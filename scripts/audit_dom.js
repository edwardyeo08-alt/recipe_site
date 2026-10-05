const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Find all elements.<key>
const regex = /elements\.([a-zA-Z0-9_]+)/g;
let match;
const usedKeys = new Set();
while ((match = regex.exec(appJs)) !== null) {
  usedKeys.add(match[1]);
}

// Find elements block
const elementsBlockMatch = appJs.match(/const elements = \{([\s\S]*?)\n  \};/);
if (!elementsBlockMatch) {
  console.error('Could not find elements definition block');
  process.exit(1);
}

const defRegex = /([a-zA-Z0-9_]+)\s*:/g;
const definedKeys = new Set();
while ((match = defRegex.exec(elementsBlockMatch[1])) !== null) {
  definedKeys.add(match[1]);
}

console.log('Total used keys on elements.*:', usedKeys.size);
console.log('Total defined keys in elements:', definedKeys.size);

const missingInElements = [];
for (const key of usedKeys) {
  if (!definedKeys.has(key)) {
    missingInElements.push(key);
  }
}
console.log('Keys used in code but NOT defined in elements:', missingInElements);

// Extract getElementById calls inside elements block
const getElemRegex = /([a-zA-Z0-9_]+)\s*:\s*document\.getElementById\(['"]([^'"]+)['"]\)/g;
const missingInHtml = [];
while ((match = getElemRegex.exec(elementsBlockMatch[1])) !== null) {
  const [_, prop, elemId] = match;
  if (!indexHtml.includes(`id="${elemId}"`) && !indexHtml.includes(`id='${elemId}'`)) {
    missingInHtml.push({ prop, elemId });
  }
}
console.log('Defined element IDs missing in index.html:', missingInHtml);
