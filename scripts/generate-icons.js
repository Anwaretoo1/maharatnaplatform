const fs = require('fs');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

function generateSVG(size) {
  const rx = Math.round(size * 0.15);
  const fontSize = Math.round(size * 0.35);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#2563eb" rx="${rx}"/><text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial" font-size="${fontSize}" font-weight="bold">م</text></svg>`;
}

sizes.forEach(size => {
  fs.writeFileSync(`public/icons/icon-${size}x${size}.png`, generateSVG(size));
});

console.log('Created icons for sizes:', sizes.join(', '));
