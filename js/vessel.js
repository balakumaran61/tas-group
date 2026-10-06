/* "A vessel calls at Penang": scroll position drives the ship through six stages of a port call. */
(function () {
  const section = document.getElementById('vessel');
  if (!section) return;
  const NS = 'http://www.w3.org/2000/svg';
  const scene = document.getElementById('vscene');
  const ship = document.getElementById('vsShip');
  const name = ship.querySelector('.name');
  const pilot = document.getElementById('vsPilot');
  const van = document.getElementById('vsVan');
  const stamp = document.getElementById('vsStamp');
  const bar = document.getElementById('vsBar');
  const status = document.getElementById('vsStatus');
  const time = document.getElementById('vsTime');
  const steps = [...document.querySelectorAll('.vstep')];
  const stepsWrap = document.getElementById('vsteps');

  const COLORS = ['#FF5A1F', '#2BB3A8', '#5B6B7A', '#C9B79C', '#9E3B26', '#DCE3E8', '#1F7A7A'];
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const pick = () => COLORS[Math.floor(rnd() * COLORS.length)];

  function rect(attrs, parent) {
    const r = document.createElementNS(NS, 'rect');
    for (const k in attrs) r.setAttribute(k, attrs[k]);
    parent.appendChild(r);
    return r;
  }

  // Deck cargo: three tiers, tapering towards the bow
  const boxes = document.getElementById('vsBoxes');
  const swaps = [];
  [[334, 48], [316, 66], [298, 96]].forEach(([y, x0], tier) => {
    for (let x = x0; x + 28 <= 348; x += 29) {
      const from = pick(), r = rect({ x, y, width: 28, height: 18, fill: from }, boxes);
      if (tier > 0 && rnd() < .45) swaps.push({ r, from, to: pick() });
    }
  });

  // Stacks on the quay
  const stacks = document.getElementById('vsStacks');
  [[8, 4], [470, 5]].forEach(([x0, cols]) => {
    for (let c = 0; c < cols; c++) {
      const h = 1 + Math.floor(rnd() * 3);
      for (let r = 0; r < h; r++) rect({ x: x0 + c * 31, y: 314 - r * 16, width: 30, height: 16, fill: pick() }, stacks);
    }
  });

  const smooth = (t) => t * t * (3 - 2 * t);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  // Ship x position keyframes against overall progress
  const KF = [[0, 760], [0.12, 720], [0.31, 112], [0.84, 112], [1, 1140]];
  function shipX(p) {
    for (let i = 1; i < KF.length; i++) {
      if (p <= KF[i][0]) {
        const [p0, x0] = KF[i - 1], [p1, x1] = KF[i];
        return x0 + (x1 - x0) * smooth((p - p0) / (p1 - p0));
      }
    }
    return KF[KF.length - 1][1];
  }

  let active = -1;
  function setStep(i) {
    if (i === active) return;
    active = i;
    steps.forEach((s, j) => {
      s.classList.toggle('is-active', j === i);
      s.classList.toggle('is-past', j < i);
    });
    scene.dataset.stage = i + 1;
    status.textContent = steps[i].dataset.status;
    time.textContent = steps[i].dataset.time;
  }

  function fitSteps() {
    let h = 0;
    steps.forEach((s) => (h = Math.max(h, s.offsetHeight)));
    stepsWrap.style.minHeight = h + 'px';
  }

  let raf = null;
  function update() {
    raf = null;
    const r = section.getBoundingClientRect();
    const total = section.offsetHeight - window.innerHeight;
    const p = clamp(-r.top / total);

    setStep(Math.min(steps.length - 1, Math.floor(p * steps.length)));
    bar.style.width = (p * 100) + '%';

    const x = shipX(p);
    const leaving = p > 0.84;
    ship.setAttribute('transform', leaving ? `translate(${x + 424} 0) scale(-1 1)` : `translate(${x} 0)`);
    name.style.opacity = leaving ? 0 : 1;

    // Pilot boat runs alongside the bow during pilotage
    const pilotOn = p > 0.13 && p < 0.3;
    pilot.style.opacity = pilotOn ? 1 : 0;
    pilot.setAttribute('transform', `translate(${x - 74} ${Math.sin(p * 120) * 2})`);

    // Cargo operations: some boxes lifted off, then new ones loaded
    const t = clamp((p - 2 / 6) * 6);
    swaps.forEach((s, k) => {
      const n = swaps.length, off = (k + .5) / n / 2;
      const out = t > off && t < .5 + off;
      s.r.classList.toggle('is-out', out);
      s.r.setAttribute('fill', t >= .5 + off ? s.to : s.from);
    });

    // Stores truck arrives during husbandry, leaves before sailing
    let vx = -100;
    if (p > 0.5 && p < 0.75) vx = p < 0.58 ? -100 + 652 * smooth((p - 0.5) / 0.08) : p > 0.68 ? 552 - 652 * smooth((p - 0.68) / 0.07) : 552;
    van.setAttribute('transform', `translate(${vx} 0)`);

    stamp.classList.toggle('is-on', p > 0.667 && p < 0.84);
  }
  function onScroll() { if (!raf) raf = requestAnimationFrame(update); }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { fitSteps(); onScroll(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitSteps);
  fitSteps();
  update();
})();
