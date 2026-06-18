const fs = require('fs');
const file = 'C:/Users/lucca/.gemini/antigravity-ide/brain/d04ccd5d-2399-4360-a917-d494af44cfd1/.system_generated/steps/217/content.md';

if (fs.existsSync(file)) {
  const c = fs.readFileSync(file, 'utf8');

  // Search for color button elements
  // Example: <a class="..." label="Botão 1 de 4, Amarelo cítrico" href="..."
  const re = /label="Botão \d+ de \d+, ([^"]+)"[^>]*href="([^"]+)"/gi;
  let match;
  console.log('--- COLOR BUTTONS ---');
  while ((match = re.exec(c)) !== null) {
    console.log(`COLOR: ${match[1]} -> URL: ${match[2]}`);
  }

  // Look for image elements with class ui-pdp-gallery or containing MLA image names
  // Let's search for occurrences of text that mention color and then look for nearby image tags
  const colors = ["índigo", "indigo", "blush", "amarelo-cítrico", "amarelo cítrico", "prateado"];
  colors.forEach(col => {
    console.log(`\n--- SEARCH NEAR COLOR: ${col} ---`);
    let idx = 0;
    while ((idx = c.indexOf(col, idx)) !== -1) {
      const start = Math.max(0, idx - 500);
      const end = Math.min(c.length, idx + 1500);
      const snippet = c.slice(start, end);
      const imgRe = /https:\/\/http2\.mlstatic\.com\/D_NQ_NP_[^\s"'>]+/gi;
      const imgs = snippet.match(imgRe) || [];
      if (imgs.length > 0) {
        console.log(`Near index ${idx} for ${col}:`);
        console.log([...new Set(imgs)].slice(0, 3).join('\n'));
      }
      idx += col.length;
    }
  });

} else {
  console.log('File does not exist');
}
