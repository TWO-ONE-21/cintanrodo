const fs = require('fs');

const numPoints = 500;
const points = [];

for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) * Math.PI * 2;
    // Heart shape parametric equations
    // scaled down to roughly match the original [-1, 1] range
    const x = (16 * Math.pow(Math.sin(t), 3)) / 16;
    const y = (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) / 16;
    const z = 0; // Flat on Z axis, or we can add a slight sine wave for 3D effect
    
    // adding a slight wave on Z just for some depth
    const z_wave = Math.sin(t * 2) * 0.5;

    points.push([x, y, z_wave]);
}

fs.writeFileSync('public/paths/heart.json', JSON.stringify(points));
console.log('Heart path generated!');
