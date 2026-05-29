import fs from 'fs';
import path from 'path';

function getJpegDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  let i = 2; // skip SOI
  while (i < buffer.length) {
    if (buffer[i] !== 0xFF) {
      // not a valid marker
      break;
    }
    const marker = buffer[i + 1];
    if (marker === 0xD9 || marker === 0xDA) {
      // EOI or SOS, dimensions not found
      break;
    }
    const size = buffer.readUInt16BE(i + 2);
    // SOF0 (0xC0), SOF1 (0xC1), SOF2 (0xC2) contain dimensions
    if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
      const height = buffer.readUInt16BE(i + 5);
      const width = buffer.readUInt16BE(i + 7);
      return { width, height };
    }
    i += 2 + size;
  }
  return null;
}

const dir = 'd:\\Vibe Choder\\avestam\\avetsam\\public\\images\\homepage';
const files = fs.readdirSync(dir);
console.log('Homepage Images Analysis:');
files.forEach(file => {
  if (file.toLowerCase().endsWith('.jpeg') || file.toLowerCase().endsWith('.jpg')) {
    const filePath = path.join(dir, file);
    try {
      const dims = getJpegDimensions(filePath);
      if (dims) {
        const aspect = (dims.width / dims.height).toFixed(3);
        console.log(`- ${file}: ${dims.width}x${dims.height} (Aspect Ratio: ${aspect})`);
      } else {
        console.log(`- ${file}: Could not parse dimensions`);
      }
    } catch (e) {
      console.log(`- ${file}: Error parsing: ${e.message}`);
    }
  }
});
