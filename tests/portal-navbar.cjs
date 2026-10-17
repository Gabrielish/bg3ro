const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});
try{for(const width of [320,390,820,1100,1280,1440,1920]){
 const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/portal-config.js*',r=>r.fulfill({contentType:'text/javascript',body:'window.BG3RO_CONFIG={supabaseUrl:"",supabasePublishableKey:"",authEnabled:false};'}));
 await page.goto(process.env.BG3RO_TEST_URL||'http://127.0.0.1:4173/',{waitUntil:'networkidle'});await page.waitForSelector('html.portal-ready');
 assert.equal(await page.locator('a[href*="bg3ro-old"]').count(),0);
 const header=page.locator('.topbar');assert.equal(await header.evaluate(el=>getComputedStyle(el).position),'fixed');
 const actions=await page.locator('.navbar-actions').boundingBox();assert(actions.x+actions.width<=width,`Actions inside viewport ${width}`);
 assert((await header.evaluate(el=>getComputedStyle(el,'::before').backgroundImage)).includes('cloud-right.png'));
 assert((await page.locator('.banner-video').evaluate(el=>getComputedStyle(el).maskImage)).includes('hero-video-feather.svg'));
 assert.equal(await header.locator('[data-auth-open]').textContent(),'Login');
 if(width<=1100){await page.locator('.nav-toggle').click();assert(await page.locator('.main-navigation').isVisible());await page.keyboard.press('Escape');assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'),'false');await page.locator('.nav-toggle').click();}
 assert.equal(await header.locator('[data-go-tab]').count(),0);
 assert.equal(await page.locator('.main-navigation a').count(),1);
 assert((await page.locator('.main-navigation a').getAttribute('href')).includes('nexusmods.com'));
 if(width<=1100)await page.keyboard.press('Escape');
 for(const id of ['despre','actualizari','descarcari','discutii','erori']){await page.locator(`#tab-${id}`).click();assert(await page.locator(`#${id}`).isVisible());}
 await header.locator('[data-auth-open]').click();assert(await page.locator('#auth-dialog').isVisible());assert(await page.locator('#auth-unavailable').isVisible());await page.keyboard.press('Escape');
 await page.locator('.nav-support').click();await page.waitForTimeout(200);const support=await page.locator('#sustinere').boundingBox();assert(support.y>=88&&support.y<1000);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`No overflow ${width}`);
 await page.evaluate(()=>scrollTo(0,0));await page.mouse.move(0,500);await page.screenshot({path:`.qa/navbar-${width}.png`});assert.deepEqual(errors,[]);await page.close();
}console.log('PASS: official smoke textures, floating navbar, mobile menu/Escape, Login dialog, support navigation, no old-site links, 320–1920px.');}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
