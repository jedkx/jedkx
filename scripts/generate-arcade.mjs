import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

const root = new URL('../',import.meta.url);
const profile=JSON.parse(await readFile(new URL('data/profile.json',root),'utf8'));
const upstream=JSON.parse(await readFile(new URL('vendor/arcade-source.json',root),'utf8'));
const cache=new URL('.cache/',root), target=new URL('arcade.mjs',cache);
await mkdir(cache,{recursive:true});
let code;
try { code=await readFile(target); } catch { /* Download the pinned engine on first run. */ }
const checksum=bytes=>createHash('sha256').update(bytes).digest('hex');
if(!code || checksum(code)!==upstream.sha256){
  const response=await fetch(upstream.url,{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error(`Arcade source: HTTP ${response.status}`);
  code=Buffer.from(await response.arrayBuffer());
  if(checksum(code)!==upstream.sha256)throw Error('Arcade source integrity mismatch');
  await writeFile(target,code);
}
// Import only the rendering library. The upstream Action analytics/leaderboard
// wrapper is intentionally not used. This also avoids redistributing the bundle.
const {ArcadeRenderer}=await import(pathToFileURL(fileURLToPath(target)).href);
const generated=[];
for(const [theme,name] of [['github','light'],['github-dark','dark']]){
  let output='';
  const renderer=new ArcadeRenderer({
    game:'breakout',platform:'github',username:profile.username,gameTheme:theme,
    showMonthLabels:true,
    githubSettings:process.env.GITHUB_TOKEN?{accessToken:process.env.GITHUB_TOKEN}:undefined,
    svgCallback:svg=>{output=svg;}
  });
  await renderer.start();
  if(!output.startsWith('<svg') || output.includes('<script'))throw Error('Invalid arcade output');
  // Recolor the generated GitHub contribution palette, preserving its levels.
  const colors={ '#9be9a8':'#ffd1d1','#40c463':'#ff9d9d','#30a14e':'#ff7777','#216e39':'#e23d3d',
    '#0e4429':'#432327','#006d32':'#854047','#26a641':'#c74e56','#39d353':'#ff5555',
    '#2da44e':'#ff5555','#238636':'#ff5555' };
  output=output.replace(/#[0-9a-f]{6}/gi,hex=>colors[hex.toLowerCase()]||hex);
  output=output.replace(/(<circle id="ball"[^>]*fill=")#[0-9a-f]{6}/i,`$1${profile.accent}`);
  // The engine output has fixed intrinsic dimensions; add responsive scaling.
  const dimensions=output.match(/<svg[^>]*width="([\d.]+)"[^>]*height="([\d.]+)"/);
  if(dimensions && !output.includes('viewBox='))output=output.replace('<svg ',`<svg viewBox="0 0 ${dimensions[1]} ${dimensions[2]}" `);
  output=output.replace(/[\t ]+$/gm,'').trimEnd();
  const next=new URL(`assets/breakout-${name}.next.svg`,root);
  await writeFile(next,output+'\n');
  generated.push([next,new URL(`assets/breakout-${name}.svg`,root)]);
  const still=output.replace(/<animate(?:Transform|Motion)?\b[^>]*\/>/g,'')
    .replace(/<animate(?:Transform|Motion)?\b[^>]*>[\s\S]*?<\/animate(?:Transform|Motion)?>/g,'');
  const staticNext=new URL(`assets/breakout-static-${name}.next.svg`,root);
  await writeFile(staticNext,still.replace(/[\t ]+$/gm,'').trimEnd()+'\n');
  generated.push([staticNext,new URL(`assets/breakout-static-${name}.svg`,root)]);
}
// Do not replace a working pair if generating either theme fails.
for(const [next,final] of generated)await rename(next,final);
console.log('Rendered Breakout from real GitHub data (light/dark).');
