const preloadCache = new Map();

function normalizeSource(source) {
  if (typeof source !== "string") return "";
  return source.trim();
}

export function preloadDomImage(source) {
  const normalized = normalizeSource(source);
  if (!normalized || typeof Image === "undefined") {
    return Promise.resolve({ source: normalized, ok: Boolean(normalized) });
  }

  const cached = preloadCache.get(normalized);
  if (cached) return cached;

  const pending = new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = async () => {
      try {
        await image.decode?.();
      } catch {
        // A completed load is still usable when decode() is unavailable or rejects.
      }
      image.onload = null;
      image.onerror = null;
      resolve({ source: normalized, ok: true });
    };
    image.onerror = () => {
      image.onload = null;
      image.onerror = null;
      resolve({ source: normalized, ok: false });
    };
    image.src = normalized;
  });

  preloadCache.set(normalized, pending);
  return pending;
}

export async function preloadDomImages(sources, onProgress) {
  const uniqueSources = [...new Set((sources || []).map(normalizeSource).filter(Boolean))];
  if (!uniqueSources.length) {
    onProgress?.(1);
    return { loaded: 0, failed: 0, total: 0 };
  }

  let completed = 0;
  let loaded = 0;
  let failed = 0;
  onProgress?.(0);

  await Promise.all(uniqueSources.map(async (source) => {
    const result = await preloadDomImage(source);
    if (result.ok) loaded += 1;
    else failed += 1;
    completed += 1;
    onProgress?.(completed / uniqueSources.length);
  }));

  return { loaded, failed, total: uniqueSources.length };
}

export function scheduleDomImagePreload(sources) {
  let cancelled = false;
  const run = () => {
    if (!cancelled) void preloadDomImages(sources);
  };
  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(run, { timeout: 1200 });
    return () => {
      cancelled = true;
      window.cancelIdleCallback?.(handle);
    };
  }
  const handle = window.setTimeout(run, 80);
  return () => {
    cancelled = true;
    window.clearTimeout(handle);
  };
}
