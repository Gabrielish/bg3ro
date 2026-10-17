const {chromium}=require('playwright');
const sharp=require('sharp');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
  const css=fs.readFileSync('portal.css','utf8');
  for(const old of ['--purple','#8b5cf6','#ac82ff','#a14df3','#7a6bfa'])assert(!css.includes(old),`Old purple removed: ${old}`);
  const svg=fs.readFileSync('assets/brand-mark-romania.svg','utf8');
  assert(svg.includes('viewBox="0 0 50 50"'));
  assert.equal((svg.match(/<path /g)||[]).length,1);
  assert(!/transform=|<script|href=/i.test(svg),'Standalone path, correctly rebased, no external dependencies');
  for(const [file,size] of [['portal-favicon-96.png',96],['portal-apple-touch-icon.png',180],['portal-icon-192.png',192],['portal-icon-512.png',512]]){
    const meta=await sharp(`assets/${file}`).metadata();assert.equal(meta.width,size);assert.equal(meta.height,size);assert(meta.hasAlpha);
  }
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    for(const width of [320,390,820,1440]){
      const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
      await page.goto(process.env.BG3RO_TEST_URL||'http://127.0.0.1:4173/',{waitUntil:'networkidle'});
      await page.waitForSelector('html.portal-ready');await page.evaluate(()=>document.fonts.ready);
      const brand=await page.locator('.wordmark').evaluate(el=>{const s=getComputedStyle(el);return{font:s.fontFamily,size:s.fontSize,color:s.color,weight:s.fontWeight,spacing:s.letterSpacing}});
      assert.equal(brand.font,'"EB Garamond", Georgia, serif');assert.equal(brand.weight,'600');assert.equal(brand.spacing,'-0.3px');
      assert.equal(brand.size,width<=760?'29px':'34px');assert.equal(brand.color,'rgb(244, 236, 217)');
      assert.equal(await page.locator('.wordmark .brand-ro').evaluate(el=>getComputedStyle(el).color),'rgb(215, 188, 138)');
      assert(await page.locator('.wordmark img').evaluate(el=>el.complete&&el.naturalWidth>0));
      assert((await page.locator('.wordmark img').getAttribute('src')).includes('brand-mark-romania.svg'));
      assert.equal(await page.locator('link[rel=icon][type="image/svg+xml"]').count(),1);
      const body=await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor);assert.equal(body,'rgb(11, 12, 15)');
      const button=page.locator('.download-main');assert.equal(await button.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(221, 201, 167)');
      await button.hover();assert.equal(await button.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      for(const icon of await page.locator('link[rel=icon],link[rel=apple-touch-icon]').all()){
        const result=await page.request.get(new URL(await icon.getAttribute('href'),page.url()).href);assert.equal(result.status(),200);
      }
      const manifestURL=new URL(await page.locator('link[rel=manifest]').getAttribute('href'),page.url()).href;
      const manifest=await (await page.request.get(manifestURL)).json();
      assert.equal(manifest.scope,'/bg3ro/');assert(manifest.icons.every(icon=>icon.src.includes('portal-icon')));
      await page.close();
    }
    console.log('PASS: charcoal/gold palette, old EB Garamond wordmark metrics/colors, supplied tricolor SVG, favicon exports, manifest, hover and responsive logo.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
