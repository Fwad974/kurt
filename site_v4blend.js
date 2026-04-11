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

/* ── Mobile menu toggle (runs on all devices) ── */
(function(){
  const menuBtn = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.topbar .nav');
  if(!menuBtn || !nav) return;

  let overlay = null;
  let isOpen = false;

  const close = () => {
    if(!overlay) return;
    overlay.remove();
    overlay = null;
    isOpen = false;
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  const open = () => {
    overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    nav.querySelectorAll('a').forEach(a => {
      const link = document.createElement('a');
      link.href = a.href;
      link.textContent = a.textContent;
      if(a.getAttribute('aria-current') === 'page') link.classList.add('active');
      link.addEventListener('click', close);
      overlay.appendChild(link);
    });
    document.body.appendChild(overlay);
    isOpen = true;
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  menuBtn.addEventListener('click', () => {
    if(isOpen) close(); else open();
  });
})();
