/* Site chrome: nav, theme, reveals, counters, ticker, voyage HUD,
   group containers, heritage timeline, enquiry dialog, toast, flags. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  /* ---------- Nav ---------- */
  const nav = $('#nav'), burger = $('#burger');
  function onScrollNav() { nav.classList.toggle('is-scrolled', window.scrollY > 24); }
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('#navLinks a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); burger.focus(); } });

  // Highlight the section currently in view
  const links = $$('#navLinks a[href^="#"]');
  const secObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((l) => l.classList.toggle('is-current', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['modes', 'vessel', 'group', 'network', 'heritage', 'quote'].forEach((id) => { const s = document.getElementById(id); s && secObs.observe(s); });

  /* ---------- Theme ---------- */
  const themeBtn = $('#themeToggle');
  function syncTheme() { themeBtn.setAttribute('aria-pressed', root.dataset.theme === 'dark'); }
  syncTheme();
  themeBtn.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('tas-theme', root.dataset.theme); } catch (e) {}
    syncTheme();
  });

  /* ---------- Reveal + counters ---------- */
  const revObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      revObs.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal]').forEach((n, i) => {
    // Stagger siblings that reveal together
    const sibs = [...n.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
    n.style.transitionDelay = (sibs.indexOf(n) * 80) + 'ms';
    revObs.observe(n);
  });

  const cntObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      cntObs.unobserve(e.target);
      const end = +e.target.dataset.count, n = e.target;
      if (reduce) { n.textContent = end; return; }
      const t0 = performance.now(), dur = 1400;
      (function step(now) {
        const p = Math.min(1, (now - t0) / dur);
        n.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }, { threshold: .6 });
  $$('[data-count]').forEach((n) => cntObs.observe(n));

  /* ---------- Ticker ---------- */
  const ticker = $('#ticker');
  if (ticker) {
    const items = TAS.ports.filter((p) => p.ocean).map((p) =>
      '<span><b>MYPEN → ' + p.code + '</b> · ' + p.name.toUpperCase() + ' · <em>' + p.ocean.days[0] + '–' + p.ocean.days[1] + 'D</em></span>').join('');
    ticker.innerHTML = items + items;
  }

  /* ---------- Voyage HUD: your scroll is a passage from Penang to Rotterdam ---------- */
  const hud = $('#hud');
  if (hud && TAS.geo) {
    const route = TAS.geo.routeLatLon(TAS.geo.portByCode('NLRTM'), 'ocean');
    const cum = [0];
    for (let i = 1; i < route.length; i++) cum.push(cum[i - 1] + TAS.geo.haversine(route[i - 1], route[i]));
    const total = cum[cum.length - 1];
    const pos = $('#hudPos'), hdg = $('#hudHdg'), sog = $('#hudSog'), pct = $('#hudPct');
    const dm = (v, pad, pos, neg) => {
      const a = Math.abs(v), d = Math.floor(a), m = (a - d) * 60;
      return String(d).padStart(pad, '0') + '°' + m.toFixed(1).padStart(4, '0') + '′' + (v >= 0 ? pos : neg);
    };
    let lastY = window.scrollY, lastT = performance.now(), speed = 0, raf = null;

    function update() {
      raf = null;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const d = p * total;
      let i = 1;
      while (i < cum.length - 1 && cum[i] < d) i++;
      const a = route[i - 1], b = route[i], t = (d - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
      const lat = a[0] + (b[0] - a[0]) * t, lon = a[1] + (b[1] - a[1]) * t;
      const r = Math.PI / 180;
      const y = Math.sin((b[1] - a[1]) * r) * Math.cos(b[0] * r);
      const x = Math.cos(a[0] * r) * Math.sin(b[0] * r) - Math.sin(a[0] * r) * Math.cos(b[0] * r) * Math.cos((b[1] - a[1]) * r);
      const brg = (Math.atan2(y, x) / r + 360) % 360;
      pos.textContent = dm(lat, 2, 'N', 'S') + ' ' + dm(lon, 3, 'E', 'W');
      hdg.textContent = 'HDG ' + String(Math.round(brg)).padStart(3, '0') + '°';
      pct.textContent = Math.round(p * 100) + '%';
      hud.classList.toggle('is-on', window.scrollY > window.innerHeight * .6);
    }
    function onScroll() {
      const now = performance.now(), dy = Math.abs(window.scrollY - lastY), dt = Math.max(16, now - lastT);
      speed = Math.min(24, speed * .6 + (dy / dt) * 9);
      lastY = window.scrollY; lastT = now;
      if (!raf) raf = requestAnimationFrame(update);
    }
    // Speed decays when the reader stops scrolling
    setInterval(() => {
      speed *= .82;
      sog.textContent = speed < .2 ? 'SOG 0.0 KN · DRIFTING' : 'SOG ' + speed.toFixed(1) + ' KN';
    }, 200);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- Group containers ---------- */
  $$('.box').forEach((box) => {
    const btn = $('.box__toggle', box), hint = $('.box__hint', box);
    function toggle(force) {
      const open = typeof force === 'boolean' ? force : !box.classList.contains('is-open');
      box.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open);
      hint.textContent = open ? 'Close doors' : 'Open doors';
    }
    btn.addEventListener('click', () => toggle());
    $('.box__body', box).addEventListener('click', (e) => { if (!e.target.closest('a, button')) toggle(); });
  });

  /* ---------- Heritage timeline ---------- */
  const track = $('#htlTrack');
  if (track) {
    const prog = $('#htlProg'), ship = $('#htlShip');
    const stepW = () => (track.querySelector('.era') || {}).offsetWidth || 300;
    $('#htlPrev').addEventListener('click', () => track.scrollBy({ left: -stepW(), behavior: reduce ? 'auto' : 'smooth' }));
    $('#htlNext').addEventListener('click', () => track.scrollBy({ left: stepW(), behavior: reduce ? 'auto' : 'smooth' }));
    function sync() {
      const max = track.scrollWidth - track.clientWidth;
      const p = max > 0 ? track.scrollLeft / max : 0;
      prog.style.width = (p * 100) + '%';
      ship.style.left = (p * 100) + '%';
    }
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();

    // Drag to scroll (mouse only; touch scrolls natively)
    let down = false, sx = 0, sl = 0, moved = false;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; sx = e.clientX; sl = track.scrollLeft;
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 4) { moved = true; track.classList.add('is-drag'); }
      track.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      track.classList.remove('is-drag');
      // Snap to the nearest era after a drag
      if (moved) { const w = stepW(); track.scrollTo({ left: Math.round(track.scrollLeft / w) * w, behavior: reduce ? 'auto' : 'smooth' }); }
    });
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left: stepW(), behavior: 'smooth' }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); track.scrollBy({ left: -stepW(), behavior: 'smooth' }); }
    });
  }

  /* ---------- Toast ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(html) {
    toastEl.innerHTML = html;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 5200);
  }

  /* ---------- Enquiry dialog ---------- */
  const dlg = $('#enquiry'), form = $('#enquiryForm');
  function openEnquiry(type, msg) {
    if (type) $('#eType').value = type;
    $('#eMsg').value = msg || '';
    $$('[aria-invalid]', form).forEach((n) => n.removeAttribute('aria-invalid'));
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    setTimeout(() => $('#eName').focus(), 50);
  }
  function closeDlg() { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
  $('#dlgClose').addEventListener('click', closeDlg);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closeDlg(); });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-enquiry]');
    if (b) openEnquiry(b.dataset.enquiry);
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#eName'), mail = $('#eMail');
    let ok = true;
    [[name, name.value.trim().length > 1], [mail, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim())]].forEach(([n, valid]) => {
      n.setAttribute('aria-invalid', !valid);
      if (!valid && ok) { n.focus(); ok = false; }
    });
    if (!ok) return;
    const ref = 'TAS-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    closeDlg();
    toast('Thanks, ' + name.value.trim().split(' ')[0].replace(/[<>&]/g, '') + '. Reference <b>' + ref + '</b>. (Demo: nothing was sent.)');
    form.reset();
  });

  /* ---------- Signal flags ---------- */
  const flagTip = $('#flagTip');
  if (flagTip) {
    const def = flagTip.textContent;
    $$('.flag').forEach((f) => {
      const show = () => (flagTip.textContent = f.dataset.tip);
      f.addEventListener('mouseenter', show);
      f.addEventListener('focus', show);
      f.addEventListener('click', show);
      f.addEventListener('mouseleave', () => (flagTip.textContent = def));
      f.addEventListener('blur', () => (flagTip.textContent = def));
    });
  }

  TAS.ui = { toast, openEnquiry };
})();
