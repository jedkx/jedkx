// Keep the upstream route, but replace the collection bar with a growing tail.
export function styleSnake(svg){
  const duration=Number(svg.match(/\.s\{[^}]*?(\d+)ms/)?.[1]);
  const head=svg.match(/@keyframes s0\{(.*?)\}\.s\.s0/s)?.[1]+'}';
  if(!duration||!head)throw Error('Unsupported upstream snake format');
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
  css+=`@keyframes bite{0%,100%{fill:var(--cs)}${flashes}}.s.s0{animation-name:s0,bite;animation-duration:${duration}ms,${duration}ms;animation-timing-function:linear,linear;animation-iteration-count:infinite,infinite}`;
  return svg.replace(/<rect class="u [^"]+"[^>]*\/>/g,'').replace('880 192','880 176').replace('height="192"','height="176"').replace('</style>',css+'</style>').replace('<rect class="s s0"',tail+'<rect class="s s0"');
}
