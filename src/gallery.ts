/**
 * gallery.ts — Act 4: 3D Depth-Mapped Photo Gallery
 * 
 * Creates 6 gallery items with Three.js PlaneGeometry per image.
 * Each plane has a depth displacement shader that reacts to mouse position.
 * Placeholder images and depth maps are generated as canvas textures.
 * GSAP staggers the reveal on scroll.
 */

import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

const GALLERY_ITEMS = [
  { title: 'Golden Hour', category: 'Photography' },
  { title: 'Kinetic Flow', category: 'Motion Design' },
  { title: 'Urban Decay', category: 'Documentary' },
  { title: 'Neon Dreams', category: 'Photography' },
  { title: 'Brand Pulse', category: 'Graphic Design' },
  { title: 'Silent City', category: 'Photography' },
];

export function initGallery(): void {
  const grid = document.getElementById('gallery-grid') as HTMLElement;
  if (!grid) return;

  GALLERY_ITEMS.forEach((item, i) => {
    // Create DOM structure
    const el = document.createElement('div');
    el.className = 'gallery__item';
    el.dataset.cursorHover = '';
    el.innerHTML = `
      <canvas id="gallery-canvas-${i}"></canvas>
      <div class="gallery__item-info">
        <div class="gallery__item-title">${item.title}</div>
        <div class="gallery__item-category">${item.category}</div>
      </div>
    `;
    grid.appendChild(el);

    // Initialize Three.js per item (deferred for performance)
    requestAnimationFrame(() => initGalleryItem(el, i));

    // Scroll stagger reveal
    gsap.fromTo(el,
      { opacity: 0, y: 80, scale: 0.92 },
      {
        opacity: 1, y: 0, scale: 1,
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          end: 'top 50%',
          scrub: 1,
        },
      }
    );
  });
}

function initGalleryItem(container: HTMLElement, index: number): void {
  const canvas = container.querySelector('canvas') as HTMLCanvasElement;
  if (!canvas) return;

  const rect = container.getBoundingClientRect();
  const w = rect.width || 400;
  const h = rect.height || 500;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.01, 10);
  camera.position.z = 1;

  // Generate textures
  const imageTexture = generateImageTexture(index);
  const depthTexture = generateDepthTexture(index);

  // Depth displacement shader
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: imageTexture },
      uDepthMap: { value: depthTexture },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uIntensity: { value: 0.03 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      uniform sampler2D uDepthMap;
      uniform vec2 uMouse;
      uniform float uIntensity;
      varying vec2 vUv;
      void main() {
        float depth = texture2D(uDepthMap, vUv).r;
        vec2 offset = (uMouse - 0.5) * depth * uIntensity;
        vec2 distortedUv = vUv + offset;
        gl_FragColor = texture2D(uTexture, distortedUv);
      }
    `,
  });

  const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  scene.add(plane);

  // Mouse tracking with LERP
  let targetMouse = { x: 0.5, y: 0.5 };
  let currentMouse = { x: 0.5, y: 0.5 };

  container.addEventListener('mousemove', (e) => {
    const r = container.getBoundingClientRect();
    targetMouse.x = (e.clientX - r.left) / r.width;
    targetMouse.y = 1.0 - (e.clientY - r.top) / r.height;
  });

  container.addEventListener('mouseleave', () => {
    targetMouse = { x: 0.5, y: 0.5 };
  });

  // Render loop (only when visible)
  let visible = false;
  const observer = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
  }, { threshold: 0.1 });
  observer.observe(container);

  function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;

    // LERP mouse
    currentMouse.x += (targetMouse.x - currentMouse.x) * 0.08;
    currentMouse.y += (targetMouse.y - currentMouse.y) * 0.08;
    material.uniforms.uMouse.value.set(currentMouse.x, currentMouse.y);

    renderer.render(scene, camera);
  }
  animate();
}

function generateImageTexture(index: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 640;
  const ctx = c.getContext('2d')!;

  // Each image has a unique warm gradient
  const hueShifts = [0, 20, -10, 30, 15, -5];
  const baseR = 100 + hueShifts[index] % 60;
  const baseG = 80 + index * 10;
  const baseB = 60 + index * 5;

  const g = ctx.createLinearGradient(0, 0, 512, 640);
  g.addColorStop(0, `rgb(${baseR + 80},${baseG + 60},${baseB + 30})`);
  g.addColorStop(0.5, `rgb(${baseR},${baseG},${baseB})`);
  g.addColorStop(1, `rgb(${Math.max(baseR - 40, 10)},${Math.max(baseG - 30, 10)},${Math.max(baseB - 20, 5)})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 640);

  // Abstract shapes
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(
      100 + Math.random() * 312,
      100 + Math.random() * 440,
      30 + Math.random() * 80,
      0, Math.PI * 2
    );
    ctx.fillStyle = `rgba(200,169,126,${0.05 + Math.random() * 0.1})`;
    ctx.fill();
  }

  // Film grain
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = `rgba(245,245,240,${Math.random() * 0.04})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 640, 1, 1);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function generateDepthTexture(index: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 640;
  const ctx = c.getContext('2d')!;

  // Simple radial depth map (center = near/white, edges = far/black)
  const g = ctx.createRadialGradient(
    256 + (index % 3 - 1) * 60,
    320 + (index % 2) * 40,
    20,
    256, 320, 300
  );
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.5, '#888888');
  g.addColorStop(1, '#222222');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 640);

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}
