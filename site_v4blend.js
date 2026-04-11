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
    }, 340);
    isOpen = false;
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  const open = () => {
    /* ── Scrim (dark backdrop covering entire screen) ── */
    scrim = el('div', {
      position:'fixed', top:'0', left:'0', width:'100%', height:'100%',
      zIndex:'99999',
      background:'rgba(0,0,0,.55)',
      opacity:'0',
      transition:'opacity .32s ease'
    });
    scrim.addEventListener('click', close);

    /* ── Slide-in panel from right ── */
    panel = el('div', {
      position:'fixed', top:'0', right:'0',
      width:'min(78vw, 320px)', height:'100%',
      zIndex:'100000',
      background:'#080d17',
      borderLeft:'1px solid rgba(255,255,255,.06)',
      boxShadow:'-8px 0 32px rgba(0,0,0,.4)',
      display:'flex', flexDirection:'column',
      boxSizing:'border-box',
      transform:'translateX(100%)',
      transition:'transform .32s cubic-bezier(.4,0,.2,1)'
    });

    /* ── Close button row ── */
    const topRow = el('div', {
      display:'flex', alignItems:'center', justifyContent:'flex-end',
      padding:'14px 18px', flexShrink:'0'
    });

    const closeBtn = el('button', {
      background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)',
      borderRadius:'50%', width:'34px', height:'34px',
      cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
      color:'rgba(255,255,255,.6)', fontSize:'15px', lineHeight:'1',
      fontFamily:'system-ui, sans-serif', padding:'0'
    });
    closeBtn.innerHTML = '&#10005;';
    closeBtn.setAttribute('aria-label', 'Close menu');
    closeBtn.addEventListener('click', close);
    topRow.appendChild(closeBtn);
    panel.appendChild(topRow);

    /* ── Label ── */
    const label = el('div', {
      padding:'0 24px 16px',
      fontFamily:'"JetBrains Mono", monospace',
      fontSize:'.62rem', fontWeight:'400',
      color:'rgba(255,255,255,.3)',
      letterSpacing:'.1em',
      textTransform:'uppercase'
    }, 'Navigation');
    panel.appendChild(label);

    /* ── Navigation links ── */
    const linksWrap = el('div', {
      flex:'1', display:'flex', flexDirection:'column',
      gap:'2px', padding:'0 14px',
      overflowY:'auto'
    });

    nav.querySelectorAll('a').forEach((a, i) => {
      const isCurrent = a.getAttribute('aria-current') === 'page';
      const link = el('a', {
        display:'block',
        fontFamily:'Manrope, sans-serif',
        fontSize:'.92rem',
        fontWeight: isCurrent ? '600' : '400',
        padding:'12px 14px',
        textDecoration:'none',
        borderRadius:'8px',
        color: isCurrent ? '#fff' : 'rgba(255,255,255,.55)',
        background: isCurrent ? 'rgba(14,184,150,.1)' : 'transparent',
        borderLeft: isCurrent ? '2px solid rgb(14,184,150)' : '2px solid transparent',
        letterSpacing:'.01em',
        boxSizing:'border-box',
        opacity:'0',
        transform:'translateX(16px)',
        transition:'opacity .28s ease ' + (i * 0.035) + 's, transform .28s ease ' + (i * 0.035) + 's, background .2s, color .2s'
      });
      link.href = a.href;
      link.textContent = a.textContent;
      link.addEventListener('click', close);
      linksWrap.appendChild(link);
    });
    panel.appendChild(linksWrap);

    /* ── Footer meta ── */
    const footer = el('div', {
      padding:'18px 24px', flexShrink:'0',
      borderTop:'1px solid rgba(255,255,255,.06)'
    });

    const uni = el('div', {
      fontFamily:'"JetBrains Mono", monospace',
      fontSize:'.62rem', fontWeight:'400',
      color:'rgba(255,255,255,.3)',
      letterSpacing:'.06em',
      marginBottom:'6px'
    }, 'University of Cologne');

    const live = el('div', {
      fontFamily:'"JetBrains Mono", monospace',
      fontSize:'.62rem', fontWeight:'400',
      color:'rgba(14,184,150,.7)',
      letterSpacing:'.06em',
      display:'flex', alignItems:'center', gap:'6px'
    });
    const dot = el('span', {
      width:'5px', height:'5px', borderRadius:'50%',
      background:'rgb(14,184,150)',
      display:'inline-block',
      boxShadow:'0 0 6px rgba(14,184,150,.5)'
    });
    live.appendChild(dot);
    live.appendChild(document.createTextNode('Active lab'));

    footer.appendChild(uni);
    footer.appendChild(live);
    panel.appendChild(footer);

    /* ── Mount & animate in ── */
    document.body.appendChild(scrim);
    document.body.appendChild(panel);

    requestAnimationFrame(() => {
      scrim.style.opacity = '1';
      panel.style.transform = 'translateX(0)';
      linksWrap.querySelectorAll('a').forEach(l => {
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
