/* ============================================================
   Cookie / privacy consent banner
   - Shows on first visit, stores choice in localStorage
   - GDPR-friendly: no analytics/tracking is loaded until accepted
   - Re-opened from footer/menu link with [data-cookie-settings]
   ============================================================ */
(function(){
  const KEY = 'mwb-cookie-consent';
  const VERSION = '1';

  function getStored(){
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
    catch(e){ return null; }
  }
  function setStored(value){
    try { localStorage.setItem(KEY, JSON.stringify({ v: VERSION, value, at: Date.now() })); }
    catch(e){ /* ignore */ }
  }

  function ensureStyles(){
    if(document.getElementById('cookie-banner-style')) return;
    const css = `
      .cookie-banner{
        position:fixed; left:16px; right:16px; bottom:16px;
        max-width:760px; margin:0 auto;
        background:linear-gradient(180deg, #14263A 0%, #0F1E2E 100%);
        color:rgba(255,255,255,.78);
        border:1px solid rgba(251,225,150,.18);
        border-radius:10px;
        padding:18px 20px;
        box-shadow:0 24px 60px rgba(0,0,0,.45);
        font-family:Manrope, system-ui, sans-serif;
        z-index:9998;
        opacity:0;
        transform:translateY(14px);
        transition:opacity .35s ease, transform .35s ease;
      }
      .cookie-banner.show{ opacity:1; transform:translateY(0); }
      .cookie-banner-inner{
        display:flex; flex-wrap:wrap; align-items:center;
        gap:18px;
      }
      .cookie-banner-text{ flex:1 1 320px; min-width:0; }
      .cookie-banner-text strong{
        display:block;
        font-family:"JetBrains Mono", monospace;
        font-size:.62rem;
        letter-spacing:.18em;
        text-transform:uppercase;
        color:#FBE196;
        margin-bottom:6px;
      }
      .cookie-banner-text p{
        margin:0;
        font-size:.92rem;
        line-height:1.55;
      }
      .cookie-banner-text a{
        color:#FBE196;
        text-decoration:underline;
        text-underline-offset:3px;
      }
      .cookie-banner-actions{
        display:flex; gap:10px; flex:0 0 auto;
      }
      .cookie-btn{
        font-family:"JetBrains Mono", monospace;
        font-size:.7rem;
        letter-spacing:.14em;
        text-transform:uppercase;
        padding:10px 16px;
        border-radius:999px;
        cursor:pointer;
        border:1px solid rgba(255,255,255,.18);
        background:transparent;
        color:rgba(255,255,255,.82);
        transition:background .25s ease, border-color .25s ease, color .25s ease, transform .25s ease;
      }
      .cookie-btn:hover,
      .cookie-btn:focus-visible{
        outline:none;
        transform:translateY(-1px);
      }
      .cookie-btn.cookie-btn-secondary:hover,
      .cookie-btn.cookie-btn-secondary:focus-visible{
        border-color:rgba(255,255,255,.4);
        color:#fff;
      }
      .cookie-btn.cookie-btn-primary{
        background:#FBE196;
        border-color:#FBE196;
        color:#0D1B2A;
      }
      .cookie-btn.cookie-btn-primary:hover,
      .cookie-btn.cookie-btn-primary:focus-visible{
        background:#fff;
        border-color:#fff;
      }
      @media (max-width:600px){
        .cookie-banner{ padding:16px; left:10px; right:10px; bottom:10px; }
        .cookie-banner-inner{ gap:14px; }
        .cookie-banner-actions{ width:100%; }
        .cookie-btn{ flex:1; padding:10px 12px; }
      }
    `;
    const style = document.createElement('style');
    style.id = 'cookie-banner-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function build(){
    const el = document.createElement('div');
    el.className = 'cookie-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Cookie consent');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = `
      <div class="cookie-banner-inner">
        <div class="cookie-banner-text">
          <strong>Cookies &amp; privacy</strong>
          <p>We use only essential cookies needed for this site to function. No analytics or tracking cookies are loaded without your consent. See our <a href="privacy.html">privacy policy</a> and <a href="impressum.html">impressum</a> for details.</p>
        </div>
        <div class="cookie-banner-actions">
          <button type="button" class="cookie-btn cookie-btn-secondary" data-consent="declined">Decline</button>
          <button type="button" class="cookie-btn cookie-btn-primary" data-consent="accepted">Accept</button>
        </div>
      </div>
    `;
    return el;
  }

  function show(){
    ensureStyles();
    const banner = build();
    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add('show'));

    banner.addEventListener('click', function(e){
      const btn = e.target.closest('[data-consent]');
      if(!btn) return;
      setStored(btn.dataset.consent);
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 350);
      window.dispatchEvent(new CustomEvent('cookie-consent-change', { detail: btn.dataset.consent }));
    });
  }

  function init(){
    /* Allow re-opening the banner from a footer/menu link */
    document.addEventListener('click', function(e){
      const trigger = e.target.closest('[data-cookie-settings]');
      if(!trigger) return;
      e.preventDefault();
      try { localStorage.removeItem(KEY); } catch(_){}
      const existing = document.querySelector('.cookie-banner');
      if(existing) existing.remove();
      show();
    });

    const stored = getStored();
    if(stored && stored.v === VERSION) return;
    show();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
