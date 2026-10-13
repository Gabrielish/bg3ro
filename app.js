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
    if (y < document.querySelector('.hero').offsetHeight - 150) {
      navigation.querySelectorAll('a.active').forEach(link => link.classList.remove('active'));
    }
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
  const backdrop = document.querySelector('.companion-backdrop');
  const voices = document.querySelector('.voices');
  const companions = {
    shadowheart: ['Shadowheart', 'Între credință și îndoială', 'Nuanțele unei replici contează la fel de mult ca sensul ei.', '#af909c'],
    gale: ['Gale', 'Magie, ambiție și cuvinte alese', 'O voce erudită merită o traducere care îi păstrează eleganța.', '#689ac9'],
    astarion: ['Astarion', 'Farmecul stă și în subtext', 'Ironia nu se traduce mecanic. Se înțelege în context.', '#c0a08b'],
    laezel: ['Lae’zel', 'Directă. Hotărâtă. Fără ocolișuri.', 'O replică fermă trebuie să rămână fermă și în română.', '#a3ad80'],
    wyll: ['Wyll', 'Curajul are propria voce', 'Păstrăm intenția din spatele cuvintelor, nu doar forma lor.', '#a2b4c2'],
    karlach: ['Karlach', 'Energie care trece dincolo de cuvinte', 'Spontaneitatea și căldura unei voci merită păstrate.', '#dc916d']
  };
  let selectionRequest = 0;
  function loadArt(src) {
    return new Promise(resolve => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }
  async function selectCompanion(button) {
    const id = button.dataset.companion;
    const request = ++selectionRequest;
    const [name, role, note, accent] = companions[id];
    document.querySelectorAll('[data-companion]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    voices.classList.add('switching');
    const [newArt, newBackdrop] = await Promise.all([
      loadArt(`https://baldursgate3.game/heros/hero-${id}.png`),
      loadArt(`https://baldursgate3.game/heros/bg-${id}.png`)
    ]);
    if (request !== selectionRequest) return; // Rapid choices cannot show an older response.
    if (newArt) { companion.src = newArt.src; companion.hidden = false; }
    else { companion.hidden = true; }
    if (newBackdrop) { backdrop.src = newBackdrop.src; backdrop.hidden = false; }
    else { backdrop.hidden = true; }
    companion.alt = `Ilustrație oficială a personajului ${name}`;
    document.getElementById('companion-name').textContent = name.toLocaleUpperCase('ro');
    document.getElementById('companion-role').textContent = role;
    document.getElementById('companion-note').textContent = note;
    voices.style.setProperty('--companion-accent', accent);
    voices.classList.remove('switching');
  }
  document.querySelectorAll('[data-companion]').forEach(button => {
    button.addEventListener('click', () => selectCompanion(button));
  });
  const picker = document.querySelector('.companion-picker');
  picker.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    const buttons = [...picker.querySelectorAll('button')];
    const index = buttons.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    let next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 :
      (index + (['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1) + buttons.length) % buttons.length;
    buttons[next].focus(); buttons[next].click();
  });
  companion.addEventListener('error', () => { companion.hidden = true; });
  backdrop.addEventListener('error', () => { backdrop.hidden = true; });
})();
