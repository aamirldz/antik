/**
 * main.ts — ANTIK Portfolio — Boot Sequence
 *
 * Journey:
 *  1. Three.js starfield background (persistent)
 *  2. Custom cursor
 *  3. Lenis smooth scroll (frozen during preload)
 *  4. Preloader (Act 1) → on complete:
 *     5. Hero frame sequence (Act 2)
 *     6. Museum 3D World (Acts 3–7 combined, one immersive experience)
 *     7. Contact (Act 8)
 */

import './style.css';
import { initSmoothScroll, stopScroll, startScroll } from './utils/smoothScroll';
import { initCursor }     from './cursor';
import { initBackground } from './background';
import { initPreloader }  from './preloader';
import { initHero }       from './hero';
import { initMuseum }     from './museum';
import { initContact }    from './contact';

function boot(): void {
  // 1. Starfield background — DISABLED
  // initBackground();

  // 2. Custom cursor
  initCursor();

  // 3. Smooth scroll (frozen until preloader done)
  initSmoothScroll();
  stopScroll();

  // 4. Preloader
  initPreloader(() => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.classList.add('is-loaded');
      setTimeout(() => { preloader.style.display = 'none'; }, 1500);
    }

    // Start scroll
    startScroll();

    // Acts
    initHero();      // Act 2: Scroll-driven frame sequence + lens fly-through
    initMuseum();    // Acts 3–7: Zero-gravity obsidian museum world
    initContact();   // Act 8: Contact CTA

    console.log('✦ ANTIK — Museum world online. Zero gravity engaged.');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
