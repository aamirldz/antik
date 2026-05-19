/**
 * services.ts — Act 3: Video-Masked Typography
 * 
 * Giant service titles with animated backgrounds, staggered scroll entrance,
 * and hover glow effect.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

const THEMES: Record<string, { primary: string; secondary: string }> = {
  photography: { primary: '#c8a97e', secondary: '#8b7355' },
  motion:      { primary: '#e8c99a', secondary: '#c8a97e' },
  editing:     { primary: '#f5f5f0', secondary: '#a89f91' },
  graphics:    { primary: '#b89668', secondary: '#6b6458' },
};

export function initServices(): void {
  const items = document.querySelectorAll<HTMLElement>('.services__item');
  if (!items.length) return;

  items.forEach((item, i) => {
    const text = item.querySelector('.services__text') as HTMLElement;
    const label = item.querySelector('.services__label') as HTMLElement;
    const key = item.dataset.service || 'photography';
    const theme = THEMES[key] || THEMES.photography;

    // Fill background canvas with a warm atmospheric gradient
    const bgDiv = item.querySelector('.services__bg-canvas') as HTMLElement;
    if (bgDiv) {
      const canvas = document.createElement('canvas');
      canvas.width = 960; canvas.height = 540;
      canvas.style.cssText = 'width:100%; height:100%;';
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Radial glow
        const g = ctx.createRadialGradient(480, 270, 0, 480, 270, 480);
        g.addColorStop(0, theme.primary + '15');
        g.addColorStop(0.5, theme.secondary + '08');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = '#0a0a08';
        ctx.fillRect(0, 0, 960, 540);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 960, 540);
        // Film grain texture
        for (let n = 0; n < 2000; n++) {
          ctx.fillStyle = `rgba(200,169,126,${Math.random() * 0.05})`;
          ctx.fillRect(Math.random() * 960, Math.random() * 540, 1, 1);
        }
        // Scan lines
        for (let y = 0; y < 540; y += 3) {
          ctx.fillStyle = 'rgba(0,0,0,0.02)';
          ctx.fillRect(0, y, 960, 1);
        }
      }
      bgDiv.appendChild(canvas);
    }

    // Scroll entrance: text slides in from alternating sides
    gsap.fromTo(text,
      { x: i % 2 === 0 ? 200 : -200, opacity: 0, scale: 0.9 },
      {
        x: 0, opacity: 1, scale: 1,
        scrollTrigger: {
          trigger: item, start: 'top 80%', end: 'top 30%', scrub: 1,
          onEnter: () => text.classList.add('is-active'),
          onLeaveBack: () => text.classList.remove('is-active'),
        },
      }
    );

    // Label fades in after text
    if (label) {
      gsap.fromTo(label,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0,
          scrollTrigger: { trigger: item, start: 'top 50%', end: 'top 20%', scrub: 1 },
        }
      );
    }

    // Parallax on background
    if (bgDiv) {
      gsap.to(bgDiv, {
        y: -60,
        scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }
  });
}
