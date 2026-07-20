const fs = require('fs');

const numPoints = 1000; // use more points for a smoother curve
const points = [];

for (let i = 0; i < numPoints; i++) {
    // distribute t from 0 to 2PI
    const t = (i / numPoints) * Math.PI * 2;
    
    // Heart shape parametric equations
    // The original path data is small, bounded roughly between -1 to 1 in y and z (but offset in x)
    // The scale multiplier in main.js is 16.
    // Let's create a heart in the XY plane, but orient it so the camera travels along it nicely.
    // Original path: X is around -27 to -29. Y is -0.7 to 0.7. Z is -1 to +1.
    // Let's just generate a heart centered at [0, 0, 0]. The 3D engine will just center on it.
    
    // x = 16 sin^3(t)
    // y = 13 cos(t) - 5 cos(2t) - 2 cos(3t) - cos(4t)
    // Scale it down by 16 so it's roughly between -1 and 1, similar to the original points
    
    const x = (16 * Math.pow(Math.sin(t), 3)) / 16;
    const y = (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) / 16;
    
    // We want the camera to move along the heart.
    // We'll lay the heart flat on the XZ plane, or keep it on the XY plane?
    // In original path, X was roughly constant (-28), while Y and Z varied. This means the path was on the YZ plane.
    // Let's put our heart on the XZ plane (so y is flat) or YZ plane (x is flat).
    // Let's put it on the XY plane and see.
    // Let's actually add a slight Z variation so it's a 3D heart path.
    const z = Math.sin(t * 2) * 0.3;

    points.push([x * 1.5, y * 1.5, z]); // scale it up slightly so it's spacious
}

// close the loop
points.push(points[0]);

fs.writeFileSync('public/paths/heart.json', JSON.stringify(points));
console.log('Heart path generated successfully!');
