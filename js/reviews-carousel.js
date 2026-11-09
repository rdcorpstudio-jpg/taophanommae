(()=>{'use strict';
const grid=document.querySelector('#reviews .reviews-grid');
if(!grid)return;

grid.querySelectorAll('[data-review-clone]').forEach(n=>n.remove());
const cards=[...grid.querySelectorAll('.review-card')];
if(cards.length<2)return;

const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const copies=cards.map(card=>{
  const c=card.cloneNode(true);
  c.setAttribute('data-review-clone','');
  c.setAttribute('aria-hidden','true');
  c.inert=true;
  c.querySelectorAll('button').forEach(n=>n.remove());
  c.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
  c.querySelectorAll('[data-media-slot]').forEach(n=>{
    n.removeAttribute('data-media-slot');
    n.removeAttribute('data-media-label');
  });
  c.querySelectorAll('[data-edit]').forEach(n=>n.removeAttribute('data-edit'));
  grid.append(c);
  return c;
});

const step=()=>cards.length>1?cards[1].offsetLeft-cards[0].offsetLeft:grid.clientWidth;
const cycle=()=>copies[0]?copies[0].offsetLeft-cards[0].offsetLeft:0;
const indexFromScroll=()=>{
  const s=Math.max(step(),1);
  const size=cycle()||(s*cards.length);
  const x=((grid.scrollLeft%s)+s)%s;
  // map within original set
  let best=0,bestDist=Infinity;
  const mid=grid.getBoundingClientRect().left+grid.clientWidth/2;
  cards.forEach((card,i)=>{
    const r=card.getBoundingClientRect();
    const d=Math.abs(r.left+r.width/2-mid);
    if(d<bestDist){bestDist=d;best=i}
  });
  return best;
};

let userStopped=false,inView=false,last=0,raf=0,position=0;
let dragging=false,startX=0,startLeft=0;

function stopAuto(){userStopped=true}
function setSnap(on){
  grid.style.scrollSnapType=on?'x mandatory':'none';
  grid.style.scrollBehavior=on?'smooth':'auto';
}
setSnap(false);

function go(delta,fromUser){
  if(fromUser)stopAuto();
  const size=cycle();
  if(size<=0)return;
  let x=grid.scrollLeft;
  if(delta<0&&x<step()){x+=size;grid.scrollLeft=x}
  if(delta>0&&x>=size){x-=size;grid.scrollLeft=x}
  setSnap(true);
  grid.scrollTo({left:x+delta*step(),behavior:reduce.matches?'instant':'smooth'});
  const end=()=>{
    position=grid.scrollLeft;
    if(!userStopped)setSnap(false);
    grid.removeEventListener('scrollend',end);
    clearTimeout(fallback);
  };
  const fallback=setTimeout(end,650);
  grid.addEventListener('scrollend',end,{once:true});
  if(reduce.matches)end();
}

let tx=0,ty=0;
grid.addEventListener('touchstart',e=>{
  tx=e.changedTouches[0].clientX;
  ty=e.changedTouches[0].clientY;
},{passive:true});
grid.addEventListener('touchend',e=>{
  const dx=e.changedTouches[0].clientX-tx;
  const dy=e.changedTouches[0].clientY-ty;
  if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.2)go(dx<0?1:-1,true);
},{passive:true});

grid.addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch'){stopAuto();return}
  dragging=true;
  stopAuto();
  startX=e.clientX;
  startLeft=grid.scrollLeft;
  grid.setPointerCapture?.(e.pointerId);
  setSnap(false);
},{passive:true});
grid.addEventListener('pointermove',e=>{
  if(!dragging)return;
  grid.scrollLeft=startLeft-(e.clientX-startX);
  position=grid.scrollLeft;
},{passive:true});
grid.addEventListener('pointerup',e=>{
  if(!dragging)return;
  dragging=false;
  const dx=e.clientX-startX;
  if(Math.abs(dx)>48)go(dx<0?1:-1,true);
  else{
    setSnap(true);
    const pad=parseFloat(getComputedStyle(grid).paddingLeft)||0;
    const i=indexFromScroll();
    grid.scrollTo({left:Math.max(0,cards[i].offsetLeft-pad),behavior:reduce.matches?'instant':'smooth'});
    setTimeout(()=>{position=grid.scrollLeft},400);
  }
},{passive:true});
grid.addEventListener('pointercancel',()=>{
  dragging=false;
  position=grid.scrollLeft;
},{passive:true});
grid.addEventListener('wheel',e=>{
  if(Math.abs(e.deltaX)>Math.abs(e.deltaY)||e.shiftKey)stopAuto();
},{passive:true});
grid.addEventListener('scroll',()=>{if(!raf||userStopped||dragging)position=grid.scrollLeft},{passive:true});

grid.setAttribute('tabindex','0');
grid.setAttribute('role','region');
grid.setAttribute('aria-label','รีวิวจากลูกค้า เลื่อนซ้ายขวาเพื่อดูต่อ');
grid.addEventListener('keydown',e=>{
  if(e.key==='ArrowRight'){e.preventDefault();go(1,true)}
  if(e.key==='ArrowLeft'){e.preventDefault();go(-1,true)}
});

new IntersectionObserver(entries=>{
  inView=entries[0].isIntersecting;
  if(!inView){if(raf){cancelAnimationFrame(raf);raf=0;last=0}}
  else if(inView&&!userStopped&&!reduce.matches&&!raf){
    position=grid.scrollLeft;
    raf=requestAnimationFrame(tick);
  }
},{threshold:.15}).observe(grid.closest('#reviews')||grid);

function tick(now){
  raf=0;
  if(!inView||userStopped||reduce.matches){last=0;return}
  const dt=last?Math.min(now-last,40):0;
  last=now;
  if(!dragging){
    const size=cycle();
    if(size>0){
      // gentle continuous drift ~22px/s
      position+=22*dt/1000;
      if(position>=size)position-=size;
      if(position<0)position+=size;
      grid.scrollLeft=position;
    }
  }else position=grid.scrollLeft;
  raf=requestAnimationFrame(tick);
}

if(!reduce.matches){
  position=grid.scrollLeft;
  raf=requestAnimationFrame(tick);
}
})();
