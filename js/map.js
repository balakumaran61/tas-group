/* Map engine: projection helpers, hero map and the interactive network map.
   Projection is equirectangular, cropped to lon -20..160, lat 70..-45,
   matching assets/world-dots.svg (viewBox 0 0 1000 639). */
(function () {
  const L0 = -20, T = 70, S = 1000 / 180;
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hub = TAS.hub;

  function project(lat, lon) { return [(lon - L0) * S, (T - lat) * S]; }

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function haversine(a, b) {
    const R = 6371, r = Math.PI / 180;
    const dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function routeLatLon(port, mode) {
    const m = port[mode];
    if (!m) return null;
    if (mode === 'air') return [[hub.lat, hub.lon], [port.lat, port.lon]];
    return [[hub.lat, hub.lon], ...(m.via || []), [port.lat, port.lon]];
  }

  const f = (p) => p[0].toFixed(1) + ',' + p[1].toFixed(1);

  /* Catmull-Rom spline through the points, as cubic Béziers */
  function smooth(pts) {
    if (pts.length < 3) return 'M' + pts.map(f).join('L');
    let d = 'M' + f(pts[0]);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += 'C' + f(c1) + ' ' + f(c2) + ' ' + f(p2);
    }
    return d;
  }

  /* Air lanes: a bowed arc that always bulges "up" the map */
  function arc(a, b) {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    let nx = -dy / d, ny = dx / d;
    if (ny > 0) { nx = -nx; ny = -ny; }
    const k = d * 0.22;
    return 'M' + f(a) + 'Q' + f([mx + nx * k, my + ny * k]) + ' ' + f(b);
  }

  function routeD(port, mode) {
    const pts = routeLatLon(port, mode).map((p) => project(p[0], p[1]));
    return mode === 'air' ? arc(pts[0], pts[pts.length - 1]) : smooth(pts);
  }

  /* Distance in km along the lane (and nautical miles for ocean) */
  function distance(port, mode) {
    const ll = routeLatLon(port, mode);
    if (!ll) return null;
    let km = 0;
    for (let i = 1; i < ll.length; i++) km += haversine(ll[i - 1], ll[i]);
    if (mode === 'land') km *= 1.12;          // road winding factor
    return { km: Math.round(km), nm: Math.round(km / 1.852) };
  }

  const portByCode = (code) => TAS.ports.find((p) => p.code === code);
  const portsFor = (mode) => TAS.ports.filter((p) => p[mode]);

  TAS.geo = { project, routeLatLon, routeD, distance, haversine, portByCode, portsFor };

  /* ---------------- Hero map ---------------- */
  function heroMap() {
    const svg = document.getElementById('heroMap');
    if (!svg) return;
    const gR = svg.querySelector('#heroRoutes'), gP = svg.querySelector('#heroPorts'),
          gS = svg.querySelector('#heroShips'), gH = svg.querySelector('#heroHub');
    const paths = [];
    portsFor('ocean').forEach((p, i) => {
      const path = el('path', { d: routeD(p, 'ocean'), class: 'h-route', style: 'animation-delay:' + (-i * 1.3) + 's' }, gR);
      paths.push(path);
      const [x, y] = project(p.lat, p.lon);
      el('circle', { cx: x, cy: y, r: 2.6, class: 'h-port' }, gP);
    });
    const [hx, hy] = project(hub.lat, hub.lon);
    for (let i = 0; i < 3; i++) el('circle', { cx: hx, cy: hy, r: 9, class: 'hub-ring' }, gH);
    el('circle', { cx: hx, cy: hy, r: 4.5, class: 'hub-core' }, gH);
    const t = el('text', { x: hx + 12, y: hy - 8, 'font-size': 11, class: 'hub-label' }, gH);
    t.textContent = 'PENANG';

    const pick = ['NLRTM', 'CNSHA', 'AEJEA', 'AUSYD', 'INMAA', 'KRPUS', 'ZADUR'];
    const ships = pick.map((code, i) => {
      const idx = portsFor('ocean').findIndex((p) => p.code === code);
      const path = paths[idx];
      return { path, len: path.getTotalLength(), t: (i * 0.17) % 1, speed: 26 + (i % 3) * 8,
               dot: el('circle', { r: 3.4, class: 'h-ship' }, gS) };
    });

    function place(s) {
      const pt = s.path.getPointAtLength(s.t * s.len);
      s.dot.setAttribute('cx', pt.x); s.dot.setAttribute('cy', pt.y);
      s.dot.setAttribute('opacity', Math.min(1, s.t * 12, (1 - s.t) * 12));
    }
    if (reduce) { ships.forEach((s) => { s.t = 0.5; place(s); }); return; }

    let running = false, last = 0;
    function tick(now) {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      ships.forEach((s) => { s.t = (s.t + dt * s.speed / s.len) % 1; place(s); });
      requestAnimationFrame(tick);
    }
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) { running = true; last = performance.now(); requestAnimationFrame(tick); }
      else if (!e.isIntersecting) running = false;
    }).observe(svg);
  }

  /* ---------------- Network map ---------------- */
  function netMap() {
    const svg = document.getElementById('netMap');
    if (!svg) return;
    const wrap = svg.parentElement;
    const gGrat = svg.querySelector('#netGrat'), gR = svg.querySelector('#netRoutes'),
          gW = svg.querySelector('#netWaypoints'), gP = svg.querySelector('#netPorts'),
          gM = svg.querySelector('#netMarker'), gH = svg.querySelector('#netHub');
    const dots = svg.querySelector('#netDots'), dotsFine = svg.querySelector('#netDotsFine');
    const tip = document.getElementById('netTip');
    const panel = document.getElementById('netPanel');
    const list = document.getElementById('netList');
    const modeBtns = [...document.querySelectorAll('#netModes [role="radio"]')];

    const VB = { world: [0, 0, 1000, 639], land: [586, 294, 165, 105.6] };
    let vb = VB.world.slice();
    const state = { mode: 'ocean', sel: null };
    let markerRAF = null;

    // Graticule every 10°
    let g = '';
    for (let lon = -20; lon <= 160; lon += 10) { const x = project(0, lon)[0]; g += 'M' + x + ',0V639'; }
    for (let lat = 70; lat >= -45; lat -= 10) { const y = project(lat, 0)[1]; g += 'M0,' + y + 'H1000'; }
    el('path', { d: g, class: 'n-grat' }, gGrat);

    function animateVB(to) {
      const from = vb.slice();
      if (reduce) { vb = to.slice(); svg.setAttribute('viewBox', vb.join(' ')); return; }
      const t0 = performance.now(), dur = 900;
      (function step(now) {
        const p = Math.min(1, (now - t0) / dur), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        vb = from.map((v, i) => v + (to[i] - v) * e);
        svg.setAttribute('viewBox', vb.join(' '));
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }

    function daysTxt(d) { return d[0] === d[1] ? d[0] + (d[0] === 1 ? ' day' : ' days') : d[0] + '–' + d[1] + ' days'; }

    // Mark sizes in "screen-ish" units; multiplied by k (zoom) when drawn
    const SIZES = {
      world: { dot: 4, font: 13, hub: 14, ring: 9, route: 1.4, active: 3.2, marker: 5, dash: 5 },
      land:  { dot: 7, font: 22, hub: 22, ring: 16, route: 3, active: 5.5, marker: 9, dash: 8, wp: 16 }
    };
    let SZ = SIZES.world, K = 1;

    function render() {
      const mode = state.mode, k = mode === 'land' ? VB.land[2] / 1000 : 1;
      SZ = mode === 'land' ? SIZES.land : SIZES.world; K = k;
      svg.classList.toggle('is-land', mode === 'land');
      [gR, gW, gP, gH].forEach((n) => (n.innerHTML = ''));
      stopMarker();
      dots.setAttribute('opacity', mode === 'land' ? 0 : .5);
      dotsFine.setAttribute('opacity', mode === 'land' ? .75 : 0);
      animateVB(mode === 'land' ? VB.land : VB.world);

      portsFor(mode).forEach((p) => {
        const path = el('path', { d: routeD(p, mode), class: 'n-route' + (mode === 'air' ? ' is-air' : ''), 'data-code': p.code }, gR);
        path.style.strokeWidth = SZ.route * k;
        if (mode === 'air') path.style.strokeDasharray = (SZ.dash * k) + ' ' + (SZ.dash * k);
        const [x, y] = project(p.lat, p.lon);
        const name = p.name + ', ' + p.country + ': ' + daysTxt(p[mode].days);
        const grp = el('g', { class: 'n-port', tabindex: 0, role: 'button', 'aria-label': name, 'data-code': p.code }, gP);
        el('circle', { cx: x, cy: y, r: 16 * k, class: 'hit' }, grp);
        el('circle', { cx: x, cy: y, r: SZ.dot * k, class: 'dot' }, grp);
        const left = p.code === 'MYPKG' || p.code === 'THLCH';
        const tx = el('text', { x: x + (left ? -1 : 1) * (SZ.dot + 4) * k, y: y + SZ.font * .35 * k, 'font-size': SZ.font * k, 'text-anchor': left ? 'end' : 'start' }, grp);
        tx.textContent = mode === 'land' ? p.name : p.code;
      });

      if (mode === 'land') {
        TAS.waypoints.forEach((w) => {
          const [x, y] = project(w.lat, w.lon), s = 6 * k;
          const grp = el('g', { class: 'n-wp' }, gW);
          el('path', { d: `M${x},${y - s}L${x + s},${y}L${x},${y + s}L${x - s},${y}Z` }, grp);
          const t = el('text', { x: x - 10 * k, y: y + SZ.wp * .35 * k, 'font-size': SZ.wp * k, 'text-anchor': 'end' }, grp);
          t.textContent = w.name.toUpperCase();
        });
      }

      const [hx, hy] = project(hub.lat, hub.lon);
      for (let i = 0; i < 3; i++) el('circle', { cx: hx, cy: hy, r: SZ.ring * k, class: 'hub-ring' }, gH);
      el('circle', { cx: hx, cy: hy, r: SZ.ring * .55 * k, class: 'hub-core' }, gH);
      const land = mode === 'land';
      const ht = el('text', { x: hx - SZ.ring * (land ? 1.3 : 1) * k, y: land ? hy + SZ.hub * .35 * k : hy - SZ.ring * .8 * k, 'font-size': SZ.hub * k, 'text-anchor': 'end', class: 'hub-label' }, gH);
      ht.textContent = 'PENANG';

      list.innerHTML = '';
      portsFor(mode).forEach((p) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'chip'; b.dataset.code = p.code;
        b.innerHTML = '<b>' + p.code + '</b>' + p.name;
        list.appendChild(b);
      });

      if (state.sel && !portByCode(state.sel)[mode]) state.sel = null;
      select(state.sel, true);
    }

    function routeEl(code) { return gR.querySelector('[data-code="' + code + '"]'); }

    function stopMarker() { if (markerRAF) cancelAnimationFrame(markerRAF); markerRAF = null; gM.innerHTML = ''; }

    function runMarker(path) {
      const k = K;
      const len = path.getTotalLength();
      const ring = el('circle', { r: SZ.marker * 1.2 * k, class: 'n-marker-ring' }, gM);
      const dot = el('circle', { r: SZ.marker * k, class: 'n-marker' }, gM);
      const dur = Math.max(2600, Math.min(6000, len * 12 / k));
      let t0 = performance.now();
      function tick(now) {
        let p = (now - t0) / dur;
        if (p > 1.25) { t0 = now; p = 0; }
        const e = Math.min(1, p), pt = path.getPointAtLength(e * len);
        [ring, dot].forEach((c) => { c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y); });
        markerRAF = requestAnimationFrame(tick);
      }
      if (reduce) { const pt = path.getPointAtLength(len); [ring, dot].forEach((c) => { c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y); }); return; }
      markerRAF = requestAnimationFrame(tick);
    }

    function select(code, silent) {
      state.sel = code;
      stopMarker();
      gR.querySelectorAll('.n-route').forEach((r) => {
        r.classList.toggle('is-active', r.dataset.code === code);
        r.getAnimations && r.getAnimations().forEach((a) => a.cancel());
        r.style.strokeDasharray = state.mode === 'air' ? (SZ.dash * K) + ' ' + (SZ.dash * K) : '';
        r.style.strokeWidth = (r.dataset.code === code ? SZ.active : SZ.route) * K;
      });
      gP.querySelectorAll('.n-port').forEach((p) => p.classList.toggle('is-active', p.dataset.code === code));
      list.querySelectorAll('.chip').forEach((c) => { c.classList.toggle('is-active', c.dataset.code === code); c.setAttribute('aria-pressed', c.dataset.code === code); });

      if (code) {
        const path = routeEl(code);
        path.parentNode.appendChild(path); // bring to front
        const len = path.getTotalLength();
        path.style.strokeDasharray = len + ' ' + len;
        if (!reduce && path.animate) {
          path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 1100, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' })
            .onfinish = () => runMarker(path);
        } else runMarker(path);
        if (!silent) { const chip = list.querySelector('.chip.is-active'); chip && chip.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' }); }
      }
      renderPanel();
    }

    function renderPanel() {
      const mode = state.mode;
      if (!state.sel) {
        panel.innerHTML =
          '<div class="np"><p class="np__code">' + hub.code + ' · ' + hub.iata + '</p>' +
          '<h3 class="np__name">Penang</h3>' +
          '<p class="np__lane">Every lane starts at our desk on the Butterworth waterfront.</p>' +
          '<div class="np__counts">' +
            ['ocean', 'air', 'land'].map((m) => '<div><b>' + portsFor(m).length + '</b><span>' + TAS.modes[m].label + ' lanes</span></div>').join('') +
          '</div>' +
          '<p class="np__hint">Select a port on the map or from the list to trace the lane, transit time and distance.</p></div>';
        return;
      }
      const p = portByCode(state.sel), m = p[mode], dist = distance(p, mode);
      const distTxt = mode === 'ocean' ? dist.nm.toLocaleString() + ' nm' : dist.km.toLocaleString() + ' km';
      const lane = m.lane || (mode === 'air' ? 'Air freight via ' + m.iata : '');
      panel.innerHTML =
        '<div class="np"><p class="np__code">' + p.code + (mode === 'air' ? ' · ' + m.iata : '') + ' · ' + p.country.toUpperCase() + '</p>' +
        '<h3 class="np__name">' + p.name + '</h3>' +
        '<p class="np__lane">' + p.region + (lane ? ' · ' + lane : '') + '</p>' +
        '<p class="np__big">' + (m.days[0] === m.days[1] ? m.days[0] : m.days[0] + '–' + m.days[1]) + '<small>days transit</small></p>' +
        '<dl class="np__dl">' +
          '<div><dt>From</dt><dd>' + TAS.modes[mode].gateway + '</dd></div>' +
          '<div><dt>Distance</dt><dd>≈ ' + distTxt + '</dd></div>' +
          '<div><dt>Mode</dt><dd>' + TAS.modes[mode].label + '</dd></div>' +
        '</dl>' +
        '<button class="btn btn--primary" type="button" data-quote-lane>Price this lane <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></button></div>';
    }

    // Events
    function portFromEvent(e) { const n = e.target.closest('[data-code]'); return n && n.dataset.code; }

    gP.addEventListener('click', (e) => { const c = portFromEvent(e); if (c) select(c === state.sel ? null : c); });
    gP.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const c = portFromEvent(e); if (c) select(c); }
    });
    function showTip(node) {
      const code = node.dataset.code, p = portByCode(code), dot = node.querySelector('.dot');
      const r = dot.getBoundingClientRect(), w = wrap.getBoundingClientRect();
      tip.textContent = p.name + ' · ' + daysTxt(p[state.mode].days);
      tip.style.left = (r.left + r.width / 2 - w.left) + 'px';
      tip.style.top = (r.top - w.top) + 'px';
      tip.hidden = false;
      const route = routeEl(code); route && route.classList.add('is-hover');
    }
    function hideTip() { tip.hidden = true; gR.querySelectorAll('.is-hover').forEach((r) => r.classList.remove('is-hover')); }
    gP.addEventListener('pointerover', (e) => { const n = e.target.closest('.n-port'); if (n) showTip(n); });
    gP.addEventListener('pointerout', (e) => { if (e.target.closest('.n-port')) hideTip(); });
    gP.addEventListener('focusin', (e) => { const n = e.target.closest('.n-port'); if (n) showTip(n); });
    gP.addEventListener('focusout', hideTip);

    list.addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (b) select(b.dataset.code === state.sel ? null : b.dataset.code); });

    panel.addEventListener('click', (e) => {
      if (!e.target.closest('[data-quote-lane]')) return;
      if (TAS.quote) TAS.quote.prefill(state.mode, state.sel);
      document.getElementById('quote').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });

    function setMode(mode, focus) {
      state.mode = mode;
      modeBtns.forEach((b) => {
        const on = b.dataset.mode === mode;
        b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      });
      render();
    }
    modeBtns.forEach((b, i) => {
      b.addEventListener('click', () => setMode(b.dataset.mode));
      b.addEventListener('keydown', (e) => {
        const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        setMode(modeBtns[(i + d + modeBtns.length) % modeBtns.length].dataset.mode, true);
      });
    });

    render();
  }

  heroMap();
  netMap();
})();
