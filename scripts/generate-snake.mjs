import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {styleSnake} from './style-snake.mjs';
const root=new URL('../',import.meta.url);
const profile=JSON.parse(await readFile(new URL('data/profile.json',root),'utf8'));
const upstream=JSON.parse(await readFile(new URL('vendor/snake-source.json',root),'utf8'));
if(!process.env.GITHUB_TOKEN)throw Error('GITHUB_TOKEN is required to read the real contribution calendar.');
const cache=new URL('.cache/snake/',root),output=new URL('.cache/snake-output/',root);
await mkdir(cache,{recursive:true});await mkdir(output,{recursive:true});
await writeFile(new URL('package.json',cache),'{"type":"commonjs"}\n');
await Promise.all(upstream.files.map(async file=>{
  const path=new URL(file.name,cache);let bytes;
  try{bytes=await readFile(path);}catch{/* Fetch pinned upstream bundle on first run. */}
  const hash=data=>createHash('sha256').update(data).digest('hex');
  if(!bytes||hash(bytes)!==file.sha256){
    const response=await fetch(file.url,{signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw Error(`Snake source: HTTP ${response.status}`);
    bytes=Buffer.from(await response.arrayBuffer());
    if(hash(bytes)!==file.sha256)throw Error('Snake source integrity mismatch');
    await writeFile(path,bytes);
  }
}));
const outputs=[['light','github-light','#ebedf0,#ffd1d1,#ff9d9d,#ff7777,#e23d3d'],['dark','github-dark','#161b22,#432327,#854047,#c74e56,#ff5555']].map(([theme,palette,dots])=>{
  const query=new URLSearchParams({palette,color_snake:profile.accent,color_dots:dots});
  return `${fileURLToPath(new URL(theme+'.svg',output))}?${query}`;
}).join('\n');
execFileSync(process.execPath,[fileURLToPath(new URL('index.js',cache))],{
  cwd:fileURLToPath(root),stdio:'inherit',timeout:180000,
  env:{...process.env,INPUT_GITHUB_USER_NAME:profile.username,INPUT_GITHUB_TOKEN:process.env.GITHUB_TOKEN,INPUT_OUTPUTS:outputs}
});
const files=[];
for(const theme of ['dark','light']){
  const svg=styleSnake(await readFile(new URL(theme+'.svg',output),'utf8'));
  if(!svg.includes('<svg')||/<script\b/i.test(svg))throw Error('Invalid snake SVG output');
  const still=svg.replace('</svg>','<style>*{animation:none!important;transition:none!important}</style></svg>');
  for(const [suffix,content] of [[theme,svg],['static-'+theme,still]]){
    const next=new URL(`assets/snake-${suffix}.next.svg`,root);
    await writeFile(next,content.replace(/[\t ]+$/gm,'').trimEnd()+'\n');
    files.push([next,new URL(`assets/snake-${suffix}.svg`,root)]);
  }
}
for(const [next,path] of files)await rename(next,path);
console.log('Generated Platane snake animations from the real contribution calendar.');
