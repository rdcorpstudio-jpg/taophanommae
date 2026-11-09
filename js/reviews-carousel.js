(()=>{'use strict';
const grid=document.querySelector('#reviews .reviews-grid');
if(!grid)return;

const cards=[...grid.querySelectorAll('.review-card')];
if(cards.length<2)return;

const mobile=()=>matchMedia('(max-width:950px)').matches;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const step=()=>cards.length>1?cards[1].offsetLeft-cards[0].offsetLeft:grid.clientWidth;
const indexFromScroll=()=>Math.max(0,Math.min(cards.length-1,Math.round(grid.scrollLeft/Math.max(step(),1))));

let userStopped=false,inView=false,elapsed=0,last=0,raf=0;

function stopAuto(){userStopped=true;elapsed=0}
function go(delta,fromUser){
  if(fromUser)stopAuto();
  if(!mobile())return;
  const cur=indexFromScroll();
  let i=cur+delta;
  if(i>cards.length-1)i=0;
  if(i<0)i=cards.length-1;
  const pad=parseFloat(getComputedStyle(grid).paddingLeft)||0;
  const left=Math.max(0,cards[i].offsetLeft-pad);
  const wrap=(cur===cards.length-1&&i===0)||(cur===0&&i===cards.length-1);
  grid.style.scrollSnapType='none';
  grid.scrollTo({left,behavior:(wrap||reduce.matches)?'instant':'smooth'});
  const end=()=>{
    grid.style.scrollSnapType='';
    grid.removeEventListener('scrollend',end);
    clearTimeout(fallback);
  };
  const fallback=setTimeout(end,700);
  grid.addEventListener('scrollend',end,{once:true});
  if(wrap||reduce.matches)end();
}

let tx=0,ty=0;
grid.addEventListener('touchstart',e=>{
  tx=e.changedTouches[0].clientX;
  ty=e.changedTouches[0].clientY;
},{passive:true});
grid.addEventListener('touchend',e=>{
  if(!mobile())return;
  const dx=e.changedTouches[0].clientX-tx;
  const dy=e.changedTouches[0].clientY-ty;
  if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.2)go(dx<0?1:-1,true);
},{passive:true});
grid.addEventListener('pointerdown',()=>stopAuto(),{passive:true});
grid.addEventListener('wheel',()=>stopAuto(),{passive:true});

grid.setAttribute('tabindex','0');
grid.setAttribute('role','region');
grid.setAttribute('aria-label','รีวิวจากลูกค้า ปัดซ้ายขวาเพื่อดูต่อ');
grid.addEventListener('keydown',e=>{
  if(!mobile())return;
  if(e.key==='ArrowRight'){e.preventDefault();go(1,true)}
  if(e.key==='ArrowLeft'){e.preventDefault();go(-1,true)}
});

new IntersectionObserver(entries=>{
  inView=entries[0].isIntersecting;
  if(!inView){elapsed=0;if(raf){cancelAnimationFrame(raf);raf=0;last=0}}
  else if(inView&&!userStopped&&!reduce.matches&&!raf)raf=requestAnimationFrame(tick);
},{threshold:.2}).observe(grid.closest('#reviews')||grid);

function tick(now){
  raf=0;
  if(!inView||userStopped||reduce.matches||!mobile()){last=0;elapsed=0;return}
  const dt=last?Math.min(now-last,100):0;last=now;
  elapsed+=dt;
  if(elapsed>=4500){elapsed=0;go(1,false)}
  raf=requestAnimationFrame(tick);
}

if(mobile()&&!reduce.matches)raf=requestAnimationFrame(tick);
})();
