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
  assert.equal(await page.locator('.project-badges').textContent(),'Versiune publică · Early Access · În lucru');
  assert.equal(await page.locator('.project-badges .language,.project-badges .flag').count(),0);
  assert.equal(await page.locator('.hero-edge-smoke').evaluate(el=>getComputedStyle(el).display),'none');
  assert((await page.locator('.banner-art').evaluate(el=>getComputedStyle(el).maskImage)).includes('hero-video-feather.svg'));
  const screenshot=await page.screenshot({path:`.qa/hero-transition-${width}.png`});
  const {data,info}=await sharp(screenshot).removeAlpha().raw().toBuffer({resolveWithObject:true});
  for(const y of [edge-2,edge-1,edge,edge+1])for(let x=0;x<info.width;x++){
   const offset=(y*info.width+x)*info.channels;
   assert([...data.subarray(offset,offset+3)].every((v,i)=>Math.abs(v-[11,12,15][i])<=1),`Seam pixel ${width} x${x} y${y}`);
  }
  await page.locator('#tab-descarcari').click();assert(await page.locator('#descarcari').isVisible());
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.close();
 }
 for(const width of [390,1600]){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'no-preference'});
  await page.route('**/portal-config.js*',r=>r.fulfill({contentType:'text/javascript',body:'window.BG3RO_CONFIG={};'}));
  await page.goto(process.env.BG3RO_TEST_URL||'http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('video').currentTime>.2);
  const box=await page.locator('.banner-video').boundingBox(),hero=await page.locator('.project-banner').boundingBox();
  assert.equal(box.height,hero.height,'Video height unchanged');assert.equal(box.width,hero.width,'Video width unchanged');
  for(const time of [1,4,8]){
   await page.locator('video').evaluate(async(v,t)=>{v.pause();v.currentTime=t;await new Promise(r=>v.addEventListener('seeked',r,{once:true}));},time);
   await page.screenshot({path:`.qa/hero-feather-video-${width}-${time}.png`});
  }
  await page.close();
 }
 console.log('PASS: updated badge, feathered media without smoke rectangle, seam pixels, unchanged video geometry, real video frames at 1/4/8s, tabs and 320–1600px.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
