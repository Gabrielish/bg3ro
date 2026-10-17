// Isolated sidebar UI with synthetic data. Real access policies are tested in SQL.
const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{for(const width of [320,390,820,1440]){
 const page=await browser.newPage({viewport:{width,height:950},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://baldursgate3.game/**',r=>r.abort());
 await page.addInitScript(()=>{window.__sidebarTest={rating:null,vote:null,fail:false};});
 await page.route('**/portal-config.js*',r=>r.fulfill({contentType:'text/javascript',body:"window.BG3RO_CONFIG={supabaseUrl:'https://test-project.supabase.co',supabasePublishableKey:'test-key'};"}));
 await page.route('**/portal.js*',r=>r.fulfill({contentType:'text/javascript',body:"document.querySelectorAll('[data-auth-open]').forEach(b=>b.onclick=()=>document.querySelector('#auth-dialog').showModal());document.documentElement.classList.add('portal-ready');"}));
 await page.route('**/rest/v1/rpc/bg3ro_sidebar_stats',async r=>{const state=await page.evaluate(()=>window.__sidebarTest);await r.fulfill({contentType:'application/json',body:JSON.stringify({rating_count:state.rating?1:0,rating_average:state.rating?.rating||null,compatibility_count:state.vote?1:0,works_count:state.vote?.works?1:0,last_update:null,recent:state.vote?[{...state.vote,updated_at:'2026-10-17T10:00:00Z'}]:[]})});});
 await page.goto(process.env.BG3RO_TEST_URL||'http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('.rating-star').count(),5);assert.equal(await page.locator('.sidebar .author-line').count(),0);
 assert.equal(await page.locator('#rating-average').textContent(),'—');assert.equal(await page.locator('#rating-count').textContent(),'0 evaluări');
 await page.locator('[data-rating="4"]').click();assert(await page.locator('#auth-dialog').isVisible());await page.keyboard.press('Escape');
 await page.evaluate(()=>{
  const s=window.__sidebarTest;
  const client={from(table){
   const key=table==='bg3ro_ratings'?'rating':'vote';
   return{select(){return this},eq(){return this},maybeSingle:async()=>({data:s[key],error:null}),upsert:async payload=>{if(s.fail)return{error:{message:'Network failure'}};s[key]=payload;return{error:null}}};
  }};
  window.dispatchEvent(new CustomEvent('bg3ro:auth',{detail:{client,userId:'alice'}}));
 });
 await page.locator('[data-rating="4"]').click();await page.waitForFunction(()=>document.querySelector('#rating-average').textContent==='4.0');
 assert.equal(await page.locator('[data-rating="4"]').getAttribute('aria-pressed'),'true');
 await page.locator('#compatibility-platform').selectOption('macos');await page.locator('#compatibility-version').fill('<img src=x> test');
 await page.locator('[data-works="true"]').click();await page.waitForFunction(()=>document.querySelector('#compatibility-percent').textContent==='100%');
 await page.locator('.recent-compatibility summary').click();assert.equal(await page.locator('#recent-compatibility-list img').count(),0);assert((await page.locator('#recent-compatibility-list').textContent()).includes('<img src=x>'));
 await page.evaluate(()=>window.__sidebarTest.fail=true);await page.locator('[data-rating="2"]').click();await page.waitForSelector('#rating-status.error');assert.equal(await page.locator('#rating-average').textContent(),'4.0');
 assert((await page.locator('.download-main').getAttribute('href')).includes('tab=files'));assert.equal(await page.locator('#statistics-updated').textContent(),'Nicio actualizare');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);
 await page.locator('.sidebar').screenshot({path:`.qa/sidebar-${width}.png`});await page.close();
}console.log('PASS: sidebar responsive, quick download, empty state, login gating, star/vote save/error, anonymous recent reports and text-only rendering.');}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
