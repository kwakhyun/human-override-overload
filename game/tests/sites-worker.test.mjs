import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/index.js";

class FakeD1 {
  constructor() {
    this.profilesByHash = new Map();
    this.saves = new Map();
  }

  prepare(sql) {
    const database = this;
    return {
      args: [],
      bind(...args) { this.args = args; return this; },
      async first() {
        if (sql === "SELECT 1 AS ok") return { ok: 1 };
        if (sql.includes("FROM cloud_profiles WHERE token_hash")) {
          const id = database.profilesByHash.get(this.args[0]);
          return id ? { id } : null;
        }
        if (sql.includes("payload_json") && sql.includes("FROM campaign_saves")) {
          return database.saves.get(this.args[0]) || null;
        }
        if (sql.includes("SELECT revision FROM campaign_saves")) {
          const save = database.saves.get(this.args[0]);
          return save ? { revision: save.revision } : null;
        }
        throw new Error(`Unsupported fake D1 first(): ${sql}`);
      },
      async run() {
        if (sql.startsWith("INSERT INTO cloud_profiles")) {
          database.profilesByHash.set(this.args[1], this.args[0]);
          return { meta: { changes: 1 } };
        }
        if (sql.startsWith("INSERT INTO campaign_saves")) {
          const [profileId, revision, payloadJson, checksumSha256, clientUpdatedAt, updatedAt] = this.args;
          if (database.saves.has(profileId)) throw new Error("constraint");
          database.saves.set(profileId, {
            revision, payload_json: payloadJson, checksum_sha256: checksumSha256,
            client_updated_at: clientUpdatedAt, updated_at: updatedAt,
          });
          return { meta: { changes: 1 } };
        }
        if (sql.startsWith("UPDATE campaign_saves")) {
          const [revision, payloadJson, checksumSha256, clientUpdatedAt, updatedAt, profileId, expectedRevision] = this.args;
          const current = database.saves.get(profileId);
          if (!current || current.revision !== expectedRevision) return { meta: { changes: 0 } };
          database.saves.set(profileId, {
            revision, payload_json: payloadJson, checksum_sha256: checksumSha256,
            client_updated_at: clientUpdatedAt, updated_at: updatedAt,
          });
          return { meta: { changes: 1 } };
        }
        throw new Error(`Unsupported fake D1 run(): ${sql}`);
      },
    };
  }
}

test("serves existing static assets without a fallback", async () => {
  const calls = [];
  const response = await worker.fetch(new Request("https://example.test/assets/app.js"), {
    ASSETS: {
      fetch: async (request) => {
        calls.push(new URL(request.url).pathname);
        return new Response("asset", { status: 200 });
      },
    },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/assets/app.js"]);
});

test("falls back to index.html for an unknown app route", async () => {
  const calls = [];
  const response = await worker.fetch(
    new Request("https://example.test/flow/step-two?source=share", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async (request) => {
          const url = new URL(request.url);
          calls.push(url.pathname + url.search);
          return new Response(url.pathname === "/index.html" ? "app" : "missing", {
            status: url.pathname === "/index.html" ? 200 : 404,
          });
        },
      },
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/flow/step-two?source=share", "/index.html"]);
});

test("does not turn missing API or write requests into the app shell", async () => {
  for (const request of [
    new Request("https://example.test/api/missing", { headers: { accept: "application/json" } }),
    new Request("https://example.test/flow", { method: "POST", headers: { accept: "text/html" } }),
  ]) {
    let calls = 0;
    const response = await worker.fetch(request, {
      ASSETS: {
        fetch: async () => {
          calls += 1;
          return new Response("missing", { status: 404 });
        },
      },
    });

    assert.equal(response.status, 404);
    assert.equal(calls, 1);
  }
});

test("creates an anonymous session and persists a revisioned campaign in D1", async () => {
  const DB = new FakeD1();
  const env = { DB, FILES: {} };
  const sessionResponse = await worker.fetch(new Request("https://example.test/api/v1/session", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://example.test" },
    body: "{}",
  }), env);
  assert.equal(sessionResponse.status, 201);
  const session = await sessionResponse.json();
  assert.ok(session.profile.id);
  assert.ok(session.token.length > 30);

  const authorization = `Bearer ${session.token}`;
  const emptyResponse = await worker.fetch(new Request("https://example.test/api/v1/save", {
    headers: { authorization },
  }), env);
  assert.deepEqual(await emptyResponse.json(), {
    ok: true,
    profileId: session.profile.id,
    revision: 0,
    campaign: null,
    updatedAt: null,
  });

  const campaign = { version: 2, slots: [null, null, null] };
  const writeResponse = await worker.fetch(new Request("https://example.test/api/v1/save", {
    method: "PUT",
    headers: { authorization, "content-type": "application/json", origin: "https://example.test" },
    body: JSON.stringify({ campaign, expectedRevision: 0, clientUpdatedAt: "2026-08-29T00:00:00.000Z" }),
  }), env);
  assert.equal(writeResponse.status, 200);
  assert.equal((await writeResponse.json()).revision, 1);

  const readResponse = await worker.fetch(new Request("https://example.test/api/v1/save", {
    headers: { authorization },
  }), env);
  const saved = await readResponse.json();
  assert.equal(saved.revision, 1);
  assert.deepEqual(saved.campaign, campaign);

  const conflictResponse = await worker.fetch(new Request("https://example.test/api/v1/save", {
    method: "PUT",
    headers: { authorization, "content-type": "application/json", origin: "https://example.test" },
    body: JSON.stringify({ campaign, expectedRevision: 0 }),
  }), env);
  assert.equal(conflictResponse.status, 409);
  assert.equal((await conflictResponse.json()).error.code, "REVISION_CONFLICT");
});

test("uses R2 as a read-through origin cache for overload runtime assets", async () => {
  const objects = new Map();
  const FILES = {
    async get(key) {
      const value = objects.get(key);
      return value ? { body: value, etag: "cached-etag" } : null;
    },
    async head(key) { return objects.has(key) ? { etag: "cached-etag" } : null; },
    async put(key, value) { objects.set(key, new Uint8Array(value)); },
  };
  const pending = [];
  let staticReads = 0;
  const env = {
    FILES,
    ASSETS: {},
  };
  const ctx = { waitUntil(promise) { pending.push(promise); } };
  const originPaths = [];
  env.ASSETS.fetch = async (request) => {
    staticReads += 1;
    originPaths.push(new URL(request.url).pathname);
    return new Response("runtime-asset", { headers: { "content-type": "image/png" } });
  };
  const request = new Request("https://example.test/cdn/assets/overload/vfx/hit.png");
  const first = await worker.fetch(request, env, ctx);
  assert.equal(first.headers.get("x-human-override-asset-source"), "sites");
  await Promise.all(pending);

  const second = await worker.fetch(request, env, ctx);
  assert.equal(second.headers.get("x-human-override-asset-source"), "r2");
  assert.equal(await second.text(), "runtime-asset");
  assert.equal(staticReads, 1);
  assert.deepEqual(originPaths, ["/assets/overload/vfx/hit.png"]);
});

test("maps ranged CDN requests to the packaged Sites asset", async () => {
  const calls = [];
  const response = await worker.fetch(new Request(
    "https://example.test/cdn/assets/overload/audio/dispatch.mp3",
    { headers: { range: "bytes=0-99" } },
  ), {
    FILES: {},
    ASSETS: {
      fetch: async (request) => {
        calls.push({ pathname: new URL(request.url).pathname, range: request.headers.get("range") });
        return new Response("partial", {
          status: 206,
          headers: { "content-range": "bytes 0-6/7" },
        });
      },
    },
  });

  assert.equal(response.status, 206);
  assert.equal(response.headers.get("content-range"), "bytes 0-6/7");
  assert.deepEqual(calls, [{ pathname: "/assets/overload/audio/dispatch.mp3", range: "bytes=0-99" }]);
});

test("emits the files required by Sites packaging", async () => {
  await access(new URL("../dist/client/index.html", import.meta.url));
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));
  await access(new URL("../dist/.openai/drizzle/0000_lyrical_stellaris.sql", import.meta.url));
});
