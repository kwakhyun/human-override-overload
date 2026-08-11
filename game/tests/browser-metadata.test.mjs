import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("browser metadata uses the HUMAN OVERRIDE title and official AEGIS icon", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  const iconPath = "assets/overload/hero/aegis-official-icon.webp";
  const icon = await stat(new URL(`public/${iconPath}`, root));

  assert.match(html, /<title>HUMAN OVERRIDE: OVERLOAD<\/title>/);
  assert.match(html, new RegExp(`<link rel="icon" type="image/webp" sizes="512x512" href="/${iconPath}"`));
  assert.match(html, new RegExp(`<link rel="shortcut icon" type="image/webp" href="/${iconPath}"`));
  assert.ok(icon.size > 50_000, "the favicon must reference the committed official portrait, not a placeholder");
  assert.doesNotMatch(html, /data:image\/svg\+xml/);
});
