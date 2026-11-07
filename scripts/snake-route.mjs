// Chase contribution cells using shortest paths around the moving body.
// Reserve the maximum ten-segment body even before it has finished growing.
export function planFoodRoute(cells){
  const ids=new Map(cells.map(p=>[p,`${p.x},${p.y}`]));
  const key=p=>ids.get(p),board=new Map(cells.map(p=>[key(p),p]));
  const directions=[[16,0],[0,16],[-16,0],[0,-16]];
  const adjacency=new Map(cells.map(p=>[p,directions.map(([x,y])=>board.get(`${p.x+x},${p.y+y}`)).filter(Boolean)]));
  const neighbors=p=>adjacency.get(p);
  for(let seed=0;seed<16;seed++){
    const route=[cells[0]],food=new Set(cells.filter(c=>c.id).map(key));
    food.delete(key(route[0]));
    while((food.size||route.length<12)&&route.length<cells.length*20){
      const head=route.at(-1),blocked=new Set(route.slice(-9).map(key));
      const candidates=neighbors(head).filter(p=>!blocked.has(key(p))).map((p,i)=>{
        const queue=[p],seen=new Set([key(p)]),depth=[0];let distance=Infinity;
        for(let j=0;j<queue.length;j++){
          if(food.has(key(queue[j])))distance=Math.min(distance,depth[j]);
          for(const next of neighbors(queue[j])){
            const id=key(next);
            if(blocked.has(id)||seen.has(id))continue;
            seen.add(id);queue.push(next);depth.push(depth[j]+1);
          }
        }
        const previous=route.at(-2),straight=previous&&head.x-previous.x===p.x-head.x&&head.y-previous.y===p.y-head.y;
        return {p,space:seen.size,finishing:[...food].every(id=>seen.has(id)),score:food.size?distance:0,turn:straight?0:1,order:(i+seed)%4};
      }).filter(c=>c.finishing||c.space>=Math.min(20,cells.length-10)).sort((a,b)=>a.score-b.score||a.turn-b.turn||a.order-b.order);
      if(!candidates.length)break;
      route.push(candidates[0].p);food.delete(key(candidates[0].p));
    }
    if(!food.size&&route.length>=12)return route;
  }
  throw Error('Could not find a safe food-chasing route');
}
export function calendarRoute(svg){
  const cells=[...svg.matchAll(/<rect class="c(?: (c[\da-z]+))?" x="([\d.]+)" y="([\d.]+)"/g)].map(m=>({id:m[1],x:+m[2]-2,y:+m[3]-2}));
  if(!cells.length)throw Error('Missing contribution calendar');
  const route=planFoodRoute(cells);
  for(let i=0;i<route.length;i++){
    const p=route[i];
    if(route.slice(Math.max(0,i-9),i).some(q=>q.x===p.x&&q.y===p.y))throw Error('Snake route collides with its body');
    if(i&&Math.abs(p.x-route[i-1].x)+Math.abs(p.y-route[i-1].y)!==16)throw Error('Snake route must move one cell at a time');
  }
  // 100 ms per step, with a quiet pause and fade before restarting.
  const duration=Math.round((route.length-1)*100/.9),percent=i=>+(i*90/(route.length-1)).toFixed(6);
  let css='';
  for(let n=0;n<4;n++){
    const position=i=>route[Math.max(0,i-n)];
    css+=`@keyframes s${n}{${route.map((_,i)=>`${percent(i)}%{transform:translate(${position(i).x}px,${position(i).y}px)}`).join('')}96%{transform:translate(${position(route.length-1).x}px,${position(route.length-1).y}px)}100%{transform:translate(${route[0].x}px,${route[0].y}px)}}`;
    css+=n?`@keyframes arrive${n}{0%,${(percent(n)-.001).toFixed(6)}%{opacity:0}${percent(n)}%,100%{opacity:1}}.s.s${n}{transform:translate(${route[0].x}px,${route[0].y}px);opacity:0;animation:s${n} ${duration}ms linear infinite,arrive${n} ${duration}ms steps(1) infinite}`:`.s.s0{transform:translate(${route[0].x}px,${route[0].y}px);animation-name:s0}`;
  }
  const eatenIds=new Set();
  for(let i=0;i<route.length;i++){
    const c=route[i];if(!c.id)continue;
    if(eatenIds.has(c.id))continue;
    eatenIds.add(c.id);
    const color=svg.match(new RegExp(`\\.c\\.${c.id}\\{fill:var\\((--c\\d)\\)`))?.[1];
    if(!color)throw Error('Missing calendar color');
    const eaten=Math.max(.02,percent(i));
    css+=`@keyframes ${c.id}{${(eaten-.01).toFixed(6)}%{fill:var(${color})}${eaten}%,100%{fill:var(--ce)}}`;
  }
  const oldDuration=svg.match(/\.s\{[^}]*?(\d+)ms/)?.[1];
  if(!oldDuration)throw Error('Missing snake timing');
  return svg.replace(/@keyframes [cs][\da-z]+\{(?:[^{}]*\{[^{}]*\})+\}/g,'').replace(/\.s\.s\d+\{[^}]*\}/g,'').replaceAll(oldDuration+'ms',duration+'ms').replace('</style>',css+`@keyframes calendar-loop{0%,100%{opacity:0}1%,94%{opacity:1}95%,99%{opacity:0}}.snake-loop{animation:calendar-loop ${duration}ms linear infinite}</style>`);
}
