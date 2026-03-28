// generate-icons.js
// Run this script inside the root of your application (or client folder)
// It generates standard PWA placeholder icons without Photoshop
// Installation required: npm install canvas
const fs = require('fs');
const path = require('path');

try {
  const { createCanvas } = require('canvas');

  const sizes = [192, 512];
  const publicDir = path.join(__dirname, 'public');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  sizes.forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Solid purple background
    ctx.fillStyle = '#6828B8';
    ctx.fillRect(0, 0, size, size);

    // Rose gold inner border
    ctx.strokeStyle = '#E8A4C0';
    ctx.lineWidth = size * 0.05;
    ctx.strokeRect(size * 0.1, size * 0.1, size * 0.8, size * 0.8);

    // White bold text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${size * 0.4}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SR', size / 2, size / 2);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(publicDir, `icon-${size}.png`), buffer);
    console.log(`Generated icon-${size}.png in public/`);
  });

} catch (err) {
  console.error("Please install the canvas module first by running: npm install canvas");
  console.error(err.message);
}
