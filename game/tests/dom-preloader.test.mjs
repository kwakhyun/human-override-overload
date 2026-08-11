import assert from "node:assert/strict";
import test from "node:test";

test("DOM image warmup decodes each URL once and reports unique progress", async () => {
  const OriginalImage = globalThis.Image;
  let constructions = 0;
  let decodes = 0;

  class FakeImage {
    constructor() {
      constructions += 1;
    }

    async decode() {
      decodes += 1;
    }

    set src(value) {
      this.currentSrc = value;
      queueMicrotask(() => this.onload?.());
    }
  }

  globalThis.Image = FakeImage;
  try {
    const { preloadDomImage, preloadDomImages } = await import(`../src/game/assets/domPreloader.js?test=${Date.now()}`);
    const first = preloadDomImage("./asset-a.webp");
    const duplicate = preloadDomImage("./asset-a.webp");
    assert.equal(first, duplicate);
    await first;

    const progress = [];
    const result = await preloadDomImages(["./asset-a.webp", "./asset-b.webp", "./asset-b.webp"], (value) => progress.push(value));
    assert.deepEqual(result, { loaded: 2, failed: 0, total: 2 });
    assert.equal(constructions, 2);
    assert.equal(decodes, 2);
    assert.deepEqual(progress, [0, 0.5, 1]);
  } finally {
    if (OriginalImage === undefined) delete globalThis.Image;
    else globalThis.Image = OriginalImage;
  }
});
