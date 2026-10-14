const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel:'msedge', headless:true });
  const url = process.env.BG3RO_TEST_URL || 'http://127.0.0.1:4173/';
  const page = await browser.newPage({ viewport:{width:390,height:640}, isMobile:true });
  let releaseFonts;
  const gate = new Promise(resolve => { releaseFonts = resolve; });
  let fontRequests = 0;
  await page.route('**/assets/fonts/*.woff2', async route => {
    fontRequests++;
    await gate;
    await route.continue();
  });
  const snapshot = () => page.locator('.hero-title,.hero-language,.hero-tagline,.hero-actions .button').evaluateAll(elements => elements.map(el => {
    const style = getComputedStyle(el);
    const range = document.createRange();
    range.selectNodeContents(el);
    const rect = range.getBoundingClientRect();
    const previous = el.matches('.hero-language') ? el.previousElementSibling
      : el.matches('.hero-tagline') ? el.previousElementSibling
      : el.matches('.button') ? el.closest('.hero-actions').previousElementSibling : null;
    const gapBefore = previous ? Math.round((el.getBoundingClientRect().top - previous.getBoundingClientRect().bottom) * 100) / 100 : null;
    return { size:style.fontSize, width:rect.width, height:rect.height, gapBefore };
  }));
  await page.goto(url, { waitUntil:'domcontentloaded' });
  await page.waitForTimeout(700);
  const before = await snapshot();
  releaseFonts();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  assert(fontRequests >= 2, 'Romanian and Latin fonts are requested from this site');
  const after = await snapshot();
  assert.deepEqual(after, before, 'Delayed font must not resize already visible hero text');
  for (const height of [620,650,651,700,844]) {
    await page.setViewportSize({width:390,height});
    assert.deepEqual(await snapshot(), after, 'Changing browser height must not change text dimensions or spacing');
    for (const scrollY of [80,160,40,0]) {
      await page.evaluate(y => window.scrollTo({top:y,behavior:'instant'}), scrollY);
      await page.waitForTimeout(50);
      assert.deepEqual(await snapshot(), after, 'Scrolling must not change spacing inside the hero');
    }
  }
  await browser.close();
  console.log('PASS: no late font swap; stable hero typography and gaps across viewport height changes and scrolling.');
})().catch(error => { console.error(error); process.exitCode = 1; });
