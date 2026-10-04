const fs = require('fs');

fs.readdirSync('docs/screenshots')
  .filter(f => f.endsWith('.png'))
  .forEach(f => {
    const buf = fs.readFileSync('docs/screenshots/' + f);
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    console.log(`${f}: ${width}x${height}`);
  });
