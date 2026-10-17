// Raster-size exports from the supplied SVG. Does not alter the legacy site's icons.
const sharp = require('sharp');
const path = require('node:path');
const source = path.join(__dirname, 'brand-mark-romania.svg');
(async () => {
  for (const [name, size] of [['portal-favicon-96.png',96],['portal-apple-touch-icon.png',180],['portal-icon-192.png',192],['portal-icon-512.png',512]]) {
    // Small optical inset protects the horns and tentacles from icon cropping.
    const inner = Math.round(size * .9);
    const inset = Math.floor((size-inner)/2);
    const artwork = await sharp(source,{density:600}).resize(inner,inner).png().toBuffer();
    await sharp({create:{width:size,height:size,channels:4,background:'#00000000'}})
      .composite([{input:artwork,left:inset,top:inset}]).png().toFile(path.join(__dirname,name));
  }
  console.log('PASS: portal tricolor SVG exported at 96/180/192/512px; legacy assets untouched.');
})().catch(error => {console.error(error);process.exitCode=1;});
