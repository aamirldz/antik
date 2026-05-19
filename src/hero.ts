/**
 * hero.ts — Act 2: Scroll-Driven Frame Sequence
 * 
 * ZERO-LATENCY approach: directly reads scrollY in a rAF loop
 * and maps it to frame index. No GSAP scrub delay.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 160;
const FRAME_PATH  = '/frames/hero/ezgif-frame-';

function getFrameSrc(index: number): string {
  return `${FRAME_PATH}${String(index).padStart(3, '0')}.jpg`;
}

export function initHero(): void {
  const section   = document.getElementById('act-hero') as HTMLElement;
  const canvas    = document.getElementById('hero-canvas') as HTMLCanvasElement;
  const lensGlow  = document.getElementById('hero-lens-glow') as HTMLElement;
  const overlay   = document.getElementById('hero-overlay') as HTMLElement;
  const overline  = overlay?.querySelector('.hero__overline') as HTMLElement;
  const heroName  = overlay?.querySelector('.hero__name') as HTMLElement;
  const tagline   = overlay?.querySelector('.hero__tagline') as HTMLElement;
  const scrollCue = document.getElementById('hero-scroll-cue') as HTMLElement;
  const heroBlackout = document.getElementById('hero-blackout') as HTMLElement;

  if (!section || !canvas) return;

  const ctx = canvas.getContext('2d', { alpha: false })!;
  const frames: HTMLImageElement[] = new Array(FRAME_COUNT);
  let loadedCount = 0;
  let lastDrawnFrame = -1;
  let allLoaded = false;

  // ─── Resize canvas ───
  function resizeCanvas(): void {
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width  = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    lastDrawnFrame = -1; // force redraw
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // ─── Draw frame (cover fit) ───
  function drawFrame(index: number): void {
    if (index === lastDrawnFrame) return;
    const img = frames[index];
    if (!img || !img.complete || !img.naturalWidth) return;

    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const scale = Math.max(cw / iw, ch / ih);
    const sw = iw * scale;
    const sh = ih * scale;
    const sx = (cw - sw) / 2;
    const sy = (ch - sh) / 2;

    ctx.drawImage(img, sx, sy, sw, sh);
    lastDrawnFrame = index;
  }

  // ─── Load frames in order ───
  function loadFrame(i: number): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = getFrameSrc(i + 1); // 1-based filename
      img.onload = () => {
        frames[i] = img;
        loadedCount++;
        if (i === 0) drawFrame(0);
        if (loadedCount === FRAME_COUNT) {
          allLoaded = true;
          console.log(`✦ Hero: All ${FRAME_COUNT} frames loaded`);
        }
        resolve();
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === FRAME_COUNT) allLoaded = true;
        resolve();
      };
    });
  }

  // Load first 10 frames sequentially for instant response, then batch
  async function preloadFrames(): Promise<void> {
    for (let i = 0; i < Math.min(10, FRAME_COUNT); i++) {
      await loadFrame(i);
    }
    for (let batch = 10; batch < FRAME_COUNT; batch += 20) {
      const promises: Promise<void>[] = [];
      for (let i = batch; i < Math.min(batch + 20, FRAME_COUNT); i++) {
        promises.push(loadFrame(i));
      }
      await Promise.all(promises);
    }
  }

  preloadFrames();

  // ─── Text entrance animation ───
  const textTl = gsap.timeline({ paused: true });
  textTl.set([overline, heroName, tagline, scrollCue], { opacity: 0 });
  textTl.to(overline, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0);
  textTl.to(heroName, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, 0.2);
  textTl.to(tagline,  { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0.5);
  textTl.to(scrollCue, { opacity: 1, duration: 0.6 }, 1);

  setTimeout(() => textTl.play(), 500);

  // ─── DIRECT SCROLL → FRAME MAPPING ───
  function getScrollProgress(): number {
    const rect = section.getBoundingClientRect();
    const sectionTop = window.scrollY + rect.top;
    const sectionHeight = section.offsetHeight - window.innerHeight;
    const scrolled = window.scrollY - sectionTop;
    return Math.max(0, Math.min(1, scrolled / sectionHeight));
  }

  let rafId: number;
  let isActive = true;
  let lastProgress = -1;

  function onFrame(): void {
    if (!isActive) return;

    const progress = getScrollProgress();
    
    // Only run expensive DOM mutations if scrolled
    if (progress === lastProgress) {
      rafId = requestAnimationFrame(onFrame);
      return;
    }
    lastProgress = progress;

    // ── Text fade-out (5% → 15%) ──
    if (progress < 0.05) {
      // Text is fully visible
    } else if (progress >= 0.05 && progress < 0.15) {
      const fadeProgress = (progress - 0.05) / 0.10;
      const op = 1 - fadeProgress;
      const yShift = -fadeProgress * 20;
      overline.style.opacity = String(op);
      heroName.style.opacity = String(op);
      tagline.style.opacity = String(op);
      scrollCue.style.opacity = String(Math.max(0, op));
      overline.style.transform = `translateY(${yShift}px)`;
      heroName.style.transform = `translateY(${yShift * 1.5}px)`;
      tagline.style.transform = `translateY(${yShift * 0.8}px)`;
    } else if (progress >= 0.15) {
      overline.style.opacity = '0';
      heroName.style.opacity = '0';
      tagline.style.opacity = '0';
      scrollCue.style.opacity = '0';
    }

    // ── Frame scrubbing (5% → 100%) ──
    const frameProgress = Math.max(0, progress - 0.05) / 0.95;
    const frameIndex = Math.min(
      FRAME_COUNT - 1,
      Math.floor(frameProgress * FRAME_COUNT)
    );
    drawFrame(frameIndex);

    // ── Fly-Through Zoom Effect (80% → 100%) ──
    if (progress >= 0.80) {
      // Gentle cinematic zoom from scale 1 to 3.5
      const zoomProgress = (progress - 0.80) / 0.20;
      canvas.style.transform = `scale(${1 + zoomProgress * 2.5})`;
      
      // Fade out the hero image completely so the Museum 3D canvas is flawlessly
      // revealed underneath it through the center of the lens!
      canvas.style.opacity = String(Math.max(0, 1 - zoomProgress));
    } else {
      canvas.style.transform = 'scale(1)';
      canvas.style.opacity = '1';
    }

    // ── Glow overlay (75% → 100%) ──
    if (progress >= 0.75) {
      const glowProgress = (progress - 0.75) / 0.25;
      lensGlow.style.opacity = String(glowProgress * 0.8);
    } else {
      lensGlow.style.opacity = '0';
    }

    rafId = requestAnimationFrame(onFrame);
  }

  // Start the rAF loop
  rafId = requestAnimationFrame(onFrame);

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    isActive = false;
    cancelAnimationFrame(rafId);
  });
}
