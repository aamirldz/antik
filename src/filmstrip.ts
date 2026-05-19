/**
 * filmstrip.ts — Act 5: Horizontal Film Strip Carousel
 * 
 * Vertical scroll is pinned, and converted into horizontal movement.
 * GSAP ScrollTrigger drives the strip sideways.
 * Center detection focuses the active panel.
 * Film sprocket holes styled via CSS.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export function initFilmstrip(): void {
  const section = document.getElementById('act-filmstrip') as HTMLElement;
  const wrapper = document.getElementById('filmstrip-wrapper') as HTMLElement;
  const track = document.getElementById('filmstrip-track') as HTMLElement;
  if (!section || !wrapper || !track) return;

  const panels = track.querySelectorAll<HTMLElement>('.filmstrip__panel');
  if (!panels.length) return;

  // Generate placeholder images for each panel
  panels.forEach((panel, i) => {
    const imgDiv = panel.querySelector('.filmstrip__panel-img') as HTMLElement;
    if (imgDiv) {
      const c = document.createElement('canvas');
      c.width = 380; c.height = 480;
      const ctx = c.getContext('2d');
      if (ctx) {
        // Unique warm gradient per panel
        const hue = 20 + i * 15;
        const g = ctx.createLinearGradient(0, 0, 380, 480);
        g.addColorStop(0, `hsl(${hue}, 40%, 25%)`);
        g.addColorStop(0.5, `hsl(${hue}, 35%, 15%)`);
        g.addColorStop(1, `hsl(${hue}, 30%, 8%)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 380, 480);
        // Film grain
        for (let n = 0; n < 1500; n++) {
          ctx.fillStyle = `rgba(200,169,126,${Math.random() * 0.06})`;
          ctx.fillRect(Math.random() * 380, Math.random() * 480, 1, 1);
        }
        // Project number
        ctx.fillStyle = 'rgba(200,169,126,0.08)';
        ctx.font = 'bold 200px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`0${i + 1}`, 190, 330);
      }
      const img = document.createElement('img');
      img.src = c.toDataURL('image/jpeg', 0.85);
      img.style.cssText = 'width:100%; height:100%; object-fit:cover;';
      imgDiv.appendChild(img);
    }
  });

  // Calculate total scroll distance
  const totalWidth = track.scrollWidth;
  const viewWidth = wrapper.offsetWidth;

  // Pin the section and drive horizontal scroll
  gsap.to(track, {
    x: -(totalWidth - viewWidth),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${totalWidth}`,
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      onUpdate: (self) => {
        // Center detection
        const scrollPos = self.progress * (totalWidth - viewWidth);
        const centerX = viewWidth / 2;

        panels.forEach((panel) => {
          const panelLeft = panel.offsetLeft - scrollPos;
          const panelCenter = panelLeft + panel.offsetWidth / 2;
          const dist = Math.abs(panelCenter - centerX);

          if (dist < panel.offsetWidth * 0.6) {
            panel.classList.add('is-centered');
          } else {
            panel.classList.remove('is-centered');
          }
        });
      },
    },
  });

  // Header entrance
  const header = section.querySelector('.filmstrip__header');
  if (header) {
    gsap.fromTo(header,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0,
        scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 40%', scrub: 1 },
      }
    );
  }
}
