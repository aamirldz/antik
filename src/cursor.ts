/**
 * cursor.ts — Custom Viewfinder Cursor
 * 
 * A small dot + outer ring that follows the mouse with LERP smoothing.
 * The ring expands when hovering over interactive elements.
 * Hidden on touch devices (handled by CSS).
 */

import gsap from 'gsap';

let cursorEl: HTMLElement | null = null;
let mouseX = 0;
let mouseY = 0;
let cursorX = 0;
let cursorY = 0;
const LERP_FACTOR = 0.40; // Increased for snappier tracking (was 0.15)

/**
 * Initialize the custom cursor.
 */
export function initCursor(): void {
  cursorEl = document.getElementById('cursor');
  if (!cursorEl) return;

  // Track mouse position
  document.addEventListener('mousemove', onMouseMove);

  // Start the render loop
  gsap.ticker.add(renderCursor);

  // Add hover detection for interactive elements
  setupHoverTargets();
}

function onMouseMove(e: MouseEvent): void {
  mouseX = e.clientX;
  mouseY = e.clientY;
}

/**
 * LERP the cursor position toward the actual mouse position.
 * This creates the smooth, magnetic trailing effect.
 */
function renderCursor(): void {
  if (!cursorEl) return;

  // Linear interpolation: gradually move cursor toward mouse
  cursorX += (mouseX - cursorX) * LERP_FACTOR;
  cursorY += (mouseY - cursorY) * LERP_FACTOR;

  // Use transform for GPU-accelerated positioning (no layout recalc)
  cursorEl.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
}

/**
 * Detect all interactive elements and add hover class to cursor
 * when the mouse enters them.
 */
function setupHoverTargets(): void {
  // All elements that should trigger the expanded cursor
  const interactiveSelectors = 'a, button, .gallery__item, .filmstrip__panel, [data-cursor-hover]';

  document.addEventListener('mouseover', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(interactiveSelectors)) {
      cursorEl?.classList.add('cursor--hover');
    }
  });

  document.addEventListener('mouseout', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(interactiveSelectors)) {
      cursorEl?.classList.remove('cursor--hover');
    }
  });
}
