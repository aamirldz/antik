/**
 * testimonials.ts — Act 7: Cinema Credits Testimonials
 * 
 * Sticky container with testimonials that fade in/hold/fade out
 * as user scrolls through a tall section.
 * Three.js wireframe background with bloom provides ambient motion.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export function initTestimonials(): void {
  const section = document.getElementById('act-testimonials') as HTMLElement;
  const bgCanvas = document.getElementById('testimonials-bg-canvas') as HTMLCanvasElement;
  const testimonials = section?.querySelectorAll<HTMLElement>('.testimonial');
  if (!section || !testimonials?.length) return;

  // ─── Three.js Wireframe Background ───
  if (bgCanvas) {
    initWireframeBackground(bgCanvas);
  }

  // ─── Testimonial scroll timeline ───
  // Divide section into equal parts for each testimonial
  const count = testimonials.length;
  const sectionDuration = 1 / count;

  testimonials.forEach((testimonial, i) => {
    const start = i * sectionDuration;
    const fadeIn = start;
    const fadeOut = start + sectionDuration * 0.85;

    // Fade in
    gsap.fromTo(testimonial,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0,
        scrollTrigger: {
          trigger: section,
          start: `${fadeIn * 100}% top`,
          end: `${(fadeIn + sectionDuration * 0.3) * 100}% top`,
          scrub: 1,
        },
      }
    );

    // Fade out
    gsap.to(testimonial, {
      opacity: 0, y: -30,
      scrollTrigger: {
        trigger: section,
        start: `${fadeOut * 100}% top`,
        end: `${(fadeOut + sectionDuration * 0.15) * 100}% top`,
        scrub: 1,
      },
    });
  });
}

function initWireframeBackground(canvas: HTMLCanvasElement): void {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 8);

  // Wireframe shapes
  const shapes: THREE.Mesh[] = [];
  const geometries = [
    new THREE.IcosahedronGeometry(2, 0),
    new THREE.OctahedronGeometry(1.5, 0),
    new THREE.TetrahedronGeometry(1.8, 0),
  ];
  const positions = [
    [-3, 1, 0],
    [3, -1, 2],
    [0, 2, -2],
  ];

  geometries.forEach((geo, i) => {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x3d3a34,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(positions[i][0], positions[i][1], positions[i][2]);
    shapes.push(mesh);
    scene.add(mesh);
  });

  // Bloom
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.6, 0.5, 0.7
  );
  composer.addPass(bloom);

  // Animate
  let startTime = performance.now();
  let visible = false;

  const observer = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
  }, { threshold: 0.1 });
  observer.observe(canvas);

  function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;

    const elapsed = (performance.now() - startTime) / 1000;
    shapes.forEach((mesh, i) => {
      mesh.rotation.x = elapsed * (0.05 + i * 0.02);
      mesh.rotation.y = elapsed * (0.08 + i * 0.03);
    });

    composer.render();
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });
}
