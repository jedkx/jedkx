import assert from 'node:assert/strict';
import {readFile,readdir,access} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const readme=await readFile(new URL('README.md',root),'utf8');
for(const match of readme.matchAll(/(?:src|srcset)="([^" ]+)"/g)){
  const local=match[1].replace('https://raw.githubusercontent.com/jedkx/jedkx/main/','');
  assert.ok(local.startsWith('assets/'),'Profile images must belong to this repository');
  await access(new URL(local.split('?')[0],root));
}
const names=(await readdir(new URL('assets/',root))).filter(n=>n.endsWith('.svg'));
assert.equal(names.length,28,'Expected light/dark assets, mobile headers/project cards/activity, and Breakout alternatives');
for(const name of names){
  const svg=await readFile(new URL('assets/'+name,root),'utf8');
  assert.match(svg,/<svg\b/); assert.match(svg,/viewBox=/);
  assert.doesNotMatch(svg,/<script\b|<foreignObject\b|\bon(?:load|error)=|(?:NaN|Infinity)/i);
  assert.doesNotMatch(svg,/(?:href|src)=["']https?:/i,'SVG images must be self-contained');
  assert.ok(Buffer.byteLength(svg)<5_000_000,`${name} exceeds image budget`);
}
assert.match(readme,/Selected work/);
assert.match(readme,/Résumé/);
assert.doesNotMatch(readme,/TOKEN|SECRET|github_pat_|ghp_/);
console.log(`Profile references and ${names.length} SVG assets verified.`);
