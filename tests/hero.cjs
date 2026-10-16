const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  const url = process.env.BG3RO_TEST_URL || 'http://127.0.0.1:4173/';
  fs.mkdirSync('.qa', { recursive: true });
  for (const [width, height] of [[320,568],[360,640],[375,667],[390,844],[430,932],[768,844],[1440,900]]) {
    await page.setViewportSize({ width, height });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.hero-art')).userSelect === 'none');
    assert.equal(await page.locator('.hero-art').evaluate(el => el.draggable), false);
    assert.equal(await page.locator('.hero-art').evaluate(el => getComputedStyle(el).userSelect), 'none');
    assert.equal(await page.locator('.hero-art').evaluate(el => getComputedStyle(el).pointerEvents), 'none');
    assert.notEqual(await page.locator('.hero-title').evaluate(el => getComputedStyle(el).userSelect), 'none', 'Only artwork selection is disabled');
    assert.equal(await page.locator('.scroll-cue svg').count(), 1);
    assert.equal(await page.locator('#scroll-mouse-gradient stop').first().getAttribute('stop-color'), '#DDC9A7');
    assert.equal(await page.locator('#scroll-mouse-gradient stop').last().getAttribute('stop-color'), '#B78F6D');
    assert.equal(await page.locator('.scroll-cue svg').evaluate(el => getComputedStyle(el).animationName), 'none', 'Mouse body stays still');
    assert.equal(await page.locator('.scroll-wheel').evaluate(el => getComputedStyle(el).animationName), 'scroll-wheel-hint');
    assert(await page.locator('.scroll-wheel').evaluate(el => {
      const animation = el.getAnimations()[0];
      animation.pause(); animation.currentTime = 0;
      const first = getComputedStyle(el).transform;
      animation.currentTime = 1380;
      const second = getComputedStyle(el).transform;
      animation.play();
      return first !== second;
    }), 'Only the inner line moves');
    const cue = await page.locator('.scroll-cue').boundingBox();
    assert(cue.width >= 44 && cue.height >= 44, 'Scroll cue keeps a touch-friendly target');
    const rects = await page.evaluate(() => {
      const box = selector => {
        const r = document.querySelector(selector).getBoundingClientRect();
        return { top:r.top, bottom:r.bottom, left:r.left, right:r.right };
      };
      return { art:box('.hero-art'), title:box('.hero-title'), cta:box('.hero-actions .button'), hero:box('.hero'), intro:box('.introduction'), status:box('.hero-topline') };
    });
    assert(rects.intro.top >= rects.hero.bottom - 1, 'Introduction must follow the hero');
    if (width <= 780) {
      assert.equal(rects.art.top, 0, 'No empty strip above mobile artwork');
      assert(rects.cta.bottom <= height - 35, `CTA visible in first screen at ${width}x${height}`);
      assert(rects.title.top > 100, 'Title does not overlap header or status');
      assert(rects.status.left >= 0 && rects.status.right <= width, 'Status fits mobile width');
      await page.locator('.menu-toggle').click();
      for (const link of await page.locator('#navigation a').all()) {
        const centered = await link.evaluate(el => {
          const r = el.getBoundingClientRect();
          return Math.abs((r.left + r.right) / 2 - innerWidth / 2) < 2;
        });
        assert(centered, 'Mobile menu links are centered');
      }
      if (width === 390) await page.screenshot({ path:'.qa/hero-menu-new.png' });
      await page.keyboard.press('Escape');
    }
    if ([320,390,1440].includes(width)) await page.screenshot({ path:`.qa/hero-new-${width}.png` });
    await page.evaluate(() => window.scrollTo({ top:document.querySelector('.hero').offsetHeight - 160, behavior:'instant' }));
    await page.waitForTimeout(200);
    assert(await page.locator('.hero').evaluate(el => getComputedStyle(el).isolation === 'isolate'));
  }
  await browser.close();
  console.log('PASS: hero CTA fits short/tall mobile screens; artwork starts at top; centered menu; separate intro.');
})().catch(error => { console.error(error); process.exitCode = 1; });
