#!/usr/bin/env node
import { existsSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectRuntimeAssets } from "./lib/runtime-assets.mjs";

// Retired public locations. Required authoring inputs now live under reference/.
// Retain this denylist as a compatibility guard for older local generation tools.
export const AUTHORING_ONLY_ASSET_PATHS = Object.freeze([
  "assets/audio/agent/aegis-ward-start.mp3",
  "assets/audio/agent/emp-pulse-start.mp3",
  "assets/overload/boss/motion-v2/performance/wrong-engine-motion-atlas.png",
  "assets/overload/boss/motion-v2/wrong-engine-motion-atlas.png",
  "assets/overload/defense/defense-systems-motion-atlas.png",
  "assets/overload/defense/haven-defense-grid-portrait.webp",
  "assets/overload/defense/haven-defense-grid.webp",
  "assets/overload/defense/performance/defense-systems-motion-atlas.png",
  "assets/overload/defense/performance/haven-defense-grid-portrait.webp",
  "assets/overload/defense/performance/haven-defense-grid.webp",
  "assets/overload/enemies/motion-v2/performance/rifleman-motion-atlas.png",
  "assets/overload/enemies/motion-v2/performance/sniper-motion-atlas.png",
  "assets/overload/enemies/motion-v2/rifleman-motion-atlas.png",
  "assets/overload/enemies/motion-v2/sniper-motion-atlas.png",
  "assets/overload/enemies/motion-v3/performance/siege-walker-motion-atlas.png",
  "assets/overload/enemies/motion-v3/siege-walker-motion-atlas.png",
  "assets/overload/environment/performance/sector-01-shattered-approach.webp",
  "assets/overload/environment/performance/sector-02-flooded-memorial.webp",
  "assets/overload/environment/performance/sector-03-engine-causeway.webp",
  "assets/overload/environment/performance/sector-04-reactor-vault-expanded.webp",
  "assets/overload/environment/sector-02-flooded-memorial.webp",
  "assets/overload/environment/sector-03-engine-causeway.webp",
  "assets/overload/environment/sector-04-reactor-vault-expanded.webp",
  "assets/overload/hero/mika-directional-aim-atlas.png",
  "assets/overload/hero/mika-live2d-fullbody.png",
  "assets/overload/hero/mika-portrait.png",
  "assets/overload/hero/nox-directional-aim-atlas.png",
  "assets/overload/hero/operative-portrait-contract.json",
  "assets/overload/hero/performance/mika-directional-aim-atlas.png",
  "assets/overload/hero/performance/nox-directional-aim-atlas.png",
  "assets/overload/hero/performance/survivor-directional-aim-atlas.png",
  "assets/overload/hero/performance/survivor-sword-directional-aim-atlas.png",
  "assets/overload/hero/performance/vesper-directional-aim-atlas.png",
  "assets/overload/hero/survivor-directional-aim-atlas.png",
  "assets/overload/hero/survivor-portrait.png",
  "assets/overload/hero/survivor-sword-directional-aim-atlas.png",
  "assets/overload/hero/vesper-directional-aim-atlas.png",
  "assets/overload/hero/vesper-portrait-v1.png",
  "assets/overload/hero/vesper-portrait-v2.png",
  "assets/overload/hero/vesper-portrait-v3.png",
  "assets/overload/hero/vesper-portrait-v4.webp",
  "assets/overload/hero/vesper-portrait-v5.webp",
  "assets/overload/hero/vesper-portrait-v6.webp",
  "assets/overload/regions/abyssal-archive/motion-v2/drowned-oracle-motion-atlas.png",
  "assets/overload/regions/abyssal-archive/motion-v2/performance/drowned-oracle-motion-atlas.png",
  "assets/overload/regions/abyssal-archive/performance/route-expanded-v2.webp",
  "assets/overload/regions/abyssal-archive/performance/route.webp",
  "assets/overload/regions/abyssal-archive/route-expanded-v2.webp",
  "assets/overload/regions/gene-vault/performance/enemy-forms-atlas.png",
  "assets/overload/regions/gene-vault/performance/route-expanded-v2.webp",
  "assets/overload/regions/gene-vault/performance/route.webp",
  "assets/overload/regions/gene-vault/route-expanded-v2.webp",
  "assets/overload/regions/glass-dune/motion-v2/mirror-tyrant-motion-atlas.png",
  "assets/overload/regions/glass-dune/motion-v2/performance/mirror-tyrant-motion-atlas.png",
  "assets/overload/regions/glass-dune/performance/route-expanded-v2.webp",
  "assets/overload/regions/glass-dune/performance/route.webp",
  "assets/overload/regions/glass-dune/route-expanded-v2.webp",
  "assets/overload/regions/neon-foundry/performance/enemy-forms-atlas.png",
  "assets/overload/regions/neon-foundry/performance/route-expanded-v2.webp",
  "assets/overload/regions/neon-foundry/performance/route.webp",
  "assets/overload/regions/neon-foundry/route-expanded-v2.webp",
  "assets/overload/regions/storm-spire/performance/enemy-forms-atlas.png",
  "assets/overload/regions/storm-spire/performance/route-expanded-v2.webp",
  "assets/overload/regions/storm-spire/performance/route.webp",
  "assets/overload/regions/storm-spire/route-expanded-v2.webp",
  "assets/overload/ui/npcs/hana-research-director-v1.webp",
  "assets/overload/ui/npcs/ilya-mechanic-v2.png",
  "assets/overload/ui/npcs/ilya-mechanic-v3.webp",
  "assets/overload/ui/npcs/rhea-control-officer-v2.webp",
  "assets/overload/ui/npcs/rhea-control-officer.png",
  "assets/overload/ui/npcs/sera-nightjar-pilot-v1.png",
  "assets/overload/ui/npcs/sera-nightjar-pilot-v2.png",
  "assets/overload/ui/npcs/sera-nightjar-pilot-v3.webp",
  "assets/overload/vfx/manual/aegis-ward-hd-atlas.png",
  "assets/overload/vfx/manual/emp-pulse-hd-atlas.png",
  "assets/overload/vfx/manual/nox-ability-hd-atlas.png",
  "assets/overload/vfx/manual/vesper-ability-hd-atlas.png",
  "assets/overload/vfx/pixel/automatic-skill-pixel-atlas.png",
  "assets/overload/vfx/pixel/boss-pattern-common-pixel-atlas.png",
  "assets/overload/vfx/pixel/boss-pattern-regional-pixel-atlas.png",
  "assets/overload/vfx/pixel/manual-ability-pixel-atlas.png",
  "assets/overload/vfx/pixel/mika-ability-atlas.png",
  "assets/overload/vfx/pixel/sword-manual-ability-atlas.png",
  "assets/overload/vfx/pixel/sword-skill-pixel-atlas.png"
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
  const report = await inspectRuntimeAssets(undefined, root, { ignoreBuildFiles: process.argv.includes("--dist") });
  console.log(`Runtime assets: ${report.required.length} required, ${formatMebibytes(report.bytes)}, ${report.missing.length} missing, ${report.unowned.length} unowned`);
  for (const entry of report.missing) console.error(`Missing: ${entry}`);
  for (const entry of report.unowned) console.error(`Unowned: ${entry}`);
  if (report.missing.length || report.unowned.length) process.exitCode = 1;
}
