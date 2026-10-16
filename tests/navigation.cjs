const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
  const b=await chromium.launch({channel:'msedge',headless:true});
  const settled = p => p.evaluate(() => new Promise(resolve => {
    let last = scrollY, stable = 0;
    function frame() {
      stable = Math.abs(scrollY - last) < .2 ? stable + 1 : 0;
      last = scrollY;
      if (stable >= 8) resolve(); else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }));
  try{
    for(const width of [390,1440])for(const reducedMotion of ['reduce','no-preference']){
      const p=await b.newPage({viewport:{width,height:900},reducedMotion});
      await p.goto(process.env.BG3RO_TEST_URL||'http://127.0.0.1:4173/',{waitUntil:'networkidle'});
      await p.waitForSelector('.mods-section.modules-ready');
      await p.locator('.scroll-cue').click();
      await p.waitForFunction(()=>document.querySelector('#navigation a[href="#proiect"]').getAttribute('aria-current')==='location');
      await settled(p);
      const firstY=await p.evaluate(()=>scrollY);
      await p.locator('.brand').click(); await p.waitForFunction(()=>scrollY<2);
      for(const id of ['proiect','acord','instalare','feedback']){
        if(width<=780)await p.locator('.menu-toggle').click();
        await p.locator(`#navigation a[href="#${id}"]`).click();
        await p.waitForFunction(id=>document.querySelector(`#navigation a[href="#${id}"]`).getAttribute('aria-current')==='location',id);
        await settled(p);
        if(id==='proiect')assert(Math.abs((await p.evaluate(()=>scrollY))-firstY)<2);
        if(width<=780)assert.equal(await p.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
        assert.equal(await p.locator('#navigation a[aria-current="location"]').count(),1);
      }
      await p.locator('.footer-brand').click(); await p.waitForFunction(()=>scrollY<2);
      if(width<=780)await p.locator('.menu-toggle').click();
      await p.locator('#navigation .nav-download').click();
      await p.waitForFunction(()=>{const r=document.getElementById('sustinere').getBoundingClientRect();return r.top>=0&&r.top<innerHeight;});
      const support=await p.locator('#sustinere').boundingBox(); assert(support.y>=0&&support.y<900);
      await p.close();
    }
    console.log('PASS: one-click project cue, new section navigation, active links, short final section, support destination, mobile and reduced motion.');
  }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
