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

  // Apple-style scroll sequence:
  // the page is the timeline. No rotate(), skew() or scaleX() is applied to the jewelry.
  // Each scroll position selects a locally stored photographic zoom frame.
  const scene = document.querySelector('[data-hero-scroll]');
  const canvas = document.querySelector('[data-jewelry-sequence]');
  const stage = canvas?.closest('.sequence-stage');
  const heroCopy = document.querySelector('[data-hero-copy]');
  const kicker = document.querySelector('[data-sequence-kicker]');
  const caption = document.querySelector('[data-sequence-caption]');
  const progressBar = document.querySelector('[data-scroll-progress]');
  const header = document.querySelector('[data-header]');

  if (scene && canvas && !reducedMotion) {
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    const FRAME_COUNT = 96;
    const frames = new Array(FRAME_COUNT);
    let currentProgress = 0;
    let requestedFrame = 0;
    let rafId = 0;
    let canvasWidth = 0;
    let canvasHeight = 0;

    const frameUrl = (i) => `assets/sequence/frame-${String(i).padStart(3, '0')}.webp`;

    const loadFrame = (i) => new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        frames[i] = img;
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = frameUrl(i);
    });

    // Draw without geometric distortion: source aspect ratio is always preserved.
    const drawCover = (img) => {
      if (!img || !ctx || !canvasWidth || !canvasHeight) return;
      const srcRatio = img.naturalWidth / img.naturalHeight;
      const dstRatio = canvasWidth / canvasHeight;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

      if (dstRatio > srcRatio) {
        sh = sw / dstRatio;
        sy = (img.naturalHeight - sh) / 2;
      } else {
        sw = sh * dstRatio;
        sx = (img.naturalWidth - sw) / 2;
      }

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvasWidth, canvasHeight);
    };

    const nearestLoaded = (index) => {
      if (frames[index]) return frames[index];
      for (let d = 1; d < FRAME_COUNT; d += 1) {
        const lower = index - d;
        const upper = index + d;
        if (lower >= 0 && frames[lower]) return frames[lower];
        if (upper < FRAME_COUNT && frames[upper]) return frames[upper];
      }
      return null;
    };

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvasWidth = Math.max(1, Math.round(rect.width * dpr));
      canvasHeight = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
      }
      drawCover(nearestLoaded(requestedFrame));
    };

    const render = () => {
      rafId = 0;
      // First 82% of the sticky section is the camera pull-back.
      // The final 18% holds on the complete necklace while the main message resolves.
      const visualProgress = clamp(currentProgress / 0.82, 0, 1);
      requestedFrame = Math.round(visualProgress * (FRAME_COUNT - 1));
      drawCover(nearestLoaded(requestedFrame));

      // Detail annotation fades out while the camera leaves macro range.
      const kickerOut = smoothstep(currentProgress / 0.22);
      if (kicker) {
        kicker.style.opacity = String(1 - kickerOut);
        kicker.style.transform = `translateY(${-10 * kickerOut}px)`;
      }

      // Midway annotation accompanies the revealing shape, then gets out of the way.
      const captionIn = smoothstep((currentProgress - 0.30) / 0.16);
      const captionOut = smoothstep((currentProgress - 0.68) / 0.12);
      const captionOpacity = captionIn * (1 - captionOut);
      if (caption) {
        caption.style.opacity = String(captionOpacity);
        caption.style.transform = `translateY(${18 * (1 - captionIn)}px)`;
      }

      // Main copy appears only once the necklace is nearly fully revealed.
      const copyProgress = smoothstep((currentProgress - 0.67) / 0.16);
      if (heroCopy) {
        heroCopy.style.opacity = String(copyProgress);
        if (window.innerWidth <= 720) {
          heroCopy.style.transform = `translateY(${34 * (1 - copyProgress)}px)`;
        } else {
          heroCopy.style.transform = `translate(-50%,-50%) translateY(${42 * (1 - copyProgress)}px)`;
        }
        heroCopy.classList.toggle('is-visible', copyProgress > 0.75);
      }

      if (progressBar) {
        progressBar.style.transform = `scaleY(${Math.max(0.02, currentProgress)})`;
      }
    };

    const readScroll = () => {
      const rect = scene.getBoundingClientRect();
      const travel = Math.max(1, scene.offsetHeight - window.innerHeight);
      currentProgress = clamp(-rect.top / travel, 0, 1);
      if (!rafId) rafId = requestAnimationFrame(render);
      if (header) header.classList.toggle('hero-mode', rect.bottom > 90);
    };

    // Load the first frame immediately so the experience starts without a flash,
    // then preload the full local sequence. All assets remain offline.
    loadFrame(0).then((first) => {
      if (first) {
        stage?.classList.add('ready');
        resizeCanvas();
        readScroll();
      }
      // Prioritize frames in scroll order. Browser decoding happens asynchronously.
      for (let i = 1; i < FRAME_COUNT; i += 1) {
        loadFrame(i).then(() => {
          if (Math.abs(i - requestedFrame) <= 1 && !rafId) {
            rafId = requestAnimationFrame(render);
          }
        });
      }
    });

    window.addEventListener('scroll', readScroll, { passive: true });
    window.addEventListener('resize', () => {
      resizeCanvas();
      readScroll();
    }, { passive: true });
    resizeCanvas();
    readScroll();
  } else if (heroCopy) {
    // Accessible static fallback for reduced-motion users.
    heroCopy.style.opacity = '1';
    heroCopy.classList.add('is-visible');
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

      navigator.clipboard?.writeText(draft).then(() => {
        if (status) status.textContent = 'Anfrage-Text wurde in die Zwischenablage kopiert. Vor Livegang bitte die echte Kontakt-E-Mail im Website-Setup hinterlegen.';
      }).catch(() => {
        if (status) status.textContent = 'Die Anfrage ist vorbereitet. Vor Livegang bitte die echte Kontakt-E-Mail im Website-Setup hinterlegen.';
      });
    });
  }
})();
