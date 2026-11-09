/* Slow continuous ingredient carousel with seamless looping. */
(()=>{'use strict';
const root=document.querySelector('.ingredient-carousel'),viewport=document.querySelector('#ingredient-viewport');if(!root||!viewport)return;
const track=root.querySelector('.ingredient-track');track.querySelectorAll('[data-ingredient-clone]').forEach(n=>n.remove());
const slides=[...track.querySelectorAll('.ingredient-slide')];
const copies=slides.map(slide=>{const c=slide.cloneNode(true);c.setAttribute('data-ingredient-clone','');c.setAttribute('aria-hidden','true');c.inert=true;c.querySelectorAll('button').forEach(n=>n.remove());c.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));c.querySelectorAll('[data-media-slot]').forEach(n=>{n.removeAttribute('data-media-slot');n.removeAttribute('data-media-label')});c.querySelectorAll('[data-edit]').forEach(n=>n.removeAttribute('data-edit'));track.append(c);return c});
const prev=root.querySelector('.ingredient-prev'),next=root.querySelector('.ingredient-next');prev.disabled=false;next.disabled=false;
const step=()=>slides.length>1?slides[1].offsetLeft-slides[0].offsetLeft:viewport.clientWidth;
const cycle=()=>copies[0].offsetLeft-slides[0].offsetLeft;
let hover=false,focus=false,drag=false,pauseUntil=0,last=0,position=viewport.scrollLeft,inView=false;
const mq=matchMedia('(prefers-reduced-motion: reduce)');
function stopped(){return mq.matches||document.hidden||document.body.classList.contains('motion-off')||document.documentElement.classList.contains('motion-disabled')||document.body.classList.contains('editing')||!document.querySelector('#editor-panel').hidden}
function pause(){pauseUntil=performance.now()+5000}
root.addEventListener('mouseenter',()=>{hover=true});root.addEventListener('mouseleave',()=>{hover=false});root.addEventListener('focusin',()=>{focus=true});root.addEventListener('focusout',e=>{focus=root.contains(e.relatedTarget)});
viewport.addEventListener('pointerdown',()=>{drag=true;pause()},{passive:true});window.addEventListener('pointerup',()=>{drag=false;pause()},{passive:true});window.addEventListener('pointercancel',()=>{drag=false;pause()},{passive:true});viewport.addEventListener('wheel',pause,{passive:true});
function move(delta){pause();const size=cycle();if(size<=0)return;let x=viewport.scrollLeft;if(delta<0&&x<step()){x+=size;viewport.scrollLeft=x}if(delta>0&&x>=size){x-=size;viewport.scrollLeft=x}viewport.scrollTo({left:x+delta*step(),behavior:stopped()?'instant':'smooth'})}
prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
viewport.addEventListener('keydown',e=>{if(e.target!==viewport)return;if(e.key==='ArrowRight'){e.preventDefault();move(1)}if(e.key==='ArrowLeft'){e.preventDefault();move(-1)}if(e.key==='Home'){e.preventDefault();pause();viewport.scrollLeft=0}if(e.key==='End'){e.preventDefault();pause();viewport.scrollLeft=(slides.length-1)*step()}});
new IntersectionObserver(entries=>{inView=entries[0].isIntersecting},{threshold:.05}).observe(root);
viewport.addEventListener('scroll',()=>{position=viewport.scrollLeft},{passive:true});
function frame(now){const dt=last?Math.min(now-last,50):0;last=now;if(inView&&!stopped()&&!hover&&!focus&&!drag&&now>pauseUntil){const size=cycle();if(size>0){position+=22*dt/1000;if(position>=size)position-=size;viewport.scrollLeft=position}}else position=viewport.scrollLeft;requestAnimationFrame(frame)}
slides.forEach((slide,i)=>{const pic=slide.querySelector('[data-slot-image]'),copy=copies[i].querySelector('[data-slot-image]');if(pic&&copy)new MutationObserver(()=>{if(pic.src)copy.src=pic.src;copy.alt=pic.alt;copy.hidden=pic.hidden}).observe(pic,{attributes:true,attributeFilter:['src','alt','hidden']})});
  // Keep the compact ingredient list thumbnails aligned with replacements made in the image editor.
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
requestAnimationFrame(frame);
})();
