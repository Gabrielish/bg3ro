const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
  const b=await chromium.launch({channel:'msedge',headless:true});
  const base=process.env.BG3RO_TEST_URL||'http://127.0.0.1:4173/';
  fs.mkdirSync('.qa',{recursive:true});
  try {
    for(const [width,height] of [[320,568],[390,640],[390,844],[430,932],[781,900],[820,900],[980,900],[1024,900],[1440,1000]]){
      const p=await b.newPage({viewport:{width,height},reducedMotion:'reduce'});
      const errors=[];p.on('pageerror',e=>errors.push(e.message));
      await p.goto(base,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
      assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`No overflow ${width}`);
      const footer=p.locator('.footer');
      assert.equal(await footer.locator('nav a').count(),3);
      assert.equal(await footer.locator('nav a[href^="#"]').count(),0);
      assert.equal(await footer.locator('nav a').nth(2).getAttribute('href'),'./termeni.html');
      assert.equal(await footer.evaluate(el=>getComputedStyle(el,'::before').content),'none');
      assert.equal(await p.locator('.footer-divider,.footer-bottom').count(),0);
      assert.equal(await p.locator('.button img,.button svg,#navigation svg,#navigation img').count(),0);
      assert.equal(await p.locator('.community-grid h3 img').count(),2);
      for(const icon of await p.locator('.community-grid h3 img').all()){
        assert(await icon.evaluate(img=>img.complete&&img.naturalWidth>0));
        assert.equal(await icon.getAttribute('alt'),'');
      }
      if(width<=780){
        const rects=await p.evaluate(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom}};return {cta:box('.hero-actions'),mouse:box('.scroll-cue'),title:box('.hero-title'),status:box('.hero-topline')};});
        assert(rects.mouse.bottom<=height-60,`Raised mouse remains above browser bottom at ${width}x${height}`);
        assert(rects.cta.bottom<rects.mouse.top,'Mouse follows CTA without overlap');
        assert(rects.title.top>rects.status.bottom+12,'Title clear of status');
        await p.locator('.menu-toggle').click();
        await p.locator('#navigation a[href="#feedback"]').click();
        await p.waitForFunction(()=>document.querySelector('#navigation a[href="#feedback"]').getAttribute('aria-current')==='location');
        assert.equal(await p.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
        assert.equal(await p.locator('#navigation a[href="#feedback"]').getAttribute('aria-current'),'location');
        if(width===390&&height===844){await p.locator('.brand').click();await p.screenshot({path:'.qa/hero-raised-390.png'});}
      }else{
        const brand=await p.locator('.brand').boundingBox();
        const nav=await p.locator('#navigation').boundingBox();
        assert(nav.x>=brand.x+brand.width,`No brand/nav overlap ${width}`);
        assert(nav.x+nav.width<=width,`Navbar fits ${width}`);
      }
      await footer.screenshot({path:`.qa/footer-simple-${width}.png`});
      if(width===390&&height===844)await p.locator('#feedback').screenshot({path:'.qa/feedback-390.png'});
      await p.goto(new URL('termeni.html',base).href,{waitUntil:'networkidle'});
      assert.equal(await p.locator('h1').textContent(),'Termeni de utilizare');
      assert.equal(await p.locator('script[src*="app.js"]').count(),0,'Standalone page must not execute home-only code');
      const text=await p.locator('main').innerText();
      for(const word of ['Larian Studios','Wizards of the Coast','fără scop comercial','voluntare'])assert(text.includes(word));
      assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      if(width===390&&height===844)await p.screenshot({path:'.qa/terms-390.png',fullPage:true});
      assert.deepEqual(errors,[]);
      await p.close();
    }
    console.log('PASS: raised mobile hero, cue animation layout, feedback navigation, compact three-link footer, single divider, terms and rights copy, SVG icons, tablet nav fit.');
  }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
