import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple PNG icon generator - create basic colored squares for now
const sizes = [16, 32, 48, 72, 96, 128, 144, 152, 192, 384, 512];
const iconDir = path.join(__dirname, '../public/icons');

function createBasicPNG(size) {
  // Create a simple PNG buffer with blue background
  // This is a minimal PNG structure
  const width = size;
  const height = size;
  
  // PNG header
  const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(2, 9); // color type (RGB)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  
  const ihdrChunk = createPNGChunk('IHDR', ihdrData);
  
  // Create simple blue background
  const pixelData = Buffer.alloc(height * (width * 3 + 1)); // +1 for filter byte per row
  for (let y = 0; y < height; y++) {
    pixelData[y * (width * 3 + 1)] = 0; // filter type
    for (let x = 0; x < width; x++) {
      const offset = y * (width * 3 + 1) + 1 + x * 3;
      pixelData[offset] = 48;     // R (blue background)
      pixelData[offset + 1] = 148; // G
      pixelData[offset + 2] = 209; // B
    }
  }
  
  const idatChunk = createPNGChunk('IDAT', pixelData);
  const iendChunk = createPNGChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([pngHeader, ihdrChunk, idatChunk, iendChunk]);
}

function createPNGChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = calculateCRC(Buffer.concat([typeBuffer, data]));
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);
  
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function calculateCRC(buffer) {
  // Simple CRC calculation (this is a simplified version)
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

async function generateAllIcons() {
  console.log('🎨 Generating PWA icons...');
  
  for (const size of sizes) {
    try {
      const iconBuffer = createBasicPNG(size);
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