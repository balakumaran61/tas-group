/* Ocean / Air / Land explorer: tabs, illustration swap, profile meters, door-to-door chain. */
(function () {
  const tabs = [...document.querySelectorAll('.mtab')];
  if (!tabs.length) return;
  const ink = document.querySelector('.explorer__ink');
  const chain = document.getElementById('chain');
  const caption = document.getElementById('stageCaption');

  const CHAINS = {
    ocean: { main: 3, steps: ['Factory pickup', 'Port haulage', 'Penang Port', 'Ocean leg', 'Destination port', 'Customs', 'Delivery'] },
    air:   { main: 3, steps: ['Factory pickup', 'Screening', 'PEN airport', 'Air leg', 'Destination airport', 'Customs', 'Delivery'] },
    land:  { main: 3, steps: ['Factory pickup', 'Loading', 'Border clearance', 'Road leg', 'Cross-dock', 'Delivery'] }
  };

  // Build the 5-segment meters once
  document.querySelectorAll('.meter i').forEach((m) => {
    for (let i = 0; i < 5; i++) m.appendChild(document.createElement('b'));
  });
  function fillMeters(panel) {
    panel.querySelectorAll('.meter i').forEach((m) => {
      const v = +m.dataset.v;
      [...m.children].forEach((b, i) => {
        b.classList.remove('on');
        b.style.transitionDelay = (i * 70) + 'ms';
        requestAnimationFrame(() => requestAnimationFrame(() => b.classList.toggle('on', i < v)));
      });
    });
  }

  function moveInk(tab) {
    ink.style.width = tab.offsetWidth + 'px';
    ink.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
  }

  function renderChain(mode) {
    const c = CHAINS[mode];
    chain.innerHTML = c.steps.map((s, i) =>
      '<li class="chain__node' + (i === c.main ? ' is-main' : '') + '" style="animation-delay:' + (i * 60) + 'ms">' + s + '</li>').join('') +
      '<span class="chain__pulse" aria-hidden="true"></span>';
  }

  let current = 'ocean';
  function activate(tab, focus) {
    const mode = tab.dataset.mode;
    tabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.hidden = !on;
      panel.classList.toggle('is-active', on);
      if (on) fillMeters(panel);
    });
    if (focus) tab.focus();
    moveInk(tab);
    if (mode !== current) {
      const prev = document.querySelector('.illo[data-illo="' + current + '"]');
      const next = document.querySelector('.illo[data-illo="' + mode + '"]');
      prev.classList.remove('is-active'); prev.classList.add('is-leaving');
      setTimeout(() => prev.classList.remove('is-leaving'), 500);
      next.classList.add('is-active');
      current = mode;
    }
    caption.textContent = 'Gateway: ' + TAS.modes[mode].gateway;
    renderChain(mode);
  }

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => activate(t));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (e.key === 'Home') { e.preventDefault(); activate(tabs[0], true); }
      if (e.key === 'End') { e.preventDefault(); activate(tabs[tabs.length - 1], true); }
      if (!d) return;
      e.preventDefault();
      activate(tabs[(i + d + tabs.length) % tabs.length], true);
    });
  });
  window.addEventListener('resize', () => moveInk(tabs.find((t) => t.classList.contains('is-active'))));
  // Fonts change tab widths, so re-measure once they load
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveInk(tabs.find((t) => t.classList.contains('is-active'))));

  activate(tabs[0]);
})();
