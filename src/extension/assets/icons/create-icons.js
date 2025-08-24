// Simple script to create placeholder icons for EventConnect extension
const fs = require('fs');
const path = require('path');

// SVG template for EventConnect icon (simple calendar with event dot)
const createSVG = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Background circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="#4285f4" stroke="#fff" stroke-width="2"/>
  
  <!-- Calendar icon -->
  <rect x="${size*0.25}" y="${size*0.3}" width="${size*0.5}" height="${size*0.4}" fill="white" rx="2"/>
  <rect x="${size*0.25}" y="${size*0.35}" width="${size*0.5}" height="${size*0.05}" fill="#4285f4"/>
  
  <!-- Event dot -->
  <circle cx="${size*0.65}" cy="${size*0.55}" r="${size*0.08}" fill="#34a853"/>
</svg>
`;

// Create SVG files
const sizes = [16, 48, 128];
sizes.forEach(size => {
  const svgContent = createSVG(size);
  fs.writeFileSync(`src/extension/assets/icons/icon-${size}.svg`, svgContent.trim());
  console.log(`Created icon-${size}.svg`);
});

console.log('Icon SVGs created. Convert to PNG using online tools or ImageMagick for production.');
