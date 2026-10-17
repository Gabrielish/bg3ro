(() => {
  'use strict';
  const banner = document.querySelector('.project-banner');
  const video = banner?.querySelector('.banner-video');
  const image = banner?.querySelector('.banner-art');
  const toggle = document.getElementById('banner-video-toggle');
  if (!video || !toggle) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  let userPaused = false, visible = true, failed = false;
  function syncButton() {
    const label = userPaused ? 'Pornește animația' : 'Oprește animația';
    toggle.textContent = label;
    toggle.setAttribute('aria-label', `${label} de fundal`);
  }
  function stopOnFailure() {
    failed = true; video.pause(); toggle.hidden = true;
    banner.classList.remove('video-loaded');
  }
  async function syncPlayback() {
    if (motion.matches || connection?.saveData || failed) {
      video.pause(); toggle.hidden = true; banner.classList.remove('video-loaded'); return;
    }
    if (userPaused || !visible || document.hidden) { video.pause(); return; }
    if (!video.src) { video.muted = true; video.src = video.dataset.src; }
    try { await video.play(); }
    catch (error) {
      // Visibility changes can interrupt a pending play without a media failure.
      if (error.name === 'AbortError') return;
      if (error.name === 'NotAllowedError') {
        userPaused = true; toggle.hidden = false; syncButton(); return;
      }
      stopOnFailure();
    }
  }
  video.addEventListener('playing', () => {
    if (motion.matches || connection?.saveData) { video.pause(); return; }
    banner.classList.add('video-loaded'); toggle.hidden = false; syncButton();
  });
  video.addEventListener('error', stopOnFailure);
  function imageFallback() {
    if (image.dataset.fallback) { const fallback = image.dataset.fallback; delete image.dataset.fallback; image.src = fallback; }
  }
  image?.addEventListener('error', imageFallback);
  if (image?.complete && !image.naturalWidth) imageFallback();
  toggle.addEventListener('click', () => { userPaused = !userPaused; syncButton(); syncPlayback(); });
  motion.addEventListener('change', syncPlayback);
  connection?.addEventListener?.('change', syncPlayback);
  document.addEventListener('visibilitychange', syncPlayback);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting; syncPlayback();
  }).observe(banner);
  syncPlayback();
})();
