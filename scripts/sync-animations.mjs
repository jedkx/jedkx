// Mirror every catalogued animation file from a local J-Portfolio checkout into
// animations/vendor, hash it, verify the catalog is complete, regenerate animations/README.md.
//   node scripts/sync-animations.mjs <path-to-J-Portfolio>
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, readdir, rm, stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {at, VENDOR, loadCatalog, sourceFiles, sha256, normalize, renderReadme, ANIMATED} from './animations-lib.mjs';

const jp = process.argv[2] ?? process.env.JPORTFOLIO;
assert.ok(jp, 'usage: node scripts/sync-animations.mjs <path-to-J-Portfolio>');
const from = p => path.join(jp, p);
const catalog = await loadCatalog();

async function walk(dir, out = []) {
  for (const e of await readdir(dir, {withFileTypes: true})) {
    const p = path.join(dir, e.name);
    e.isDirectory() ? await walk(p, out) : out.push(p);
  }
  return out;
}
const rel = p => path.relative(jp, p).split(path.sep).join('/');

// 1. completeness: every @keyframes and every animated module in J-Portfolio must be catalogued
const listed = new Set(sourceFiles(catalog));
const listedKf = new Set(catalog.animations.flatMap(a => a.keyframes));
const missingKf = new Set(), missingFiles = [];
for (const f of await walk(from('src'))) {
  if (!/\.(css|tsx?)$/.test(f)) continue;
  const text = await readFile(f, 'utf8');
  for (const m of text.matchAll(/@keyframes\s+([\w-]+)/g)) if (!listedKf.has(m[1])) missingKf.add(`${m[1]} (${rel(f)})`);
  if (/\.tsx?$/.test(f) && ANIMATED.test(text) && !listed.has(rel(f))) missingFiles.push(rel(f));
}
assert.equal(missingKf.size + missingFiles.length, 0,
  `Not catalogued in animations/catalog.json:\n  ${[...missingKf, ...missingFiles].join('\n  ')}`);

// 2. ids unique, every source exists
const ids = catalog.animations.map(a => a.id);
assert.equal(new Set(ids).size, ids.length, 'animation ids must be unique');
for (const f of listed) await stat(from(f)).catch(() => assert.fail(`J-Portfolio has no ${f}`));

// 3. mirror verbatim + hash; drop vendor files no longer listed
const files = {};
for (const f of listed) {
  const buf = normalize(f, await readFile(from(f)));
  await mkdir(path.dirname(fileURLToPath(at(VENDOR + f))), {recursive: true});
  await writeFile(at(VENDOR + f), buf);
  files[f] = sha256(buf);
}
const vendorRoot = fileURLToPath(at(VENDOR));
for (const f of await walk(vendorRoot).catch(() => [])) {
  const r = path.relative(vendorRoot, f).split(path.sep).join('/');
  if (!listed.has(r)) await rm(f);
}

let commit = 'unknown';
try { commit = execFileSync('git', ['-C', jp, 'rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(); } catch {}
const lock = {repo: catalog.source.repo, commit, syncedAt: new Date().toISOString(), files};
await writeFile(at('animations/lock.json'), JSON.stringify(lock, null, 2) + '\n');
await writeFile(at('animations/README.md'), renderReadme(catalog, lock));

const kf = catalog.animations.reduce((n, a) => n + a.keyframes.length, 0);
console.log(`animations: ${catalog.animations.length} entries, ${kf} keyframes, ${listed.size} files @ ${commit.slice(0, 12)}`);
