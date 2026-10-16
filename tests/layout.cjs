const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [1440, 1024, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      await page.goto(process.env.BG3RO_TEST_URL || 'http://127.0.0.1:4173', { waitUntil: 'networkidle' });
      const nav = page.locator('.site-header .parchment-button');
      const download = page.locator('.download-copy .parchment-button');
      async function appearance(locator) {
        return locator.evaluate(el => {
          const s = getComputedStyle(el), base = getComputedStyle(el, '::before'), hover = getComputedStyle(el, '::after');
          return { font: s.fontFamily, size: s.fontSize, weight: s.fontWeight, color: s.color, height: s.minHeight,
            base: base.backgroundImage, baseOpacity: base.opacity, baseFilter: base.filter,
            mask: base.maskImage, hover: hover.backgroundColor, hoverImage: hover.backgroundImage,
            hoverOpacity: hover.opacity, hoverFilter: hover.filter, transition: hover.transition };
        });
      }
      assert.deepEqual(await appearance(download), await appearance(nav), `Identical button styles at ${width}px`);
      await download.hover();
      const hovered = await appearance(download);
      assert.equal(hovered.baseOpacity, '1');
      assert.equal(hovered.baseFilter, 'none');
      assert.equal(hovered.hoverOpacity, '1');
      assert.equal(hovered.hover, 'rgb(255, 255, 255)');
      assert.equal(hovered.hoverFilter, 'none');
      const spacing = await page.evaluate(() => {
        const pad = (selector, side) => parseFloat(getComputedStyle(document.querySelector(selector))[side]);
        return [pad('.introduction', 'paddingBottom') + pad('#acord', 'paddingTop'),
          pad('#acord', 'paddingBottom') + pad('#parcurs', 'paddingTop'),
          pad('#parcurs', 'paddingBottom') + pad('.download-layout', 'paddingTop'),
          pad('.download-layout', 'paddingBottom') + pad('.faq', 'paddingTop'),
          pad('.faq', 'paddingBottom') + pad('#sustinere', 'paddingTop')];
      });
      assert(spacing.every(gap => gap === (width <= 780 ? 64 : 96)), `Consistent section rhythm: ${spacing}`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      if (width === 1440 || width === 390) {
        await page.locator('#instalare').screenshot({ path: path.join(__dirname, `../.qa/download-shared-${width}.png`) });
      }
      await page.close();
    }
    console.log('PASS: shared navbar/download button appearance and hover; consistent desktop/mobile section spacing; no overflow.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
