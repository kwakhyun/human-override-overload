#!/usr/bin/env node
import { cpSync, copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pruneAuthoringOnlyAssets } from "./production-asset-policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const index = path.join(dist, "client", "index.html");
const worker = path.join(root, "worker", "index.js");
const hosting = path.join(root, ".openai", "hosting.json");
const drizzle = path.join(root, "drizzle");

for (const file of [index, worker, hosting, drizzle]) {
  if (!existsSync(file)) throw new Error("Missing Sites build input: " + file);
}

mkdirSync(path.join(dist, "server"), { recursive: true });
mkdirSync(path.join(dist, ".openai"), { recursive: true });
copyFileSync(worker, path.join(dist, "server", "index.js"));
copyFileSync(hosting, path.join(dist, ".openai", "hosting.json"));
const distDrizzle = path.join(dist, ".openai", "drizzle");
rmSync(distDrizzle, { recursive: true, force: true });
cpSync(drizzle, distDrizzle, { recursive: true });

const pruned = pruneAuthoringOnlyAssets(path.join(dist, "client"));

console.log(`Prepared Sites build: worker, hosting bindings, D1 migrations, and ${pruned.present} authoring-only assets pruned (${(pruned.bytes / 1024 / 1024).toFixed(2)} MiB)`);
