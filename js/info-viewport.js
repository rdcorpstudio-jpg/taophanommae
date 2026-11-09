(()=>{'use strict';
const v=document.querySelector('#info-viewport');if(!v)return;
const root=document.querySelector('#documents'),track=v.querySelector('.info-track');
track.querySelectorAll('[data-info-clone]').forEach(n=>n.remove());
const cards=[...track.querySelectorAll('.info-card')];
const prev=root.querySelector('.info-prev'),next=root.querySelector('.info-next');
const mq=matchMedia('(prefers-reduced-motion: reduce)');
const touchUi=matchMedia('(hover:none), (pointer:coarse), (max-width:900px)');
const stopped=()=>mq.matches||document.hidden||document.body.classList.contains('motion-off')||document.documentElement.classList.contains('motion-disabled')||document.body.classList.contains('editing')||!document.querySelector('#editor-panel')?.hidden||!!root.querySelector('details[open]');

const step=()=>cards.length>1?cards[1].offsetLeft-cards[0].offsetLeft:v.clientWidth;

function indexFromScroll(){
  if(!cards.length)return 0;
  const mid=v.getBoundingClientRect().left+v.clientWidth/2;
  let best=0,bestDist=Infinity;
  cards.forEach((card,i)=>{
    const r=card.getBoundingClientRect();
    const d=Math.abs(r.left+r.width/2-mid);
    if(d<bestDist){bestDist=d;best=i}
  });
  return best;
}

/** Scroll so card i starts at the left padding edge (matches start snap + track pad). */
function targetLeft(i){
  const card=cards[Math.max(0,Math.min(cards.length-1,i))];
  const vr=v.getBoundingClientRect();
  const cr=card.getBoundingClientRect();
  const pad=parseFloat(getComputedStyle(track).paddingLeft)||0;
  return Math.max(0,Math.round(v.scrollLeft+(cr.left-vr.left)-pad));
}

let hover=false,focus=false,drag=false,inView=false,last=0,pauseUntil=0,position=0,raf=0,copies=[],userStopped=false,elapsed=0,scrolling=false;

function stopAuto(){userStopped=true;elapsed=0;pauseUntil=0}
function pause(){pauseUntil=performance.now()+5000}

function syncButtons(){
  if(!touchUi.matches){prev.disabled=false;next.disabled=false;return}
  const i=indexFromScroll();
  prev.disabled=i<=0;
  next.disabled=i>=cards.length-1;
}

function ensureLoop(){
  if(touchUi.matches){
    track.querySelectorAll('[data-info-clone]').forEach(n=>n.remove());
    copies=[];
    return;
  }
  if(copies.length)return;
  copies=cards.map(card=>{
    const c=card.cloneNode(true);
    c.setAttribute('data-info-clone','');
    c.setAttribute('aria-hidden','true');
    c.querySelectorAll('.media-edit').forEach(n=>n.remove());
    c.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
    c.querySelectorAll('[data-media-slot]').forEach(n=>n.removeAttribute('data-media-slot'));
    c.querySelectorAll('[data-edit],[data-bind]').forEach(n=>{n.removeAttribute('data-edit');n.removeAttribute('data-bind')});
    c.querySelectorAll('a,button,summary').forEach(n=>n.tabIndex=-1);
    track.append(c);
    return c;
  });
  cards.forEach((card,i)=>{
    const pic=card.querySelector('[data-slot-image]'),copy=copies[i]?.querySelector('[data-slot-image]');
    if(!pic||!copy)return;
    new MutationObserver(()=>{
      if(pic.src)copy.src=pic.src;
      copy.hidden=pic.hidden;
      copy.alt=pic.alt;
      copies[i].querySelector('.info-picture').className=card.querySelector('.info-picture').className;
      copies[i].querySelector('.info-picture').dataset.fit=card.querySelector('.info-picture').dataset.fit;
    }).observe(card.querySelector('.info-picture'),{attributes:true,subtree:true,attributeFilter:['src','alt','hidden','class','data-fit']});
  });
}

const cycle=()=>copies[0]?copies[0].offsetLeft-cards[0].offsetLeft:0;

function syncSnap(){
  // Mobile: start snap (edge peek). Desktop continuous scroll: no snap.
  v.style.scrollSnapType=touchUi.matches?'x mandatory':'none';
  v.style.scrollBehavior=touchUi.matches?'':'auto';
}

function finishProgrammatic(){
  scrolling=false;
  if(touchUi.matches)v.style.scrollSnapType='x mandatory';
  position=v.scrollLeft;
  syncButtons();
}

function scrollToIndex(i,behavior){
  const left=targetLeft(i);
  if(Math.abs(v.scrollLeft-left)<2){finishProgrammatic();return}
  scrolling=true;
  // Disable snap while animating so it doesn't fight scrollTo
  v.style.scrollSnapType='none';
  const useInstant=behavior==='instant'||behavior==='auto'||stopped();
  v.scrollTo({left,behavior:useInstant?'instant':'smooth'});
  if(useInstant){
    finishProgrammatic();
    return;
  }
  let done=false;
  const end=()=>{
    if(done)return;
    done=true;
    v.removeEventListener('scrollend',end);
    clearTimeout(fallback);
    finishProgrammatic();
  };
  const fallback=setTimeout(end,700);
  v.addEventListener('scrollend',end,{once:true});
}

function move(d,fromUser){
  if(fromUser)stopAuto();
  else pause();
  if(touchUi.matches||!copies.length){
    const cur=indexFromScroll();
    let i=cur+d;
    if(i>cards.length-1)i=0;
    if(i<0)i=cards.length-1;
    // Loop wrap: jump instantly — smooth reverse looks like a bug
    const wrap=(cur===cards.length-1&&i===0)||(cur===0&&i===cards.length-1);
    scrollToIndex(i,wrap||stopped()?'instant':'smooth');
    return;
  }
  const size=cycle();
  if(size<=0)return;
  let x=v.scrollLeft;
  if(d<0&&x<step()){x+=size;v.scrollLeft=x}
  if(d>0&&x>=size){x-=size;v.scrollLeft=x}
  v.scrollTo({left:x+d*step(),behavior:stopped()?'instant':'smooth'});
}

function setupMode(){
  ensureLoop();
  syncSnap();
  syncButtons();
  if(userStopped&&raf){cancelAnimationFrame(raf);raf=0;last=0;elapsed=0}
}

setupMode();
touchUi.addEventListener?.('change',setupMode);

root.addEventListener('mouseenter',()=>hover=true);
root.addEventListener('mouseleave',()=>hover=false);
root.addEventListener('focusin',()=>focus=true);
root.addEventListener('focusout',e=>focus=root.contains(e.relatedTarget));
v.addEventListener('pointerdown',()=>{drag=true;stopAuto()},{passive:true});
window.addEventListener('pointerup',()=>{drag=false},{passive:true});
window.addEventListener('pointercancel',()=>{drag=false},{passive:true});
v.addEventListener('wheel',()=>stopAuto(),{passive:true});
prev.addEventListener('click',()=>move(-1,true));
next.addEventListener('click',()=>move(1,true));
v.addEventListener('scroll',()=>{if(!scrolling)position=v.scrollLeft;syncButtons()},{passive:true});
v.addEventListener('keydown',e=>{
  if(e.target!==v)return;
  if(e.key==='ArrowRight'){e.preventDefault();move(1,true)}
  if(e.key==='ArrowLeft'){e.preventDefault();move(-1,true)}
  if(e.key==='Home'){e.preventDefault();stopAuto();scrollToIndex(0,'instant')}
  if(e.key==='End'){e.preventDefault();stopAuto();scrollToIndex(cards.length-1,'instant')}
});

let tx=0,ty=0;
v.addEventListener('touchstart',e=>{tx=e.changedTouches[0].clientX;ty=e.changedTouches[0].clientY},{passive:true});
v.addEventListener('touchend',e=>{
  const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;
  if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.35)move(dx<0?1:-1,true);
},{passive:true});

new IntersectionObserver(e=>{
  inView=e[0].isIntersecting;
  if(!inView){elapsed=0;if(raf){cancelAnimationFrame(raf);raf=0;last=0}}
  else if(inView&&!userStopped&&!stopped()&&!raf)raf=requestAnimationFrame(frame);
},{threshold:.05}).observe(root);

function frame(now){
  raf=0;
  if(!inView||userStopped||stopped()){last=0;elapsed=0;return}
  const dt=last?Math.min(now-last,100):0;last=now;

  if(touchUi.matches){
    if(!hover&&!focus&&!drag&&!scrolling){
      elapsed+=dt;
      if(elapsed>=4200){elapsed=0;move(1,false)}
    }else if(drag||hover||focus)elapsed=0;
  }else if(!hover&&!focus&&!drag&&now>pauseUntil){
    const size=cycle();
    if(size>0){position+=20*dt/1000;if(position>=size)position-=size;v.scrollLeft=position}
  }else position=v.scrollLeft;

  raf=requestAnimationFrame(frame);
}

document.querySelector('#media-locate')?.addEventListener('click',()=>{
  const key=document.querySelector('#media-select')?.value;
  const i=cards.findIndex(c=>c.querySelector('[data-media-slot]')?.dataset.mediaSlot===key);
  if(i>=0){stopAuto();scrollToIndex(i,'instant')}
});

if(!userStopped&&!stopped())raf=requestAnimationFrame(frame);
})();
