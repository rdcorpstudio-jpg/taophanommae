/* Ingredient carousel — autoplay until the user interacts. */
(()=>{'use strict';
const root=document.querySelector('.ingredient-carousel'),viewport=document.querySelector('#ingredient-viewport');if(!root||!viewport)return;
const track=root.querySelector('.ingredient-track');track.querySelectorAll('[data-ingredient-clone]').forEach(n=>n.remove());
const slides=[...track.querySelectorAll('.ingredient-slide')];
const copies=slides.map(slide=>{const c=slide.cloneNode(true);c.setAttribute('data-ingredient-clone','');c.setAttribute('aria-hidden','true');c.inert=true;c.querySelectorAll('button').forEach(n=>n.remove());c.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));c.querySelectorAll('[data-media-slot]').forEach(n=>{n.removeAttribute('data-media-slot');n.removeAttribute('data-media-label')});c.querySelectorAll('[data-edit]').forEach(n=>n.removeAttribute('data-edit'));track.append(c);return c});
const prev=root.querySelector('.ingredient-prev'),next=root.querySelector('.ingredient-next');prev.disabled=false;next.disabled=false;
const step=()=>slides.length>1?slides[1].offsetLeft-slides[0].offsetLeft:viewport.clientWidth;
const cycle=()=>copies[0].offsetLeft-slides[0].offsetLeft;
let hover=false,focus=false,drag=false,pauseUntil=0,last=0,position=viewport.scrollLeft,inView=false,raf=0,userStopped=false;
const mq=matchMedia('(prefers-reduced-motion: reduce)');
const touchUi=matchMedia('(hover:none), (pointer:coarse), (max-width:900px)');
function stopped(){return mq.matches||document.hidden||document.body.classList.contains('motion-off')||document.documentElement.classList.contains('motion-disabled')||document.body.classList.contains('editing')||!document.querySelector('#editor-panel')?.hidden}
function stopAuto(){userStopped=true;pauseUntil=0}
function pause(){pauseUntil=performance.now()+5000}
function syncSnap(){
  viewport.style.scrollSnapType=touchUi.matches?'x mandatory':'none';
}
syncSnap();
touchUi.addEventListener?.('change',syncSnap);

function move(delta,fromUser){
  if(fromUser)stopAuto();
  else pause();
  const size=cycle();if(size<=0)return;
  let x=viewport.scrollLeft;
  if(delta<0&&x<step()){x+=size;viewport.scrollLeft=x}
  if(delta>0&&x>=size){x-=size;viewport.scrollLeft=x}
  viewport.scrollTo({left:x+delta*step(),behavior:stopped()?'instant':'smooth'});
}

root.addEventListener('mouseenter',()=>{hover=true});
root.addEventListener('mouseleave',()=>{hover=false});
root.addEventListener('focusin',()=>{focus=true});
root.addEventListener('focusout',e=>{focus=root.contains(e.relatedTarget)});
viewport.addEventListener('pointerdown',()=>{drag=true;stopAuto()},{passive:true});
window.addEventListener('pointerup',()=>{drag=false},{passive:true});
window.addEventListener('pointercancel',()=>{drag=false},{passive:true});
viewport.addEventListener('wheel',()=>stopAuto(),{passive:true});
prev.addEventListener('click',()=>move(-1,true));
next.addEventListener('click',()=>move(1,true));
viewport.addEventListener('keydown',e=>{
  if(e.target!==viewport)return;
  if(e.key==='ArrowRight'){e.preventDefault();move(1,true)}
  if(e.key==='ArrowLeft'){e.preventDefault();move(-1,true)}
  if(e.key==='Home'){e.preventDefault();stopAuto();viewport.scrollLeft=0}
  if(e.key==='End'){e.preventDefault();stopAuto();viewport.scrollLeft=(slides.length-1)*step()}
});

let tx=0,ty=0;
viewport.addEventListener('touchstart',e=>{tx=e.changedTouches[0].clientX;ty=e.changedTouches[0].clientY},{passive:true});
viewport.addEventListener('touchend',e=>{
  const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;
  if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.35)move(dx<0?1:-1,true);
},{passive:true});

new IntersectionObserver(entries=>{
  inView=entries[0].isIntersecting;
  if(!inView&&raf){cancelAnimationFrame(raf);raf=0;last=0}
  else if(inView&&!userStopped&&!stopped()&&!raf)raf=requestAnimationFrame(frame);
},{threshold:.05}).observe(root);

viewport.addEventListener('scroll',()=>{position=viewport.scrollLeft},{passive:true});

function frame(now){
  raf=0;
  if(!inView||userStopped||stopped()){last=0;return}
  const dt=last?Math.min(now-last,50):0;last=now;
  if(!hover&&!focus&&!drag&&now>pauseUntil){
    const size=cycle();
    if(size>0){
      // slower on touch for readability
      position+=(touchUi.matches?14:22)*dt/1000;
      if(position>=size)position-=size;
      viewport.scrollLeft=position;
    }
  }else position=viewport.scrollLeft;
  raf=requestAnimationFrame(frame);
}

slides.forEach((slide,i)=>{
  const pic=slide.querySelector('[data-slot-image]'),copy=copies[i].querySelector('[data-slot-image]');
  if(pic&&copy)new MutationObserver(()=>{if(pic.src)copy.src=pic.src;copy.alt=pic.alt;copy.hidden=pic.hidden}).observe(pic,{attributes:true,attributeFilter:['src','alt','hidden']});
});
slides.forEach((slide,index)=>{
  const pic=slide.querySelector('[data-slot-image]');
  const thumb=document.querySelectorAll('#all-ingredients .ingredient-thumb')[index];
  if(!pic||!thumb)return;
  new MutationObserver(()=>{
    const src=pic.getAttribute('src');
    if(src){thumb.setAttribute('src',src);thumb.hidden=false}
    else{thumb.removeAttribute('src');thumb.hidden=true}
  }).observe(pic,{attributes:true,attributeFilter:['src']});
});

if(!userStopped&&!stopped())raf=requestAnimationFrame(frame);
})();
