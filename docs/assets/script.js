(() => {
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

  // Header + mobile navigation
  const header = qs('[data-header]');
  const menuToggle = qs('[data-menu-toggle]');
  const nav = qs('[data-nav]');
  const syncHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });

  menuToggle?.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!open));
    nav?.classList.toggle('is-open', !open);
  });
  qsa('a', nav).forEach(a => a.addEventListener('click', () => {
    nav?.classList.remove('is-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  }));

  // Catalog filters: intentionally data-attribute driven so new images can be added later.
  const cards = qsa('[data-product]');
  const categoryButtons = qsa('[data-filter-category]');
  const colorSelect = qs('[data-filter-color]');
  const searchInput = qs('[data-catalog-search]');
  const resetButton = qs('[data-filter-reset]');
  const resultCount = qs('[data-result-count]');
  let activeCategory = 'all';

  const normalize = value => (value || '').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  function applyFilters() {
    const color = colorSelect?.value || 'all';
    const search = normalize(searchInput?.value.trim());
    let visible = 0;

    cards.forEach(card => {
      const categories = (card.dataset.category || '').split(/\s+/);
      const colors = (card.dataset.color || '').split(/\s+/);
      const haystack = normalize(card.dataset.search || '');
      const categoryMatch = activeCategory === 'all' || categories.includes(activeCategory);
      const colorMatch = color === 'all' || colors.includes(color);
      const searchMatch = !search || haystack.includes(search);
      const show = categoryMatch && colorMatch && searchMatch;
      card.hidden = !show;
      if (show) visible += 1;
    });

    if (resultCount) resultCount.textContent = String(visible);
  }

  categoryButtons.forEach(button => button.addEventListener('click', () => {
    activeCategory = button.dataset.filterCategory || 'all';
    categoryButtons.forEach(btn => btn.classList.toggle('is-active', btn === button));
    applyFilters();
  }));
  colorSelect?.addEventListener('change', applyFilters);
  searchInput?.addEventListener('input', applyFilters);
  resetButton?.addEventListener('click', () => {
    activeCategory = 'all';
    categoryButtons.forEach(btn => btn.classList.toggle('is-active', btn.dataset.filterCategory === 'all'));
    if (colorSelect) colorSelect.value = 'all';
    if (searchInput) searchInput.value = '';
    applyFilters();
  });

  // Product modal + prefill inquiry form
  const modal = qs('[data-product-modal]');
  const modalImage = qs('[data-modal-image]');
  const modalTitle = qs('[data-modal-title]');
  const modalCategory = qs('[data-modal-category]');
  const productInput = qs('[data-product-input]');
  let currentProduct = '';

  function openModal(button) {
    if (!modal || !button) return;
    currentProduct = button.dataset.title || '';
    if (modalImage) {
      modalImage.src = button.dataset.image || '';
      modalImage.alt = currentProduct;
    }
    if (modalTitle) modalTitle.textContent = currentProduct;
    if (modalCategory) modalCategory.textContent = button.dataset.categoryLabel || 'Sortiment';
    document.body.classList.add('modal-open');
    if (typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open', '');
  }

  qsa('[data-modal-open]').forEach(button => button.addEventListener('click', () => openModal(button)));
  qsa('[data-modal-close]').forEach(button => button.addEventListener('click', () => {
    modal?.close?.();
    modal?.removeAttribute('open');
    document.body.classList.remove('modal-open');
  }));
  modal?.addEventListener('click', event => {
    if (event.target === modal) {
      modal.close?.();
      document.body.classList.remove('modal-open');
    }
  });
  modal?.addEventListener('close', () => document.body.classList.remove('modal-open'));

  qs('[data-product-inquiry]')?.addEventListener('click', () => {
    if (productInput) productInput.value = currentProduct;
    modal?.close?.();
    document.body.classList.remove('modal-open');
    qs('#anfrage')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => productInput?.focus(), 450);
  });

  // Sticky sourcing story in the middle of the page.
  const story = qs('[data-sourcing-story]');
  const storyImages = qsa('[data-sourcing-image]');
  const storyCopies = qsa('[data-sourcing-copy]');
  const storyProgress = qs('[data-sourcing-progress]');
  const storyNumber = qs('[data-sourcing-number]');
  let ticking = false;

  function renderStory() {
    ticking = false;
    if (!story) return;
    const rect = story.getBoundingClientRect();
    const total = story.offsetHeight - window.innerHeight;
    const traveled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
    const progress = total > 0 ? traveled / total : 0;
    const stages = storyCopies.length || 1;
    const scaled = Math.min(progress * stages, stages - 0.0001);
    const active = Math.min(stages - 1, Math.floor(scaled));
    const local = scaled - active;

    storyImages.forEach((img, index) => {
      img.classList.toggle('is-active', index === active);
      if (index === active) {
        // A restrained camera-like pullback inside each image.
        const scale = 1.12 - Math.min(local, 1) * 0.12;
        const y = (0.5 - local) * 1.5;
        img.style.transform = `scale(${scale}) translate3d(0, ${y}%, 0)`;
      }
    });
    storyCopies.forEach((copy, index) => copy.classList.toggle('is-active', index === active));
    if (storyProgress) storyProgress.style.height = `${progress * 100}%`;
    if (storyNumber) storyNumber.textContent = String(active + 1).padStart(2, '0');
  }

  function requestStoryRender() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(renderStory);
  }
  renderStory();
  window.addEventListener('scroll', requestStoryRender, { passive: true });
  window.addEventListener('resize', requestStoryRender, { passive: true });

  // Offline-safe demo form: validate and create a plain-text brief locally.
  const requestForm = qs('[data-request-form]');
  const formStatus = qs('[data-form-status]');
  requestForm?.addEventListener('submit', event => {
    event.preventDefault();
    if (!requestForm.checkValidity()) {
      requestForm.reportValidity();
      if (formStatus) formStatus.textContent = 'Bitte füllen Sie die Pflichtfelder aus.';
      return;
    }
    const data = new FormData(requestForm);
    const lines = [
      'MERVELLE GEMS – Produktanfrage',
      '',
      `Unternehmen: ${data.get('company') || '–'}`,
      `Name: ${data.get('name') || '–'}`,
      `E-Mail: ${data.get('email') || '–'}`,
      `Telefon: ${data.get('phone') || '–'}`,
      `Steinart / Produkt: ${data.get('product') || '–'}`,
      `Verarbeitungsstufe: ${data.get('stage') || '–'}`,
      `Farbe: ${data.get('color') || '–'}`,
      `Größe: ${data.get('size') || '–'}`,
      `Menge: ${data.get('quantity') || '–'}`,
      '',
      `Weitere Anforderungen: ${data.get('message') || '–'}`
    ];
    const brief = lines.join('\n');

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(brief).then(() => {
        if (formStatus) formStatus.textContent = 'Anfragetext wurde lokal erstellt und in die Zwischenablage kopiert. Vor Livegang kann hier der echte E-Mail-Versand angebunden werden.';
      }).catch(() => {
        if (formStatus) formStatus.textContent = 'Anfrage ist vollständig. Vor Livegang wird hier der echte Versand angebunden.';
      });
    } else if (formStatus) {
      formStatus.textContent = 'Anfrage ist vollständig. Vor Livegang wird hier der echte Versand angebunden.';
    }
  });
})();
