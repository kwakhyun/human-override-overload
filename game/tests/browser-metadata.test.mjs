import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("browser metadata uses the HUMAN OVERRIDE title and official AEGIS icon", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const iconPath = "assets/overload/hero/aegis-anime-v2-icon.webp";
  const icon = await stat(new URL(`public/${iconPath}`, root));

  assert.match(html, /<title>HUMAN OVERRIDE: OVERLOAD<\/title>/);
  assert.match(html, new RegExp(`<link rel="icon" type="image/webp" sizes="512x512" href="/${iconPath}"`));
  assert.ok(icon.size > 0, "the private runtime icon must be restored before validation");
  for (const [name, size, rel] of [["favicon-32", 32, "icon"], ["apple-touch-180", 180, "apple-touch-icon"]]) {
    const file = `assets/overload/hero/aegis-anime-v2-${name}.png`;
    assert.match(html, new RegExp(`<link rel="${rel}"[^>]*sizes="${size}x${size}"[^>]*href="/${file}"`));
    const png = await readFile(new URL(`public/${file}`, root));
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
  assert.match(html, /<link rel="shortcut icon" type="image\/png" href="\/assets\/overload\/hero\/aegis-anime-v2-favicon-32.png"/);
  assert.doesNotMatch(html, /aegis-official-icon/);
  assert.doesNotMatch(html, /data:image\/svg\+xml/);
});
