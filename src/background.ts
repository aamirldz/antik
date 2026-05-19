/**
 * background.ts — Persistent Three.js Starfield Background
 * 
 * Optimized for maximum scroll performance:
 * - 2,500 particles (down from 8,000 for better FPS during scroll)
 * - Direct WebGL rendering (removed heavy EffectComposer/Bloom/FXAA)
 * - Subtle mouse parallax on camera
 * 
 * This runs continuously behind all 8 acts.
 */

import * as THREE from 'three';

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let starfield: THREE.Points;

let mouseX = 0;
let mouseY = 0;
let baseCamX = 0;
let baseCamY = 0;
let startTime = 0;

export function initBackground(): void {
  const canvas = document.getElementById('bg-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  // ─── Renderer ───
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Cap pixel ratio at 1.5 to save massive memory/fill-rate on high-DPI screens
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // ─── Scene ───
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);
  scene.fog = new THREE.FogExp2(0x050505, 0.003);

  // ─── Camera ───
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 5);
  baseCamX = 0;
  baseCamY = 0;

  // ─── Create Stars ───
  createStarfield();

  // ─── Ambient Glow ───
  createAmbientGlow();

  // ─── Mouse Parallax ───
  document.addEventListener('mousemove', (e) => {
    // Throttled mouse tracking for better performance is recommended,
    // but standard read here is very lightweight
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // ─── Resize ───
  window.addEventListener('resize', onResize, { passive: true });

  // ─── Start ───
  startTime = performance.now();
  animate();
}

function createStarfield(): void {
  // Lower particle count = significantly smoother scroll on mid-tier GPUs
  const count = 2500;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    // Spherical distribution
    const radius = 30 + Math.random() * 300;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i3]     = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);

    // Color variety: warm tones
    const roll = Math.random();
    if (roll > 0.9) {
      // 10% amber/gold stars
      colors[i3]     = 0.9 + Math.random() * 0.1;
      colors[i3 + 1] = 0.6 + Math.random() * 0.2;
      colors[i3 + 2] = 0.3 + Math.random() * 0.1;
    } else if (roll > 0.75) {
      // 15% warm white
      colors[i3]     = 0.95;
      colors[i3 + 1] = 0.9;
      colors[i3 + 2] = 0.8;
    } else {
      // 75% neutral white
      const b = 0.5 + Math.random() * 0.5;
      colors[i3]     = b;
      colors[i3 + 1] = b;
      colors[i3 + 2] = b;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.25, // Slightly larger to compensate for no bloom
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  starfield = new THREE.Points(geo, mat);
  scene.add(starfield);
}

function createAmbientGlow(): void {
  // Subtle warm ambient
  scene.add(new THREE.AmbientLight(0x0a0908, 0.2));

  // Distant warm point light
  const glow = new THREE.PointLight(0xc8a97e, 0.5, 200, 2);
  glow.position.set(20, 10, -50);
  scene.add(glow);
}

function animate(): void {
  requestAnimationFrame(animate);

  const elapsed = (performance.now() - startTime) / 1000;

  // Slow starfield rotation
  if (starfield) {
    starfield.rotation.y = elapsed * 0.005;
    starfield.rotation.x = elapsed * 0.002;
  }

  // Mouse parallax on camera (very subtle)
  baseCamX += (mouseX * 0.3 - baseCamX) * 0.02;
  baseCamY += (-mouseY * 0.2 - baseCamY) * 0.02;
  camera.position.x = baseCamX;
  camera.position.y = baseCamY;
  camera.lookAt(0, 0, 0);

  // Direct render is infinitely faster than EffectComposer
  renderer.render(scene, camera);
}

function onResize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
