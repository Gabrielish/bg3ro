const {chromium}=require('playwright');
const sharp=require('sharp');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const width of [320,390,820,1440]){
  const page=await browser.newPage({viewport:{width,height:850},reducedMotion:'reduce'});
  await page.route('**/portal-config.js*',r=>r.fulfill({contentType:'text/javascript',body:'window.BG3RO_CONFIG={supabaseUrl:"",supabasePublishableKey:"",authEnabled:false};'}));
  await page.goto(process.env.BG3RO_TEST_URL||'http://127.0.0.1:4173/',{waitUntil:'networkidle'});
  await page.waitForSelector('html.portal-ready');
  await page.evaluate(()=>scrollTo(0,document.querySelector('.project-banner').getBoundingClientRect().bottom+scrollY-300));
  const edge=await page.locator('.project-banner').evaluate(el=>Math.round(el.getBoundingClientRect().bottom));
  const smoke=await page.locator('.hero-edge-smoke').evaluate(el=>({background:getComputedStyle(el).backgroundImage,pointer:getComputedStyle(el).pointerEvents}));
  assert(smoke.background.includes('rgb(11, 12, 15)'));assert.equal(smoke.pointer,'none');
  const screenshot=await page.screenshot({path:`.qa/hero-transition-${width}.png`});
  const {data,info}=await sharp(screenshot).removeAlpha().raw().toBuffer({resolveWithObject:true});
  for(const y of [edge-2,edge-1,edge,edge+1])for(let x=0;x<info.width;x++){
   const offset=(y*info.width+x)*info.channels;
   assert.deepEqual([...data.subarray(offset,offset+3)],[11,12,15],`Seam pixel ${width} x${x} y${y}`);
  }
  await page.locator('#tab-descarcari').click();assert(await page.locator('#descarcari').isVisible());
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.close();
 }
 console.log('PASS: smoky edge dissolves to exact page color with no seam, tabs clickable and no overflow, 320–1440px.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
