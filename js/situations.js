(()=>{'use strict';
const root=document.querySelector('.situations-carousel');
if(!root)return;

const slides=[...root.querySelectorAll('.situation-slide')];
const dots=[...root.querySelectorAll('[data-situation-index]')];
const status=root.querySelector('.situation-status');
const prev=root.querySelector('.situation-prev');
const next=root.querySelector('.situation-next');

let active=0;
let inView=false;
let elapsed=0;
let last=0;
let userStopped=false;
let x=0;
let y=0;

const motion=matchMedia('(prefers-reduced-motion: reduce)');
const blocked=()=>
  motion.matches
  ||document.hidden
  ||document.body.classList.contains('motion-off')
  ||document.documentElement.classList.contains('motion-disabled')
  ||document.body.classList.contains('editing')
  ||!document.querySelector('#editor-panel')?.hidden;

function show(index,announce=true){
  elapsed=0;
  const previous=active;
  active=(index+slides.length)%slides.length;
  slides.forEach((s,i)=>{s.hidden=i!==active});
  dots.forEach((d,i)=>d.setAttribute('aria-pressed',String(i===active)));
  if(previous!==active&&!blocked()){
    slides[active].animate(
      [{opacity:0,transform:'translateX(12px)'},{opacity:1,transform:'translateX(0)'}],
      {duration:600,easing:'ease-out'}
    );
  }
  if(announce)status.textContent='กรณีที่ '+(active+1)+' จาก '+slides.length;
}

function stopAuto(){
  userStopped=true;
  elapsed=0;
}

function go(index,fromUser){
  if(fromUser)stopAuto();
  show(index,true);
}

prev.addEventListener('click',()=>go(active-1,true));
next.addEventListener('click',()=>go(active+1,true));
dots.forEach((d,i)=>d.addEventListener('click',()=>go(i,true)));

root.addEventListener('keydown',e=>{
  if(e.target!==root)return;
  if(e.key==='ArrowRight'){e.preventDefault();go(active+1,true)}
  if(e.key==='ArrowLeft'){e.preventDefault();go(active-1,true)}
  if(e.key==='Home'){e.preventDefault();go(0,true)}
  if(e.key==='End'){e.preventDefault();go(slides.length-1,true)}
});

root.addEventListener('touchstart',e=>{
  x=e.changedTouches[0].clientX;
  y=e.changedTouches[0].clientY;
},{passive:true});

root.addEventListener('touchend',e=>{
  const dx=e.changedTouches[0].clientX-x;
  const dy=e.changedTouches[0].clientY-y;
  if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.3)go(active+(dx<0?1:-1),true);
},{passive:true});

document.querySelector('#media-locate')?.addEventListener('click',()=>{
  const value=document.querySelector('#media-select')?.value;
  if(value==='story')show(0,false);
  else if(/^story-[2-5]$/.test(value))show(Number(value.split('-')[1])-1,false);
});

new IntersectionObserver(entries=>{
  inView=entries[0].isIntersecting;
  if(!inView)elapsed=0;
},{threshold:0.2}).observe(root);

function tick(now){
  const dt=last?Math.min(now-last,100):0;
  last=now;
  if(inView&&!blocked()&&!userStopped){
    elapsed+=dt;
    if(elapsed>=4500)show(active+1,false);
  }else{
    elapsed=0;
  }
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
show(0,false);
})();
