const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  fs.mkdirSync(path.join(__dirname, '../.qa'), { recursive: true });
  try {
    for (const width of [1440, 1024, 781, 780, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(process.env.BG3RO_TEST_URL || 'http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('.last-word, .support-backdrop, .support-frame').count(), 0);
      assert.equal(await page.locator('#sustinere a').count(), 2);
      assert.equal(await page.locator('#sustinere a').first().getAttribute('href'), 'https://www.patreon.com/cw/Gabrielish');
      assert.equal(await page.locator('#sustinere a').nth(1).getAttribute('href'), 'https://ko-fi.com/gabrielish');
      assert.equal(await page.locator('.footer nav').count(), 1);
      assert.equal(await page.locator('.footer-links a').count(), 3);
      assert.equal(await page.locator('.footer-main').evaluate(el => getComputedStyle(el).display), 'flex');
      assert.equal(await page.locator('.footer img, #sustinere .button img, #sustinere svg').count(), 0);
      const feedback = await page.locator('.community-feedback').boundingBox();
      const support = await page.locator('.community-support').boundingBox();
      if (width > 780) assert(support.x >= feedback.x + feedback.width, 'Feedback and support share one row');
      else assert(support.y >= feedback.y + feedback.height, 'Community articles stack on phones');
      for (const button of await page.locator('#sustinere a').all()) {
        assert((await button.boundingBox()).height >= 44);
        await button.focus();
        assert(await button.evaluate(el => el === document.activeElement));
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      const invalid = await page.locator('a[href^="#"]').evaluateAll(links => links.filter(a => !document.getElementById(a.hash.slice(1))).map(a => a.hash));
      assert.deepEqual(invalid, []);
      assert.equal(await page.locator('.project-status dt').filter({ hasText: /^Actul I$/ }).count(), 1);
      assert.deepEqual(errors, []);
      if (width === 1440 || width === 390) {
        await page.evaluate(() => document.activeElement.blur());
        await page.mouse.move(0, 0);
        await page.locator('#sustinere').screenshot({ path: path.join(__dirname, `../.qa/support-redesign-${width}.png`) });
        await page.locator('.footer').screenshot({ path: path.join(__dirname, `../.qa/footer-redesign-${width}.png`) });
      }
      await page.close();
    }
    console.log('PASS: refreshed support/footer at 320–1440px, genuine links, scoped author copy, keyboard access, no overflow or JS errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
