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
const projects=JSON.parse(await readFile(new URL('data/profile.json',root),'utf8')).projects.length;
assert.equal(names.length,16+4*projects,'Expected headers, linked neofetch slices (one per project) with activity, and snake alternatives');
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
    const route=svg.match(/@keyframes s0\{(.*?)\}\.s\.s0/s)?.[1]+'}';
    const positions=[...route.matchAll(/([\d.]+)%\{transform:translate\(([\d.]+)px,([\d.]+)px\)\}/g)].filter(m=>+m[1]<=90).map(m=>({x:+m[2],y:+m[3]}));
    const visited=new Set(positions.map(p=>`${p.x},${p.y}`));
    for(const cell of cells.filter(c=>c[0].includes('class="c c')))assert.ok(visited.has(`${+cell[1]-2},${+cell[2]-2}`),'Snake must eat every active contribution');
    for(let i=0;i<positions.length;i++){
      const body=positions.slice(Math.max(0,i-9),i+1);
      assert.equal(new Set(body.map(p=>`${p.x},${p.y}`)).size,body.length,'Snake must not intersect its moving body');
    }
    for(let i=1;i<positions.length;i++)assert.equal(Math.abs(positions[i].x-positions[i-1].x)+Math.abs(positions[i].y-positions[i-1].y),16,'Snake must move between adjacent cells');
    assert.match(svg,/<g class="snake-loop">/,'Reset must happen inside the fading snake layer');
  }
}
assert.match(readme,/Selected work/);
assert.match(readme,/Contribution trail/);
assert.doesNotMatch(readme,/I build software across the stack|Working with|^### /m,'Keep presentation inside the panels');
assert.doesNotMatch(readme,/Breakout|A year, in bricks|assets\/project-/);
assert.match(readme,/Résumé/);
assert.doesNotMatch(readme,/TOKEN|SECRET|github_pat_|ghp_/);
console.log(`Profile references and ${names.length} SVG assets verified.`);
