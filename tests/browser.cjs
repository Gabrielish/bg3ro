const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {execFileSync}=require('node:child_process');
const baseline='95f1064';
const original=execFileSync('git',['show',`${baseline}:index.html`],{encoding:'utf8'});
const current=fs.readFileSync('index.html','utf8');
const hero=s=>s.match(/<section class="hero"[\s\S]*?<\/section>/)[0].replace(/\r\n/g,'\n');
assert.equal(hero(current),hero(original),'Hero markup must remain byte-for-byte unchanged');
for(const f of ['hero-layout.css','controls.css','scroll-cue.css','fireflies.css','fonts.css']){
  assert.equal(fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n'),execFileSync('git',['show',`${baseline}:${f}`],{encoding:'utf8'}).replace(/\r\n/g,'\n'),`${f} unchanged`);
}
(async()=>{
  const b=await chromium.launch({channel:'msedge',headless:true});
  const base=process.env.BG3RO_TEST_URL||'http://127.0.0.1:4173/';
  fs.mkdirSync('.qa',{recursive:true});
  try{
    for(const width of [320,390,780,781,820,1024,1440]){
      const p=await b.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
      const errors=[]; p.on('pageerror',e=>errors.push(e.message));
      await p.goto(base,{waitUntil:'networkidle'}); await p.evaluate(()=>document.fonts.ready);
      await p.waitForFunction(()=>document.querySelector('.mods-section').classList.contains('modules-ready'));
      assert.equal(await p.locator('.site-content > section').count(),4);
      assert.equal(await p.locator('.principles,.timeline,.faq,.feedback-section,.support-section').count(),0);
      assert.equal(await p.locator('.module-panel:not([hidden])').count(),1);
      const input=p.locator('#example-search');
      for(const [query,count] of [['manusi',2],['MĂNUȘI',2],['palarie',1],['sabie',1],['nimic',0],['',4]]){
        await input.fill(query); assert.equal(await p.locator('[data-example-item]:not([hidden])').count(),count);
      }
      await p.locator('#tab-items').click();
      assert(await p.locator('#module-items').isVisible());
      assert((await p.locator('.item-forms tbody tr').first().innerText()).includes('Obișnuită'));
      await p.locator('#tab-combat').click();
      await p.locator('[data-gender="male"]').click();
      assert.equal(await p.locator('[data-form="passive"]').textContent(),'vindecat');
      await p.locator('[data-gender="female"]').click();
      assert.equal(await p.locator('[data-form="heal"]').textContent(),'a vindecat-o');
      await p.locator('#tab-combat').focus(); await p.keyboard.press('ArrowRight');
      assert(await p.locator('#module-search').isVisible());
      assert.equal(await p.locator('[role="tab"][tabindex="0"]').count(),1);
      assert.equal(await p.locator('[role="tab"][aria-selected="true"]').count(),1);
      assert.equal(await p.locator('#sustinere a').count(),2);
      assert.equal(await p.locator('#sustinere a').first().getAttribute('href'),'https://www.patreon.com/cw/Gabrielish');
      assert.equal(await p.locator('#sustinere a').nth(1).getAttribute('href'),'https://ko-fi.com/gabrielish');
      assert.equal(await p.locator('.footer nav a').count(),3);
      assert.equal(await p.locator('.button img,.button svg,.footer img').count(),0);
      assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`No overflow at ${width}`);
      if(width>780){
        const brand=await p.locator('.brand').boundingBox(); const nav=await p.locator('#navigation').boundingBox();
        assert(nav.x>=brand.x+brand.width && nav.x+nav.width<=width+1);
      }
      const bad=await p.locator('a[href^="#"]').evaluateAll(links=>links.filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash));
      assert.deepEqual(bad,[]);assert.deepEqual(errors,[]);
      if(width===390||width===1440){
        await p.locator('#proiect').screenshot({path:`.qa/project-rebuild-${width}.png`});
        await p.locator('#acord').screenshot({path:`.qa/mods-rebuild-${width}.png`});
        await p.locator('#feedback').screenshot({path:`.qa/community-rebuild-${width}.png`});
        await p.screenshot({path:`.qa/rebuild-full-${width}.png`,fullPage:true});
      }
      await p.close();
    }
    const p=await b.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
    await p.goto(base);
    assert.equal(await p.locator('.module-panel:not([hidden])').count(),3,'All examples readable without JS');
    assert.equal(await p.locator('.module-tabs').isVisible(),false);
    assert(await p.locator('.hero-actions a').isVisible());
    console.log('PASS: hero HTML/CSS preserved, four-section structure, real interactive examples, tabs/keyboard, honest statuses, mobile/tablet, links and no-JS.');
  }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
