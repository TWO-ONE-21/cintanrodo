import * as THREE from 'three';
function createRoundedPlaneGeometry(size, radius) {
  const shape = new THREE.Shape();
  const x = -size / 2;
  const y = -size / 2;
  shape.moveTo(x, y + radius);
  shape.lineTo(x, y + size - radius);
  shape.quadraticCurveTo(x, y + size, x + radius, y + size);
  shape.lineTo(x + size - radius, y + size);
  shape.quadraticCurveTo(x + size, y + size, x + size, y + size - radius);
  shape.lineTo(x + size, y + radius);
  shape.quadraticCurveTo(x + size, y, x + size - radius, y);
  shape.lineTo(x + radius, y);
  shape.quadraticCurveTo(x, y, x, y + radius);
  
  const geometry = new THREE.ShapeGeometry(shape);
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);
    uv.setXY(i, (px - x) / size, (py - y) / size);
  }
  return geometry;
}
const geo = createRoundedPlaneGeometry(0.4, 0.032);
console.log("Pos count:", geo.attributes.position.count);
console.log("UV count:", geo.attributes.uv.count);
console.log("Sample UV:", geo.attributes.uv.getX(0), geo.attributes.uv.getY(0));
