import { SFX_SAMPLE_PATHS } from './sfxSamples.js';

// Four concurrent requests, one decoded buffer per path, no delayed event replay.
// A missing/undecodable sample remains on the synthesizer fallback this session.
export function createSfxSampleBank(context, fetcher = globalThis.fetch) {
  const buffers = new Map();
  const abort = new AbortController();
  let disposed = false;
  let pending;
  let failures = 0;
  return {
    get: path => buffers.get(path),
    preload() {
      if (pending) return pending;
      if (disposed) return Promise.resolve();
      let cursor = 0;
      async function worker() {
        while (!disposed && cursor < SFX_SAMPLE_PATHS.length) {
          const path = SFX_SAMPLE_PATHS[cursor++];
          try {
            const response = await fetcher(path, { signal: abort.signal });
            if (!response.ok) throw new Error('SFX unavailable');
            const buffer = await context.decodeAudioData(await response.arrayBuffer());
            if (!disposed) buffers.set(path, buffer);
          } catch {
            if (!disposed) failures += 1;
          }
        }
      }
      pending = Promise.all(Array.from({ length: 4 }, worker)).then(() => undefined);
      return pending;
    },
    stats: () => ({ ready: buffers.size, total: SFX_SAMPLE_PATHS.length, failures }),
    dispose() {
      disposed = true;
      abort.abort();
      buffers.clear();
    },
  };
}
