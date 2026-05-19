/**
 * contact.ts — Act 8: Contact CTA Finale
 * 
 * Glassmorphism contact card with scroll entrance.
 * Magnetic CTA button.
 * Generated cinematic background.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export function initContact(): void {
  const section = document.getElementById('act-contact') as HTMLElement;
  if (!section) return;

  // ─── Generate background ───
  generateBackground();

  // ─── Card entrance ───
  const card = section.querySelector('.contact__card') as HTMLElement;
  if (card) {
    gsap.fromTo(card,
      { opacity: 0, y: 60, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1,
        scrollTrigger: { trigger: section, start: 'top 60%', end: 'top 30%', scrub: 1 },
      }
    );
  }

  // ─── Stagger links ───
  const links = section.querySelectorAll<HTMLElement>('.contact__link');
  links.forEach((link, i) => {
    gsap.fromTo(link,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0,
        scrollTrigger: {
          trigger: section,
          start: `${40 + i * 5}% center`,
          end: `${50 + i * 5}% center`,
          scrub: 1,
        },
      }
    );
  });

  // ─── Magnetic CTA ───
  const cta = document.getElementById('contact-cta') as HTMLElement;
  if (cta) {
    cta.addEventListener('mousemove', (e) => {
      const r = cta.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      gsap.to(cta, { x: dx * 0.3, y: dy * 0.3, duration: 0.3, ease: 'power2.out' });
    });
    cta.addEventListener('mouseleave', () => {
      gsap.to(cta, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    });
  }
}

function generateBackground(): void {
  const bgDiv = document.getElementById('contact-bg') as HTMLElement;
  if (!bgDiv) return;

  const c = document.createElement('canvas');
  c.width = 1920; c.height = 1080;
  const ctx = c.getContext('2d');
  if (!ctx) return;

  // Dark gradient
  const g = ctx.createLinearGradient(0, 0, 1920, 1080);
  g.addColorStop(0, '#050505');
  g.addColorStop(0.3, '#1a1410');
  g.addColorStop(0.7, '#14100c');
  g.addColorStop(1, '#050505');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1920, 1080);

  // Warm light
  const r = ctx.createRadialGradient(1400, 200, 50, 1400, 200, 700);
  r.addColorStop(0, 'rgba(200,169,126,0.1)');
  r.addColorStop(1, 'transparent');
  ctx.fillStyle = r;
  ctx.fillRect(0, 0, 1920, 1080);

  // Bokeh
  for (let i = 0; i < 25; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 1920, Math.random() * 1080, 20 + Math.random() * 50, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,169,126,${0.01 + Math.random() * 0.025})`;
    ctx.fill();
  }

  // Grain
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = `rgba(245,245,240,${Math.random() * 0.03})`;
    ctx.fillRect(Math.random() * 1920, Math.random() * 1080, 1, 1);
  }

  const img = document.createElement('img');
  img.src = c.toDataURL('image/jpeg', 0.85);
  img.alt = '';
  img.style.cssText = 'width:100%; height:100%; object-fit:cover; filter:brightness(0.25) saturate(0.6);';
  bgDiv.appendChild(img);
}
