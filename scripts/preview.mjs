import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
const root=resolve(new URL('../',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
await mkdir(resolve(root,'.cache'),{recursive:true});
const markdown=await readFile(resolve(root,'README.md'),'utf8');
const response=await fetch('https://api.github.com/markdown',{
  method:'POST',headers:{'User-Agent':'jedkx-profile-preview','Content-Type':'application/json'},
  body:JSON.stringify({text:markdown,mode:'gfm',context:'jedkx/jedkx'}),signal:AbortSignal.timeout(15000)
});
let html;
if(response.ok){html=await response.text();await writeFile(resolve(root,'.cache/readme.html'),html);}
else html=await readFile(resolve(root,'.cache/readme.html'),'utf8');
const css=`*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}body.dark{--bg:#0d1117;--fg:#e6edf3;--muted:#919ba8;--rule:#30363d;--panel:#161b22}body.light{--bg:#fff;--fg:#20252c;--muted:#59636e;--rule:#d0d7de;--panel:#f6f8fa}header{border-bottom:1px solid var(--rule);padding:14px 28px;display:flex;justify-content:space-between;gap:16px;align-items:center}header span{color:var(--muted);font-size:12px}a{color:inherit;text-decoration:none}a:hover{text-decoration:underline;color:#ff5555}header a{margin-left:12px}.layout{max-width:1220px;margin:32px auto;display:grid;grid-template-columns:220px minmax(0,1fr);gap:28px;padding:0 24px}.identity img{width:160px;height:160px;border-radius:50%;border:1px solid var(--rule)}.identity h1{font-size:24px;line-height:1.3;margin-bottom:0}.identity p{margin-top:4px;color:var(--muted)}article{padding:24px;border:1px solid var(--rule);border-radius:8px;min-width:0}article>small{display:block;color:var(--muted);font:12px ui-monospace,monospace;margin-bottom:24px}article p{margin:16px 0}article h3{font-size:20px;line-height:1.3;margin:32px 0 16px}img{max-width:100%;height:auto}picture{display:block}table{border-collapse:collapse;width:100%;table-layout:fixed}td{padding:16px;border:1px solid var(--rule);vertical-align:top}td p{margin:12px 0;line-height:1.55}details{margin:28px 0 4px;padding-top:16px;border-top:1px solid var(--rule)}summary{cursor:pointer;color:var(--muted)}details picture{margin-top:16px}@media(max-width:760px){.layout{display:block;padding:0 16px;margin-top:20px}.identity{display:flex;gap:16px;align-items:center;margin-bottom:20px}.identity img{width:64px;height:64px}.identity h1{font-size:20px;margin:0}.identity p{margin:0}.identity .bio{display:none}article{padding:16px}header{padding:12px 16px}header span{display:none}td{padding:10px;font-size:13px}}`;
createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/'){
      const theme=url.searchParams.get('theme')==='light'?'light':'dark';
      const content=html.replaceAll('(prefers-color-scheme: dark)',theme==='dark'?'(min-width: 0px)':'(min-width: 99999px)');
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
      res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>jedkx · Profile preview</title><style>${css}</style><body class="${theme}"><header><b>jedkx / profile preview</b><div><span>Rendered with GitHub’s Markdown API</span><a href="/?theme=dark">Dark</a><a href="/?theme=light">Light</a></div></header><main class="layout"><aside class="identity"><img src="https://avatars.githubusercontent.com/jedkx" alt="Caner Coşkun"><div><h1>Caner Coşkun</h1><p>jedkx</p><p class="bio">Full-stack developer<br>Ankara, Türkiye</p></div></aside><article><small>jedkx / README.md</small>${content}</article></main></body></html>`);
      return;
    }
    const path=resolve(root,'.'+decodeURIComponent(url.pathname));
    if(!path.startsWith(resolve(root,'assets')+sep)||!path.endsWith('.svg')){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'Content-Type':'image/svg+xml','X-Content-Type-Options':'nosniff'});res.end(await readFile(path));
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(4180,'127.0.0.1',()=>console.log('Profile preview: http://127.0.0.1:4180/'));
