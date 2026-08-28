import {
  CAMPAIGN_SAVE_EVENT,
  loadCampaign,
  sanitizeCampaign,
  saveCampaign,
} from "./campaignSave.js";

export const CLOUD_SAVE_IDENTITY_KEY = "human-override.overload.cloud-save.v1";
export const CLOUD_SAVE_STATUS_EVENT = "human-override:cloud-save-status";

const SESSION_ENDPOINT = "/api/v1/session";
const SAVE_ENDPOINT = "/api/v1/save";
const SYNC_DEBOUNCE_MS = 650;

function isoTime(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function campaignUpdatedAt(campaign) {
  return Math.max(0, ...sanitizeCampaign(campaign).slots.map((slot) => isoTime(slot?.updatedAt)));
}

function sameDocument(left, right) {
  return JSON.stringify(sanitizeCampaign(left)) === JSON.stringify(sanitizeCampaign(right));
}

export function mergeCampaignDocuments(localCampaign, remoteCampaign) {
  const local = sanitizeCampaign(localCampaign);
  const remote = sanitizeCampaign(remoteCampaign);
  return {
    version: local.version,
    slots: local.slots.map((localSlot, index) => {
      const remoteSlot = remote.slots[index];
      if (!localSlot) return remoteSlot;
      if (!remoteSlot) return localSlot;
      return isoTime(remoteSlot.updatedAt) > isoTime(localSlot.updatedAt) ? remoteSlot : localSlot;
    }),
  };
}

function dispatchStatus(status, details = {}) {
  if (typeof globalThis?.dispatchEvent !== "function" || typeof globalThis?.CustomEvent !== "function") return;
  globalThis.dispatchEvent(new CustomEvent(CLOUD_SAVE_STATUS_EVENT, { detail: { status, ...details } }));
}

function readIdentity(storage) {
  try {
    const value = JSON.parse(storage.getItem(CLOUD_SAVE_IDENTITY_KEY) || "null");
    return value?.profileId && value?.token ? value : null;
  } catch {
    return null;
  }
}

function writeIdentity(storage, identity) {
  if (identity) storage.setItem(CLOUD_SAVE_IDENTITY_KEY, JSON.stringify(identity));
  else storage.removeItem(CLOUD_SAVE_IDENTITY_KEY);
}

async function readJson(response) {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error?.message || `Cloud save request failed (${response.status})`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

export function startCampaignCloudSync(options = {}) {
  const storage = options.storage ?? (() => {
    try { return globalThis.localStorage; } catch { return null; }
  })();
  const fetchImpl = options.fetchImpl ?? globalThis.fetch?.bind(globalThis);
  if (!storage || !fetchImpl || typeof globalThis?.addEventListener !== "function") return () => {};

  let stopped = false;
  let revision = 0;
  let identity = readIdentity(storage);
  let pendingCampaign = null;
  let debounceTimer = null;
  let flushing = null;

  async function createIdentity() {
    const payload = await readJson(await fetchImpl(SESSION_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ client: "web" }),
    }));
    identity = { profileId: payload.profile.id, token: payload.token };
    writeIdentity(storage, identity);
    revision = 0;
    return identity;
  }

  async function ensureIdentity() {
    return identity || createIdentity();
  }

  async function authorizedFetch(url, init = {}, retrySession = true) {
    const currentIdentity = await ensureIdentity();
    const response = await fetchImpl(url, {
      ...init,
      headers: { ...init.headers, authorization: `Bearer ${currentIdentity.token}` },
    });
    if (response.status === 401 && retrySession) {
      identity = null;
      writeIdentity(storage, null);
      await createIdentity();
      return authorizedFetch(url, init, false);
    }
    return response;
  }

  function applyMergedCampaign(merged, currentLocal) {
    if (!sameDocument(merged, currentLocal)) {
      saveCampaign(merged, storage, { notify: false });
      options.onCampaign?.(merged);
    }
  }

  async function upload(campaign, retryConflict = true) {
    const sanitized = sanitizeCampaign(campaign);
    const response = await authorizedFetch(SAVE_ENDPOINT, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        campaign: sanitized,
        expectedRevision: revision,
        clientUpdatedAt: new Date(campaignUpdatedAt(sanitized) || Date.now()).toISOString(),
      }),
    });
    if (response.status === 409 && retryConflict) {
      const remotePayload = await readJson(await authorizedFetch(SAVE_ENDPOINT));
      revision = Number(remotePayload.revision || 0);
      const local = loadCampaign(storage);
      const merged = mergeCampaignDocuments(local, remotePayload.campaign || local);
      applyMergedCampaign(merged, local);
      return upload(merged, false);
    }
    const payload = await readJson(response);
    revision = Number(payload.revision || revision);
    dispatchStatus("synced", { revision, updatedAt: payload.updatedAt });
  }

  async function flush() {
    if (stopped || flushing || !pendingCampaign) return flushing;
    const campaign = pendingCampaign;
    pendingCampaign = null;
    dispatchStatus("syncing", { revision });
    flushing = upload(campaign)
      .catch((error) => {
        pendingCampaign = campaign;
        dispatchStatus("offline", { message: error.message });
      })
      .finally(() => { flushing = null; });
    return flushing;
  }

  function scheduleUpload(campaign) {
    pendingCampaign = sanitizeCampaign(campaign);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(flush, SYNC_DEBOUNCE_MS);
  }

  async function initialize() {
    dispatchStatus("connecting");
    try {
      const remotePayload = await readJson(await authorizedFetch(SAVE_ENDPOINT));
      revision = Number(remotePayload.revision || 0);
      const local = loadCampaign(storage);
      const merged = remotePayload.campaign ? mergeCampaignDocuments(local, remotePayload.campaign) : local;
      applyMergedCampaign(merged, local);
      if (!remotePayload.campaign || !sameDocument(merged, remotePayload.campaign)) scheduleUpload(merged);
      else dispatchStatus("synced", { revision, updatedAt: remotePayload.updatedAt });
    } catch (error) {
      dispatchStatus("offline", { message: error.message });
    }
  }

  const handleSaved = (event) => scheduleUpload(event.detail?.campaign || loadCampaign(storage));
  const handleOnline = () => initialize();
  globalThis.addEventListener(CAMPAIGN_SAVE_EVENT, handleSaved);
  globalThis.addEventListener("online", handleOnline);
  void initialize();

  return () => {
    stopped = true;
    clearTimeout(debounceTimer);
    globalThis.removeEventListener(CAMPAIGN_SAVE_EVENT, handleSaved);
    globalThis.removeEventListener("online", handleOnline);
  };
}
