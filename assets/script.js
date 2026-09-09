(() => {
  const canvas = document.getElementById('jewel-canvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('[data-header]');
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  let dpr = Math.min(devicePixelRatio || 1, 2);
  let w = 0, h = 0, scrollY = 0, targetScroll = 0, raf = 0;

  function resize() {
    w = innerWidth; h = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function diamond(x, y, size, depth, rot, tone) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    const alpha = .34 + depth * .66;
    const s = size * (.65 + depth * .7);
    ctx.shadowColor = tone === 'gold' ? 'rgba(222,189,115,.28)' : 'rgba(210,242,255,.38)';
    ctx.shadowBlur = 12 + 18 * depth;

    const grad = ctx.createLinearGradient(-s, -s, s, s);
    if (tone === 'gold') {
      grad.addColorStop(0, `rgba(252,229,170,${alpha})`);
      grad.addColorStop(.45, `rgba(171,130,65,${alpha})`);
      grad.addColorStop(1, `rgba(255,244,207,${alpha})`);
    } else {
      grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
      grad.addColorStop(.28, `rgba(169,206,218,${alpha})`);
      grad.addColorStop(.55, `rgba(248,255,255,${alpha})`);
      grad.addColorStop(1, `rgba(112,147,157,${alpha})`);
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * .88, -s * .12);
    ctx.lineTo(s * .58, s);
    ctx.lineTo(-s * .58, s);
    ctx.lineTo(-s * .88, -s * .12);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(255,255,255,${.18 + depth * .3})`;
    ctx.lineWidth = Math.max(.45, s * .035);
    ctx.beginPath();
    ctx.moveTo(0,-s); ctx.lineTo(0,s*.15);
    ctx.moveTo(-s*.88,-s*.12); ctx.lineTo(0,s*.15); ctx.lineTo(s*.88,-s*.12);
    ctx.moveTo(-s*.58,s); ctx.lineTo(0,s*.15); ctx.lineTo(s*.58,s);
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    raf = requestAnimationFrame(draw);
    scrollY += (targetScroll - scrollY) * (reducedMotion ? 1 : .075);
    ctx.clearRect(0, 0, w, h);

    const maxScroll = Math.max(1, document.documentElement.scrollHeight - h);
    const p = Math.min(1, Math.max(0, scrollY / maxScroll));
    const sectionShift = Math.min(1, scrollY / Math.max(h * 3.2, 1));
    const globalAngle = (reducedMotion ? .45 : p * Math.PI * 9.2) + .42;
    const centerX = w * (w < 760 ? .72 : .64);
    const centerY = h * .50;
    const helixHeight = h * 1.16;
    const radius = Math.min(w, h) * (w < 760 ? .16 : .18);
    const perspective = Math.min(w,h) * .0012;
    const count = w < 600 ? 34 : 50;

    const points = [];
    for (let strand = 0; strand < 2; strand++) {
      const phase = strand * Math.PI;
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        const y3 = (t - .5) * helixHeight;
        const taper = .62 + .38 * Math.sin(Math.PI * t);
        const a = globalAngle + t * Math.PI * 4.2 + phase;
        const x3 = Math.cos(a) * radius * taper;
        const z3 = Math.sin(a) * radius;
        const scale = 1 + z3 * perspective;
        const x = centerX + x3 * scale + Math.sin(sectionShift * Math.PI) * w * .03;
        const y = centerY + y3 * (1 + .04 * Math.cos(a)) + Math.sin(p * Math.PI * 2) * 12;
        points.push({x,y,z:z3,scale,t,strand,a});
      }
    }

    points.sort((a,b) => a.z - b.z);

    // Metallic links first.
    ctx.save();
    ctx.lineCap = 'round';
    for (let strand = 0; strand < 2; strand++) {
      const same = points.filter(pt => pt.strand === strand).sort((a,b) => a.t-b.t);
      for (let i=1;i<same.length;i++) {
        const a=same[i-1], b=same[i];
        const depth = Math.max(0, Math.min(1, (a.z/radius + 1)/2));
        ctx.strokeStyle = `rgba(199,168,106,${.16 + .34*depth})`;
        ctx.lineWidth = 1.1 + 1.3*depth;
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
      }
    }
    // Cross-links create the DNA / necklace-lattice impression.
    const s0 = points.filter(pt => pt.strand === 0).sort((a,b)=>a.t-b.t);
    const s1 = points.filter(pt => pt.strand === 1).sort((a,b)=>a.t-b.t);
    for (let i=0;i<count;i+=3) {
      const a=s0[i], b=s1[i];
      ctx.strokeStyle = 'rgba(201,173,111,.10)';
      ctx.lineWidth=.8;
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
    }
    ctx.restore();

    for (const pt of points) {
      const depth = Math.max(0, Math.min(1, (pt.z/radius + 1)/2));
      const size = (w < 600 ? 5.5 : 7.2) * pt.scale;
      const isGold = (Math.round(pt.t * count) + pt.strand) % 9 === 0;
      diamond(pt.x, pt.y, size, depth, -pt.a * .25 + pt.strand*.2, isGold ? 'gold' : 'ice');
    }

    // Soft luminous center stone.
    const pulse = reducedMotion ? 1 : .96 + .04 * Math.sin(performance.now()/1100);
    ctx.save();
    const glow = ctx.createRadialGradient(centerX,centerY,0,centerX,centerY,70*pulse);
    glow.addColorStop(0,'rgba(255,255,255,.18)');
    glow.addColorStop(.35,'rgba(199,168,106,.09)');
    glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(centerX,centerY,75*pulse,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function onScroll() {
    targetScroll = scrollY = reducedMotion ? window.scrollY : targetScroll;
    if (!reducedMotion) targetScroll = window.scrollY;
    header?.classList.toggle('scrolled', window.scrollY > 24);
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  addEventListener('resize', resize, {passive:true});
  addEventListener('scroll', onScroll, {passive:true});
  resize(); targetScroll = window.scrollY; scrollY = targetScroll; onScroll(); draw();

  addEventListener('pagehide', () => cancelAnimationFrame(raf));
})();
