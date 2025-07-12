const fs = require('fs');
const path = require('path');

// Simple PNG icon generator using Canvas API
const { createCanvas } = require('canvas');

const sizes = [16, 32, 48, 72, 96, 128, 144, 152, 192, 384, 512];
const iconDir = path.join(__dirname, '../public/icons');

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#3094d1';
  ctx.fillRect(0, 0, size, size);

  // Text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LG', size / 2, size / 2);

  return canvas.toBuffer('image/png');
}

async function generateAllIcons() {
  console.log('🎨 Generating PWA icons...');
  
  for (const size of sizes) {
    try {
      const iconBuffer = generateIcon(size);
      const iconPath = path.join(iconDir, `icon-${size}x${size}.png`);
      fs.writeFileSync(iconPath, iconBuffer);
      console.log(`✅ Generated icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Failed to generate icon-${size}x${size}.png:`, error.message);
    }
  }
  
  console.log('🎉 PWA icons generation completed!');
}

generateAllIcons(); 