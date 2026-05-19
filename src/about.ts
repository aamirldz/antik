/**
 * about.ts — Act 6: Parallax About Section
 * 
 * Split-screen with different parallax speeds.
 * Animated stat counters. Bio text entrance.
 * Generated placeholder portrait.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export function initAbout(): void {
  const section = document.getElementById('act-about') as HTMLElement;
  if (!section) return;

  const imageCol = section.querySelector('.about__image-col') as HTMLElement;
  const textCol = section.querySelector('.about__text-col') as HTMLElement;
  const imageDiv = document.getElementById('about-image') as HTMLElement;
  const stats = section.querySelectorAll<HTMLElement>('.about__stat-number');
  const bios = section.querySelectorAll<HTMLElement>('.about__bio p');

  // ─── Generate placeholder portrait ───
  if (imageDiv) {
    const c = document.createElement('canvas');
    c.width = 600; c.height = 800;
    const ctx = c.getContext('2d');
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, 800);
      g.addColorStop(0, '#2a201a');
      g.addColorStop(0.5, '#1a1410');
      g.addColorStop(1, '#0a0a08');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 600, 800);
      // Warm glow
      const r = ctx.createRadialGradient(300, 250, 30, 300, 250, 350);
      r.addColorStop(0, 'rgba(200,169,126,0.12)');
      r.addColorStop(1, 'transparent');
      ctx.fillStyle = r;
      ctx.fillRect(0, 0, 600, 800);
      // Silhouette hint
      ctx.fillStyle = 'rgba(30,30,26,0.7)';
      ctx.beginPath();
      ctx.ellipse(300, 380, 110, 200, 0, 0, Math.PI * 2);
      ctx.fill();
      // Camera lens hint
      ctx.strokeStyle = 'rgba(200,169,126,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(300, 340, 30, 0, Math.PI * 2);
      ctx.stroke();
      // Film grain
      for (let i = 0; i < 4000; i++) {
        ctx.fillStyle = `rgba(245,245,240,${Math.random() * 0.04})`;
        ctx.fillRect(Math.random() * 600, Math.random() * 800, 1, 1);
      }
    }
    const img = document.createElement('img');
    img.src = c.toDataURL('image/jpeg', 0.9);
    img.alt = 'Antik — Visual Artist';
    img.style.cssText = 'width:100%; height:100%; object-fit:cover; border-radius:8px; filter:grayscale(20%) contrast(1.1);';
    imageDiv.appendChild(img);
  }

  // ─── Parallax: image moves slower ───
  if (imageCol) {
    gsap.to(imageCol, {
      y: -100,
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }
  if (textCol) {
    gsap.to(textCol, {
      y: -30,
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }

  // ─── Section title entrance ───
  const overline = section.querySelector('.overline') as HTMLElement;
  const title = section.querySelector('.section-title') as HTMLElement;

  [overline, title].forEach((el, i) => {
    if (el) {
      gsap.fromTo(el,
        { opacity: 0, y: 20 + i * 10 },
        { opacity: 1, y: 0,
          scrollTrigger: { trigger: section, start: `top ${75 - i * 5}%`, end: `top ${55 - i * 5}%`, scrub: 1 },
        }
      );
    }
  });

  // ─── Bio paragraphs ───
  bios.forEach((p) => {
    gsap.fromTo(p,
      { opacity: 0, y: 25 },
      { opacity: 1, y: 0,
        scrollTrigger: { trigger: p, start: 'top 85%', end: 'top 60%', scrub: 1 },
      }
    );
  });

  // ─── Image entrance ───
  if (imageDiv) {
    gsap.fromTo(imageDiv,
      { opacity: 0, scale: 1.05 },
      { opacity: 1, scale: 1,
        scrollTrigger: { trigger: imageCol, start: 'top 80%', end: 'top 40%', scrub: 1 },
      }
    );
  }

  // ─── Animated stat counters ───
  stats.forEach((stat) => {
    const target = parseInt(stat.dataset.target || '0', 10);
    ScrollTrigger.create({
      trigger: stat,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        const counter = { value: 0 };
        gsap.to(counter, {
          value: target,
          duration: 2.5,
          ease: 'power2.out',
          onUpdate: () => { stat.textContent = Math.round(counter.value) + '+'; },
        });
      },
    });
  });

  // Stats container entrance
  const statsEl = section.querySelector('.about__stats') as HTMLElement;
  if (statsEl) {
    gsap.fromTo(statsEl,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0,
        scrollTrigger: { trigger: statsEl, start: 'top 85%', end: 'top 65%', scrub: 1 },
      }
    );
  }
}
