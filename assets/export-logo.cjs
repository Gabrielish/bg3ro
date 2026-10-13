// Mechanical size/format exports only; the artwork is generated with ImageGen.
const sharp = require('sharp');
const path = require('node:path');
const assert = require('node:assert/strict');
const source = path.join(__dirname, 'logo-d20-master.png');
(async () => {
  const stats = await sharp(source).stats();
  assert(stats.channels.length === 4 && stats.channels[3].min === 0, 'Logo must have real transparency');
  const outputs = [['logo-d20-romania.png', 1024], ['favicon-96.png', 96], ['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]];
  for (const [file, size] of outputs) {
    await sharp(source).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9 }).toFile(path.join(__dirname, file));
  }
  await sharp(source).resize(256, 256).webp({ quality: 92, alphaQuality: 100 }).toFile(path.join(__dirname, 'logo-d20-romania-256.webp'));
  console.log('PASS: transparent logo and exports at 96/180/192/256/512/1024px.');
})().catch(error => { console.error(error); process.exitCode = 1; });
