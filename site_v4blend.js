(function(){
  const fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!fine || reduced) return;

  const body = document.body;
  body.classList.add('has-v4blend-cursor');

  let c1 = document.getElementById('v4c1');
  let c2 = document.getElementById('v4c2');
  if(!c1){ c1 = document.createElement('div'); c1.id = 'v4c1'; body.appendChild(c1); }
  if(!c2){ c2 = document.createElement('div'); c2.id = 'v4c2'; body.appendChild(c2); }

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let tx = x;
  let ty = y;
  let raf = null;

  const step = () => {
    tx += (x - tx) * 0.18;
    ty += (y - ty) * 0.18;
    c1.style.transform = `translate(${x}px, ${y}px)`;
    c2.style.transform = `translate(${tx}px, ${ty}px)`;
    raf = requestAnimationFrame(step);
  };

  window.addEventListener('mousemove', (e) => {
    x = e.clientX;
    y = e.clientY;
    body.classList.add('cursor-live');
    if(!raf) raf = requestAnimationFrame(step);
  }, {passive:true});

  const hoverSel = 'a,button,.chip,.btn,.ed-item,.fig-card,.figure,.viewer-frame,.atlas-viewer,.nav a';
  const bindHover = (root=document) => {
    root.querySelectorAll(hoverSel).forEach(el => {
      if(el.dataset.v4hoverBound) return;
      el.dataset.v4hoverBound = '1';
      el.addEventListener('mouseenter', () => body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => body.classList.remove('cursor-hover'));
    });
  };
  bindHover();

  const mo = new MutationObserver(() => bindHover());
  mo.observe(body, {childList:true, subtree:true});

  window.addEventListener('mouseleave', () => body.classList.remove('cursor-live'));
})();

(function(){
  const sections = [...document.querySelectorAll('section[data-bg]')];
  const layers = [...document.querySelectorAll('#ambient .bg[data-bg]')];
  if(!sections.length || !layers.length) return;

  const setAmbient = (key) => {
    layers.forEach(layer => layer.classList.toggle('on', layer.getAttribute('data-bg') === String(key)));
    document.body.setAttribute('data-ambient', String(key));
  };

  const chooseSection = () => {
    const probe = window.innerHeight * 0.34;
    let best = sections[0];
    let bestDist = Infinity;
    for(const sec of sections){
      const r = sec.getBoundingClientRect();
      let dist = 0;
      if(probe < r.top) dist = r.top - probe;
      else if(probe > r.bottom) dist = probe - r.bottom;
      else dist = 0;
      if(dist < bestDist){
        best = sec;
        bestDist = dist;
      }
    }
    if(best) setAmbient(best.getAttribute('data-bg') || 0);
  };

  let ticking = false;
  const requestTick = () => {
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      chooseSection();
      ticking = false;
    });
  };

  window.addEventListener('scroll', requestTick, {passive:true});
  window.addEventListener('resize', requestTick);
  window.addEventListener('load', requestTick);
  requestTick();
})();


(function(){
  const fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!fine || reduced) return;

  const panelSel = '.viewer-frame,.atlas-viewer,.split-fig,.figure,.fig-card,.contact-card,.pos-card,.ed-item,.legal';
  const panels = [...document.querySelectorAll(panelSel)];

  panels.forEach((panel) => {
    if(panel.dataset.v4tiltBound) return;
    panel.dataset.v4tiltBound = '1';
    panel.addEventListener('mousemove', (e) => {
      const r = panel.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * 100;
      const py = ((e.clientY - r.top) / r.height) * 100;
      const rx = ((py - 50) / 50) * -4.5;
      const ry = ((px - 50) / 50) * 4.5;
      panel.style.setProperty('--mx', px + '%');
      panel.style.setProperty('--my', py + '%');
      panel.style.setProperty('--glow', '.95');
      panel.style.transform = `perspective(1400px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
    }, {passive:true});
    panel.addEventListener('mouseleave', () => {
      panel.style.setProperty('--glow', '0');
      panel.style.transform = '';
    });
  });

  document.querySelectorAll('.btn').forEach((btn) => {
    if(btn.dataset.v4magBound) return;
    btn.dataset.v4magBound = '1';
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) / r.width;
      const y = (e.clientY - r.top - r.height / 2) / r.height;
      btn.style.transform = `translate(${x * 10}px, ${y * 8}px)`;
    }, {passive:true});
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
})();

/* ── Mobile slide-in sidebar (runs on all devices) ── */
(function(){
  const menuBtn = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.topbar .nav');
  if(!menuBtn || !nav) return;

  let scrim = null;
  let panel = null;
  let isOpen = false;

  const el = (tag, styles, text) => {
    const e = document.createElement(tag);
    if(styles) Object.assign(e.style, styles);
    if(text) e.textContent = text;
    return e;
  };

  const close = () => {
    if(!scrim) return;
    scrim.style.opacity = '0';
    panel.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if(scrim){ scrim.remove(); scrim = null; panel = null; }
    }, 360);
    isOpen = false;
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  const open = () => {
    /* ── Scrim ── */
    scrim = el('div', {
      position:'fixed', top:'0', left:'0', width:'100%', height:'100%',
      zIndex:'99999',
      background:'rgba(0,0,0,.6)',
      backdropFilter:'blur(2px)', WebkitBackdropFilter:'blur(2px)',
      opacity:'0',
      transition:'opacity .35s ease'
    });
    scrim.addEventListener('click', close);

    /* ── Panel ── */
    panel = el('div', {
      position:'fixed', top:'0', right:'0',
      width:'min(82vw, 340px)', height:'100%',
      zIndex:'100000',
      background:'linear-gradient(180deg, #0b1120 0%, #080d17 40%, #070b14 100%)',
      borderLeft:'1px solid rgba(14,184,150,.08)',
      boxShadow:'-12px 0 48px rgba(0,0,0,.5), -2px 0 8px rgba(0,0,0,.3)',
      display:'flex', flexDirection:'column',
      boxSizing:'border-box',
      transform:'translateX(100%)',
      transition:'transform .35s cubic-bezier(.22,.61,.36,1)'
    });

    /* ── Top accent line ── */
    const accent = el('div', {
      height:'2px', flexShrink:'0',
      background:'linear-gradient(90deg, rgba(14,184,150,.5), rgba(201,169,110,.3), transparent)'
    });
    panel.appendChild(accent);

    /* ── Close button row ── */
    const topRow = el('div', {
      display:'flex', alignItems:'center', justifyContent:'flex-end',
      padding:'16px 20px 8px', flexShrink:'0'
    });

    const closeBtn = el('button', {
      background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)',
      borderRadius:'8px', width:'36px', height:'36px',
      cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
      color:'rgba(255,255,255,.5)', fontSize:'14px', lineHeight:'1',
      fontFamily:'system-ui, sans-serif', padding:'0',
      transition:'background .2s, border-color .2s, color .2s'
    });
    closeBtn.innerHTML = '&#10005;';
    closeBtn.setAttribute('aria-label', 'Close menu');
    closeBtn.addEventListener('click', close);
    topRow.appendChild(closeBtn);
    panel.appendChild(topRow);

    /* ── Links section ── */
    const linksSection = el('div', {
      flex:'1', display:'flex', flexDirection:'column',
      padding:'12px 16px', overflowY:'auto'
    });

    /* label */
    const label = el('div', {
      padding:'4px 10px 14px',
      fontFamily:'"JetBrains Mono", monospace',
      fontSize:'.58rem', fontWeight:'500',
      color:'rgba(14,184,150,.5)',
      letterSpacing:'.14em',
      textTransform:'uppercase'
    }, 'Menu');
    linksSection.appendChild(label);

    /* links */
    nav.querySelectorAll('a').forEach((a, i) => {
      const isCurrent = a.getAttribute('aria-current') === 'page';
      const link = el('a', {
        display:'flex', alignItems:'center', gap:'12px',
        fontFamily:'Manrope, sans-serif',
        fontSize:'.9rem',
        fontWeight: isCurrent ? '600' : '400',
        padding:'13px 14px',
        textDecoration:'none',
        borderRadius:'10px',
        color: isCurrent ? '#fff' : 'rgba(255,255,255,.5)',
        background: isCurrent
          ? 'linear-gradient(135deg, rgba(14,184,150,.12) 0%, rgba(14,184,150,.06) 100%)'
          : 'transparent',
        border: isCurrent ? '1px solid rgba(14,184,150,.18)' : '1px solid transparent',
        letterSpacing:'.01em',
        boxSizing:'border-box',
        opacity:'0',
        transform:'translateX(20px)',
        transition:'opacity .3s ease ' + (i * 0.04 + 0.08) + 's, transform .3s ease ' + (i * 0.04 + 0.08) + 's, background .2s, color .2s, border-color .2s'
      });

      /* teal dot for active page */
      if(isCurrent){
        const activeDot = el('span', {
          width:'6px', height:'6px', borderRadius:'50%', flexShrink:'0',
          background:'rgb(14,184,150)',
          boxShadow:'0 0 8px rgba(14,184,150,.6)'
        });
        link.appendChild(activeDot);
      }

      link.appendChild(document.createTextNode(a.textContent));
      link.href = a.href;
      link.addEventListener('click', close);
      linksSection.appendChild(link);
    });

    panel.appendChild(linksSection);

    /* ── Divider ── */
    panel.appendChild(el('div', {
      height:'1px', margin:'0 24px', flexShrink:'0',
      background:'linear-gradient(90deg, rgba(255,255,255,.06), rgba(255,255,255,.02))'
    }));

    /* ── Footer meta ── */
    const footer = el('div', {
      padding:'20px 26px 28px', flexShrink:'0'
    });

    const uni = el('div', {
      fontFamily:'"JetBrains Mono", monospace',
      fontSize:'.6rem', fontWeight:'400',
      color:'rgba(255,255,255,.25)',
      letterSpacing:'.06em',
      marginBottom:'8px'
    }, 'University of Cologne');

    const live = el('div', {
      fontFamily:'"JetBrains Mono", monospace',
      fontSize:'.6rem', fontWeight:'400',
      color:'rgba(14,184,150,.6)',
      letterSpacing:'.06em',
      display:'flex', alignItems:'center', gap:'7px'
    });
    const dot = el('span', {
      width:'5px', height:'5px', borderRadius:'50%',
      background:'rgb(14,184,150)', display:'inline-block',
      boxShadow:'0 0 4px rgba(14,184,150,.5), 0 0 12px rgba(14,184,150,.2)'
    });
    live.appendChild(dot);
    live.appendChild(document.createTextNode('Active lab'));

    footer.appendChild(uni);
    footer.appendChild(live);
    panel.appendChild(footer);

    /* ── Mount & animate ── */
    document.body.appendChild(scrim);
    document.body.appendChild(panel);

    requestAnimationFrame(() => {
      scrim.style.opacity = '1';
      panel.style.transform = 'translateX(0)';
      linksSection.querySelectorAll('a').forEach(l => {
        l.style.opacity = '1';
        l.style.transform = 'translateX(0)';
      });
    });

    isOpen = true;
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  menuBtn.addEventListener('click', () => {
    if(isOpen) close(); else open();
  });
})();
