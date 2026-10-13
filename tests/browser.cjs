const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.BG3RO_BROWSER || 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const url = process.env.BG3RO_TEST_URL || 'http://127.0.0.1:4173';
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.title(), 'Baldur’s Gate 3 — în limba română');
  assert.equal(await page.locator('html').getAttribute('lang'), 'ro');
  assert(await page.locator('.hero-art').evaluate(img => img.complete && img.naturalWidth > 0));
  assert.equal(await page.locator('.embers .ember').count(), 14, 'Keep the original fireflies');
  assert.equal(await page.locator('.ornate-frame').count(), 4);
  assert(await page.locator('.journal-wrap').evaluate(el => getComputedStyle(el, '::before').backgroundImage.includes('corner-small-left-top.svg')));
  assert(!(await page.locator('#instalare').evaluate(el => getComputedStyle(el, '::before').backgroundImage)).includes('url('), 'Closing section stays image-free');
  assert(await page.locator('.brand').evaluate(el => getComputedStyle(el).fontFamily.includes('Cinzel')));
  assert.equal(await page.locator('.dot-grid i').count(), 9);
  assert.equal(await page.locator('.menu-toggle').isVisible(), false, 'No phone menu on desktop');
  assert.equal(await page.locator('.hero-actions .button').count(), 1);
  for (const selector of ['.hero-actions .button-gold', '.nav-download']) {
    const button = page.locator(selector).first();
    assert.equal(await button.evaluate(el => getComputedStyle(el).clipPath), 'none');
    assert.equal(await button.evaluate(el => getComputedStyle(el).backdropFilter), 'none');
    assert(await button.evaluate(el => getComputedStyle(el, '::before').backgroundImage.includes('button-')));
    await button.hover();
    await page.waitForTimeout(250);
    assert.equal(await button.evaluate(el => getComputedStyle(el).transform), 'none');
    assert.equal(await button.evaluate(el => getComputedStyle(el, '::after').opacity), '1', 'Hover reveals the filled cream shape');
    assert(await button.evaluate(el => getComputedStyle(el, '::after').backgroundImage.includes('button-filled.svg')));
    if (selector.includes('hero-actions')) assert.equal(await button.evaluate(el => getComputedStyle(el).color), 'rgb(23, 21, 19)');
  }
  const navItem = page.locator('#navigation a[href="#proiect"]');
  await navItem.hover();
  await page.waitForTimeout(250);
  assert.equal(await navItem.evaluate(el => getComputedStyle(el, '::after').opacity), '1');
  for (const [id, name] of [['gale', 'GALE'], ['astarion', 'ASTARION'], ['laezel', 'LAE’ZEL'], ['wyll', 'WYLL'], ['karlach', 'KARLACH'], ['shadowheart', 'SHADOWHEART']]) {
    await page.locator(`[data-companion="${id}"]`).click();
    await page.waitForFunction(expected => document.getElementById('companion-name').textContent === expected, name);
    assert((await page.locator('.companion-art').getAttribute('src')).endsWith(`hero-${id}.png`));
    assert((await page.locator('.companion-backdrop').getAttribute('src')).endsWith(`bg-${id}.png`));
    assert.equal(await page.locator(`[data-companion="${id}"]`).getAttribute('aria-pressed'), 'true');
  }
  await page.locator('[data-companion="gale"]').focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => document.getElementById('companion-name').textContent === 'ASTARION');
  await page.locator('[data-companion="shadowheart"]').click();
  await page.waitForFunction(() => document.getElementById('companion-name').textContent === 'SHADOWHEART');
  await page.locator('[data-gender="male"]').click();
  assert.equal(await page.locator('[data-line="heal"]').textContent(), 'l-a vindecat');
  assert.equal(await page.locator('[data-line="passive"]').textContent(), 'vindecat');
  assert.equal(await page.locator('[data-line="miss"]').textContent(), 'l-a ratat');
  await page.locator('[data-gender="female"]').click();
  assert.equal(await page.locator('[data-line="heal"]').textContent(), 'a vindecat-o');
  assert.equal(await page.locator('[data-line="passive"]').textContent(), 'vindecată');
  assert.equal(await page.locator('[data-line="miss"]').textContent(), 'a ratat-o');
  await page.locator('[data-topic="inventory"]').click();
  assert.equal(await page.locator('#topic-title').textContent(), 'Ordine firească, sens păstrat.');
  await page.locator('[data-topic="interface"]').click();
  assert.equal(await page.locator('#topic-title').textContent(), 'Înțelegi. Alegi. Continui.');
  await page.locator('[data-topic="dialog"]').click();
  await page.locator('details').first().locator('summary').click();
  assert(await page.locator('details').first().evaluate(el => el.open));
  await page.locator('details').first().locator('summary').click();
  const badAnchors = await page.locator('a[href^="#"]').evaluateAll(links => links.filter(link => !document.getElementById(link.hash.slice(1))).map(link => link.hash));
  assert.deepEqual(badAnchors, []);
  assert.equal(await page.locator('.button-gold').first().getAttribute('href'), 'https://www.nexusmods.com/baldursgate3/mods/24379');
  const output = path.join(__dirname, '..', '.qa');
  fs.mkdirSync(output, { recursive: true });
  // Reveal every section through actual scroll observation before the full-page image.
  for (const section of await page.locator('.reveal').all()) { await section.scrollIntoViewIfNeeded(); await page.waitForTimeout(70); }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(output, 'desktop.png'), fullPage: true });
  await page.screenshot({ path: path.join(output, 'hero-desktop.png') });
  await page.locator('[data-companion="gale"]').click();
  await page.waitForFunction(() => document.getElementById('companion-name').textContent === 'GALE');
  await page.locator('#detalii').screenshot({ path: path.join(output, 'companions-desktop.png') });
  await page.locator('[data-companion="shadowheart"]').click();
  await page.waitForFunction(() => document.getElementById('companion-name').textContent === 'SHADOWHEART');
  assert(await page.locator('.companion-art').evaluate(img => img.complete && img.naturalWidth > 0), 'Official companion artwork must load during QA');

  for (const width of [390, 320, 768, 781, 820, 980, 1024]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(url, { waitUntil: 'networkidle' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert(overflow <= 1, `Horizontal overflow at ${width}px: ${overflow}`);
    if (width <= 768) {
      assert((await page.locator('.hero-actions .button-gold').boundingBox()).height <= 65, 'Mobile CTA must stay on one line');
      await page.locator('.menu-toggle').click();
      assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'true');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');
      await page.locator('.menu-toggle').click();
      await page.locator('#navigation a[href="#acord"]').click();
      assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');
    }
    if (width > 780) {
      assert.equal(await page.locator('.menu-toggle').isVisible(), false);
      assert.equal(await page.locator('#navigation').isVisible(), true, 'Desktop/tablet navbar stays visible');
    }
    if (width === 390) {
      for (const section of await page.locator('.reveal').all()) { await section.scrollIntoViewIfNeeded(); await page.waitForTimeout(70); }
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(output, 'mobile.png'), fullPage: true });
      await page.screenshot({ path: path.join(output, 'hero-mobile.png') });
      await page.locator('#detalii').screenshot({ path: path.join(output, 'companions-mobile.png') });
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.embers .ember').count(), 0);
  assert.equal(await page.locator('.reveal').first().evaluate(el => getComputedStyle(el).opacity), '1');
  const noJS = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await noJS.goto(url);
  assert.equal(await noJS.locator('.reveal').first().evaluate(el => getComputedStyle(el).opacity), '1');
  assert(await noJS.locator('.button-gold').first().isVisible());
  assert.deepEqual(errors, []);
  console.log('PASS: desktop; widths 320/390/768/1024; gender forms; topics; FAQ; menu keyboard; anchors; images; reduced motion; no-JS; no JS errors.');
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
