(() => {
  'use strict';

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mobile navigation
  const menuButton = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    }));
  }

  // Stable scroll-linked jewelry movement.
  // No canvas, no scroll hijacking, no third-party animation library.
  const scene = document.querySelector('[data-hero-scroll]');
  const necklace = document.querySelector('[data-necklace]');
  const ghost = document.querySelector('.necklace-ghost');
  const progressBar = document.querySelector('[data-scroll-progress]');
  const header = document.querySelector('[data-header]');

  if (scene && necklace && !reducedMotion) {
    let target = 0;
    let current = 0;
    let rafId = 0;

    const updateTarget = () => {
      const rect = scene.getBoundingClientRect();
      const travel = Math.max(1, scene.offsetHeight - window.innerHeight);
      target = clamp(-rect.top / travel, 0, 1);
      if (!rafId) rafId = requestAnimationFrame(render);
      if (header) header.classList.toggle('hero-mode', rect.bottom > 90);
    };

    const render = () => {
      // Easing only the image value eliminates the jumpy feel without delaying page scroll.
      current += (target - current) * 0.13;

      const turns = window.innerWidth < 720 ? 1.2 : 2.15;
      const angle = current * Math.PI * 2 * turns;
      const wave = Math.sin(angle);
      const depth = Math.abs(Math.cos(angle));
      const scaleX = 0.58 + depth * 0.42;
      const scale = 1 + Math.sin(current * Math.PI) * 0.035;
      const x = wave * (window.innerWidth < 720 ? 18 : 46);
      const y = Math.sin(angle * .5) * (window.innerWidth < 720 ? 5 : 12);
      const rz = wave * 2.2;
      const skew = wave * 1.4;
      const brightness = .94 + depth * .12;

      // 2D depth simulation is intentional: it keeps the photo from collapsing to a 1px plane
      // at 90° like a raw rotateY(), which caused the previous apparent scroll bug.
      necklace.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${rz}deg) skewY(${skew}deg) scale(${scale * scaleX}, ${scale})`;
      necklace.style.filter = `brightness(${brightness}) contrast(1.02)`;

      if (ghost) {
        ghost.style.transform = `translate(calc(-50% - ${x * .65}px), calc(-50% - ${y * .6}px)) rotate(${-rz * .65}deg) scale(${.96 + (1-depth) * .06})`;
        ghost.style.opacity = String(.07 + (1 - depth) * .11);
      }
      if (progressBar) progressBar.style.transform = `scaleY(${Math.max(.06, current)})`;

      if (Math.abs(target - current) > 0.0005) {
        rafId = requestAnimationFrame(render);
      } else {
        current = target;
        rafId = 0;
      }
    };

    window.addEventListener('scroll', updateTarget, { passive: true });
    window.addEventListener('resize', updateTarget, { passive: true });
    updateTarget();
  }

  // Contact demo: privacy-first, no network submission.
  const form = document.querySelector('[data-contact-form]');
  const status = document.querySelector('[data-form-status]');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        if (status) status.textContent = 'Bitte füllen Sie die Pflichtfelder aus.';
        return;
      }
      const data = new FormData(form);
      const name = data.get('name') || '';
      const email = data.get('email') || '';
      const interest = data.get('interest') || '';
      const message = data.get('message') || '';
      const draft = `Betreff: Anfrage – ${interest}\n\nName: ${name}\nE-Mail: ${email}\nThema: ${interest}\n\n${message}`;

      // The demo deliberately does not transmit data. Copy the prepared mail text instead.
      navigator.clipboard?.writeText(draft).then(() => {
        if (status) status.textContent = 'Anfrage-Text wurde in die Zwischenablage kopiert. Vor Livegang bitte die echte Kontakt-E-Mail im Website-Setup hinterlegen.';
      }).catch(() => {
        if (status) status.textContent = 'Die Anfrage ist vorbereitet. Vor Livegang bitte die echte Kontakt-E-Mail im Website-Setup hinterlegen.';
      });
    });
  }
})();
