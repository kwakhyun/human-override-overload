import assert from "node:assert/strict";
import { access, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const policy = await import(new URL("../scripts/production-asset-policy.mjs", import.meta.url));

test("the production asset policy is explicit, unique, and retains authoring inputs in public", async () => {
  const paths = policy.AUTHORING_ONLY_ASSET_PATHS;
  assert.equal(new Set(paths).size, paths.length);
  assert.ok(paths.length >= 40);
  assert.ok(paths.every((relativePath) => relativePath.startsWith("assets/") && !relativePath.includes("..")));

  const publicRoot = fileURLToPath(new URL("../public/", import.meta.url));
  const report = policy.inspectAuthoringOnlyAssets(publicRoot);
  assert.equal(report.missing, 0, "authoring inputs stay available for reproducible generation and provenance review");
  assert.ok(report.bytes > 20 * 1024 * 1024, "the production policy must remove a material amount of unused payload");
});

test("the production pruner deletes only explicitly listed client copies", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "human-override-assets-"));
  const listed = policy.AUTHORING_ONLY_ASSET_PATHS[0];
  const listedPath = path.join(root, listed);
  const retainedPath = path.join(root, "assets/overload/runtime-retained.txt");
  await mkdir(path.dirname(listedPath), { recursive: true });
  await mkdir(path.dirname(retainedPath), { recursive: true });
  await writeFile(listedPath, "authoring");
  await writeFile(retainedPath, "runtime");

  try {
    const report = policy.pruneAuthoringOnlyAssets(root);
    assert.equal(report.present, 1);
    await assert.rejects(access(listedPath));
    await access(retainedPath);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
