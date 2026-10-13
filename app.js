(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.site-header');
  const navigation = document.getElementById('navigation');
  const menu = document.querySelector('.menu-toggle');
  const progress = document.querySelector('.scroll-progress');
  const art = document.querySelector('.hero-art');
  let scheduled = false;

  function updateScroll() {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 30);
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
  reducedMotion.addEventListener('change', queueScroll);
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
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu(); menu.focus();
    }
  });

  // An illustrative, browser-local demo. This is NOT the game's mod logic.
  const forms = {
    female: { heal: 'a vindecat-o', passive: 'vindecată', miss: 'a ratat-o', explanation: 'vindecată · a vindecat-o · a ratat-o' },
    male: { heal: 'l-a vindecat', passive: 'vindecat', miss: 'l-a ratat', explanation: 'vindecat · l-a vindecat · l-a ratat' }
  };
  document.querySelectorAll('[data-gender]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-gender]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      const selected = forms[button.dataset.gender];
      Object.entries(selected).forEach(([key, value]) => {
        const line = document.querySelector(`[data-line="${key}"]`);
        line.textContent = value;
        line.classList.remove('pulse-text');
        requestAnimationFrame(() => line.classList.add('pulse-text'));
      });
    });
  });

  const topics = {
    dialog: ['FIECARE REPLICĂ ARE UN CONTEXT', 'O voce, nu o traducere mecanică.', 'Dialogurile sunt traduse manual și revizuite pentru ton, sens și acord. Obiectivul este ca personajele să rămână ele însele, și în română.'],
    inventory: ['DETALII MICI. O DIFERENȚĂ REALĂ.', 'Ordine firească, sens păstrat.', 'Numele obiectelor, etichetele de raritate și starea „echipat” merită aceeași atenție ca dialogurile. Lucrăm la formulări clare și consecvente, nu doar la cuvinte înlocuite.'],
    interface: ['MAI PUȚINĂ FRICȚIUNE. MAI MULT JOC.', 'Înțelegi. Alegi. Continui.', 'Meniuri, descrieri de vrăji și indicii de interfață cu terminologie coerentă. O traducere utilă trebuie să te ajute să înțelegi și mecanicile, nu doar povestea.']
  };
  document.querySelectorAll('[data-topic]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-topic]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      const [kicker, title, body] = topics[button.dataset.topic];
      document.getElementById('topic-kicker').textContent = kicker;
      document.getElementById('topic-title').textContent = title;
      document.getElementById('topic-text').textContent = body;
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
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navigation.querySelectorAll('a[href^="#"]').forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
        }
      });
    }, { rootMargin: '-15% 0px -60% 0px' });
    ['proiect', 'acord', 'parcurs', 'instalare'].forEach(id => navObserver.observe(document.getElementById(id)));
  }
  if (!reducedMotion.matches) {
    const embers = document.querySelector('.embers');
    for (let i = 0; i < 14; i++) {
      const spark = document.createElement('span');
      spark.className = 'ember';
      spark.style.setProperty('--left', `${25 + (i * 17 % 60)}%`);
      spark.style.setProperty('--duration', `${5 + i % 5}s`);
      spark.style.setProperty('--delay', `${-i * 0.8}s`);
      embers.appendChild(spark);
    }
  }
  const companion = document.querySelector('.companion-art');
  companion.addEventListener('error', () => { companion.hidden = true; });
})();
