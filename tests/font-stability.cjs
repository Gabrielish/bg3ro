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
    return { size:style.fontSize, width:rect.width, height:rect.height };
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
    assert.deepEqual(await snapshot(), after, 'Changing browser height must not change text dimensions');
  }
  await browser.close();
  console.log('PASS: no late font swap with delayed font loading; stable typography across 650px height breakpoint.');
})().catch(error => { console.error(error); process.exitCode = 1; });
