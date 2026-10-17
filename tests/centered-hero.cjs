const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const base=process.env.BG3RO_TEST_URL||'http://127.0.0.1:4173/';
  try{
    for(const [width,height] of [[320,568],[390,844],[760,900],[820,900],[1440,1000],[1920,1080]]){
      const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
      await page.goto(base,{waitUntil:'networkidle'});await page.waitForSelector('html.portal-ready');
      const hero=page.locator('.project-banner');
      assert.equal(await hero.locator('h1').textContent(),'Baldur’s Gate 3');
      assert.equal(await hero.locator('.subtitle').textContent(),'În limba română');
      assert.equal(await hero.locator('.project-cover,.project-meta,.hero-tagline,a[href*="nexusmods"]').count(),0);
      assert.equal(await hero.evaluate(el=>getComputedStyle(el,'::after').display),'none');
      assert.notEqual(await hero.locator('h1').evaluate(el=>getComputedStyle(el).textShadow),'none');
      assert.equal(await hero.locator('.banner-art').evaluate(el=>getComputedStyle(el).opacity),'1');
      assert.equal(await hero.locator('.embers').evaluate(el=>getComputedStyle(el).display),'none');
      const title=await hero.locator('h1').boundingBox(),sub=await hero.locator('.subtitle').boundingBox(),badges=await hero.locator('.project-badges').boundingBox();
      assert(Math.abs(title.x+title.width/2-width/2)<2,'Centered title');
      assert(badges.y+badges.height<title.y,'Badges above the titles');assert(sub.y>=title.y+title.height,'Subtitle below title');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`No overflow ${width}`);
      if([390,1440].includes(width))await page.screenshot({path:`.qa/centered-hero-${width}.png`});
      await page.close();
    }
    const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
    await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('video').currentTime>.2,null,{timeout:30000});
    assert.equal(await page.locator('video').evaluate(el=>getComputedStyle(el).opacity),'1');
    assert.equal(await page.locator('video').evaluate(el=>getComputedStyle(el).filter),'none');
    assert.equal(await page.locator('.ember').count(),36);
    assert.equal(await page.locator('.ember').first().evaluate(el=>getComputedStyle(el).animationName),'firefly-drift');
    assert.equal(await page.locator('#banner-video-toggle').count(),0);
    await page.locator('.footer').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('.project-banner').classList.contains('animation-paused'));
    assert.equal(await page.locator('.ember').first().evaluate(el=>getComputedStyle(el).animationPlayState),'paused');
    await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:'.qa/centered-hero-video-1440.png'});await page.close();
    console.log('PASS: centered title/subtitle, top badges, no cover/metadata, unfiltered video, text shadow, restored fireflies, offscreen/reduced motion handling, 320–1920px.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
