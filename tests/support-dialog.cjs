const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const width of [320,390,820,1440]){
  const page=await browser.newPage({viewport:{width,height:width===320?568:900},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/portal-config.js*',r=>r.fulfill({contentType:'text/javascript',body:'window.BG3RO_CONFIG={};'}));
  await page.goto(process.env.BG3RO_TEST_URL||'http://127.0.0.1:4173/',{waitUntil:'networkidle'});
  const trigger=page.locator('.nav-support'),dialog=page.locator('#support-dialog');const originalURL=page.url();
  await trigger.click();assert(await dialog.isVisible());assert.equal(page.url(),originalURL,'No jump to sidebar');
  assert.equal(await dialog.evaluate(el=>el.matches(':modal')),true);
  assert.equal(await page.locator('.support-close').evaluate(el=>el===document.activeElement),true);
  assert.equal(await dialog.locator('a').count(),2);
  for(const [i,url] of ['https://www.patreon.com/cw/Gabrielish','https://ko-fi.com/gabrielish'].entries()){
   const link=dialog.locator('a').nth(i);assert.equal(await link.getAttribute('href'),url);assert.equal(await link.getAttribute('target'),'_blank');assert((await link.getAttribute('rel')).includes('noopener'));
  }
  const box=await dialog.boundingBox();assert(box.x>=0&&box.x+box.width<=width);
  assert(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth));
  await page.screenshot({path:`.qa/support-dialog-${width}.png`});
  await page.locator('.support-close').click();assert(!await dialog.isVisible());
  assert(await trigger.evaluate(el=>el===document.activeElement));
  await page.keyboard.press('Enter');assert(await dialog.isVisible());await page.keyboard.press('Escape');assert(!await dialog.isVisible());
  await trigger.click();await page.mouse.click(1,200);assert(!await dialog.isVisible());
  assert(!await page.locator('html').evaluate(el=>el.classList.contains('support-open')));assert.deepEqual(errors,[]);
  await page.close();
 }
 console.log('PASS: support modal, real links, X/Escape/backdrop, keyboard focus restore, no page jump, mobile 320–1440px.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
