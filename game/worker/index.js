const API_PREFIX = "/api/v1";
const SERVICE_VERSION = "2026-08-29.1";
const CAMPAIGN_VERSION = 2;
const CAMPAIGN_SLOT_COUNT = 3;
const MAX_SAVE_BYTES = 512 * 1024;
const R2_CACHE_VERSION = "2026-08-29.1";
const RUNTIME_ASSET_PREFIX = "/assets/overload/";
const RUNTIME_CACHE_CONTROL = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

const JSON_HEADERS = Object.freeze({
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "same-origin",
});

function jsonResponse(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), { status, headers: { ...JSON_HEADERS, ...headers } });
}

function apiError(status, code, message, details) {
  return jsonResponse({ ok: false, error: { code, message, ...(details ? { details } : {}) } }, status);
}

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(value) {
  return bytesToHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

function randomToken(byteLength = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function bearerToken(request) {
  const match = /^Bearer\s+(.+)$/i.exec(request.headers.get("authorization") || "");
  return match?.[1]?.trim() || null;
}

function sameOriginMutation(request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

async function readJsonBody(request) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_SAVE_BYTES) throw Object.assign(new Error("Payload too large"), { status: 413 });
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_SAVE_BYTES) {
    throw Object.assign(new Error("Payload too large"), { status: 413 });
  }
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw Object.assign(new Error("Invalid JSON"), { status: 400 });
  }
}

function isCampaignDocument(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)
    && value.version === CAMPAIGN_VERSION && Array.isArray(value.slots)
    && value.slots.length === CAMPAIGN_SLOT_COUNT);
}

async function resolveProfile(request, env) {
  const token = bearerToken(request);
  if (!token) return null;
  const tokenHash = await sha256(token);
  return env.DB.prepare("SELECT id FROM cloud_profiles WHERE token_hash = ? LIMIT 1")
    .bind(tokenHash).first();
}

function changesFrom(result) {
  return Number(result?.meta?.changes ?? result?.changes ?? 0);
}

async function handleHealth(env) {
  if (!env.DB) return apiError(503, "DATABASE_UNBOUND", "Cloud save database is not connected.");
  const probe = await env.DB.prepare("SELECT 1 AS ok").first();
  return jsonResponse({
    ok: probe?.ok === 1,
    service: "human-override-edge",
    version: SERVICE_VERSION,
    database: probe?.ok === 1 ? "connected" : "degraded",
    objectStorage: env.FILES ? "connected" : "unbound",
  }, probe?.ok === 1 ? 200 : 503);
}

async function createSession(request, env) {
  if (!env.DB) return apiError(503, "DATABASE_UNBOUND", "Cloud save database is not connected.");
  if (!sameOriginMutation(request)) return apiError(403, "ORIGIN_REJECTED", "Cross-origin writes are not allowed.");
  const profileId = crypto.randomUUID();
  const token = randomToken();
  const tokenHash = await sha256(token);
  const now = new Date().toISOString();
  await env.DB.prepare("INSERT INTO cloud_profiles (id, token_hash, created_at, last_seen_at) VALUES (?, ?, ?, ?)")
    .bind(profileId, tokenHash, now, now).run();
  return jsonResponse({ ok: true, profile: { id: profileId, createdAt: now }, token }, 201);
}

async function readCloudSave(request, env) {
  if (!env.DB) return apiError(503, "DATABASE_UNBOUND", "Cloud save database is not connected.");
  const profile = await resolveProfile(request, env);
  if (!profile) return apiError(401, "INVALID_SESSION", "Cloud save session is missing or invalid.");
  const row = await env.DB.prepare(
    "SELECT revision, payload_json, checksum_sha256, client_updated_at, updated_at FROM campaign_saves WHERE profile_id = ? LIMIT 1",
  ).bind(profile.id).first();
  if (!row) return jsonResponse({ ok: true, profileId: profile.id, revision: 0, campaign: null, updatedAt: null });
  let campaign;
  try {
    campaign = JSON.parse(row.payload_json);
  } catch {
    return apiError(500, "CORRUPT_SAVE", "Stored campaign data could not be decoded.");
  }
  return jsonResponse({
    ok: true, profileId: profile.id, revision: Number(row.revision), campaign,
    checksum: row.checksum_sha256, clientUpdatedAt: row.client_updated_at, updatedAt: row.updated_at,
  }, 200, { etag: `"save-${row.revision}"` });
}

async function writeCloudSave(request, env) {
  if (!env.DB) return apiError(503, "DATABASE_UNBOUND", "Cloud save database is not connected.");
  if (!sameOriginMutation(request)) return apiError(403, "ORIGIN_REJECTED", "Cross-origin writes are not allowed.");
  const profile = await resolveProfile(request, env);
  if (!profile) return apiError(401, "INVALID_SESSION", "Cloud save session is missing or invalid.");
  const body = await readJsonBody(request);
  if (!isCampaignDocument(body.campaign)) {
    return apiError(422, "INVALID_CAMPAIGN", "Campaign save must be a version 2 document with exactly three slots.");
  }
  const expectedRevision = Number(body.expectedRevision);
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0) {
    return apiError(422, "INVALID_REVISION", "expectedRevision must be a non-negative integer.");
  }
  const existing = await env.DB.prepare("SELECT revision FROM campaign_saves WHERE profile_id = ? LIMIT 1")
    .bind(profile.id).first();
  const currentRevision = Number(existing?.revision || 0);
  if (currentRevision !== expectedRevision) {
    return apiError(409, "REVISION_CONFLICT", "A newer cloud save already exists.", { currentRevision });
  }

  const payloadJson = JSON.stringify(body.campaign);
  const checksum = await sha256(payloadJson);
  const now = new Date().toISOString();
  const clientUpdatedAt = typeof body.clientUpdatedAt === "string" ? body.clientUpdatedAt : now;
  const nextRevision = currentRevision + 1;
  let result;
  try {
    if (existing) {
      result = await env.DB.prepare(
        "UPDATE campaign_saves SET revision = ?, payload_json = ?, checksum_sha256 = ?, client_updated_at = ?, updated_at = ? WHERE profile_id = ? AND revision = ?",
      ).bind(nextRevision, payloadJson, checksum, clientUpdatedAt, now, profile.id, currentRevision).run();
    } else {
      result = await env.DB.prepare(
        "INSERT INTO campaign_saves (profile_id, revision, payload_json, checksum_sha256, client_updated_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ).bind(profile.id, nextRevision, payloadJson, checksum, clientUpdatedAt, now).run();
    }
  } catch {
    return apiError(409, "REVISION_CONFLICT", "A newer cloud save already exists.", { currentRevision });
  }
  if (changesFrom(result) !== 1) {
    const latest = await env.DB.prepare("SELECT revision FROM campaign_saves WHERE profile_id = ? LIMIT 1")
      .bind(profile.id).first();
    return apiError(409, "REVISION_CONFLICT", "A newer cloud save already exists.", {
      currentRevision: Number(latest?.revision || 0),
    });
  }
  return jsonResponse({
    ok: true, profileId: profile.id, revision: nextRevision, checksum, clientUpdatedAt, updatedAt: now,
  }, 200, { etag: `"save-${nextRevision}"` });
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { allow: "GET, PUT, POST, OPTIONS", "cache-control": "no-store" } });
  }
  try {
    if (url.pathname === `${API_PREFIX}/health` && request.method === "GET") return handleHealth(env);
    if (url.pathname === `${API_PREFIX}/session` && request.method === "POST") return createSession(request, env);
    if (url.pathname === `${API_PREFIX}/save` && request.method === "GET") return readCloudSave(request, env);
    if (url.pathname === `${API_PREFIX}/save` && request.method === "PUT") return writeCloudSave(request, env);
    return apiError(404, "NOT_FOUND", "API route not found.");
  } catch (error) {
    if (error?.status === 400) return apiError(400, "INVALID_JSON", "Request body is not valid JSON.");
    if (error?.status === 413) return apiError(413, "PAYLOAD_TOO_LARGE", `Cloud saves are limited to ${MAX_SAVE_BYTES} bytes.`);
    console.error("HUMAN OVERRIDE edge API failure", error);
    return apiError(500, "INTERNAL_ERROR", "The cloud save service could not complete the request.");
  }
}

function isRuntimeAssetRequest(request, env) {
  const url = new URL(request.url);
  return Boolean(env.FILES && ["GET", "HEAD"].includes(request.method)
    && !request.headers.has("range") && url.pathname.startsWith(RUNTIME_ASSET_PREFIX));
}

function r2Headers(object, source) {
  const headers = new Headers();
  object?.writeHttpMetadata?.(headers);
  if (object?.httpEtag) headers.set("etag", object.httpEtag);
  else if (object?.etag) headers.set("etag", object.etag);
  headers.set("cache-control", RUNTIME_CACHE_CONTROL);
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-human-override-asset-source", source);
  return headers;
}

function queueBackground(ctx, promise) {
  const guarded = promise.catch((error) => console.warn("R2 cache write failed", error));
  if (ctx?.waitUntil) ctx.waitUntil(guarded);
}

async function cacheRuntimeAsset(request, env, ctx) {
  const url = new URL(request.url);
  const cache = globalThis.caches?.default;
  if (request.method === "GET" && cache) {
    const cached = await cache.match(request);
    if (cached) return cached;
  }
  const objectKey = `site-assets/${R2_CACHE_VERSION}${url.pathname}`;
  const object = request.method === "HEAD" ? await env.FILES.head(objectKey) : await env.FILES.get(objectKey);
  if (object) {
    const response = new Response(request.method === "HEAD" ? null : object.body, {
      status: 200, headers: r2Headers(object, "r2"),
    });
    if (request.method === "GET" && cache) queueBackground(ctx, cache.put(request, response.clone()));
    return response;
  }

  const response = await env.ASSETS.fetch(request);
  if (!response.ok || request.method !== "GET") return response;
  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (!contentLength || contentLength <= 25 * 1024 * 1024) {
    const copy = response.clone();
    queueBackground(ctx, copy.arrayBuffer().then((bytes) => env.FILES.put(objectKey, bytes, {
      httpMetadata: { contentType, cacheControl: RUNTIME_CACHE_CONTROL },
      customMetadata: { source: "sites-assets", serviceVersion: SERVICE_VERSION },
    })));
  }
  const headers = new Headers(response.headers);
  headers.set("cache-control", RUNTIME_CACHE_CONTROL);
  headers.set("x-human-override-asset-source", "sites");
  const cacheableResponse = new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  if (cache) queueBackground(ctx, cache.put(request, cacheableResponse.clone()));
  return cacheableResponse;
}

async function serveStaticApp(request, env) {
  const response = await env.ASSETS.fetch(request);
  const acceptsHtml = request.headers.get("accept")?.includes("text/html");
  if (response.status !== 404 || !acceptsHtml || !["GET", "HEAD"].includes(request.method)) return response;
  const indexUrl = new URL(request.url);
  indexUrl.pathname = "/index.html";
  indexUrl.search = "";
  return env.ASSETS.fetch(new Request(indexUrl, request));
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith(`${API_PREFIX}/`)) return handleApi(request, env);
    if (isRuntimeAssetRequest(request, env)) return cacheRuntimeAsset(request, env, ctx);
    return serveStaticApp(request, env);
  },
};
