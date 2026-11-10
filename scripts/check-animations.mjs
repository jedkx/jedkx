// Offline check of the animation library: catalog shape, mirrored files + hashes,
// local files, and that animations/README.md matches the catalog.
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
import {at, VENDOR, TARGETS, LEVELS, loadCatalog, sourceFiles, sha256, normalize, renderReadme} from './animations-lib.mjs';

const catalog = await loadCatalog();
const lock = JSON.parse(await readFile(at('animations/lock.json'), 'utf8'));

const ids = new Set();
for (const a of catalog.animations) {
  assert.match(a.id, /^[a-z0-9-]+$/, `bad id ${a.id}`);
  assert.ok(!ids.has(a.id), `duplicate id ${a.id}`); ids.add(a.id);
  for (const k of ['name', 'kind', 'summary']) assert.ok(a[k], `${a.id}: missing ${k}`);
  for (const t of TARGETS) assert.ok(LEVELS.includes(a.targets?.[t]), `${a.id}: targets.${t} must be ${LEVELS.join('|')}`);
  assert.ok(Array.isArray(a.usedIn) && Array.isArray(a.keyframes) && Array.isArray(a.source), `${a.id}: usedIn/keyframes/source must be arrays`);
  assert.ok(a.source.length || a.local?.length, `${a.id}: needs source or local files`);
  for (const f of a.local ?? []) await access(at(f)).catch(() => assert.fail(`${a.id}: missing local ${f}`));
}

const listed = sourceFiles(catalog);
assert.deepEqual(Object.keys(lock.files).sort(), listed, 'lock.json is out of date — run scripts/sync-animations.mjs');
for (const f of listed) {
  const buf = normalize(f, await readFile(at(VENDOR + f)).catch(() => assert.fail(`missing vendor/${f}`)));
  assert.equal(sha256(buf), lock.files[f], `vendor/${f} was edited — change it in J-Portfolio and re-sync`);
}
assert.equal((await readFile(at('animations/README.md'), 'utf8')).replace(/\r\n/g, '\n'), renderReadme(catalog, lock), 'animations/README.md is stale — re-sync');
console.log(`animations ok: ${catalog.animations.length} entries, ${listed.length} files`);
