// Keep the upstream route, but replace the collection bar with a growing tail.
export function styleSnake(svg){
  // Upstream uses an outside lane to travel between cells and reset the loop.
  // Fold that lane onto the calendar edges for every body segment, not just the head.
  const cells=[...svg.matchAll(/<rect class="c(?: [^"]+)?" x="([\d.]+)" y="([\d.]+)"/g)];
  if(!cells.length)throw Error('Missing contribution grid');
  const maxX=Math.max(...cells.map(c=>+c[1]))-2,maxY=Math.max(...cells.map(c=>+c[2]))-2;
  svg=svg.replace(/translate\((-?[\d.]+)px,(-?[\d.]+)px\)/g,(_,x,y)=>`translate(${Math.max(0,Math.min(maxX,+x))}px,${Math.max(0,Math.min(maxY,+y))}px)`);
  const duration=Number(svg.match(/\.s\{[^}]*?(\d+)ms/)?.[1]);
  const headMatch=svg.match(/@keyframes s0\{(.*?)\}\.s\.s0/s);
  if(!duration||!headMatch)throw Error('Unsupported upstream snake format');
  const head=headMatch[1]+'}';
  const points=[];
  for(const m of head.matchAll(/([\d.% ,]+)\{transform:translate\((-?[\d.]+)px,(-?[\d.]+)px\)\}/g)){
    for(const time of m[1].split(','))points.push({t:parseFloat(time),x:+m[2],y:+m[3]});
  }
  points.sort((a,b)=>a.t-b.t);
  if(!points.length)throw Error('Missing snake route');
  points.push({...points[0],t:100});
  const at=t=>{
    t=(t+100)%100;
    const i=points.findIndex(p=>p.t>=t),b=points[i],a=points[Math.max(0,i-1)];
    const ratio=b.t===a.t?0:(t-a.t)/(b.t-a.t);
    return {x:a.x+(b.x-a.x)*ratio,y:a.y+(b.y-a.y)*ratio};
  };
  const meals=[...svg.matchAll(/@keyframes c[\da-z]+\{[\d.]+%\{fill:var\(--c\d\)\}([\d.]+)%,100%/g)].map(m=>+m[1]).sort((a,b)=>a-b);
  let css='',tail='';
  // Six additional segments: bounded growth avoids overwhelming the calendar.
  for(let n=4;n<10&&meals.length;n++){
    const delay=n*10000/duration;
    const frames=[{t:0,...at(-delay)},...points.filter(p=>p.t+delay<100).map(p=>({...p,t:p.t+delay})),{t:100,...at(-delay)}].sort((a,b)=>a.t-b.t);
    const born=meals[Math.min(meals.length-1,Math.floor((n-3)*meals.length/7))];
    css+=`@keyframes tail${n}{${frames.map(p=>`${p.t.toFixed(4)}%{transform:translate(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px)}`).join('')}}@keyframes grow${n}{0%,${Math.max(0,born-.01)}%{opacity:0}${born}%,100%{opacity:1}}.tail${n}{fill:var(--cs);opacity:0;animation:tail${n} ${duration}ms linear infinite,grow${n} ${duration}ms steps(1) infinite}`;
    tail+=`<rect class="tail${n}" x="3" y="3" width="10" height="10" rx="3"/>`;
  }
  // Short, subtle head highlights at actual eaten-cell timestamps.
  const flashes=meals.filter((t,i)=>i===0||t-meals[i-1]>.5).map(t=>`${Math.max(0,t-.02)}%{fill:var(--cs)}${t}%{fill:#ffe8e8}${Math.min(99.99,t+.25)}%{fill:var(--cs)}`).join('');
  css+=`@keyframes bite{0%,100%{fill:var(--cs)}${flashes}}.s.s0{animation-name:s0,bite;animation-duration:${duration}ms,${duration}ms;animation-timing-function:linear,linear;animation-iteration-count:infinite,infinite}.eye{fill:#10151c;transform-box:fill-box;transform-origin:center;animation:wink 4.6s infinite}.eye.second{animation-delay:.12s}@keyframes wink{0%,43%,49%,100%{transform:scaleY(1)}46%{transform:scaleY(.15)}}`;
  // A thin expanding outline marks the cell being eaten, then disappears.
  let ripples='';
  for(const m of svg.matchAll(/<rect class="c (c[\da-z]+)"([^>]+)\/>/g)){
    const eaten=Number(svg.match(new RegExp(`@keyframes ${m[1]}\\{[\\d.]+%\\{fill:var\\(--c\\d\\)\\}([\\d.]+)%,100%`))?.[1]);
    if(!eaten||eaten>98)continue;
    css+=`@keyframes meal-${m[1]}{0%,${(eaten-.01).toFixed(3)}%,${(eaten+1.2).toFixed(3)}%,100%{opacity:0;stroke-width:0}${eaten}%{opacity:.8;stroke-width:2}${(eaten+.6).toFixed(3)}%{opacity:.3;stroke-width:4}}.meal-${m[1]}{fill:none;stroke:var(--cs);opacity:0;animation:meal-${m[1]} ${duration}ms linear infinite}`;
    ripples+=`<rect class="meal-${m[1]}"${m[2]} width="12" height="12"/>`;
  }
  const dark=svg.includes('--ce:#161b22'),bg=dark?'#0d1117':'#ffffff',panel=dark?'#10151c':'#f6f8fa',rule=dark?'#30363d':'#d0d7de',muted=dark?'#919ba8':'#59636e';
  const frame=`<rect x="-25.5" y="-73.5" width="899" height="213" rx="9" fill="${bg}" stroke="${rule}"/><path d="M-17 -73.5H865Q873.5 -73.5 873.5 -65V-40H-25.5V-65Q-25.5 -73.5 -17 -73.5Z" fill="${panel}"/><path d="M-25 -40H873" stroke="${rule}"/>${['var(--cs)',rule,muted].map((color,i)=>`<circle cx="${-9+i*12}" cy="-57" r="3" fill="${color}"/>`).join('')}<text x="50" y="-53" fill="${muted}" font-family="ui-monospace,SFMono-Regular,Consolas,monospace" font-size="11">~/contributions</text>`;
  const animated=svg.replace(/<rect class="u [^"]+"[^>]*\/>/g,'').replace(/viewBox="[^"]+"/,'viewBox="-26 -74 900 214"').replace('width="880"','width="900"').replace('height="192"','height="214"').replace('</style>',css+'</style>'+frame).replace(/<rect class="s s0"([^>]+)\/>/,`${ripples}${tail}<g class="s s0"><rect$1/><circle class="eye" cx="5" cy="5.5" r="1.3"/><circle class="eye second" cx="10.5" cy="5.5" r="1.3"/></g>`);
  return animated;
}
