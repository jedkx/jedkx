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
assert.equal(names.length,36,'Expected headers, six linked neofetch slices, activity and snake alternatives');
for(const name of names){
  const svg=await readFile(new URL('assets/'+name,root),'utf8');
  assert.match(svg,/<svg\b/); assert.match(svg,/viewBox=/);
  assert.doesNotMatch(svg,/<script\b|<foreignObject\b|\bon(?:load|error)=|(?:NaN|Infinity)/i);
  assert.doesNotMatch(svg,/(?:href|src)=["']https?:/i,'SVG images must be self-contained');
  assert.ok(Buffer.byteLength(svg)<5_000_000,`${name} exceeds image budget`);
  if(name.startsWith('snake-')){
    const cells=[...svg.matchAll(/<rect class="c(?: [^"]+)?" x="([\d.]+)" y="([\d.]+)"/g)];
    const maxX=Math.max(...cells.map(c=>+c[1]))-2,maxY=Math.max(...cells.map(c=>+c[2]))-2;
    for(const m of svg.matchAll(/translate\((-?[\d.]+)px,(-?[\d.]+)px\)/g)){
      assert.ok(+m[1]>=0&&+m[1]<=maxX&&+m[2]>=0&&+m[2]<=maxY,'Snake must stay inside the calendar');
    }
    assert.doesNotMatch(svg,/<rect class="u /,'Collection bar must remain removed');
  }
}
assert.match(readme,/Selected work/);
assert.match(readme,/Contribution trail/);
assert.doesNotMatch(readme,/I build software across the stack|Working with|^### /m,'Keep presentation inside the panels');
assert.doesNotMatch(readme,/Breakout|A year, in bricks|assets\/project-/);
assert.match(readme,/Résumé/);
assert.doesNotMatch(readme,/TOKEN|SECRET|github_pat_|ghp_/);
console.log(`Profile references and ${names.length} SVG assets verified.`);
