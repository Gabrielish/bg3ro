const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel:'msedge', headless:true });
  try {
    for (const width of [1440,390]) for (const reducedMotion of ['no-preference','reduce']) {
      const page = await browser.newPage({ viewport:{width,height:900}, reducedMotion });
      await page.goto(process.env.BG3RO_TEST_URL || 'http://127.0.0.1:4173/', {waitUntil:'networkidle'});
      const projectLink = page.locator('#navigation a').first();
      const waitForProject = async () => {
        await page.waitForFunction(() => {
          const section = document.getElementById('proiect');
          const expected = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + parseFloat(getComputedStyle(section).scrollMarginTop);
          return Math.abs(section.getBoundingClientRect().top - expected) < 2;
        });
        await page.mouse.move(5,400);
        await page.waitForFunction(() => document.querySelector('#navigation a').classList.contains('active'));
        assert.equal(await projectLink.getAttribute('aria-current'), 'location');
        assert.equal(await page.locator('.world-background').evaluate(el => el.scrollTop), 0, 'Decorative wrapper must not scroll internally');
        await page.waitForTimeout(450);
        assert.equal(await projectLink.evaluate(el => getComputedStyle(el,'::after').opacity), '1', 'Active ornament is visible without hover');
        assert(await page.locator('.introduction > .eyebrow').evaluate(el => {
          const top = el.getBoundingClientRect().top;
          const bottom = document.querySelector('.site-header').getBoundingClientRect().bottom;
          return top >= bottom && top < bottom + 45;
        }), 'Project content lands directly below the fixed navbar');
        return page.evaluate(() => scrollY);
      };
      await page.locator('.scroll-cue').click();
      const fromMouse = await waitForProject();
      await page.locator('.brand').click();
      await page.waitForFunction(() => scrollY < 2);
      await page.waitForFunction(() => !document.querySelector('#navigation a.active'));
      if (width < 781) await page.locator('.menu-toggle').click();
      await projectLink.click();
      const fromNavbar = await waitForProject();
      assert(Math.abs(fromMouse - fromNavbar) < 2, 'Mouse and navbar use the same destination');
      await page.evaluate(() => document.getElementById('acord').scrollIntoView());
      await page.waitForFunction(() => document.querySelector('#navigation a[href="#acord"]').classList.contains('active'));
      for (const id of ['acord', 'parcurs', 'instalare', 'proiect']) {
        if (width <= 780) await page.locator('.menu-toggle').click();
        await page.locator(`#navigation a[href="#${id}"]`).click();
        await page.waitForFunction(expected => {
          const el = document.getElementById(expected);
          const target = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + parseFloat(getComputedStyle(el).scrollMarginTop);
          return Math.abs(el.getBoundingClientRect().top - target) < 2;
        }, id);
        await page.waitForTimeout(800);
        await page.mouse.move(5, 400);
        assert.equal(await page.locator('#navigation a.active').getAttribute('href'), `#${id}`);
        assert.equal(await page.locator('#navigation a[aria-current="location"]').count(), 1);
        const eyebrowY = await page.locator(`#${id} .eyebrow`).first().evaluate(el => el.getBoundingClientRect().top);
        const paddingY = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop));
        assert(Math.abs(eyebrowY - paddingY) < 3, `${id} heading has the same navbar inset at ${width}px: ${eyebrowY}`);
      }
      // Regression: the incoming section already fills the upper viewport,
      // but its edge has not yet reached the fixed header.
      await page.evaluate(() => {
        const el = document.getElementById('acord');
        const inset = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
        window.scrollTo({ top: scrollY + el.getBoundingClientRect().top - inset - 205, behavior: 'instant' });
      });
      await page.waitForFunction(() => document.querySelector('#navigation a[href="#acord"]').classList.contains('active'));
      await page.close();
    }
    console.log('PASS: one-click mouse navigation, active ornament without hover, matching navbar target, manual scroll tracking, mobile and reduced motion.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
