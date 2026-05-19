/**
 * smoothScroll.ts — Lenis + GSAP ScrollTrigger Synchronization
 * 
 * This is the core scroll engine for the entire site.
 * Lenis provides buttery-smooth momentum scrolling.
 * GSAP ScrollTrigger handles all pinning, scrubbing, and scroll-linked animations.
 * They MUST be synchronized to prevent jitter.
 */

import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugin
gsap.registerPlugin(ScrollTrigger);

let lenisInstance: Lenis | null = null;

/**
 * Initialize the smooth scroll engine.
 * Call this once from main.ts after the DOM is ready.
 */
export function initSmoothScroll(): Lenis {
  // Create Lenis instance with premium feel
  lenisInstance = new Lenis({
    lerp: 0.07,           // Lower (0.07 vs 0.15) = buttery, high-inertia scroll glide
    smoothWheel: true,    // Smooth mouse wheel scrolling
    wheelMultiplier: 1.2, // Faster, effortless glide for mice and trackpads
    touchMultiplier: 1.5, // Natural touch sensitivity on mobile
  });

  // CRITICAL: Sync Lenis scroll position with GSAP ScrollTrigger
  // Without this, pinned sections and scrubbed animations will jitter
  lenisInstance.on('scroll', ScrollTrigger.update);

  // Hook Lenis into GSAP's internal ticker (requestAnimationFrame loop)
  gsap.ticker.add((time: number) => {
    lenisInstance?.raf(time * 1000); // Lenis expects milliseconds
  });

  // Disable GSAP's lag smoothing — prevents scroll delays 
  // that would cause animations to drift from the actual scroll position
  gsap.ticker.lagSmoothing(0);

  return lenisInstance;
}

/**
 * Stop smooth scrolling (e.g., when preloader is active or overlay is open)
 */
export function stopScroll(): void {
  lenisInstance?.stop();
}

/**
 * Resume smooth scrolling
 */
export function startScroll(): void {
  lenisInstance?.start();
}

/**
 * Scroll to a specific target (element selector or pixel offset)
 */
export function scrollTo(target: string | number | HTMLElement, options?: { offset?: number; duration?: number }): void {
  lenisInstance?.scrollTo(target, {
    offset: options?.offset ?? 0,
    duration: options?.duration ?? 1.2,
  });
}

/**
 * Get the current Lenis instance (for direct access if needed)
 */
export function getLenis(): Lenis | null {
  return lenisInstance;
}

/**
 * Cleanup — call on page unload to prevent memory leaks
 */
export function destroyScroll(): void {
  lenisInstance?.destroy();
  lenisInstance = null;
}
