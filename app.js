(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.site-header');
  const navigation = document.getElementById('navigation');
  const menu = document.querySelector('.menu-toggle');
  const progress = document.querySelector('.scroll-progress');
  const art = document.querySelector('.hero-art');
  const navSections = ['proiect', 'acord', 'instalare', 'feedback'].map(id => document.getElementById(id));
  let scheduled = false;

  function updateActiveSection() {
    const anchorInset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const activationLine = Math.max(header.getBoundingClientRect().bottom, anchorInset) + Math.min(160, innerHeight * .18);
    let activeId = null;
    for (const section of navSections) {
      // Match each anchor's visible content inset, not its padded outer box.
      const inset = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
      if (section.getBoundingClientRect().top - inset <= activationLine) activeId = section.id;
    }
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 2) activeId = 'feedback';
    navigation.querySelectorAll('a[href^="#"]').forEach(link => {
      const active = link.hash === `#${activeId}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  function updateScroll() {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 30);
    updateActiveSection();
    const available = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${available > 0 ? Math.min(y / available, 1) : 0})`;
    if (!reducedMotion.matches && window.innerWidth > 780 && y < 1100) {
      art.style.transform = `translateY(${Math.min(y * 0.16, 130)}px) scale(1.025)`;
    } else if (reducedMotion.matches || window.innerWidth <= 780) {
      art.style.transform = 'none';
    }
    scheduled = false;
  }
  function queueScroll() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateScroll); }
  }
  window.addEventListener('scroll', queueScroll, { passive: true });
  window.addEventListener('resize', queueScroll, { passive: true });
  window.addEventListener('hashchange', queueScroll);
  reducedMotion.addEventListener('change', queueScroll);
  if ('ResizeObserver' in window) new ResizeObserver(queueScroll).observe(document.querySelector('main'));
  document.fonts.ready.then(queueScroll);
  updateScroll();

  function closeMenu() {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Deschide meniul');
    navigation.classList.remove('open');
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Închide meniul' : 'Deschide meniul');
    navigation.classList.toggle('open', open);
    if (open) navigation.querySelector('a').focus();
  });
  document.addEventListener('click', event => {
    if (menu.getAttribute('aria-expanded') === 'true' && !header.contains(event.target)) closeMenu();
  });
  window.matchMedia('(max-width: 780px)').addEventListener('change', closeMenu);
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu(); menu.focus();
    }
  });

  // Browser-only examples, deliberately independent of any game or mod API.
  const tabs = [...document.querySelectorAll('.module-tabs [role="tab"]')];
  const panels = [...document.querySelectorAll('.module-panel')];
  const tabList = document.querySelector('.module-tabs');
  function selectModule(index, focus = false) {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[i].hidden = !active;
    });
    if (focus) tabs[index].focus();
  }
  if (tabs.length && panels.length === tabs.length) {
    tabList.hidden = false;
    document.querySelector('.mods-section').classList.add('modules-ready');
    selectModule(0);
    tabs.forEach((tab, index) => tab.addEventListener('click', () => selectModule(index)));
    tabList.addEventListener('keydown', event => {
      const current = tabs.indexOf(document.activeElement);
      if (current < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
        : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      selectModule(index, true);
    });
  }
  const search = document.getElementById('example-search');
  if (search) {
    const items = [...document.querySelectorAll('[data-example-item]')];
    const count = document.getElementById('example-count');
    const fold = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('ro');
    function searchExample() {
      const query = fold(search.value.trim());
      let matches = 0;
      items.forEach(item => {
        item.hidden = !fold(item.dataset.exampleItem).includes(query);
        if (!item.hidden) matches++;
      });
      count.textContent = matches === 1 ? '1 obiect în exemplu' : `${matches} obiecte în exemplu`;
    }
    search.disabled = false;
    search.addEventListener('input', searchExample);
    searchExample();
  }
  const forms = {
    female: { passive: 'vindecată', heal: 'a vindecat-o' },
    male: { passive: 'vindecat', heal: 'l-a vindecat' }
  };
  document.querySelectorAll('[data-gender]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-gender]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      Object.entries(forms[button.dataset.gender]).forEach(([key, value]) => {
        document.querySelector(`[data-form="${key}"]`).textContent = value;
      });
    });
  });

  // Reveal only once; no polling, no render loop when the page is idle.
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
    document.documentElement.classList.add('js-enabled');
  }
  if (!reducedMotion.matches) {
    const embers = document.querySelector('.embers');
    const count = window.innerWidth <= 780 ? 22 : 34;
    for (let i = 0; i < count; i++) {
      const spark = document.createElement('span');
      spark.className = 'ember';
      spark.style.setProperty('--left', `${2 + i * 96 / (count - 1)}%`);
      spark.style.setProperty('--top', `${22 + (i * 29 % 73)}%`);
      spark.style.setProperty('--size', `${2.5 + (i % 4) * 0.5}px`);
      spark.style.setProperty('--drift', `${(i % 2 ? -1 : 1) * (16 + i % 39)}px`);
      spark.style.setProperty('--lift', `${-(125 + i * 17 % 160)}px`);
      spark.style.setProperty('--duration', `${6.5 + (i % 7) * 0.7}s`);
      spark.style.setProperty('--delay', `${-i * 1.37}s`);
      embers.appendChild(spark);
    }
  }
})();
