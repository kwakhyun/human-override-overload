import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export const PROJECT_ROOT = fileURLToPath(new URL('../../', import.meta.url));

export function walkFiles(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(root, entry.name);
    return entry.isDirectory() ? walkFiles(file) : entry.isFile() ? [file] : [];
  });
}

// Evaluate the manifest so generated paths and every device profile are included.
// Static scanning alone misses stage-dependent defense maps and atlas variants.
export async function collectRuntimeAssetPaths(root = PROJECT_ROOT) {
  const source = readFileSync(path.join(root, 'src/game/assets/manifest.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  const manifest = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
  const paths = new Set();
  function collect(value) {
    if (typeof value === 'string' && value.startsWith('./assets/')) paths.add(value.slice(2));
    else if (value && typeof value === 'object') Object.values(value).forEach(collect);
  }
  collect(manifest);
  for (const stage of ['haven-perimeter', 'relay-blackout', 'sovereign-night-siege']) collect(manifest.getDefenseGameAssets(stage));
  for (const file of [path.join(root, 'index.html'), ...walkFiles(path.join(root, 'src')).filter((file) => /\.(?:css|jsx?|tsx?)$/.test(file))]) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/(?:\.\/|\/)?(assets\/[\w./-]+\.(?:png|webp|jpe?g|mp3|mp4|wav|ogg|json))/g)) paths.add(match[1]);
  }
  return [...paths].sort();
}

export async function inspectRuntimeAssets(root = PROJECT_ROOT, publicRoot = path.join(root, 'public'), { ignoreBuildFiles = false } = {}) {
  const required = await collectRuntimeAssetPaths(root);
  const requiredSet = new Set(required);
  const files = walkFiles(path.join(publicRoot, 'assets')).filter((file) =>
    !ignoreBuildFiles || !/\.(?:js|css|woff2?|ttf|otf|map)$/.test(file));
  return {
    required,
    missing: required.filter((relative) => !existsSync(path.join(publicRoot, relative))),
    unowned: files.map((file) => path.relative(publicRoot, file).replaceAll('\\', '/')).filter((relative) => !requiredSet.has(relative)).sort(),
    bytes: files.reduce((total, file) => total + statSync(file).size, 0),
  };
}
