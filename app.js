(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.site-header');
  const navigation = document.getElementById('navigation');
  const menu = document.querySelector('.menu-toggle');
  const progress = document.querySelector('.scroll-progress');
  const art = document.querySelector('.hero-art');
  const navSections = ['proiect', 'acord', 'parcurs', 'instalare'].map(id => document.getElementById(id));
  let scheduled = false;

  function updateActiveSection() {
    const anchorInset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const activationLine = Math.max(header.getBoundingClientRect().bottom, anchorInset) + 12;
    let activeId = null;
    for (const section of navSections) {
      if (section.getBoundingClientRect().top <= activationLine) activeId = section.id;
    }
    if (document.getElementById('sustinere').getBoundingClientRect().top <= activationLine) activeId = null;
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

  const carousel = document.querySelector('.feature-carousel');
  const stage = carousel.querySelector('.feature-stage');
  const slides = [...carousel.querySelectorAll('.feature-slide')];
  const dots = [...carousel.querySelectorAll('.feature-dot')];
  const announcement = carousel.querySelector('.feature-announcement');
  let currentSlide = 0;
  let transitionId = 0;
  let slideAnimations = [];
  function showSlide(index, direction = 1) {
    const next = (index + slides.length) % slides.length;
    if (next === currentSlide) return;
    const request = ++transitionId;
    slideAnimations.forEach(animation => animation.cancel());
    slideAnimations = [];
    const outgoing = slides[currentSlide];
    const incoming = slides[next];
    // Reset interrupted transitions before starting the latest choice.
    slides.forEach(slide => {
      slide.hidden = slide !== outgoing && slide !== incoming;
      slide.inert = slide !== incoming;
      slide.setAttribute('aria-hidden', String(slide !== incoming));
    });
    currentSlide = next;
    dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === next)));
    announcement.textContent = `Exemplul ${next + 1} din ${slides.length}: ${incoming.getAttribute('aria-label')}.`;
    const finish = () => {
      if (request !== transitionId) return;
      outgoing.hidden = true;
      slideAnimations.forEach(animation => animation.cancel());
      slideAnimations = [];
    };
    if (reducedMotion.matches || !incoming.animate) { finish(); return; }
    const options = { duration: 460, easing: 'cubic-bezier(.22,.75,.25,1)', fill: 'both' };
    const exit = outgoing.animate([
      { opacity: 1, transform: 'translateX(0)' },
      { opacity: 0, transform: `translateX(${-direction * 35}px)` }
    ], options);
    const enter = incoming.animate([
      { opacity: 0, transform: `translateX(${direction * 55}px)` },
      { opacity: 1, transform: 'translateX(0)' }
    ], options);
    slideAnimations = [exit, enter];
    Promise.all(slideAnimations.map(animation => animation.finished)).then(finish).catch(() => {});
  }
  slides.forEach((slide, i) => {
    slide.hidden = i !== 0;
    slide.inert = i !== 0;
    slide.setAttribute('aria-hidden', String(i !== 0));
  });
  carousel.classList.add('carousel-ready');
  // Reserve the tallest example at this width so the arrows never jump.
  function sizeStage() {
    stage.style.minHeight = '0px';
    const states = slides.map(slide => ({ hidden: slide.hidden, visibility: slide.style.visibility }));
    slides.forEach(slide => { slide.style.visibility = 'hidden'; slide.hidden = false; });
    const height = stage.offsetHeight;
    slides.forEach((slide, i) => { slide.hidden = states[i].hidden; slide.style.visibility = states[i].visibility; });
    stage.style.minHeight = `${height}px`;
  }
  sizeStage();
  document.fonts.ready.then(sizeStage);
  let resizeFrame = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(sizeStage);
  }, { passive: true });
  carousel.querySelector('.previous').addEventListener('click', () => showSlide(currentSlide - 1, -1));
  carousel.querySelector('.next').addEventListener('click', () => showSlide(currentSlide + 1, 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => showSlide(i, i > currentSlide ? 1 : -1)));
  carousel.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') showSlide(0, -1);
    else if (event.key === 'End') showSlide(slides.length - 1, 1);
    else showSlide(currentSlide + (event.key === 'ArrowLeft' ? -1 : 1), event.key === 'ArrowLeft' ? -1 : 1);
  });
  let swipeStart = null;
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' || event.target.closest('button, a')) return;
    swipeStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  }, { passive: true });
  stage.addEventListener('pointerup', event => {
    if (!swipeStart || swipeStart.id !== event.pointerId) return;
    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) showSlide(currentSlide + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  }, { passive: true });
  stage.addEventListener('pointercancel', () => { swipeStart = null; }, { passive: true });
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    ++transitionId;
    slideAnimations.forEach(animation => animation.cancel());
    slideAnimations = [];
    slides.forEach((slide, i) => { slide.hidden = i !== currentSlide; });
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
