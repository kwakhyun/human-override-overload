#!/usr/bin/env node
import { existsSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// These files remain under public/ because the reproducible authoring scripts
// and provenance records use them. They are not referenced by the active
// client, so copying them into every production bundle only increases upload,
// storage, and deployment invalidation work.
export const AUTHORING_ONLY_ASSET_PATHS = Object.freeze([
  "assets/audio/agent/aegis-ward-start.mp3",
  "assets/audio/agent/emp-pulse-start.mp3",
  "assets/overload/defense/haven-defense-grid-portrait.webp",
  "assets/overload/defense/haven-defense-grid.webp",
  "assets/overload/defense/performance/haven-defense-grid-portrait.webp",
  "assets/overload/defense/performance/haven-defense-grid.webp",
  "assets/overload/environment/sector-02-flooded-memorial.webp",
  "assets/overload/environment/sector-03-engine-causeway.webp",
  "assets/overload/environment/sector-04-reactor-vault-expanded.webp",
  "assets/overload/environment/performance/sector-01-shattered-approach.webp",
  "assets/overload/environment/performance/sector-02-flooded-memorial.webp",
  "assets/overload/environment/performance/sector-03-engine-causeway.webp",
  "assets/overload/environment/performance/sector-04-reactor-vault-expanded.webp",
  "assets/overload/hero/mika-live2d-fullbody.png",
  "assets/overload/hero/mika-portrait.png",
  "assets/overload/hero/operative-portrait-contract.json",
  "assets/overload/hero/survivor-portrait.png",
  "assets/overload/hero/vesper-portrait-v1.png",
  "assets/overload/hero/vesper-portrait-v2.png",
  "assets/overload/hero/vesper-portrait-v3.png",
  "assets/overload/hero/vesper-portrait-v4.webp",
  "assets/overload/hero/vesper-portrait-v5.webp",
  "assets/overload/hero/vesper-portrait-v6.webp",
  "assets/overload/regions/abyssal-archive/route-expanded-v2.webp",
  "assets/overload/regions/abyssal-archive/performance/route-expanded-v2.webp",
  "assets/overload/regions/abyssal-archive/performance/route.webp",
  "assets/overload/regions/gene-vault/route-expanded-v2.webp",
  "assets/overload/regions/gene-vault/performance/route-expanded-v2.webp",
  "assets/overload/regions/gene-vault/performance/route.webp",
  "assets/overload/regions/glass-dune/route-expanded-v2.webp",
  "assets/overload/regions/glass-dune/performance/route-expanded-v2.webp",
  "assets/overload/regions/glass-dune/performance/route.webp",
  "assets/overload/regions/neon-foundry/route-expanded-v2.webp",
  "assets/overload/regions/neon-foundry/performance/route-expanded-v2.webp",
  "assets/overload/regions/neon-foundry/performance/route.webp",
  "assets/overload/regions/storm-spire/route-expanded-v2.webp",
  "assets/overload/regions/storm-spire/performance/route-expanded-v2.webp",
  "assets/overload/regions/storm-spire/performance/route.webp",
  "assets/overload/ui/npcs/hana-research-director-v1.webp",
  "assets/overload/ui/npcs/ilya-mechanic-v2.png",
  "assets/overload/ui/npcs/ilya-mechanic-v3.webp",
  "assets/overload/ui/npcs/rhea-control-officer-v2.webp",
  "assets/overload/ui/npcs/rhea-control-officer.png",
  "assets/overload/ui/npcs/sera-nightjar-pilot-v1.png",
  "assets/overload/ui/npcs/sera-nightjar-pilot-v2.png",
  "assets/overload/ui/npcs/sera-nightjar-pilot-v3.webp",
]);

function resolvePolicyTarget(root, relativePath) {
  const resolvedRoot = path.resolve(root);
  const target = path.resolve(resolvedRoot, relativePath);
  if (!target.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`Asset policy escaped its root: ${relativePath}`);
  }
  return target;
}

export function inspectAuthoringOnlyAssets(root) {
  const entries = AUTHORING_ONLY_ASSET_PATHS.map((relativePath) => {
    const target = resolvePolicyTarget(root, relativePath);
    const present = existsSync(target);
    return Object.freeze({ relativePath, present, bytes: present ? statSync(target).size : 0 });
  });
  return Object.freeze({
    entries: Object.freeze(entries),
    present: entries.filter((entry) => entry.present).length,
    missing: entries.filter((entry) => !entry.present).length,
    bytes: entries.reduce((total, entry) => total + entry.bytes, 0),
  });
}

export function pruneAuthoringOnlyAssets(clientRoot) {
  const report = inspectAuthoringOnlyAssets(clientRoot);
  for (const entry of report.entries) {
    if (entry.present) unlinkSync(resolvePolicyTarget(clientRoot, entry.relativePath));
  }
  return report;
}

function formatMebibytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", process.argv.includes("--dist") ? "dist/client" : "public");
  const report = inspectAuthoringOnlyAssets(root);
  console.log(`Authoring-only policy: ${report.present}/${AUTHORING_ONLY_ASSET_PATHS.length} files, ${formatMebibytes(report.bytes)} excluded from production`);
  if (report.missing) console.log(`Missing policy inputs: ${report.missing} (already removed or not generated)`);
}
