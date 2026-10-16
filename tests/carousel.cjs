const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const url = process.env.BG3RO_TEST_URL || 'http://127.0.0.1:4173';
  await page.goto(url, { waitUntil: 'networkidle' });
  const section = page.locator('#acord');
  const dots = page.locator('.feature-dot');
  const next = page.locator('.feature-arrow.next');
  const previous = page.locator('.feature-arrow.previous');
  async function check(index) {
    await page.waitForTimeout(510);
    assert.equal(await page.locator('.feature-slide:not([hidden])').count(), 1);
    assert.equal(await dots.nth(index).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.feature-slide').nth(index).getAttribute('aria-hidden'), 'false');
    assert.equal(await page.locator('.feature-slide').nth(index).evaluate(el => el.inert), false);
    for (let i = 0; i < 3; i++) if (i !== index) {
      assert.equal(await page.locator('.feature-slide').nth(i).evaluate(el => el.inert), true);
    }
  }
  await section.scrollIntoViewIfNeeded();
  await check(0);
  await section.screenshot({ path: path.join(__dirname, '../.qa/carousel-combat.png') });
  const initialNavY = await next.evaluate(el => el.getBoundingClientRect().top + scrollY);
  await next.click(); await check(1);
  assert.equal(await page.locator('#feature-items .item-equipped').allTextContents().then(a => a.join('/')), 'Echipat/Echipată/Echipați/Echipate');
  assert(Math.abs(await next.evaluate(el => el.getBoundingClientRect().top + scrollY) - initialNavY) < 2, 'Navigation stays fixed between slides');
  await section.screenshot({ path: path.join(__dirname, '../.qa/carousel-items.png') });
  await next.click(); await check(2);
  await section.screenshot({ path: path.join(__dirname, '../.qa/carousel-dialogue.png') });
  await next.click(); await check(0);
  await previous.click(); await check(2);
  await dots.nth(1).click(); await check(1);
  await dots.nth(1).focus(); await page.keyboard.press('Home'); await check(0);
  await page.keyboard.press('ArrowRight'); await check(1);
  await page.keyboard.press('End'); await check(2);
  // Rapid choices cancel old animations without leaving an old panel visible.
  await page.evaluate(() => { for (let i = 0; i < 7; i++) document.querySelector('.feature-arrow.next').click(); });
  await check(0);
  for (const width of [320, 390, 768, 820, 1024]) {
    await page.setViewportSize({ width, height: 844 });
    for (let i = 0; i < 3; i++) {
      await dots.nth(i).click(); await check(i);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `No overflow at ${width}, slide ${i}`);
    }
    if (width === 390) await section.screenshot({ path: path.join(__dirname, '../.qa/carousel-mobile.png') });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.feature-stage').dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: 1, clientX: 280, clientY: 200 });
  await page.locator('.feature-stage').dispatchEvent('pointerup', { pointerType: 'touch', pointerId: 1, clientX: 90, clientY: 205 });
  await check(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await next.click();
  assert.equal(await page.locator('.feature-slide:not([hidden])').count(), 1);
  assert.equal(await section.evaluate(el => el.getAnimations({ subtree: true }).length), 0);
  const noJS = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await noJS.goto(url);
  assert.equal(await noJS.locator('.feature-slide:not([hidden])').count(), 3, 'All examples readable without JS');
  assert.equal(await noJS.locator('.feature-navigation').isVisible(), false);
  assert.deepEqual(errors, []);
  await browser.close();
  console.log('PASS: carousel arrows, wrap, dots, keyboard, rapid clicks, fixed desktop controls, five responsive widths, swipe, reduced motion, no-JS.');
})().catch(error => { console.error(error); process.exitCode = 1; });
