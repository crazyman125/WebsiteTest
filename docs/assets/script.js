(() => {
  'use strict';

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const smoothstep = (t) => {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  };
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

  // Mid-page scroll story.
  // Four genuine high-resolution photographic stages are stacked on top of each other.
  // Scroll progress crossfades between dedicated macro/detail/full shots instead of enlarging
  // one small source image. This keeps the close-up sharp and avoids stretching/distortion.
  const story = document.querySelector('[data-story-scroll]');
  const images = [...document.querySelectorAll('[data-story-image]')];
  const copies = [...document.querySelectorAll('[data-story-copy]')];
  const progress = document.querySelector('[data-story-progress]');
  const progressNumber = document.querySelector('[data-story-progress-number]');
  const header = document.querySelector('[data-header]');

  if (story && images.length === 4 && copies.length === 4 && !reducedMotion) {
    let target = 0;
    let current = 0;
    let raf = 0;

    const imageOpacity = (p, i) => {
      const centers = [0.00, 0.34, 0.66, 1.00];
      if (i === 0) return 1 - smoothstep((p - 0.17) / 0.18);
      if (i === 3) return smoothstep((p - 0.76) / 0.18);
      const center = centers[i];
      const half = .24;
      const dist = Math.abs(p - center);
      return 1 - smoothstep((dist - .04) / (half - .04));
    };

    const copyOpacity = (p, i) => {
      const start = i * .25;
      const end = start + .25;
      const fade = .055;
      const fadeIn = smoothstep((p - start) / fade);
      const fadeOut = 1 - smoothstep((p - (end - fade)) / fade);
      if (i === 0 && p < fade) return 1;
      if (i === 3 && p > end - fade) return 1;
      return clamp(fadeIn * fadeOut, 0, 1);
    };

    const render = () => {
      raf = 0;
      // Small smoothing only removes wheel/touch jitter; the scroll position still controls the scene.
      current += (target - current) * 0.18;
      if (Math.abs(target - current) < 0.00035) current = target;

      images.forEach((img, i) => {
        const o = imageOpacity(current, i);
        img.style.opacity = o.toFixed(4);
        // Each source is already framed at its own camera distance. The tiny movement adds depth
        // without scaling a macro crop into a blurry full-screen picture.
        const local = clamp((current - i * .25) / .25, -1, 2);
        const scale = 1.035 - clamp(local, 0, 1) * .035;
        const y = (0.5 - clamp(local, 0, 1)) * 10;
        img.style.transform = `scale(${scale}) translate3d(0, ${y}px, 0)`;
      });

      let activeIndex = Math.min(3, Math.floor(current * 4));
      if (current >= .999) activeIndex = 3;
      copies.forEach((copy, i) => {
        const o = copyOpacity(current, i);
        copy.style.opacity = o.toFixed(4);
        copy.style.transform = `translateY(${(1 - o) * 28}px)`;
        copy.classList.toggle('is-active', i === activeIndex && o > .45);
      });

      if (progress) progress.style.transform = `scaleY(${Math.max(.005, current)})`;
      if (progressNumber) progressNumber.textContent = String(activeIndex + 1).padStart(2, '0');

      if (Math.abs(target - current) > 0.00035) raf = requestAnimationFrame(render);
    };

    const readScroll = () => {
      const rect = story.getBoundingClientRect();
      const travel = Math.max(1, story.offsetHeight - window.innerHeight);
      target = clamp(-rect.top / travel, 0, 1);
      if (!raf) raf = requestAnimationFrame(render);
      if (header) {
        const inStory = rect.top < 90 && rect.bottom > 90;
        header.classList.toggle('dark-mode', inStory);
      }
    };

    window.addEventListener('scroll', readScroll, { passive: true });
    window.addEventListener('resize', readScroll, { passive: true });
    readScroll();
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
      const draft = `Betreff: Anfrage – ${data.get('interest') || ''}\n\nName: ${data.get('name') || ''}\nE-Mail: ${data.get('email') || ''}\nThema: ${data.get('interest') || ''}\n\n${data.get('message') || ''}`;
      navigator.clipboard?.writeText(draft).then(() => {
        if (status) status.textContent = 'Anfrage-Text wurde in die Zwischenablage kopiert. Vor Livegang bitte die echte Kontakt-E-Mail im Website-Setup hinterlegen.';
      }).catch(() => {
        if (status) status.textContent = 'Die Anfrage ist vorbereitet. Vor Livegang bitte die echte Kontakt-E-Mail im Website-Setup hinterlegen.';
      });
    });
  }
})();
