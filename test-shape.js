import * as THREE from 'three';
const shape = new THREE.Shape();
shape.moveTo(0, 0);
shape.lineTo(1, 0);
shape.lineTo(1, 1);
shape.lineTo(0, 1);
const geometry = new THREE.ShapeGeometry(shape);
console.log("UV attribute exists:", !!geometry.attributes.uv);
