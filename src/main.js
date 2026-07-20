import './style.css'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { Observer } from 'gsap/Observer'
import lottie from 'lottie-web'

gsap.registerPlugin(Observer)

// --- INTRO OVERLAY LOGIC ---
const introOverlay = document.getElementById('intro-overlay')
const loadingState = document.getElementById('loading-state')
const flowerState = document.getElementById('flower-state')
const photoState = document.getElementById('photo-state')
const bgm = document.getElementById('bgm')

let introFinished = false;

const flowerCanvas = document.getElementById('flower-canvas');
const ctx = flowerCanvas.getContext('2d');
flowerCanvas.width = window.innerWidth;
flowerCanvas.height = window.innerHeight;

const flowerImages = [];
let loadedImagesCount = 0;
for (let i = 1; i <= 9; i++) {
  const img = new Image();
  img.src = `/flower/flower-${i}.png`;
  img.onload = () => { loadedImagesCount++; };
  flowerImages.push(img);
}

const canvasFlowers = [];
const numCanvasFlowers = 150;
const isMobile = window.innerWidth < 768;

function initCanvasFlowers() {
  for (let i = 0; i < numCanvasFlowers; i++) {
    const baseSize = isMobile ? 80 : 200;
    const sizeVar = isMobile ? 60 : 150;
    const size = baseSize + Math.random() * sizeVar;
    
    canvasFlowers.push({
      x: Math.random() * flowerCanvas.width,
      y: Math.random() * flowerCanvas.height,
      size: size,
      imgIndex: Math.floor(Math.random() * 9),
      rotation: Math.random() * Math.PI * 2,
      scalePhase: Math.random() * Math.PI * 2,
      scaleSpeed: 0.01 + Math.random() * 0.01,
      rotSpeed: (Math.random() - 0.5) * 0.01,
      opacity: 0.5 + Math.random() * 0.5
    });
  }
}

function animateCanvas() {
  if (introFinished) return; // Stop rendering once swiped out
  
  ctx.clearRect(0, 0, flowerCanvas.width, flowerCanvas.height);
  
  if (loadedImagesCount === 9) {
    if (canvasFlowers.length === 0) initCanvasFlowers();
    
    for (const f of canvasFlowers) {
      f.scalePhase += f.scaleSpeed;
      f.rotation += f.rotSpeed;
      
      const currentScale = 0.9 + Math.sin(f.scalePhase) * 0.15;
      const w = f.size * currentScale;
      const h = f.size * currentScale;
      
      ctx.save();
      ctx.globalAlpha = f.opacity;
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rotation);
      ctx.drawImage(flowerImages[f.imgIndex], -w/2, -h/2, w, h);
      ctx.restore();
    }
  }
  
  requestAnimationFrame(animateCanvas);
}
animateCanvas();

window.addEventListener('resize', () => {
  if (flowerCanvas) {
    flowerCanvas.width = window.innerWidth;
    flowerCanvas.height = window.innerHeight;
  }
});

// 2. Loading to Interactive Flower State
setTimeout(() => {
  loadingState.classList.remove('active');
  flowerState.classList.add('active');
  
  let swiped = false;
  
  Observer.create({
    target: flowerState,
    type: 'wheel,touch,pointer',
    onUp: () => handleSwipe('up'),
    onDown: () => handleSwipe('down'),
    onChange: (self) => {
      // Fallback for vertical wheel/trackpad scrolling
      if (self.deltaY > 20) handleSwipe('up');
      if (self.deltaY < -20) handleSwipe('down');
    }
  });

  function handleSwipe(direction) {
    if (swiped) return;
    swiped = true;
    
    // 1. Instantly reveal the photo state underneath the curtain
    photoState.style.transition = 'none'; // disable CSS fade-in
    photoState.classList.add('active');
    
    // 2. Determine how far to pull the curtain
    // Pulling up means we move it -200vh so its top edge completely clears the screen.
    // Pulling down means we move it 200vh.
    const moveY = direction === 'down' ? '200vh' : '-200vh';
    
    // Hide swipe hint immediately
    gsap.to('.swipe-hint', { opacity: 0, duration: 0.3 });
    
    // 3. Move the entire canvas out of the screen vertically
    gsap.to(flowerCanvas, {
      y: moveY,
      duration: 1.5,
      ease: "power3.inOut",
      onComplete: () => {
        // Hard-remove the flower state so it doesn't fade out
        flowerState.style.display = 'none';
        introFinished = true;
      }
    });
  }
}, 2000);

// -----------------------------

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
document.getElementById('canvas-container').appendChild(renderer.domElement)

const scene = new THREE.Scene()
// Deep Romantic Midnight
scene.background = new THREE.Color('#1a0b16')
scene.fog = new THREE.Fog('#1a0b16', 10, 40)

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200)

const SCALE = 16 
const TEX_VARIANTS = 34 // number of pap images in the /img folder
const textureLoader = new THREE.TextureLoader()
const textures = loadTextureVariants(TEX_VARIANTS, textureLoader)

// --- Butterfly Config (analyzed per image) ---
const BUTTERFLY_COUNT = 18; // total butterflies in the scene
const BUTTERFLY_CONFIGS = [
  { file: 'butterfly-1.png', scale: 0.8,  flapSpeed: 3.0,  weight: 1 },  // Purple, landscape wide
  { file: 'butterfly-2.png', scale: 1.1,  flapSpeed: 2.0,  weight: 1 },  // Red monarch, large & round
  { file: 'butterfly-3.png', scale: 1.0,  flapSpeed: 2.5,  weight: 1 },  // Yellow gold, symmetric
  { file: 'butterfly-4.png', scale: 1.2,  flapSpeed: 1.8,  weight: 1 },  // Teal swallowtail, biggest
  { file: 'butterfly-5.png', scale: 0.65, flapSpeed: 3.5,  weight: 2 },  // Pink, compact, most common
  { file: 'butterfly-6.png', scale: 0.75, flapSpeed: 2.8,  weight: 1 },  // Dark teal, elegant
];
const butterflyTextures = BUTTERFLY_CONFIGS.map(c =>
  textureLoader.load(`/butterfly/${c.file}`)
);

const TOTAL = 500 
const CAM_Z = 10 
const FOCUS_DIST = 5.5 
const MAX_SCALE = 14 
const Z_GATE = 11 

const LATERAL_OFFSET_RANGE = [-1, 1]
const DEPTH_OFFSET_RANGE = [-0.75, 0.75]
const SIZE_RANGE = [0.18, 0.4]

function randomBetween(min, max) {
  return min + Math.random() * (max - min)
}

function toScaledVector3([x, y, z], scale) {
  return new THREE.Vector3(x * scale, y * scale, z * scale)
}

function loadTextureVariants(count, loader) {
  return Array.from({ length: count }, (_, i) => loader.load(`/img/${i + 1}.webp`))
}

function buildCurve(raw) {
  const points = raw.map(p => toScaledVector3(p, SCALE))
  return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5)
}

function createParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 200, 210, 0.8)'); // soft pink center
  gradient.addColorStop(0.5, 'rgba(255, 200, 210, 0.2)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

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
  // Map UVs correctly to the bounding box
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);
    uv.setXY(i, (px - x) / size, (py - y) / size);
  }
  return geometry;
}

function getCurveFrame(curve, t) {
  const pos = curve.getPoint(t)
  const tangent = curve.getTangent(t)
  return { pos, nx: -tangent.y, ny: tangent.x }
}

async function init() {
  // We only load the heart path
  const rawPath = await fetch(`/paths/heart.json`).then(r => r.json())
  
  let curve = buildCurve(rawPath)
  let focusTGate = (FOCUS_DIST * 1.5) / curve.getLength()

  function createScaleAnimator(mesh) {
    const proxy = { value: 1 }
    return gsap.quickTo(proxy, 'value', {
      duration: 0.4,
      ease: 'power3.out',
      onUpdate: () => mesh.scale.setScalar(proxy.value),
    })
  }

  const planes = []

  for (let i = 0; i < TOTAL; i++) {
    const t = i / TOTAL 

    const { pos, nx, ny } = getCurveFrame(curve, t) 

    const lateralOffset = randomBetween(...LATERAL_OFFSET_RANGE) 
    const depthOffset = randomBetween(...DEPTH_OFFSET_RANGE)
    const size = randomBetween(...SIZE_RANGE)
    const cornerRadius = size * 0.08; // 8% of the size is the corner radius

    const mesh = new THREE.Mesh(
      createRoundedPlaneGeometry(size, cornerRadius),
      new THREE.MeshBasicMaterial({
        map: textures[Math.floor(Math.random() * TEX_VARIANTS)],
        side: THREE.DoubleSide,
      })
    )

    mesh.position.set(
      pos.x + nx * lateralOffset,
      pos.y + ny * lateralOffset,
      pos.z + depthOffset
    )

    mesh.userData.t = t
    mesh.userData.lateralOffset = lateralOffset
    mesh.userData.depthOffset = depthOffset
    mesh.userData.setScale = createScaleAnimator(mesh) 

    planes.push(mesh)
    scene.add(mesh)
  }

  // --- Particle System (Cinematic Dust) ---
  const particleCount = 500;
  const particlesGeo = new THREE.BufferGeometry();
  const posArray = new Float32Array(particleCount * 3);
  const phaseArray = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    // Spread across the heart path space roughly
    posArray[i * 3] = (Math.random() - 0.5) * 50;     // X
    posArray[i * 3 + 1] = (Math.random() - 0.5) * 50; // Y
    posArray[i * 3 + 2] = (Math.random() - 0.5) * 30; // Z
    phaseArray[i] = Math.random() * Math.PI * 2;
  }
  
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  particlesGeo.setAttribute('phase', new THREE.BufferAttribute(phaseArray, 1));

  const particlesMat = new THREE.PointsMaterial({
    size: 0.6,
    map: createParticleTexture(),
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    color: 0xffffff
  });

  const particleSystem = new THREE.Points(particlesGeo, particlesMat);
  scene.add(particleSystem);

  // --- Butterfly System ---
  const butterflies = [];
  
  // Build weighted pool for butterfly type selection
  const weightedPool = [];
  BUTTERFLY_CONFIGS.forEach((cfg, idx) => {
    for (let w = 0; w < cfg.weight; w++) weightedPool.push(idx);
  });
  
  for (let i = 0; i < BUTTERFLY_COUNT; i++) {
    const cfgIdx = weightedPool[Math.floor(Math.random() * weightedPool.length)];
    const cfg = BUTTERFLY_CONFIGS[cfgIdx];
    
    const bfGeo = new THREE.PlaneGeometry(cfg.scale, cfg.scale * 0.7); // slightly taller than wide
    const bfMat = new THREE.MeshBasicMaterial({
      map: butterflyTextures[cfgIdx],
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const bfMesh = new THREE.Mesh(bfGeo, bfMat);
    
    // Spread butterflies around the heart path area
    bfMesh.position.set(
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 15
    );
    
    bfMesh.userData = {
      phase: Math.random() * Math.PI * 2,
      flapSpeed: cfg.flapSpeed,
      driftSpeedX: 0.3 + Math.random() * 0.5,
      driftSpeedY: 0.2 + Math.random() * 0.4,
      driftPhaseX: Math.random() * Math.PI * 2,
      driftPhaseY: Math.random() * Math.PI * 2,
      baseY: bfMesh.position.y,
    };
    
    scene.add(bfMesh);
    butterflies.push(bfMesh);
  }

  function computeFocusScale(distance, maxDistance, maxScale) {
    const f = 1 - distance / maxDistance
    return 1 + f ** 3 * (maxScale - 1)
  }

  const camProxy = { t: 0 }
  const setCamT = gsap.quickTo(camProxy, 't', { duration: 1, ease: 'power3.out' })
  
  let targetT = 0
  const SENSITIVITY = 0.8 / (window.innerHeight * 4)
  let galleryStarted = false;
  let introTransitioning = false;
  let finaleTriggered = false;
  let finaleActive = false;
  let letterPhaseReady = false;
  let targetLetterProgress = 0;
  let islandTimer = null; 
  let letterFlowersTriggered = false;
  const letterProxy = { progress: 0 };
  const setLetterProgress = gsap.quickTo(letterProxy, 'progress', { duration: 1, ease: 'power3.out' });

  Observer.create({
    target: window,
    type: 'wheel,touch,pointer',
    onChange: (self) => {
      // Intro sequence scroll handling
      if (introFinished && !galleryStarted) {
        galleryStarted = true;
        // play music
        if (bgm) bgm.play().catch(e => console.log('Audio autoplay blocked'));
        // hide overlay with a cinematic curtain slide UP instead of just fading
        introOverlay.style.pointerEvents = 'none';
        introTransitioning = true;
        gsap.to(introOverlay, {
          y: '-100vh',
          duration: 1.5,
          ease: 'power3.inOut',
          onComplete: () => {
            introTransitioning = false;
          }
        });
        document.body.style.overflow = 'auto'; // allow scrolling
        return; // Prevent this initial scroll from moving camera
      }

      // Block scroll during finale animation
      if (finaleActive) return;

      // Letter Phase scroll handling
      if (letterPhaseReady) {
        // Hide dynamic island if they start scrolling
        if (islandTimer) {
          clearTimeout(islandTimer);
          islandTimer = null;
        }
        document.getElementById('dynamic-island')?.classList.remove('visible');

        // Map scroll delta to unroll progress (sensitivity 0.002)
        targetLetterProgress += self.deltaY * 0.002;
        targetLetterProgress = Math.max(0, Math.min(1, targetLetterProgress));
        
        setLetterProgress(targetLetterProgress);
        return;
      }

      // Normal 3D scroll handling
      if (!galleryStarted || introTransitioning || autoScroll) return;
      targetT += self.deltaY * SENSITIVITY
      setCamT(targetT)
    },
  })

  function updateLetterPhaseUI(progress) {
    const container = document.getElementById('letter-phase-container');
    const paper = document.querySelector('.scroll-paper-container');
    const content = document.querySelector('.scroll-paper-content');
    
    // Fade in the whole letter container only when they start scrolling
    if (progress > 0) {
      container.style.opacity = '1';
      container.style.pointerEvents = 'auto';
      
      if (!letterFlowersTriggered) {
        letterFlowersTriggered = true;
        triggerSideFlowers();
      }
    } else {
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      if (letterFlowersTriggered) {
        letterFlowersTriggered = false;
        resetSideFlowers();
      }
    }
    
    // Unroll the paper based on progress mapped to actual content height
    const maxPaperHeight = content.scrollHeight;
    const currentHeight = progress * maxPaperHeight;
    
    // Clamp the physical paper height to 75% of window height so it never overflows
    const visibleMaxHeight = window.innerHeight * 0.75;
    
    if (currentHeight <= visibleMaxHeight) {
      paper.style.height = `${currentHeight}px`;
      content.style.transform = `translateY(0px)`;
    } else {
      paper.style.height = `${visibleMaxHeight}px`;
      const scrollOffset = currentHeight - visibleMaxHeight;
      content.style.transform = `translateY(-${scrollOffset}px)`;
      
      // Trigger butterfly landing when max height is hit for the first time
      if (!letterBfLanded) {
        letterBfLanded = true;
        spawnRollerButterfly();
      }
    }
  }

  let sideAnimLeft = null;
  let sideAnimRight = null;

  function triggerSideFlowers() {
    const leftEl = document.getElementById('left-flower');
    const rightEl = document.getElementById('right-flower');
    const rightWrapper = document.getElementById('right-flower-wrapper');
    if (!leftEl || !rightEl || !rightWrapper) return;
    
    leftEl.style.opacity = '1';
    rightWrapper.style.opacity = '1';

    const baseConfig = { renderer: 'svg', loop: false, autoplay: false };

    sideAnimLeft = lottie.loadAnimation({ ...baseConfig, container: leftEl, path: '/flower-json/Floral Ornamental Design.json' });
    sideAnimRight = lottie.loadAnimation({ ...baseConfig, container: rightEl, path: '/flower-json/Flower Animation.json' });

    function onComplete(el) {
      return () => {
        gsap.to(el, {
          scale: 1.02,
          rotation: 2,
          duration: 3 + Math.random(), // natural variance
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut'
        });
      };
    }

    sideAnimLeft.addEventListener('DOMLoaded', () => {
      sideAnimLeft.play();
      sideAnimLeft.addEventListener('complete', onComplete(leftEl));
    });
    
    sideAnimRight.addEventListener('DOMLoaded', () => {
      setTimeout(() => sideAnimRight.play(), 300);
      sideAnimRight.addEventListener('complete', onComplete(rightEl));
    });
  }

  function resetSideFlowers() {
    const leftEl = document.getElementById('left-flower');
    const rightEl = document.getElementById('right-flower');
    if (leftEl) {
      gsap.killTweensOf(leftEl);
      gsap.set(leftEl, { scale: 1, rotation: 0 });
    }
    if (rightEl) {
      gsap.killTweensOf(rightEl);
      gsap.set(rightEl, { scale: 1, rotation: 0 });
    }
    if (sideAnimLeft) {
      sideAnimLeft.destroy();
      sideAnimLeft = null;
    }
    if (sideAnimRight) {
      sideAnimRight.destroy();
      sideAnimRight = null;
    }
  }

  function spawnRollerButterfly() {
    const wrapper = document.querySelector('.scroll-wrapper');
    const bf = document.createElement('img');
    bf.src = '/butterfly/butterfly-4.png'; // Tosca big butterfly
    bf.className = 'roller-landing-bf';
    wrapper.appendChild(bf);
    
    gsap.fromTo(bf, 
      {
        x: -400,
        y: -300,
        rotation: 45,
        scaleX: 0.1
      },
      {
        x: -(wrapper.offsetWidth * 0.07), // Left edge of the roller relative to wrapper
        y: -(document.querySelector('.scroll-top-roller').offsetHeight * 0.6), // Slightly above the center of the roller
        rotation: 15, // Slight tilt
        duration: 2.5,
        ease: 'power2.out'
      }
    );
    
    gsap.to(bf, {
      scaleX: 1,
      duration: 0.15,
      repeat: 16, // Fly for about 2.5 seconds (16 * 0.15 ~= 2.4)
      yoyo: true,
      ease: 'sine.inOut',
      onComplete: () => {
        gsap.to(bf, {
          scaleX: 0.6,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
      }
    });
  }

  const AUTO_SCROLL_DURATION = 10
  const AUTO_T_PER_SEC = 1 / AUTO_SCROLL_DURATION
  let autoScroll = false

  const camPos = { x: 0, y: 0, z: 0 }

  const scrollToggleBtn = document.getElementById('scroll-toggle')
  if (scrollToggleBtn) {
    scrollToggleBtn.addEventListener('click', () => {
      autoScroll = !autoScroll
      scrollToggleBtn.classList.toggle('active', autoScroll)
      scrollToggleBtn.textContent = autoScroll ? 'Auto' : 'Scroll'
    })
  }

  // --- Finale: cinematic zoom-out sequence ---
  const finaleOverlay = document.getElementById('finale-overlay');
  
  // Heart center in world space (path is centered at origin, scaled by SCALE=16)
  const heartCenterX = 0;
  const heartCenterY = 0.0005 * SCALE; // tiny offset from path data
  
  function triggerFinale() {
    finaleTriggered = true;
    finaleActive = true;
    autoScroll = false;
    
    // Remove 3D butterflies to free GPU resources before 2D butterflies arrive
    for (const bf of butterflies) {
      scene.remove(bf);
      bf.geometry.dispose();
      bf.material.dispose();
    }
    butterflies.length = 0;
    
    const tl = gsap.timeline();
    
    // Phase 1: Smoothly zoom the camera out to reveal the full heart (3 seconds)
    tl.to(camPos, {
      x: heartCenterX,
      y: heartCenterY,
      z: 75,
      duration: 3,
      ease: 'power2.inOut',
    }, 0);
    
    // Simultaneously expand the fog
    tl.to(scene.fog, {
      far: 200,
      near: 60,
      duration: 3,
      ease: 'power2.inOut',
    }, 0);
    
    // Phase 2: Show the finale overlay
    tl.to(finaleOverlay, {
      opacity: 1,
      duration: 1.5,
      ease: 'power1.in',
    }, 1.5);
    
    // Phase 3: Staggered text animations
    tl.to('.finale-sub', {
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: 'power3.out',
    }, 2.5);
    
    tl.to('.finale-title', {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1.5,
      ease: 'power3.out',
    }, 3.0);
    
    tl.to('.finale-divider', {
      opacity: 1,
      width: '180px',
      duration: 1,
      ease: 'power2.out',
    }, 3.8);
    
    // Name fades up
    tl.to('.finale-name', {
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: 'power3.out',
    }, 4.2);
    
    // Phase 4: Spawn 2D butterflies when "Cintan" appears
    tl.call(() => spawnFinaleButterflies(), null, 4.5);
  }
  
  function spawnFinaleButterflies() {
    const container = document.getElementById('finale-butterflies');
    const bfFiles = BUTTERFLY_CONFIGS.map(c => c.file);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    // Spawn 8 flying butterflies
    for (let i = 0; i < 8; i++) {
      const img = document.createElement('img');
      const fileIdx = Math.floor(Math.random() * bfFiles.length);
      img.src = `/butterfly/${bfFiles[fileIdx]}`;
      img.className = 'finale-bf';
      
      // Responsive size
      const minSize = Math.max(20, vw * 0.04);
      const maxSize = Math.max(25, vw * 0.05);
      const size = minSize + Math.random() * maxSize;
      img.style.width = `${size}px`;
      
      container.appendChild(img);
      
      // Random start position (from edges)
      const side = Math.floor(Math.random() * 4); // 0=left, 1=right, 2=top, 3=bottom
      let startX, startY;
      if (side === 0) { startX = -100; startY = Math.random() * vh; }
      else if (side === 1) { startX = vw + 100; startY = Math.random() * vh; }
      else if (side === 2) { startX = Math.random() * vw; startY = -100; }
      else { startX = Math.random() * vw; startY = vh + 100; }
      
      // Target: somewhere in the central area of the screen
      const endX = vw * 0.2 + Math.random() * vw * 0.6;
      const endY = vh * 0.15 + Math.random() * vh * 0.7;
      
      // Midpoint for organic curve
      const midX = (startX + endX) / 2 + (Math.random() - 0.5) * vw * 0.4;
      const midY = (startY + endY) / 2 + (Math.random() - 0.5) * vh * 0.3;
      
      gsap.set(img, { x: startX, y: startY });
      
      const delay = i * 0.3 + Math.random() * 0.5;
      const duration = 2.5 + Math.random() * 2;
      
      // Fly in along a bezier-like curved path
      const bfTl = gsap.timeline({ delay });
      
      bfTl.to(img, {
        opacity: 1,
        duration: 0.4,
      }, 0);
      
      // Phase A: fly to midpoint
      bfTl.to(img, {
        x: midX,
        y: midY,
        rotation: (Math.random() - 0.5) * 30,
        duration: duration * 0.5,
        ease: 'power1.inOut',
      }, 0);
      
      // Phase B: fly to end position with drift
      bfTl.to(img, {
        x: endX,
        y: endY,
        rotation: (Math.random() - 0.5) * 15,
        duration: duration * 0.5,
        ease: 'power1.inOut',
      }, duration * 0.5);
      
      // Continuous wing flap
      gsap.to(img, {
        scaleX: 0.15,
        duration: 0.15 + Math.random() * 0.1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay,
      });
      
      // Gentle hover after arriving
      gsap.to(img, {
        y: `+=${10 + Math.random() * 15}`,
        duration: 1.5 + Math.random(),
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: delay + duration,
      });
    }
    
    // Special butterfly: lands on the "n" in Cintan
    const nSpan = document.getElementById('cintan-n');
    if (!nSpan) return;
    
    const nRect = nSpan.getBoundingClientRect();
    const landX = nRect.right - 10; // right edge of the "n"
    const landY = nRect.top - 28;   // just above the top of "n"
    
    const landingBf = document.createElement('img');
    landingBf.src = '/butterfly/butterfly-5.png'; // Pink butterfly — most on-theme
    landingBf.className = 'finale-bf-landing';
    container.appendChild(landingBf);
    
    // Start from bottom-right corner
    const lStartX = vw * 0.85;
    const lStartY = vh + 50;
    
    gsap.set(landingBf, { x: lStartX, y: lStartY, rotation: -20 });
    
    const landTl = gsap.timeline({ delay: 1.2 });
    
    // Appear
    landTl.to(landingBf, { opacity: 1, duration: 0.3 }, 0);
    
    // Flap wings during flight
    const landFlap = gsap.to(landingBf, {
      scaleX: 0.15,
      duration: 0.12,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
    
    // Fly upward in a gentle S-curve
    landTl.to(landingBf, {
      x: vw * 0.5,
      y: vh * 0.4,
      rotation: 10,
      duration: 1.5,
      ease: 'power1.inOut',
    }, 0);
    
    // Approach the letter
    landTl.to(landingBf, {
      x: landX,
      y: landY,
      rotation: -8,
      duration: 1.2,
      ease: 'power2.out',
    }, 1.5);
    
    // Land: stop flapping, settle wings open
    landTl.call(() => {
      landFlap.kill();
      gsap.to(landingBf, {
        scaleX: 1,
        duration: 0.4,
        ease: 'power2.out',
      });
    }, null, 2.7);
    
    // Gentle breathing motion after landing
    landTl.to(landingBf, {
      scaleX: 0.85,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    }, 3.2);
    
    // End of finale animation, prepare letter phase
    landTl.call(() => {
      finaleActive = false;
      letterPhaseReady = true;
      // Do NOT show the letter automatically. It will appear when they scroll.
      startLiveCounter();

      // Start idle timer for dynamic island (4 seconds)
      islandTimer = setTimeout(() => {
        if (targetLetterProgress === 0) {
          document.getElementById('dynamic-island')?.classList.add('visible');
        }
      }, 4000);
    }, null, 4.0);
  }

  // --- Live Counter Logic ---
  let counterInterval;
  function startLiveCounter() {
    if (counterInterval) clearInterval(counterInterval);
    const startDate = new Date('2026-03-20T00:00:00'); // 20 Maret 2026
    const counterEl = document.getElementById('counter-numbers');
    
    counterInterval = setInterval(() => {
      const now = new Date();
      const diff = now - startDate;
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      
      counterEl.textContent = `${days} hari, ${hours} jam, ${minutes} menit, dan ${seconds} detik`;
    }, 1000);
  }



  let lastTime = performance.now()

  function animate() {
    requestAnimationFrame(animate)

    const now = performance.now()
    const delta = (now - lastTime) / 1000
    lastTime = now

    if (autoScroll && galleryStarted) {
      targetT += AUTO_T_PER_SEC * delta
      setCamT(targetT)
    }
    
    // Check for finale trigger: after 1.5 full loops forwards or backwards
    if (!finaleTriggered && galleryStarted && Math.abs(camProxy.t) >= 1.5) {
      triggerFinale();
    }
    
    const t = ((1 - camProxy.t) % 1 + 1) % 1

    const pathPos = curve.getPoint(t)
    // Only track the curve if the finale hasn't triggered.
    // Once finale triggers, GSAP controls the camera permanently.
    if (!finaleTriggered) {
      camPos.x = pathPos.x
      camPos.y = pathPos.y
      camPos.z = pathPos.z + CAM_Z
    }
    camera.position.set(camPos.x, camPos.y, camPos.z)

    for (const plane of planes) {
      const dx = camera.position.x - plane.position.x
      const dy = camera.position.y - plane.position.y
      const dz = Math.abs(camera.position.z - plane.position.z)
      
      // FRUSTUM CULLING OPTIMIZATION
      // If plane is extremely far away (dist > 40), don't render it.
      // IMPORTANT: Disable culling if finaleTriggered is true, because we zoom out to see the entire love shape!
      if (!finaleTriggered) {
        const totalDistSq = dx * dx + dy * dy + dz * dz;
        if (totalDistSq > 1600) { 
          plane.visible = false;
          continue; 
        }
      }
      
      plane.visible = true;

      const distXY = Math.sqrt(dx * dx + dy * dy)

      let dt = Math.abs(plane.userData.t - t)
      if (dt > 0.5) {
        dt = 1 - dt
      }

      const isInFocusZone = dt < focusTGate && dz < Z_GATE && distXY < FOCUS_DIST
      const targetScale = isInFocusZone ? computeFocusScale(distXY, FOCUS_DIST, MAX_SCALE) : 1

      plane.userData.setScale(targetScale)
    }

    // --- Update Particles ---
    const positions = particlesGeo.attributes.position.array;
    const phases = particlesGeo.attributes.phase.array;
    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      // Very slow fall
      positions[idx + 1] -= 0.3 * delta;
      
      // Organic drifting
      positions[idx] += Math.sin(now * 0.001 + phases[i]) * 0.2 * delta;
      positions[idx + 2] += Math.cos(now * 0.0008 + phases[i]) * 0.2 * delta;
      
      // Infinite loop
      if (positions[idx + 1] < -25) {
        positions[idx + 1] = 25;
      }
    }
    particlesGeo.attributes.position.needsUpdate = true;

    // --- Update Butterflies ---
    const timeS = now * 0.001; // time in seconds
    for (const bf of butterflies) {
      const ud = bf.userData;
      
      // Wing flap: scaleX oscillates between 0.15 and 1.0
      const flapVal = Math.sin(timeS * ud.flapSpeed * Math.PI * 2 + ud.phase);
      bf.scale.x = 0.15 + (1 - 0.15) * (flapVal * 0.5 + 0.5);
      
      // Organic drift (sine wave flight path)
      bf.position.x += Math.sin(timeS * ud.driftSpeedX + ud.driftPhaseX) * 0.4 * delta;
      bf.position.y = ud.baseY + Math.sin(timeS * ud.driftSpeedY + ud.driftPhaseY) * 1.5;
      
      // Subtle rotation to face flight direction
      bf.rotation.z = Math.sin(timeS * ud.driftSpeedX + ud.driftPhaseX) * 0.15;
      bf.rotation.x = 0.3; // slight tilt forward for perspective
    }
    
    if (letterPhaseReady) {
      updateLetterPhaseUI(letterProxy.progress);
    }

    renderer.render(scene, camera)
  }

  animate();
}

init()

window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
  
  // Re-calculate any cached window-dependent variables if needed
  // Note: CSS clamps and flexbox handle most resizing gracefully without JS
})