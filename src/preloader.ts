/**
 * preloader.ts — Act 1: Lens Focus Ring Preloader
 * 
 * A premium camera-themed preloader featuring:
 * - Warm bokeh background with floating light orbs
 * - Photorealistic lens image rotating clockwise
 * - "ANTIK" text that gradually comes into focus (blur → sharp)
 * - Gold progress bar synced to simulated loading
 * - Smooth scale-out transition to hero
 */

import gsap from 'gsap';

// ─── Configuration ───
const BOKEH_COUNT = 35;
const ROTATION_SPEED = 0.12; // Degrees per frame (clockwise)

interface BokehOrb {
  x: number; y: number;
  radius: number;
  opacity: number;
  hue: number;
  driftX: number; driftY: number;
  pulseSpeed: number;
  pulsePhase: number;
}

let destroyed = false;
let rafId: number | null = null;

export function initPreloader(onComplete: () => void): void {
  const bgCanvas = document.getElementById('preloader-bg') as HTMLCanvasElement;
  const lensImg = document.getElementById('preloader-lens') as HTMLImageElement;
  const textEl = document.getElementById('preloader-text') as HTMLElement;
  const brandEl = textEl?.querySelector('.preloader__brand') as HTMLElement;
  const subtitleEl = textEl?.querySelector('.preloader__subtitle') as HTMLElement;
  const bar = document.getElementById('preloader-bar') as HTMLElement;
  const pct = document.getElementById('preloader-percent') as HTMLElement;

  if (!bgCanvas) { onComplete(); return; }

  // ─── Background Canvas (Bokeh) ───
  const bgCtx = bgCanvas.getContext('2d')!;
  const dpr = Math.min(window.devicePixelRatio, 2);

  function resizeBg() {
    bgCanvas.width = window.innerWidth * dpr;
    bgCanvas.height = window.innerHeight * dpr;
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeBg();

  // Generate bokeh orbs
  const orbs: BokehOrb[] = [];
  for (let i = 0; i < BOKEH_COUNT; i++) {
    orbs.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: 20 + Math.random() * 80,
      opacity: 0.015 + Math.random() * 0.05,
      hue: 22 + Math.random() * 25,
      driftX: (Math.random() - 0.5) * 0.25,
      driftY: (Math.random() - 0.5) * 0.15,
      pulseSpeed: 0.4 + Math.random() * 1.2,
      pulsePhase: Math.random() * Math.PI * 2,
    });
  }

  function drawBackground(elapsed: number) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Base — pure black to match lens image background
    bgCtx.fillStyle = '#000000';
    bgCtx.fillRect(0, 0, w, h);

    // Top-right warm light leak
    const leak = bgCtx.createRadialGradient(w * 0.78, h * 0.12, 0, w * 0.78, h * 0.12, w * 0.45);
    leak.addColorStop(0, 'rgba(200, 155, 90, 0.07)');
    leak.addColorStop(0.5, 'rgba(180, 120, 60, 0.025)');
    leak.addColorStop(1, 'transparent');
    bgCtx.fillStyle = leak;
    bgCtx.fillRect(0, 0, w, h);

    // Bottom-left subtle cool leak
    const leak2 = bgCtx.createRadialGradient(w * 0.18, h * 0.88, 0, w * 0.18, h * 0.88, w * 0.35);
    leak2.addColorStop(0, 'rgba(120, 140, 180, 0.03)');
    leak2.addColorStop(1, 'transparent');
    bgCtx.fillStyle = leak2;
    bgCtx.fillRect(0, 0, w, h);

    // Bokeh orbs
    orbs.forEach(orb => {
      orb.x += orb.driftX;
      orb.y += orb.driftY;
      if (orb.x < -orb.radius) orb.x = w + orb.radius;
      if (orb.x > w + orb.radius) orb.x = -orb.radius;
      if (orb.y < -orb.radius) orb.y = h + orb.radius;
      if (orb.y > h + orb.radius) orb.y = -orb.radius;

      const pulse = Math.sin(elapsed * orb.pulseSpeed + orb.pulsePhase) * 0.35 + 0.65;
      const op = orb.opacity * pulse;

      const g = bgCtx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
      g.addColorStop(0, `hsla(${orb.hue}, 55%, 60%, ${op * 1.8})`);
      g.addColorStop(0.35, `hsla(${orb.hue}, 50%, 50%, ${op})`);
      g.addColorStop(1, `hsla(${orb.hue}, 40%, 40%, 0)`);
      bgCtx.fillStyle = g;
      bgCtx.fillRect(orb.x - orb.radius, orb.y - orb.radius, orb.radius * 2, orb.radius * 2);
    });

    // Subtle film grain
    for (let i = 0; i < 500; i++) {
      bgCtx.fillStyle = `rgba(200,180,150,${Math.random() * 0.02})`;
      bgCtx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    }
  }

  // ─── Animation State ───
  let elapsed = 0;
  let lensRotation = 0;
  const clock = { prev: performance.now() };

  // Set initial blur
  if (brandEl) brandEl.style.filter = 'blur(18px)';
  if (subtitleEl) {
    subtitleEl.style.filter = 'blur(12px)';
    subtitleEl.style.opacity = '0';
  }

  // ─── Render Loop ───
  function render() {
    if (destroyed) return;
    rafId = requestAnimationFrame(render);

    const now = performance.now();
    const dt = (now - clock.prev) / 1000;
    clock.prev = now;
    elapsed += dt;

    // Animated bokeh background
    drawBackground(elapsed);

    // Rotate the lens image clockwise
    lensRotation += ROTATION_SPEED;
    if (lensImg) {
      lensImg.style.transform = `rotate(${lensRotation}deg)`;
    }
  }
  render();

  // ─── Loading Progress ───
  const prog = { value: 0 };

  function updateProgress(v: number) {
    const p = Math.round(v);
    if (bar) bar.style.width = `${p}%`;
    if (pct) pct.textContent = `${p}%`;

    // Blur: 0% → 18px, 100% → 0px
    const blur = 18 * (1 - v / 100);
    if (brandEl) brandEl.style.filter = `blur(${blur}px)`;

    // Subtitle fades in after 25%
    if (subtitleEl) {
      const sub = Math.max(0, (v - 25) / 75);
      subtitleEl.style.filter = `blur(${12 * (1 - sub)}px)`;
      subtitleEl.style.opacity = String(Math.min(1, sub * 1.3));
    }
  }

  gsap.timeline()
    .to(prog, {
      value: 40, duration: 1.0, ease: 'power2.out',
      onUpdate: () => updateProgress(prog.value),
    })
    .to(prog, {
      value: 75, duration: 0.8, ease: 'power1.inOut',
      onUpdate: () => updateProgress(prog.value),
    })
    .to(prog, {
      value: 95, duration: 0.6, ease: 'power1.in',
      onUpdate: () => updateProgress(prog.value),
    })
    .to(prog, {
      value: 100, duration: 0.4, ease: 'power2.out',
      onUpdate: () => updateProgress(prog.value),
      onComplete: exitPreloader,
    });

  // ─── Exit Transition ───
  function exitPreloader() {
    gsap.timeline()
      .to({}, { duration: 0.4 })
      // Scale lens up and fade
      .to('.preloader__lens-container', {
        scale: 1.6,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.in',
      }, 0.4)
      .to('.preloader__ui', {
        opacity: 0,
        y: 20,
        duration: 0.4,
        ease: 'power2.in',
      }, 0.4)
      .to('#preloader-bg', {
        opacity: 0,
        duration: 0.7,
        ease: 'power2.in',
      }, 0.6)
      .call(() => {
        destroyed = true;
        if (rafId) cancelAnimationFrame(rafId);
        onComplete();
      }, [], 1.4);
  }

  // ─── Resize ───
  window.addEventListener('resize', () => {
    if (destroyed) return;
    resizeBg();
  });
}
