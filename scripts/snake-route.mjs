// A one-way calendar sweep. Every cell is visited once before a hidden reset,
// so a growing body cannot collide with itself or leave the contribution grid.
export function calendarRoute(svg){
  const cells=[...svg.matchAll(/<rect class="c(?: (c[\da-z]+))?" x="([\d.]+)" y="([\d.]+)"/g)].map(m=>({id:m[1],x:+m[2]-2,y:+m[3]-2}));
  if(!cells.length)throw Error('Missing contribution calendar');
  const columns=[...new Set(cells.map(c=>c.x))].sort((a,b)=>a-b);
  const route=columns.flatMap((x,i)=>cells.filter(c=>c.x===x).sort((a,b)=>i%2?b.y-a.y:a.y-b.y));
  const occupied=new Set();
  for(let i=0;i<route.length;i++){
    const p=route[i],key=`${p.x},${p.y}`;
    if(occupied.has(key))throw Error('Snake route revisits a cell');
    if(i&&Math.abs(p.x-route[i-1].x)+Math.abs(p.y-route[i-1].y)!==16)throw Error('Snake route must move one cell at a time');
    occupied.add(key);
  }
  // 100 ms per step, with a quiet pause and fade before restarting.
  const duration=Math.round((route.length-1)*100/.9),percent=i=>+(i*90/(route.length-1)).toFixed(6);
  let css='';
  for(let n=0;n<4;n++){
    const position=i=>route[Math.max(0,i-n)];
    css+=`@keyframes s${n}{${route.map((_,i)=>`${percent(i)}%{transform:translate(${position(i).x}px,${position(i).y}px)}`).join('')}96%{transform:translate(${position(route.length-1).x}px,${position(route.length-1).y}px)}100%{transform:translate(${route[0].x}px,${route[0].y}px)}}`;
    css+=n?`@keyframes arrive${n}{0%,${(percent(n)-.001).toFixed(6)}%{opacity:0}${percent(n)}%,100%{opacity:1}}.s.s${n}{transform:translate(${route[0].x}px,${route[0].y}px);opacity:0;animation:s${n} ${duration}ms linear infinite,arrive${n} ${duration}ms steps(1) infinite}`:`.s.s0{transform:translate(${route[0].x}px,${route[0].y}px);animation-name:s0}`;
  }
  for(let i=0;i<route.length;i++){
    const c=route[i];if(!c.id)continue;
    const color=svg.match(new RegExp(`\\.c\\.${c.id}\\{fill:var\\((--c\\d)\\)`))?.[1];
    if(!color)throw Error('Missing calendar color');
    const eaten=Math.max(.02,percent(i));
    css+=`@keyframes ${c.id}{${(eaten-.01).toFixed(6)}%{fill:var(${color})}${eaten}%,100%{fill:var(--ce)}}`;
  }
  const oldDuration=svg.match(/\.s\{[^}]*?(\d+)ms/)?.[1];
  if(!oldDuration)throw Error('Missing snake timing');
  return svg.replace(/@keyframes [cs][\da-z]+\{(?:[^{}]*\{[^{}]*\})+\}/g,'').replace(/\.s\.s\d+\{[^}]*\}/g,'').replaceAll(oldDuration+'ms',duration+'ms').replace('</style>',css+`@keyframes calendar-loop{0%,100%{opacity:0}1%,94%{opacity:1}95%,99%{opacity:0}}.snake-loop{animation:calendar-loop ${duration}ms linear infinite}</style>`);
}
