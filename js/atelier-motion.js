(()=>{
  const reduce=matchMedia("(prefers-reduced-motion: reduce)");
  const off=()=>reduce.matches
    ||document.body.classList.contains("motion-off")
    ||document.documentElement.classList.contains("motion-disabled");

  const selectors=[
    "#documents .info-card",
    "#story .situation-heading",
    "#story .situations-carousel",
    ".section-head",
    "#ingredients .ingredient-carousel",
    "#ingredients .ingredient-detail-grid",
    "#documents .info-heading",
    "#documents .info-viewport",
    "#evidence .research-card",
    "#reviews .review-card",
    "#faq .faq-intro",
    "#faq .faq-items .disclosure",
    "#order .callback-copy",
    "#order .callback-card",
    "#references .wrap",
    ".footer-hero",
    ".footer-notice",
    ".footer-bottom"
  ];

  const nodes=[...new Set(selectors.flatMap(sel=>[...document.querySelectorAll(sel)]))];
  const showAll=()=>nodes.forEach(el=>el.classList.add("atelier-in","in-view"));

  if(off()||!("IntersectionObserver" in window)){
    showAll();
    return;
  }

  const mobile=matchMedia("(max-width:1280px)").matches;
  // Apply motion classes ASAP so hero entrance animations start on first paint after script
  document.documentElement.classList.add("motion-boot");
  document.body.classList.add("atelier-motion","motion-ready","atelier-grand");
  // Restart hero animations cleanly once classes are present
  requestAnimationFrame(()=>{
    document.querySelectorAll(".hero-editorial .hero-visual, .hero-editorial .product-upload, .hero-copy > *").forEach(el=>{
      el.style.animation="none";
      void el.offsetWidth;
      el.style.animation="";
    });
  });

  const io=new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      const el=entry.target;
      const siblings=[...el.parentElement?.children||[]].filter(n=>nodes.includes(n));
      const i=Math.max(0,siblings.indexOf(el));
      el.style.setProperty("--atelier-delay",`${Math.min(i*(mobile?80:140),mobile?320:560)}ms`);
      el.classList.add("atelier-in","in-view");
      io.unobserve(el);
    });
  },{threshold:0.08,rootMargin:mobile?"0px 0px -8% 0px":"0px 0px -10% 0px"});

  nodes.forEach((el,idx)=>{
    el.classList.add("atelier-reveal");
    el.classList.add(idx%2===0?"atelier-from-left":"atelier-from-right");
    if(el.matches(".section-head, #story .situation-heading, #faq .faq-intro, #documents .info-heading")){
      el.classList.add("atelier-title");
      el.classList.remove("atelier-from-left","atelier-from-right");
    }
    if(el.matches(".footer-hero")){
      el.classList.add("atelier-title");
      el.classList.remove("atelier-from-left","atelier-from-right");
    }
    if(el.matches(".footer-notice")){
      el.classList.add("atelier-from-right");
      el.classList.remove("atelier-from-left");
    }
    io.observe(el);
  });

  document.getElementById("motion-toggle")?.addEventListener("click",()=>{
    setTimeout(()=>{if(off())showAll();},0);
  });

  const refs=document.querySelector(".references-details");
  if(refs){
    const replay=()=>{
      if(!refs.open||off())return;
      refs.querySelectorAll(".source-item, .editorial-notice").forEach(el=>{
        el.style.animation="none";
        void el.offsetWidth;
        el.style.animation="";
      });
    };
    refs.addEventListener("toggle",replay);
  }
})();
