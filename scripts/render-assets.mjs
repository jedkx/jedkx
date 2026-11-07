import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';

const root = new URL('../', import.meta.url);
const profile = JSON.parse(await readFile(new URL('data/profile.json', root), 'utf8'));
const repos = JSON.parse(await readFile(new URL('data/repositories.json', root), 'utf8'));
const meta = JSON.parse(await readFile(new URL('art/resident/sheet.json', root), 'utf8'));
const frames = Object.values(meta.frames);
const xml = (value) => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' })[c]);
const mono = 'ui-monospace,SFMono-Regular,Consolas,monospace';
const palettes = {
  dark: { bg:'#0d1117', panel:'#10151c', fg:'#e6edf3', muted:'#919ba8', rule:'#30363d' },
  light: { bg:'#ffffff', panel:'#f6f8fa', fg:'#20252c', muted:'#59636e', rule:'#d0d7de' }
};
// Decode the approved RGBA Aseprite atlas. No redraw, recoloring or rescaling of its geometry.
function decodePng(buf) {
  if (buf.subarray(0,8).toString('hex') !== '89504e470d0a1a0a') throw Error('Invalid PNG');
  let width, height, chunks=[];
  for (let at=8; at<buf.length;) {
    const size=buf.readUInt32BE(at), kind=buf.toString('ascii',at+4,at+8), data=buf.subarray(at+8,at+8+size);
    if (kind==='IHDR') {
      width=data.readUInt32BE(0); height=data.readUInt32BE(4);
      if (data[8]!==8 || data[9]!==6 || data[12]!==0) throw Error('Expected non-interlaced RGBA8 PNG');
    }
    if (kind==='IDAT') chunks.push(data);
    at += size+12;
  }
  const raw=inflateSync(Buffer.concat(chunks)), stride=width*4, out=Buffer.alloc(width*height*4);
  if (raw.length !== (stride+1)*height) throw Error('PNG row length mismatch');
  const paeth=(a,b,c)=>{ const p=a+b-c, pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c); return pa<=pb&&pa<=pc?a:pb<=pc?b:c; };
  for (let y=0; y<height; y++) {
    const filter=raw[y*(stride+1)];
    if (filter>4) throw Error('Unknown PNG filter');
    for (let x=0;x<stride;x++) {
      const a=x>=4?out[y*stride+x-4]:0,b=y?out[(y-1)*stride+x]:0,c=y&&x>=4?out[(y-1)*stride+x-4]:0;
      out[y*stride+x]=(raw[y*(stride+1)+1+x]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;
    }
  }
  return {width,height,pixels:out};
}
const png=decodePng(await readFile(new URL('art/resident/sheet.png',root)));
function pose(index) {
  const frame=frames[index].frame, neutral=frames[0].frame;
  let path='';
  for (let y=0;y<40;y++) {
    // Keep neutral eyes during chewing, matching the approved website renderer.
    const source=index>=26&&index<=38&&y<25?neutral:frame;
    const on=x=>png.pixels[((source.y+y)*png.width+source.x+x)*4+3]>127;
    for(let x=0;x<68;) {
      if(!on(x)){x++;continue;}
      const start=x; while(x<68&&on(x))x++;
      path+=`M${start} ${y}h${x-start}v1H${start}z`;
    }
  }
  return path;
}
const sequence=[{frame:0,ms:2400},...Array.from({length:9},(_,i)=>({frame:i+1,ms:Math.round(frames[i+1].duration*1.25)})),{frame:0,ms:3200},...Array.from({length:7},(_,i)=>({frame:39+i,ms:frames[39+i].duration})),{frame:0,ms:2600},...Array.from({length:13},(_,i)=>({frame:26+i,ms:Math.round(frames[26+i].duration*1.4)})),{frame:0,ms:4400}];
const total=sequence.reduce((n,s)=>n+s.ms,0);
const timeOf=frame=>sequence.slice(0,sequence.findIndex(s=>s.frame===frame)).reduce((n,s)=>n+s.ms,0)/total;
function snack(mobile){
  const start=timeOf(26),bite=timeOf(29),from=mobile?'394 294':'826 205',to=mobile?'317 294':'748 181';
  const keys=`0;${start};${bite};${bite+.0001};1`;
  return `<rect class="snack" x="-3" y="-3" width="6" height="6" fill="${profile.accent}" opacity="0"><animate attributeName="opacity" values="0;1;1;0;0" keyTimes="${keys}" calcMode="discrete" dur="${total}ms" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="${from};${from};${to};${to};${to}" keyTimes="${keys}" dur="${total}ms" repeatCount="indefinite"/></rect>`;
}
function resident(x,y,scale) {
  let at=0;
  const defs=[...new Set(sequence.map(s=>s.frame))].map(i=>`<path id="face-${i}" d="${pose(i)}"/>`).join('');
  const keys=sequence.map(s=>{const key=(at/total).toFixed(7);at+=s.ms;return key;});
  const values=sequence.map(s=>`#face-${s.frame}`);
  return `<defs>${defs}</defs><g transform="translate(${x} ${y}) scale(${scale})" fill="#f4f4f4" shape-rendering="crispEdges"><use class="resident-still" href="#face-0"/><use class="resident-motion" href="#face-0"><animate attributeName="href" values="${[...values,values[0]].join(';')}" keyTimes="${[...keys,'1'].join(';')}" calcMode="discrete" dur="${total}ms" repeatCount="indefinite"/></use></g>`;
}
const text=(x,y,value,size=12,color='#e6edf3',extra='')=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" ${extra}>${xml(value)}</text>`;
const svg=(w,h,body,label,extra='')=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title" font-family="${mono}" ${extra}><title id="title">${xml(label)}</title>${body}</svg>\n`;
function header(theme,mobile=false) {
  const p=palettes[theme],w=mobile?440:900,h=mobile?350:300;
  const left=mobile?28:44;
  const styles=`<style>.line{opacity:0;animation:reveal .6s ease forwards}.l1{animation-delay:.15s}.l2{animation-delay:.45s}.l3{animation-delay:.75s}.cursor{animation:blink 1.15s steps(1) infinite}.resident-still{display:none}@keyframes reveal{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}@keyframes blink{50%{opacity:0}}@media(prefers-reduced-motion:reduce){.line{animation:none;opacity:1}.cursor{animation:none}.resident-motion{display:none}.resident-still{display:inline}.snack{display:none}}</style>`;
  let body=`${styles}<rect x=".5" y=".5" width="${w-1}" height="${h-1}" rx="12" fill="${p.bg}" stroke="${p.rule}"/><path d="M1 45H${w-1}" stroke="${p.rule}"/>${text(left,28,'caner@jedkx:~',12,p.muted)}${text(w-28,28,'●',10,profile.accent,'text-anchor="end"')}`;
  body+=`<g class="line l1">${text(left,83,'$ whoami',12,profile.accent)}</g>`;
  if(mobile){
    body+=`<g class="line l2">${text(left,131,'CANER COŞKUN',38,p.fg,'font-family="Arial,Helvetica,sans-serif" font-weight="800" letter-spacing="-1.4"')}</g>`;
    body+=`<g class="line l3">${text(left,169,'Full-stack developer',15,p.fg)}${text(left,194,'Ankara, Türkiye',12,p.muted)}${text(left,246,'$ hello friend',11,profile.accent)}<rect class="cursor" x="132" y="258" width="7" height="12" fill="${profile.accent}"/></g>`;
    body+=`<rect x="220" y="218" width="194" height="108" rx="8" fill="#070707"/>${resident(249,232,2)}`;
    body+=text(left,316,'software / games',10,p.muted);
  }else{
    body+=`<g class="line l2">${text(left,143,'CANER COŞKUN',57,p.fg,'font-family="Arial,Helvetica,sans-serif" font-weight="800" letter-spacing="-2"')}</g>`;
    body+=`<g class="line l3">${text(left,183,'Full-stack developer · Ankara, Türkiye',15,p.fg)}${text(left,220,'software / games / embedded systems',12,p.muted)}</g>`;
    body+=`<path d="M${left} 246H${w-left}" stroke="${p.rule}"/>${text(left,276,'C# / TypeScript / Python / Go / C++',11,p.muted)}${text(w-left,276,'hello friend',11,profile.accent,'text-anchor="end"')}<rect class="cursor" x="${w-left+8}" y="266" width="6" height="11" fill="${profile.accent}"/>`;
    body+=`<rect x="640" y="82" width="216" height="140" rx="8" fill="#070707"/>${resident(663,104,2.5)}`;
  }
  return svg(w,h,body+snack(mobile),'Caner Coşkun. Full-stack developer in Ankara. Software, games and embedded systems.');
}
function cover(project,index,theme){
  const p=palettes[theme];
  const nodes=project.diagram.map((label,i)=>{
    const x=24+i*145;
    return `<rect x="${x}" y="139" width="132" height="34" rx="3" fill="${p.panel}" stroke="${i===1?profile.accent:p.rule}"/>${text(x+66,160,label,9,i===1?profile.accent:p.fg,'text-anchor="middle"')}${i<2?`<path d="M${x+132} 156h13m-4-3 4 3-4 3" fill="none" stroke="${p.muted}"/>`:''}`;
  }).join('');
  const styles=`<style>.caret{animation:blink 1.4s steps(1) ${index*.17}s infinite}@keyframes blink{50%{opacity:0}}@media(prefers-reduced-motion:reduce){.caret{animation:none}}</style>`;
  const chrome=`<path d="M8 .5H462Q469.5 .5 469.5 8V32H.5V8Q.5 .5 8 .5Z" fill="${p.panel}"/><path d="M1 32H469" stroke="${p.rule}"/>${[profile.accent,p.rule,p.muted].map((color,i)=>`<circle cx="${16+i*12}" cy="16" r="3" fill="${color}"/>`).join('')}${text(76,20,`~/work/${project.name}`,10,p.muted)}${text(449,20,'zsh',9,p.muted,'text-anchor="end"')}`;
  const body=`${text(24,61,'$ cat project.info',11,profile.accent)}${text(24,98,project.title,25,p.fg,'font-weight="700" letter-spacing="-.8"')}${text(24,119,project.category,9,p.muted)}${nodes}<path d="M24 190H446" stroke="${p.rule}"/>${text(24,210,project.stack,10,p.muted)}${text(24,235,'$ open repository',10,profile.accent)}<rect class="caret" x="134" y="226" width="6" height="10" fill="${profile.accent}"/>${text(446,235,`0${index+1} ↗`,10,p.muted,'text-anchor="end"')}`;
  return svg(470,252,`${styles}<rect x=".5" y=".5" width="469" height="251" rx="8" fill="${p.bg}" stroke="${p.rule}"/>${chrome}${body}`,`${project.title} terminal project card: ${project.summary}`);
}
function activity(theme){
  const p=palettes[theme];
  const selected=repos.filter(r=>!r.fork&&!r.archived&&r.name!==profile.username&&r.pushed_at).sort((a,b)=>b.pushed_at.localeCompare(a.pushed_at)).slice(0,3);
  return svg(900,150,`<rect x=".5" y=".5" width="899" height="149" rx="8" fill="${p.bg}" stroke="${p.rule}"/>${text(24,29,'RECENT REPOSITORY UPDATES',11,p.muted)}${selected.map((r,i)=>`${text(24,61+i*32,'›',14,profile.accent)}${text(47,61+i*32,r.name,13,p.fg)}${text(650,61+i*32,r.language||'—',11,p.muted)}${text(875,61+i*32,r.pushed_at.slice(0,10),11,p.muted,'text-anchor="end"')}`).join('')}`,'Recent public repository push dates. Not a live activity feed.');
}
const versions=new Map();
const asset=name=>`assets/${name}?v=${versions.get(name)}`;
function picture(stem,alt,width=900,mobile=false){
  return `<picture>\n${stem==='breakout'?`  <source media="(prefers-reduced-motion: reduce) and (prefers-color-scheme: dark)" srcset="${asset('breakout-static-dark.svg')}">\n  <source media="(prefers-reduced-motion: reduce)" srcset="${asset('breakout-static-light.svg')}">\n`:''}${mobile?`  <source media="(max-width: 600px) and (prefers-color-scheme: dark)" srcset="${asset(stem+'-mobile-dark.svg')}">\n  <source media="(max-width: 600px)" srcset="${asset(stem+'-mobile-light.svg')}">\n`:''}  <source media="(prefers-color-scheme: dark)" srcset="${asset(stem+'-dark.svg')}">\n  <img src="${asset(stem+'-light.svg')}" alt="${xml(alt)}" width="${width}">\n</picture>`;
}
await mkdir(new URL('assets/',root),{recursive:true});
for(const theme of Object.keys(palettes)){
  await writeFile(new URL(`assets/header-${theme}.svg`,root),header(theme));
  await writeFile(new URL(`assets/header-mobile-${theme}.svg`,root),header(theme,true));
  await writeFile(new URL(`assets/activity-${theme}.svg`,root),activity(theme));
  for(const [i,p] of profile.projects.entries())await writeFile(new URL(`assets/project-${p.name.toLowerCase()}-${theme}.svg`,root),cover(p,i,theme));
}
for(const name of (await readdir(new URL('assets/',root))).filter(n=>n.endsWith('.svg'))){
  versions.set(name,createHash('sha256').update(await readFile(new URL('assets/'+name,root))).digest('hex').slice(0,12));
}
const projectRows=[0,2].map(start=>`<tr>\n${profile.projects.slice(start,start+2).map(p=>`<td width="50%" valign="top">\n<a href="https://github.com/${profile.username}/${p.name}">${picture('project-'+p.name.toLowerCase(),p.title+' system diagram',450)}</a>\n\n**[${p.title}](https://github.com/${profile.username}/${p.name})**\n\n${p.summary}\n\n</td>`).join('\n')}\n</tr>`).join('\n');
const readme=`<!-- Generated by scripts/render-assets.mjs. Edit data/profile.json, not this file. -->
<a href="${profile.portfolio}">
${picture('header','Caner Coşkun — full-stack developer. Animated terminal with the original pixel resident.',900,true)}
</a>

<p align="center"><a href="${profile.portfolio}">Portfolio ↗</a> &nbsp; / &nbsp; <a href="${profile.cv}">Résumé</a> &nbsp; / &nbsp; <a href="mailto:${profile.email}">Email</a> &nbsp; / &nbsp; <a href="https://www.linkedin.com/in/caner-co%C5%9Fkun/">LinkedIn</a></p>

I build software across the stack, with a soft spot for games, playful interfaces and small computers.

**Working with** C# / ASP.NET Core · TypeScript / React · Python · Go · C/C++

### Selected work

<table>
${projectRows}
</table>

### A year, in bricks

My contribution calendar, played back as Breakout. [Play the real paddle game on my site ↗](${profile.portfolio})

${picture('breakout','Animated Breakout replay generated from my GitHub contribution calendar.',900)}

<details>
<summary>What I’ve been working on</summary>

${picture('activity','Recent repository push dates. Generated automatically from public GitHub data.')}

</details>
`;
await writeFile(new URL('README.md',root),readme);
console.log(`Rendered profile, 4 project diagrams, theme/mobile variants; resident uses ${new Set(sequence.map(s=>s.frame)).size} approved poses.`);
