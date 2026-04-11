/* cleanup: remove leftover custom cursor elements */
document.querySelectorAll('#v4c1,#v4c2').forEach(function(e){e.remove()});
document.body.classList.remove('has-v4blend-cursor','cursor-live','cursor-hover');

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
  const logoEl = document.querySelector('.topbar .brand-logo');
  if(!menuBtn || !nav) return;

  let scrim = null;
  let panel = null;
  let isOpen = false;

  const el = (tag, styles, html) => {
    const e = document.createElement(tag);
    if(styles) Object.assign(e.style, styles);
    if(html && typeof html === 'string') e.textContent = html;
    return e;
  };

  const close = () => {
    if(!scrim) return;
    scrim.style.opacity = '0';
    panel.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if(scrim){ scrim.remove(); scrim = null; }
      if(panel){ panel.remove(); panel = null; }
    }, 380);
    isOpen = false;
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  const open = () => {

    /* ── Scrim ── */
    scrim = el('div', {
      position:'fixed', top:'0', left:'0', width:'100%', height:'100%',
      zIndex:'99999',
      background:'rgba(0,0,0,.55)',
      backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)',
      opacity:'0',
      transition:'opacity .38s ease'
    });
    scrim.addEventListener('click', close);

    /* ── Panel ── */
    panel = el('div', {
      position:'fixed', top:'0', right:'0',
      width:'min(80vw, 320px)', height:'100%',
      zIndex:'100000',
      background:'#080d17',
      borderLeft:'1px solid rgba(212,173,74,.06)',
      boxShadow:'-16px 0 60px rgba(0,0,0,.55)',
      display:'flex', flexDirection:'column',
      boxSizing:'border-box',
      overflowY:'auto', overflowX:'hidden',
      transform:'translateX(100%)',
      transition:'transform .38s cubic-bezier(.22,.61,.36,1)'
    });

    /* ── Accent strip ── */
    panel.appendChild(el('div', {
      height:'1px', flexShrink:'0',
      background:'linear-gradient(90deg, rgba(212,173,74,.45), rgba(201,169,110,.25) 60%, transparent)'
    }));

    /* ── Header: logo + close ── */
    const header = el('div', {
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'16px 18px 20px 22px', flexShrink:'0'
    });

    /* logo */
    if(logoEl){
      const lClone = logoEl.cloneNode(true);
      Object.assign(lClone.style, { display:'flex', alignItems:'center', textDecoration:'none' });
      const img = lClone.querySelector('img');
      if(img) Object.assign(img.style, { height:'34px', width:'auto', filter:'drop-shadow(0 0 6px rgba(212,173,74,.2))' });
      header.appendChild(lClone);
    }

    /* close */
    const closeBtn = el('button', {
      background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)',
      borderRadius:'8px', width:'34px', height:'34px',
      cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
      color:'rgba(255,255,255,.45)', fontSize:'13px', lineHeight:'1',
      fontFamily:'system-ui, sans-serif', padding:'0',
      transition:'background .2s, color .2s'
    });
    closeBtn.innerHTML = '&#10005;';
    closeBtn.setAttribute('aria-label', 'Close menu');
    closeBtn.addEventListener('click', close);
    header.appendChild(closeBtn);
    panel.appendChild(header);

    /* ── Separator ── */
    panel.appendChild(el('div', {
      height:'1px', margin:'0 22px', flexShrink:'0',
      background:'rgba(255,255,255,.04)'
    }));

    /* ── Nav links ── */
    const linksWrap = el('div', {
      flex:'1', display:'flex', flexDirection:'column',
      padding:'20px 14px 16px'
    });

    /* section label */
    linksWrap.appendChild(el('div', {
      padding:'0 12px 12px',
      fontFamily:'"JetBrains Mono", monospace',
      fontSize:'.56rem', fontWeight:'500',
      color:'rgba(212,173,74,.4)',
      letterSpacing:'.14em',
      textTransform:'uppercase'
    }, 'Navigate'));

    nav.querySelectorAll('a').forEach((a, i) => {
      const isCurrent = a.getAttribute('aria-current') === 'page';

      const link = el('a', {
        display:'flex', alignItems:'center', gap:'10px',
        fontFamily:'Manrope, sans-serif',
        fontSize:'.88rem',
        fontWeight: isCurrent ? '600' : '400',
        padding:'12px 12px',
        margin:'1px 0',
        textDecoration:'none',
        borderRadius:'8px',
        color: isCurrent ? '#fff' : 'rgba(255,255,255,.45)',
        background: isCurrent ? 'rgba(212,173,74,.08)' : 'transparent',
        borderLeft: isCurrent ? '2px solid rgba(212,173,74,.7)' : '2px solid transparent',
        letterSpacing:'.01em',
        boxSizing:'border-box',
        opacity:'0',
        transform:'translateX(14px)',
        transition:'opacity .28s ease ' + (i * 0.035 + 0.1) + 's, transform .32s cubic-bezier(.22,.61,.36,1) ' + (i * 0.035 + 0.1) + 's, background .2s, color .2s'
      });

      if(isCurrent){
        link.appendChild(el('span', {
          width:'5px', height:'5px', borderRadius:'50%', flexShrink:'0',
          background:'rgb(212,173,74)',
          boxShadow:'0 0 6px rgba(212,173,74,.55)'
        }));
      }

      link.appendChild(document.createTextNode(a.textContent));
      link.href = a.href;
      link.addEventListener('click', close);
      linksWrap.appendChild(link);
    });

    panel.appendChild(linksWrap);

    /* ── Bottom section ── */
    const bottom = el('div', {
      padding:'0 22px 26px', flexShrink:'0', marginTop:'auto'
    });

    /* divider */
    bottom.appendChild(el('div', {
      height:'1px', marginBottom:'18px',
      background:'linear-gradient(90deg, rgba(255,255,255,.05), rgba(255,255,255,.01))'
    }));

    /* university */
    bottom.appendChild(el('div', {
      fontFamily:'"JetBrains Mono", monospace',
      fontSize:'.58rem', fontWeight:'400',
      color:'rgba(255,255,255,.2)',
      letterSpacing:'.06em',
      marginBottom:'7px'
    }, 'University of Cologne'));

    /* active lab */
    const liveRow = el('div', {
      fontFamily:'"JetBrains Mono", monospace',
      fontSize:'.58rem', fontWeight:'400',
      color:'rgba(212,173,74,.55)',
      letterSpacing:'.06em',
      display:'flex', alignItems:'center', gap:'6px'
    });
    liveRow.appendChild(el('span', {
      width:'4px', height:'4px', borderRadius:'50%',
      background:'rgb(212,173,74)', display:'inline-block',
      boxShadow:'0 0 3px rgba(212,173,74,.5), 0 0 10px rgba(212,173,74,.15)'
    }));
    liveRow.appendChild(document.createTextNode('Active lab'));
    bottom.appendChild(liveRow);

    /* version tag */
    bottom.appendChild(el('div', {
      fontFamily:'"JetBrains Mono", monospace',
      fontSize:'.5rem', fontWeight:'400',
      color:'rgba(255,255,255,.08)',
      letterSpacing:'.08em',
      marginTop:'14px'
    }, 'MWB Lab · 2025'));

    panel.appendChild(bottom);

    /* ── Mount & animate ── */
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
