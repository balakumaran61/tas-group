/* Four-step freight estimate: mode → route → cargo → indicative price, transit and CO2. */
(function () {
  const form = document.getElementById('quoteForm');
  if (!form) return;
  const $ = (s) => form.querySelector(s);
  const $$ = (s) => [...form.querySelectorAll(s)];
  const R = TAS.rates, G = TAS.geo, hub = TAS.hub;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const steps = $$('.qstep');
  const rail = [...document.querySelectorAll('#qrail li')];
  const back = document.getElementById('qBack'), next = document.getElementById('qNext');
  const count = document.getElementById('qCount');
  const dest = $('#qDest'), destLabel = document.getElementById('qDestLabel');
  const routeBox = $('#qRoute'), result = $('#qResult');
  let step = 1;

  const num = (id) => Math.max(0, parseFloat(document.getElementById(id).value) || 0);
  const radio = (name) => (form.querySelector('input[name="' + name + '"]:checked') || {}).value;
  const fmt = (n, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const usd = (n) => 'USD ' + fmt(n);
  const days = (d) => (d[0] === d[1] ? d[0] : d[0] + '–' + d[1]) + (d[1] === 1 ? ' day' : ' days');
  const ICON = { ocean: 'i-ship', air: 'i-plane', land: 'i-truck' };

  /* ---------- Step 2: destinations ---------- */
  function fillDestinations() {
    const mode = radio('mode'), keep = dest.value;
    const ports = G.portsFor(mode);
    const regions = [...new Set(ports.map((p) => p.region))];
    dest.innerHTML = regions.map((r) =>
      '<optgroup label="' + r + '">' +
      ports.filter((p) => p.region === r).map((p) =>
        '<option value="' + p.code + '">' + p.name + ' · ' + (mode === 'air' ? p.air.iata : p.code) + '</option>').join('') +
      '</optgroup>').join('');
    if (ports.some((p) => p.code === keep)) dest.value = keep;
    else dest.value = (ports.find((p) => p.code === (mode === 'land' ? 'SGSIN' : 'NLRTM')) || ports[0]).code;
    // Reefer only makes sense for ocean here
    $('#qCargo option[value="reefer"]').disabled = mode !== 'ocean';
    if (mode !== 'ocean' && $('#qCargo').value === 'reefer') $('#qCargo').value = 'general';
  }

  function hubEnd(mode) {
    return mode === 'air' ? { b: 'Penang', s: 'PEN · MALAYSIA' } : mode === 'land' ? { b: 'Butterworth', s: 'MYPEN · MALAYSIA' } : { b: 'Penang', s: 'MYPEN · MALAYSIA' };
  }

  function renderRoute() {
    const mode = radio('mode'), p = G.portByCode(dest.value);
    if (!p) { routeBox.innerHTML = ''; return; }
    const imp = radio('dir') === 'import';
    destLabel.textContent = imp ? 'Origin' : 'Destination';
    const d = G.distance(p, mode), h = hubEnd(mode);
    const far = { b: p.name, s: (mode === 'air' ? p.air.iata : p.code) + ' · ' + p.country.toUpperCase() };
    const [a, b] = imp ? [far, h] : [h, far];
    routeBox.innerHTML =
      '<div class="rp__line"><div class="rp__end"><b>' + a.b + '</b><span>' + a.s + '</span></div>' +
      '<div class="rp__path"><svg class="ico"><use href="#' + ICON[mode] + '"/></svg></div>' +
      '<div class="rp__end rp__end--r"><b>' + b.b + '</b><span>' + b.s + '</span></div></div>' +
      '<div class="rp__meta"><span>Transit <b>' + days(p[mode].days) + '</b></span>' +
      '<span>Distance <b>≈ ' + (mode === 'ocean' ? fmt(d.nm) + ' nm' : fmt(d.km) + ' km') + '</b></span>' +
      (p[mode].lane ? '<span>Lane <b>' + p[mode].lane + '</b></span>' : '') + '</div>';
  }

  /* ---------- Step 3: cargo panels + live visuals ---------- */
  function showCargo() {
    const mode = radio('mode'), load = radio('load');
    $$('.cargo').forEach((c) => (c.hidden = c.dataset.for !== mode));
    $$('.sub').forEach((s) => (s.hidden = s.dataset.load !== load));
  }

  function vizFcl() {
    const type = radio('ctype'), qty = Math.max(1, Math.round(num('qQty'))), w = num('qFclW');
    const cls = type === '20GP' ? 'w20' : 'w40' + (type === '40HC' ? ' hc' : '');
    const shown = Math.min(qty, 12);
    let html = '';
    for (let i = 0; i < shown; i++) html += '<i class="' + cls + '" style="animation-delay:' + (i * 40) + 'ms"></i>';
    if (qty > shown) html += '<span>+' + (qty - shown) + ' more</span>';
    const max = R.fcl[type].maxT;
    html += '<span>' + qty + ' × ' + type + (w > max ? ' · <b style="color:#D7263D">over ' + max + ' t payload</b>' : '') + '</span>';
    document.getElementById('vizFcl').innerHTML = html;
  }

  function vizLcl() {
    const pcs = num('lPcs'), cbm = pcs * num('lL') * num('lW') * num('lH') / 1e6, kg = pcs * num('lKg');
    const pct = Math.min(100, cbm / R.fcl['20GP'].cbm * 100);
    document.getElementById('lclFill').style.width = pct + '%';
    document.getElementById('lclNote').innerHTML = '<b>' + fmt(cbm, 2) + ' m³</b> and <b>' + fmt(kg) + ' kg</b> fills about <b>' + Math.round(pct) + '%</b> of a 20′ container.' +
      (cbm > 15 ? ' At this volume a full container is often cheaper: try FCL.' : ' You only pay for your share.');
  }

  function vizAir() {
    const pcs = num('aPcs'), act = pcs * num('aKg'), vol = pcs * num('aL') * num('aW') * num('aH') / 6000;
    const max = Math.max(act, vol, 1);
    document.getElementById('barAct').style.width = (act / max * 100) + '%';
    document.getElementById('barVol').style.width = (vol / max * 100) + '%';
    document.getElementById('valAct').textContent = fmt(act) + ' kg';
    document.getElementById('valVol').textContent = fmt(vol) + ' kg';
    const bars = form.querySelectorAll('.wbar');
    bars[0].classList.toggle('is-charge', act >= vol);
    bars[1].classList.toggle('is-charge', vol > act);
    document.getElementById('airNote').innerHTML = 'Airlines charge the higher of the two: <b>' + fmt(Math.max(act, vol)) + ' kg chargeable</b>.' +
      (vol > act ? ' Bulky but light: tighter packing would cut the cost.' : '');
  }

  const trailer = document.getElementById('trailer');
  for (let i = 0; i < 26; i++) trailer.appendChild(document.createElement('i'));
  function vizLand() {
    const pal = Math.min(26, Math.max(0, Math.round(num('tPal'))));
    [...trailer.children].forEach((c, i) => c.classList.toggle('on', i < pal));
    document.getElementById('landNote').innerHTML = '<b>' + pal + ' of 26</b> pallet spaces. ' +
      (pal >= R.land.ftlPallets ? 'Full-truckload rate applies from ' + R.land.ftlPallets + ' pallets.' : 'Part load: you share the trailer and pay per pallet.');
  }

  function updateViz() { vizFcl(); vizLcl(); vizAir(); vizLand(); }

  /* ---------- Pricing model (indicative) ---------- */
  function compute() {
    const mode = radio('mode'), p = G.portByCode(dest.value), d = G.distance(p, mode);
    const cargo = $('#qCargo').value, mult = R.cargo[cargo];
    const lines = [];
    let freight, tonnes, desc;

    if (mode === 'ocean' && radio('load') === 'fcl') {
      const type = radio('ctype'), c = R.fcl[type], qty = Math.max(1, Math.round(num('qQty')));
      freight = (c.base + d.nm * c.perNm) * qty;
      lines.push(['Ocean freight', freight], ['Terminal handling', c.thc * qty]);
      tonnes = num('qFclW') * qty;
      desc = qty + ' × ' + type.replace('GP', '′ GP').replace('HC', '′ HC');
    } else if (mode === 'ocean') {
      const pcs = num('lPcs'), cbm = pcs * num('lL') * num('lW') * num('lH') / 1e6, t = pcs * num('lKg') / 1000;
      const wm = Math.max(cbm, t, R.lcl.minWM);
      freight = (R.lcl.base + d.nm * R.lcl.perNmPerWM) * wm;
      lines.push(['Ocean freight (LCL)', freight], ['CFS handling', R.lcl.cfsPerWM * wm]);
      tonnes = t;
      desc = fmt(cbm, 2) + ' m³ LCL';
    } else if (mode === 'air') {
      const pcs = num('aPcs'), act = pcs * num('aKg'), vol = pcs * num('aL') * num('aW') * num('aH') / 6000, ch = Math.max(act, vol);
      freight = Math.max(R.air.min, (R.air.base + d.km * R.air.perKmPerKg) * ch);
      lines.push(['Air freight', freight], ['Handling & screening', (R.air.handlingPerKg + R.air.screeningPerKg) * ch]);
      tonnes = act / 1000;
      desc = fmt(ch) + ' kg chargeable';
    } else {
      const pal = Math.max(1, Math.round(num('tPal'))), ftl = pal >= R.land.ftlPallets;
      freight = ftl ? R.land.ftlBase + d.km * R.land.ftlPerKm : pal * (R.land.palletBase + d.km * R.land.palletPerKm);
      lines.push([ftl ? 'Road freight (FTL)' : 'Road freight (LTL)', freight]);
      if (p.country !== 'Malaysia') lines.push(['Border clearance', R.land.border]);
      tonnes = num('tKg') / 1000;
      desc = ftl ? 'Full truckload' : pal + ' pallets';
    }
    if (mult > 1) lines.push([cargo === 'dg' ? 'Dangerous goods surcharge' : 'Reefer surcharge', freight * (mult - 1)]);
    lines.push(['Documentation', R.docs], ['Customs clearance', R.customs]);

    const total = lines.reduce((s, l) => s + l[1], 0);
    const round = (v) => Math.round(v / 10) * 10;
    const co2 = ['ocean', 'air', 'land'].filter((m) => p[m]).map((m) => ({ m, kg: tonnes * G.distance(p, m).km * R.co2[m] }));
    return { mode, p, d, lines, total, lo: round(total * .9), hi: round(total * 1.12), tonnes, desc, co2 };
  }

  function renderResult() {
    const r = compute(), imp = radio('dir') === 'import';
    const route = imp ? r.p.name + ' → Penang' : 'Penang → ' + r.p.name;
    const me = r.co2.find((c) => c.m === r.mode);
    const maxCo2 = Math.max(...r.co2.map((c) => c.kg), 1);
    const kgTxt = (v) => (v >= 1000 ? fmt(v / 1000, 1) + ' t' : fmt(v) + ' kg');
    result.innerHTML =
      '<p class="res__label">Indicative all-in estimate</p>' +
      '<p class="res__price">' + usd(r.lo) + ' <span>–</span> ' + fmt(r.hi) + '</p>' +
      '<p class="res__sub">' + route + ' · ' + r.desc + ' · ' + TAS.modes[r.mode].label + '</p>' +
      '<div class="res__kpis">' +
        '<div class="res__kpi"><svg class="ico"><use href="#i-clock"/></svg><b>' + days(r.p[r.mode].days) + '</b><span>Transit</span></div>' +
        '<div class="res__kpi"><svg class="ico"><use href="#i-route"/></svg><b>' + (r.mode === 'ocean' ? fmt(r.d.nm) + ' nm' : fmt(r.d.km) + ' km') + '</b><span>Distance</span></div>' +
        '<div class="res__kpi"><svg class="ico"><use href="#i-leaf"/></svg><b>' + kgTxt(me.kg) + '</b><span>CO₂e est.</span></div>' +
      '</div>' +
      '<div class="res__cols">' +
        '<div><p class="res__h">Breakdown (mid-point)</p><dl class="res__break">' +
          r.lines.map((l) => '<div><dt>' + l[0] + '</dt><dd>' + fmt(l[1]) + '</dd></div>').join('') +
          '<div class="tot"><dt>Total</dt><dd>' + usd(Math.round(r.total)) + '</dd></div></dl></div>' +
        '<div><p class="res__h">Same cargo, other modes: CO₂e</p><div class="co2">' +
          r.co2.map((c) => '<div class="' + (c.m === r.mode ? 'me' : '') + '"><span>' + TAS.modes[c.m].label + '</span><i data-w="' + (c.kg / maxCo2 * 100) + '"></i><b>' + kgTxt(c.kg) + '</b></div>').join('') +
        '</div></div>' +
      '</div>' +
      '<div class="res__actions">' +
        '<button class="btn btn--primary" type="button" id="qFirm">Request a firm quote <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></button>' +
        '<button class="btn btn--line" type="button" id="qRestart">Start over</button>' +
      '</div>' +
      '<p class="res__disc">Indicative only. Based on a sample tariff, excludes duties and taxes, and assumes standard cargo dimensions. Final rates depend on carrier space and date of shipment.</p>';
    requestAnimationFrame(() => requestAnimationFrame(() =>
      result.querySelectorAll('.co2 i').forEach((i) => (i.style.width = Math.max(2, i.dataset.w) + '%'))));

    document.getElementById('qFirm').addEventListener('click', () => {
      const msg = 'Estimate: ' + usd(r.lo) + '–' + fmt(r.hi) + '\nRoute: ' + route + ' (' + TAS.modes[r.mode].label + ')\nCargo: ' + r.desc + ', ' + $('#qCargo').selectedOptions[0].text;
      TAS.ui.openEnquiry('Freight quote', msg);
    });
    document.getElementById('qRestart').addEventListener('click', () => go(1));
  }

  /* ---------- Navigation ---------- */
  function valid(n) {
    if (n === 2) return !!dest.value;
    if (n === 3) {
      const mode = radio('mode'), load = radio('load');
      const ids = mode === 'air' ? ['aPcs', 'aL', 'aW', 'aH', 'aKg'] : mode === 'land' ? ['tPal', 'tKg'] : load === 'fcl' ? ['qQty', 'qFclW'] : ['lPcs', 'lL', 'lW', 'lH', 'lKg'];
      let ok = true;
      ids.forEach((id) => {
        const el = document.getElementById(id), bad = !(parseFloat(el.value) > 0);
        el.setAttribute('aria-invalid', bad);
        if (bad && ok) { el.focus(); ok = false; }
      });
      return ok;
    }
    return true;
  }

  function go(n) {
    step = n;
    steps.forEach((s) => s.classList.toggle('is-active', +s.dataset.step === n));
    rail.forEach((li, i) => { li.classList.toggle('is-active', i + 1 === n); li.classList.toggle('is-done', i + 1 < n); });
    back.disabled = n === 1;
    next.innerHTML = n === 3 ? 'See estimate <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg>' : 'Next <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg>';
    form.classList.toggle('is-result', n === 4);
    count.textContent = 'Step ' + n + ' of 4';
    if (n === 2) renderRoute();
    if (n === 3) { showCargo(); updateViz(); }
    if (n === 4) renderResult();
    const top = form.getBoundingClientRect().top;
    if (top < 60) window.scrollBy({ top: top - 100, behavior: reduce ? 'auto' : 'smooth' });
  }

  next.addEventListener('click', () => { if (step < 4 && valid(step)) go(step + 1); });
  back.addEventListener('click', () => { if (step > 1) go(step - 1); });

  form.addEventListener('change', (e) => {
    const n = e.target.name;
    if (n === 'mode') { fillDestinations(); showCargo(); }
    if (n === 'mode' || n === 'dest' || n === 'dir') renderRoute();
    if (n === 'load') showCargo();
    updateViz();
  });
  form.addEventListener('input', (e) => { e.target.removeAttribute('aria-invalid'); updateViz(); });
  form.addEventListener('submit', (e) => e.preventDefault());
  // Enter in a field advances the form instead of submitting
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && step < 4) { e.preventDefault(); next.click(); }
  });

  form.querySelectorAll('.stepper').forEach((st) => {
    const input = st.querySelector('input');
    st.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const d = b.hasAttribute('data-inc') ? 1 : -1;
      const v = Math.min(+input.max || 999, Math.max(+input.min || 0, (parseInt(input.value, 10) || 0) + d));
      input.value = v;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  /* Called from the network map's "Price this lane" */
  function prefill(mode, code) {
    const r = form.querySelector('input[name="mode"][value="' + mode + '"]');
    if (r) r.checked = true;
    fillDestinations();
    if (code && G.portByCode(code)[mode]) dest.value = code;
    renderRoute();
    go(3);
  }

  fillDestinations();
  updateViz();
  TAS.quote = { prefill };
})();
