(()=>{'use strict';
const v=document.querySelector('#info-viewport');if(!v)return;
const root=document.querySelector('#documents'),track=v.querySelector('.info-track');track.querySelectorAll('[data-info-clone]').forEach(n=>n.remove());
const cards=[...track.querySelectorAll('.info-card')],prev=root.querySelector('.info-prev'),next=root.querySelector('.info-next');
const copies=cards.map(card=>{const c=card.cloneNode(true);c.setAttribute('data-info-clone','');c.setAttribute('aria-hidden','true');c.querySelectorAll('.media-edit').forEach(n=>n.remove());c.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));c.querySelectorAll('[data-media-slot]').forEach(n=>n.removeAttribute('data-media-slot'));c.querySelectorAll('[data-edit],[data-bind]').forEach(n=>{n.removeAttribute('data-edit');n.removeAttribute('data-bind')});c.querySelectorAll('a,button,summary').forEach(n=>n.tabIndex=-1);track.append(c);return c});
prev.disabled=false;next.disabled=false;let hover=false,focus=false,drag=false,inView=false,last=0,pauseUntil=0,position=v.scrollLeft,raf=0;
const step=()=>cards[1].offsetLeft-cards[0].offsetLeft,cycle=()=>copies[0].offsetLeft-cards[0].offsetLeft;
const mq=matchMedia('(prefers-reduced-motion: reduce)');
const touchUi=matchMedia('(hover:none), (pointer:coarse), (max-width:900px)');
const stopped=()=>mq.matches||document.hidden||document.body.classList.contains('motion-off')||document.documentElement.classList.contains('motion-disabled')||document.body.classList.contains('editing')||!document.querySelector('#editor-panel').hidden||!!root.querySelector('details[open]');
const autoplayOk=()=>!touchUi.matches&&!stopped();
function syncSnap(){
  if(touchUi.matches){
    v.style.scrollSnapType='x mandatory';
    v.style.scrollBehavior='';
  }else{
    v.style.scrollSnapType='none';
    v.style.scrollBehavior='auto';
  }
}
syncSnap();
touchUi.addEventListener?.('change',syncSnap);
function pause(){pauseUntil=performance.now()+5000}
root.addEventListener('mouseenter',()=>hover=true);root.addEventListener('mouseleave',()=>hover=false);root.addEventListener('focusin',()=>focus=true);root.addEventListener('focusout',e=>focus=root.contains(e.relatedTarget));
v.addEventListener('pointerdown',()=>{drag=true;pause()},{passive:true});
window.addEventListener('pointerup',()=>{drag=false;pause()},{passive:true});
window.addEventListener('pointercancel',()=>{drag=false;pause()},{passive:true});
v.addEventListener('wheel',pause,{passive:true});
function move(d){pause();const size=cycle();if(size<=0)return;let x=v.scrollLeft;if(d<0&&x<step()){x+=size;v.scrollLeft=x}if(d>0&&x>=size){x-=size;v.scrollLeft=x}v.scrollTo({left:x+d*step(),behavior:stopped()?'instant':'smooth'})}
prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
v.addEventListener('scroll',()=>position=v.scrollLeft,{passive:true});
v.addEventListener('keydown',e=>{if(e.target!==v)return;if(e.key==='ArrowRight'){e.preventDefault();move(1)}if(e.key==='ArrowLeft'){e.preventDefault();move(-1)}if(e.key==='Home'){e.preventDefault();pause();v.scrollLeft=0}if(e.key==='End'){e.preventDefault();pause();v.scrollLeft=(cards.length-1)*step()}});
new IntersectionObserver(e=>{
  inView=e[0].isIntersecting;
  if(!inView&&raf){cancelAnimationFrame(raf);raf=0;last=0}
  else if(inView&&autoplayOk()&&!raf)raf=requestAnimationFrame(frame);
},{threshold:.05}).observe(root);
function frame(now){
  raf=0;
  if(!inView||!autoplayOk()){last=0;return}
  const dt=last?Math.min(now-last,50):0;last=now;
  if(!hover&&!focus&&!drag&&now>pauseUntil){
    const size=cycle();
    if(size>0){position+=20*dt/1000;if(position>=size)position-=size;v.scrollLeft=position}
  }else position=v.scrollLeft;
  raf=requestAnimationFrame(frame);
}
cards.forEach((card,i)=>{const pic=card.querySelector('[data-slot-image]'),copy=copies[i].querySelector('[data-slot-image]');if(pic&&copy)new MutationObserver(()=>{if(pic.src)copy.src=pic.src;copy.hidden=pic.hidden;copy.alt=pic.alt;copies[i].querySelector('.info-picture').className=card.querySelector('.info-picture').className;copies[i].querySelector('.info-picture').dataset.fit=card.querySelector('.info-picture').dataset.fit}).observe(card.querySelector('.info-picture'),{attributes:true,subtree:true,attributeFilter:['src','alt','hidden','class','data-fit']})});
document.querySelector('#media-locate')?.addEventListener('click',()=>{const key=document.querySelector('#media-select')?.value;const i=cards.findIndex(c=>c.querySelector('[data-media-slot]').dataset.mediaSlot===key);if(i>=0){pause();v.scrollLeft=i*step()}});
if(autoplayOk())raf=requestAnimationFrame(frame);
})();
