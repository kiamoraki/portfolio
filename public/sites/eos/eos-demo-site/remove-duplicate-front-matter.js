const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Find all front matter blocks
  const matches = [...content.matchAll(/---\s*\n([\s\S]*?)---\s*\n/g)];
  if (matches.length > 1) {
    // Keep only the first block, remove the rest
    const firstBlock = matches[0][0];
    // Remove all front matter blocks
    let rest = content.replace(/---\s*\n([\s\S]*?)---\s*\n/g, '');
    // Add back the first block at the top
    const fixed = firstBlock + rest;
    fs.writeFileSync(file, fixed, 'utf8');
    console.log(`Cleaned: ${file}`);
  }
});
