const fs = require('fs');
const path = require('path');

const colorMap = {
  'green-50': '#F7FAF6',
  'green-100': '#EDF3EB',
  'green-200': '#D6E4D2',
  'green-300': '#B3CEAD',
  'green-400': '#8AB382',
  'green-500': '#5D7A57',
  'green-600': '#4A6B43',
  'green-700': '#3D5A37',
  'green-800': '#6B4E3D',
  'green-900': '#4A3728',
  'green-950': '#2C1F14',
};

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  for (const [tailwind, hex] of Object.entries(colorMap)) {
    const regex = new RegExp('(^|[^\\w])' + tailwind + '([^\\w]|$)', 'g');
    const matches = content.match(regex);
    if (matches) {
      console.log('Found', tailwind, 'in', filePath, ':', matches.length, 'matches');
      const newContent = content.replace(regex, (match, p1, p2) => p1 + '[' + hex + ']' + p2);
      if (newContent !== content) {
        changed = true;
        content = newContent;
      }
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      replaceInFile(fullPath);
    }
  }
}

walk('src');
console.log('Done!');