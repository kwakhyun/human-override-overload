import assert from "node:assert/strict";
import { access, readdir } from "node:fs/promises";
import test from "node:test";

const retiredPaths = [
  "public/assets/overload/campaign/airship-region-map.webp",
  "public/assets/overload/hero/survivor-motion-atlas.png",
  "public/assets/overload/ui/tutorial/null-snare-gameplay.jpg",
  "public/assets/overload/vfx/manual/manual-ability-motion-atlas.png",
  "public/assets/overload/vfx/omega-laser-motion-atlas.png",
  "public/assets/overload/vfx/skill-motion-atlas.png",
  "public/assets/overload/ui/buttons/command-button-states-atlas.png",
  "public/assets/overload/ui/campaign/mobile-menu-icons-v1.webp",
  "public/audio/README.md",
];

test("retired public assets no longer inflate production output", async () => {
  for (const relativePath of retiredPaths) {
    await assert.rejects(access(new URL(`../${relativePath}`, import.meta.url)), { code: "ENOENT" });
  }
});

test("historical survivor and adversarial prototypes stay removed from active source", async () => {
  const sourceEntries = await readdir(new URL("../src/", import.meta.url), { withFileTypes: true });
  const sourceDirectories = new Set(sourceEntries.filter((entry) => entry.isDirectory()).map((entry) => entry.name));
  assert.equal(sourceDirectories.has("survivor"), false);
  assert.equal(sourceDirectories.has("adversarial"), false);

  const testEntries = await readdir(new URL("./", import.meta.url));
  assert.equal(testEntries.some((name) => /^(?:survivor|adversarial|neural-echo).*\.test\.mjs$/.test(name)), false);
});
