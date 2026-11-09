/* EDIT BEHAVIOR: Vanilla JavaScript — no libraries, no network calls, no trackers. */
(function(){
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));
  let state;
  try { state=JSON.parse($('#page-config').textContent); }
  catch { state={reviewUrls:['','','']}; }
  if(!Array.isArray(state.reviewUrls)) state.reviewUrls=['','',''];
  let editing=false, dirty=false, previouslyFocused=null;
  const panel=$('#editor-panel'), openButton=$('#editor-open'), dialog=$('#demo-dialog');
  const notify = text => { $('#editor-status').textContent=text; };
  function safeUrl(value){
    if(!value) return '';
    try { const u=new URL(value.trim()); return u.protocol==='https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; }
  }
  function serializeState(){
    $('#page-config').textContent=JSON.stringify(state,null,2).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
  }
  function applyState(){
    $$('[data-bind]').forEach(el=>{
      const val=String(state[el.dataset.bind] || '').trim();
      el.textContent=val || el.dataset.fallback || '';
      el.classList.toggle('pending',!val);
    });
    $$('[data-action]').forEach(el=>{
      const url=safeUrl(state[el.dataset.action==='chat' ? 'chatUrl' : 'orderUrl']);
      el.href=url || '#order';
      if(url){el.target='_blank';el.rel='noopener noreferrer';} else {el.removeAttribute('target');el.removeAttribute('rel');}
      el.dataset.ready=url?'true':'false';
    });
    $$('[data-review-source]').forEach(el=>{
      const url=safeUrl(state.reviewUrls[Number(el.dataset.reviewSource)]);
      el.href=url||'#reviews';el.textContent=url?'เปิดรีวิวต้นฉบับ ↗':'ยังไม่ได้แนบแหล่งที่มา';
      el.setAttribute('aria-disabled',String(!url));
      if(url){el.target='_blank';el.rel='noopener noreferrer';}else{el.removeAttribute('target');el.removeAttribute('rel');}
    });
    const p=$('.offer-warning');
    if(p) p.textContent=(safeUrl(state.chatUrl)||safeUrl(state.orderUrl))
      ? 'ตรวจสอบปลายทางและผู้ขายก่อนติดต่อหรือชำระเงิน ปุ่มที่ยังไม่ตั้งค่าจะเปิดคำอธิบายตัวอย่าง'
      : 'ปุ่มในต้นแบบยังไม่เชื่อมกับร้านหรือระบบรับคำสั่งซื้อจริง ตั้งค่าลิงก์ที่ได้รับการยืนยันผ่าน “แก้ไขหน้า”';
  }
  function setPanel(show){
    panel.hidden=!show;openButton.setAttribute('aria-expanded',String(show));
    if(show){ previouslyFocused=document.activeElement; $('#editor-close').focus({preventScroll:true}); }
    else if(previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus({preventScroll:true});
  }
  function setEditing(value){
    editing=value;document.body.classList.toggle('editing',value);
    $$('[data-edit]').forEach(el=>{ if(value){el.setAttribute('contenteditable','plaintext-only');el.setAttribute('spellcheck','false');}else{el.removeAttribute('contenteditable');el.removeAttribute('spellcheck');} });
    $('#toggle-edit').textContent=value?'ปิดการแก้ข้อความ':'เปิดการแก้ข้อความ';
    $('#toggle-edit').setAttribute('aria-pressed',String(value));
    notify(value?'คลิกข้อความกรอบเส้นประเพื่อแก้ไข แล้วบันทึก HTML เมื่อเสร็จ':'ปิดการแก้ข้อความแล้ว ข้อมูลที่แก้ยังอยู่ในหน้านี้');
  }
  openButton.addEventListener('click',()=>setPanel(panel.hidden));
  $('#editor-close').addEventListener('click',()=>setPanel(false));
  $('#editor-hide').addEventListener('click',()=>setPanel(false));
  $('#toggle-edit').addEventListener('click',()=>setEditing(!editing));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)setPanel(false);});
  $$('[data-config]').forEach(input=>{
    input.value=state[input.dataset.config]||'';
    input.addEventListener('input',()=>{
      const key=input.dataset.config;state[key]=input.value;dirty=true;
      const invalid=input.type==='url' && input.value.trim() && !safeUrl(input.value);
      input.setAttribute('aria-invalid',String(Boolean(invalid)));
      notify(invalid?'ลิงก์ต้องเป็น HTTPS ที่ถูกต้องและไม่มีข้อมูลรหัสผ่าน ปุ่มนี้ยังไม่ถูกเปิดใช้งาน':'ปรับข้อมูลแล้ว อย่าลืมบันทึก HTML เพื่อเก็บการเปลี่ยนแปลง');
      applyState();serializeState();
    });
  });
  $$('[data-review-config]').forEach(input=>{
    const i=Number(input.dataset.reviewConfig);input.value=state.reviewUrls[i]||'';
    input.addEventListener('input',()=>{
      state.reviewUrls[i]=input.value;dirty=true;
      const invalid=input.value.trim()&&!safeUrl(input.value);input.setAttribute('aria-invalid',String(Boolean(invalid)));
      notify(invalid?'กรุณาใช้ลิงก์รีวิว HTTPS ที่ถูกต้อง':'บันทึกลิงก์ในหน้าแล้ว กรุณาบันทึก HTML เพื่อเก็บไฟล์');applyState();serializeState();
    });
  });
  $$('[data-edit]').forEach(el=>el.addEventListener('input',()=>{dirty=true;}));
  function openDemo(message){
    $('#demo-message').textContent=message;
    if(typeof dialog.showModal==='function'){dialog.showModal();document.body.classList.add('modal-open');}
    else{window.alert(message);}
  }
  $$('[data-action]').forEach(el=>el.addEventListener('click',e=>{
    if(el.dataset.ready!=='true'){
      e.preventDefault();
      openDemo(el.dataset.action==='chat'?'ยังไม่ได้ตั้งค่าช่องทางสอบถามจริง เปิด “แก้ไขหน้า” แล้วใส่ลิงก์ LINE OA หรือช่องทางของแบรนด์ ระบบไม่ได้ส่งข้อความใดออกไป':'ยังไม่ได้ตั้งค่าหน้าสั่งซื้อจริง เปิด “แก้ไขหน้า” แล้วใส่ลิงก์ที่ตรวจสอบแล้ว ต้นแบบนี้ไม่ได้รับคำสั่งซื้อหรือชำระเงิน');
    }
  }));
  $$('[data-review-source]').forEach(el=>el.addEventListener('click',e=>{if(el.getAttribute('aria-disabled')==='true'){e.preventDefault();openDemo('ช่องนี้ยังไม่มีรีวิวจริงหรือลิงก์ต้นฉบับ โปรดเพิ่มเฉพาะรีวิวที่ตรวจสอบได้และมีสิทธิ์เผยแพร่');}}));
  $('#demo-close').addEventListener('click',()=>dialog.close());
  $('#demo-edit').addEventListener('click',()=>{dialog.close();setPanel(true);});
  dialog.addEventListener('close',()=>document.body.classList.remove('modal-open'));
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  function setProductImage(data){
    $('.hero-scene').classList.toggle('has-composite-image',Boolean(data));
    $$('[data-product-image]').forEach(img=>{if(data){img.src=data;img.hidden=false;}else{img.removeAttribute('src');img.hidden=true;}});
    $$('[data-product-mock]').forEach(el=>el.hidden=Boolean(data));
    $$('[data-product-caption]').forEach(el=>el.textContent=data?'ภาพสินค้าที่ผู้แก้ไขเพิ่ม • ตรวจรุ่นฉลากและสิทธิ์ใช้ภาพก่อนเผยแพร่':'ภาพจำลองเพื่อจัดวาง • โปรดแทนด้วยภาพสินค้าจริง');
    $('.hero-scene').setAttribute('aria-label',data?'ภาพสินค้าที่ผู้แก้ไขเพิ่ม':'ภาพจำลองตำแหน่งสินค้า สามารถเปลี่ยนเป็นภาพสินค้าจริงผ่านเครื่องมือแก้ไข');
    state.productImageAdded=Boolean(data);dirty=true;serializeState();
  }
  $('#product-upload').addEventListener('change',async e=>{
    const f=e.target.files&&e.target.files[0]; if(!f)return;
    if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>5*1024*1024){notify('ใช้ไฟล์ PNG, JPG หรือ WebP ขนาดไม่เกิน 5 MB');e.target.value='';return;}
    try{
      const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(f);});
      const image=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=data;});
      if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth*image.naturalHeight>40000000)throw Error('image too large');
      const ratio=Math.min(1,1400/Math.max(image.naturalWidth,image.naturalHeight));
      const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*ratio);canvas.height=Math.round(image.naturalHeight*ratio);
      const ctx=canvas.getContext('2d');if(!ctx)throw Error('canvas unsupported');ctx.drawImage(image,0,0,canvas.width,canvas.height);
      setProductImage(canvas.toDataURL('image/webp',.92));notify('เพิ่มรูปสินค้าแล้ว รูปจะฝังอยู่ในไฟล์ HTML เมื่อบันทึก โดยไม่อัปโหลดไปที่ใด');
    }catch{notify('เปิดรูปไม่สำเร็จ กรุณาใช้รูป PNG, JPG หรือ WebP ที่ไม่เสียหายและขนาดเหมาะสม');}
    e.target.value='';
  });
  $('#reset-product').addEventListener('click',()=>{setProductImage('');notify('กลับไปใช้ภาพจำลองแล้ว');});
  // V2 — any illustration/review/document slot can be replaced locally.
  const mediaSelect=$('#media-select'), mediaInput=$('#slot-upload'), mediaAlt=$('#media-alt'), mediaFit=$('#media-fit');
  const toastNode=$('#toast');let toastTimer;
  function toast(message){toastNode.textContent=message;toastNode.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastNode.classList.remove('visible'),3800);}
  function currentSlot(){return $$('[data-media-slot]').find(el=>el.dataset.mediaSlot===mediaSelect.value);}
  function syncMediaFields(){const slot=currentSlot();if(!slot)return;mediaAlt.value=$('[data-slot-image]',slot).alt||slot.dataset.mediaLabel;mediaFit.value=slot.dataset.fit||'cover';}
  function focusSlot(slot){slot.scrollIntoView({behavior:document.body.classList.contains('motion-off')?'auto':'smooth',block:'center'});slot.classList.add('just-changed');setTimeout(()=>slot.classList.remove('just-changed'),2000);}
  function chooseSlot(key,openFile=false){mediaSelect.value=key;syncMediaFields();if(openFile){mediaInput.click();}else{setPanel(true);}}
  mediaSelect.addEventListener('change',syncMediaFields);
  $$('[data-change-media]').forEach(button=>button.addEventListener('click',()=>chooseSlot(button.dataset.changeMedia,true)));
  $$('[data-open-product]').forEach(button=>button.addEventListener('click',()=>$('#product-upload').click()));
  mediaAlt.addEventListener('input',()=>{const slot=currentSlot();if(!slot)return;$('[data-slot-image]',slot).alt=mediaAlt.value;dirty=true;});
  mediaFit.addEventListener('change',()=>{const slot=currentSlot();if(!slot)return;slot.dataset.fit=mediaFit.value;dirty=true;});
  $('#media-locate').addEventListener('click',()=>{const slot=currentSlot();if(slot){setPanel(false);focusSlot(slot);}});
  $('#media-reset').addEventListener('click',()=>{const slot=currentSlot();if(!slot)return;const img=$('[data-slot-image]',slot);img.removeAttribute('src');img.hidden=true;slot.classList.remove('has-image');dirty=true;notify('คืนช่องภาพตัวอย่างแล้ว บันทึก HTML เพื่อเก็บการเปลี่ยนแปลง');toast('คืนช่องภาพตัวอย่างแล้ว');});
  mediaInput.addEventListener('change',async e=>{
    const f=e.target.files&&e.target.files[0],slot=currentSlot();if(!f||!slot)return;
    if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>8*1024*1024){notify('กรุณาใช้ PNG, JPG หรือ WebP ขนาดไม่เกิน 8 MB');toast('ใช้ไฟล์ PNG / JPG / WebP ไม่เกิน 8 MB');e.target.value='';return;}
    try{
      const data=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=reject;fr.readAsDataURL(f);});
      const im=await new Promise((resolve,reject)=>{const pic=new Image();pic.onload=()=>resolve(pic);pic.onerror=reject;pic.src=data;});
      if(!im.naturalWidth||!im.naturalHeight||im.naturalWidth*im.naturalHeight>50000000)throw Error('Invalid image');
      const ratio=Math.min(1,1800/Math.max(im.naturalWidth,im.naturalHeight));
      const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(im.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(im.naturalHeight*ratio));
      const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');ctx.drawImage(im,0,0,canvas.width,canvas.height);
      const target=$('[data-slot-image]',slot);target.src=canvas.toDataURL('image/webp',.92);target.hidden=false;target.alt=mediaAlt.value||slot.dataset.mediaLabel;target.loading='lazy';slot.classList.add('has-image');dirty=true;
      notify('เพิ่มภาพแล้ว ภาพจะฝังใน HTML เมื่อบันทึก ไม่มีการอัปโหลดไปยังเซิร์ฟเวอร์');toast('เปลี่ยนภาพแล้ว · อย่าลืมบันทึก HTML');
    }catch(err){notify('เปิดรูปไม่สำเร็จ กรุณาใช้ไฟล์ภาพที่ไม่เสียหายและขนาดเหมาะสม');toast('เปิดรูปไม่สำเร็จ กรุณาตรวจไฟล์ภาพ');}
    finally{e.target.value='';}
  });
  syncMediaFields();

  $('#save-html').addEventListener('click',()=>{
    serializeState();
    const clone=document.documentElement.cloneNode(true);
    clone.querySelectorAll("[data-ingredient-clone],[data-info-clone]").forEach(n=>n.remove());
    const body=clone.querySelector('body');body.classList.remove('editing','modal-open','motion-ready','tab-inactive');
    clone.querySelectorAll('[contenteditable],[spellcheck]').forEach(el=>{el.removeAttribute('contenteditable');el.removeAttribute('spellcheck');});
    clone.querySelector('#editor-panel').hidden=true;clone.querySelector('#editor-open').setAttribute('aria-expanded','false');
    clone.querySelector('#toggle-edit').setAttribute('aria-pressed','false');clone.querySelector('#toggle-edit').textContent='เปิดการแก้ข้อความ';
    clone.querySelector('#editor-status').textContent='ไฟล์ทำงานในเครื่อง ไม่ส่งรูปหรือข้อความไปยังเซิร์ฟเวอร์';
    clone.querySelector('#demo-dialog').removeAttribute('open');clone.querySelector('#sticky-buy').classList.remove('is-visible');
    clone.querySelector('#reading-progress').style.width='0%';
    clone.querySelector('#mobile-nav').hidden=true;clone.querySelector('#menu-toggle').setAttribute('aria-expanded','false');
    clone.querySelector('#toast').classList.remove('visible');clone.querySelector('#toast').textContent='';
    clone.querySelector('.hero-scene').style.removeProperty('--rx');clone.querySelector('.hero-scene').style.removeProperty('--ry');
    clone.querySelectorAll('.in-view,.just-changed').forEach(el=>el.classList.remove('in-view','just-changed'));
    clone.querySelectorAll('details').forEach(el=>{if(!el.closest('#editor-panel'))el.removeAttribute('open');});
    clone.querySelectorAll('[data-slot-image]:not([src])').forEach(el=>el.hidden=true);
    clone.querySelectorAll('input[type=file]').forEach(el=>el.value='');
    clone.querySelectorAll('.toc a').forEach((el,i)=>el.classList.toggle('active',i===0));
    const blob=new Blob(['<!doctype html>\n'+clone.outerHTML],{type:'text/html;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='tao-phanom-mue-salespage-v2-edited.html';document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);dirty=false;notify('สร้างไฟล์ HTML ที่แก้ไขแล้ว กรุณาเปิดไฟล์ใหม่เพื่อตรวจอีกครั้งก่อนใช้จริง');
  });
  // No automatic saving, storage, or analytics. Warn only when unsaved edits exist.
  window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
  const chapters=$$('.chapter'),tocLinks=$$('.header-nav a,.mobile-nav a'),sticky=$('#sticky-buy');
  let ticking=false;
  function updateReading(){
    $('.masthead').classList.toggle('scrolled',window.scrollY>25);
    const total=document.documentElement.scrollHeight-window.innerHeight;
    $('#reading-progress').style.width=(total>0?Math.min(100,Math.max(0,window.scrollY/total*100)):0)+'%';
    const hero=$('.hero').getBoundingClientRect();const order=$('#order').getBoundingClientRect();
    sticky.classList.toggle('is-visible',hero.bottom<110 && !(order.top<window.innerHeight && order.bottom>0));
    let active=chapters[0];chapters.forEach(s=>{if(s.getBoundingClientRect().top<190)active=s;});
    tocLinks.forEach(a=>{const on=a.getAttribute('href')==='#'+active.id;a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
    ticking=false;
  }
  window.addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(updateReading);ticking=true;}},{passive:true});
  window.addEventListener('resize',updateReading);
  // V2 — progressive enhancement: all sections are readable without JS.
  const mqMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton=$('#motion-toggle');let revealObserver;
  function applyMotion(){
    const off=Boolean(state.reduceMotion)||mqMotion.matches;
    document.body.classList.toggle('motion-off',off);document.documentElement.classList.toggle('motion-disabled',off);
    motionButton.setAttribute('aria-pressed',String(off));motionButton.setAttribute('aria-label',off?'เปิดแอนิเมชัน (เคารพการตั้งค่าระบบ)':'หยุดแอนิเมชัน');motionButton.title=off?'ลดการเคลื่อนไหวอยู่':'หยุดแอนิเมชัน';
    if(off)$$('.reveal').forEach(el=>el.classList.add('in-view'));
  }
  motionButton.addEventListener('click',()=>{state.reduceMotion=!document.body.classList.contains('motion-off');serializeState();applyMotion();toast(mqMotion.matches?'ใช้การลดการเคลื่อนไหวตามการตั้งค่าของระบบ':state.reduceMotion?'หยุดแอนิเมชันแล้ว':'เปิดแอนิเมชันแล้ว');});
  if(mqMotion.addEventListener)mqMotion.addEventListener('change',applyMotion);applyMotion();
  if('IntersectionObserver' in window){
    document.body.classList.add('motion-ready');
    ['.ingredient-showcase','.research-grid','.documents-grid','.reviews-grid'].forEach(selector=>{const group=$(selector);if(group)$$('.reveal',group).forEach((el,i)=>el.style.setProperty('--delay',Math.min(i*60,180)+'ms'));});
    revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');revealObserver.unobserve(entry.target);}}),{rootMargin:'0px 0px 24px 0px',threshold:.045});
    $$('.reveal').forEach(el=>revealObserver.observe(el));
  }
  const menu=$('#mobile-nav'),menuButton=$('#menu-toggle');
  function setMenu(show){menu.hidden=!show;menuButton.setAttribute('aria-expanded',String(show));menuButton.setAttribute('aria-label',show?'ปิดเมนู':'เปิดเมนู');}
  menuButton.addEventListener('click',()=>setMenu(menu.hidden));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){setMenu(false);}});
  document.addEventListener('click',e=>{
    const link=e.target.closest('a[href^="#"]');if(!link)return;
    const id=link.getAttribute('href').slice(1);if(!id)return;
    const target=document.getElementById(id);if(!target)return;
    if(link.hasAttribute('data-action')||link.hasAttribute('data-review-source'))return;
    if(document.body.classList.contains('editing')&&e.target.closest('[contenteditable]')){e.preventDefault();return;}
    setMenu(false);let parent=target.parentElement;
    while(parent){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}
    if(id==='references'){const d=$('.references-details');if(d)d.open=true;}
    if(id==='all-ingredients'){const d=$('details',target);if(d)d.open=true;}
    e.preventDefault();try{history.pushState(null,'','#'+id);}catch{}
    requestAnimationFrame(()=>target.scrollIntoView({behavior:document.body.classList.contains('motion-off')?'auto':'smooth',block:'start'}));
  });
  function revealHash(){const id=decodeURIComponent(location.hash.slice(1));const target=document.getElementById(id);if(!target)return;let parent=target.parentElement;while(parent){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}if(id==='references')$('.references-details').open=true;setTimeout(()=>target.scrollIntoView({behavior:'auto',block:'start'}),100);}
  window.addEventListener('hashchange',revealHash);if(location.hash)revealHash();
  const heroScene=$('.hero-scene');
  const finePointer=window.matchMedia('(pointer:fine)');let tiltFrame=0;
  if(heroScene){
    heroScene.addEventListener('pointermove',e=>{if(!finePointer.matches||document.body.classList.contains('motion-off'))return;cancelAnimationFrame(tiltFrame);tiltFrame=requestAnimationFrame(()=>{const r=heroScene.getBoundingClientRect();heroScene.style.setProperty('--ry',((e.clientX-r.left)/r.width-.5)*3+'deg');heroScene.style.setProperty('--rx',-((e.clientY-r.top)/r.height-.5)*3+'deg');});});
    heroScene.addEventListener('pointerleave',()=>{cancelAnimationFrame(tiltFrame);heroScene.style.setProperty('--rx','0deg');heroScene.style.setProperty('--ry','0deg');});
  }
  document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('tab-inactive',document.hidden);});

  applyState();updateReading();
})();
