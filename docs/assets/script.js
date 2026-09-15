(() => {
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];
  const normalize = value => (value || '').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Header contrast
  // Adds a fully opaque background after the user starts scrolling.
  // Change the visual values in assets/styles.css under .site-header.is-scrolled.
  const header = qs('[data-header]');
  const updateHeaderState = () => header?.classList.toggle('is-scrolled', window.scrollY > 16);
  updateHeaderState();
  window.addEventListener('scroll', updateHeaderState, { passive: true });

  // Mobile navigation
  const toggle = qs('[data-menu-toggle]');
  const nav = qs('[data-nav]');
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    nav?.classList.toggle('is-open', !open);
  });
  qsa('a', nav).forEach(link => link.addEventListener('click', () => {
    nav?.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
  }));

  // Catalog is generated from assets/catalog/<category>/<color>/ by tools/build_catalog.py.
  const catalog = Array.isArray(window.MERVELLE_CATALOG) ? window.MERVELLE_CATALOG : [];
  const grid = qs('[data-catalog-grid]');
  const empty = qs('[data-catalog-empty]');
  const resultCount = qs('[data-result-count]');
  const searchInput = qs('[data-catalog-search]');
  const colorSelect = qs('[data-filter-color]');
  const sortSelect = qs('[data-sort]');
  const resetButton = qs('[data-filter-reset]');
  const categoryButtons = qsa('[data-filter-category]');
  let activeCategory = 'all';

  // Farben werden direkt aus den vorhandenen Bildordnern erzeugt.
  if (colorSelect) {
    const colors = [...new Map(catalog.map(item => [item.color, item.colorLabel])).entries()]
      .sort((a,b) => a[1].localeCompare(b[1], 'de'));
    colors.forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      colorSelect.append(option);
    });
  }

  function cardTemplate(item) {
    return `
      <article class="catalog-card" data-product-id="${item.id}">
        <button class="catalog-open" type="button" data-modal-open="${item.id}" aria-label="${item.title} ansehen">
          <span class="catalog-image"><img src="${item.image}" alt="${item.alt}" loading="lazy"></span>
          <span class="catalog-info">
            <small>${item.categoryLabel} · ${item.colorLabel}</small>
            <strong>${item.title}</strong>
            <p>${item.description}</p>
          </span>
        </button>
      </article>`;
  }

  function renderCatalog() {
    if (!grid) return;
    const search = normalize(searchInput?.value.trim());
    const color = colorSelect?.value || 'all';
    const sort = sortSelect?.value || 'default';

    let items = catalog.filter(item => {
      const categoryMatch = activeCategory === 'all' || item.category === activeCategory;
      const colorMatch = color === 'all' || item.color === color;
      const haystack = normalize([item.title, item.description, item.categoryLabel, item.colorLabel, ...(item.tags || [])].join(' '));
      const searchMatch = !search || haystack.includes(search);
      return categoryMatch && colorMatch && searchMatch;
    });

    if (sort === 'title') items = [...items].sort((a,b) => a.title.localeCompare(b.title, 'de'));
    if (sort === 'category') items = [...items].sort((a,b) => a.categoryLabel.localeCompare(b.categoryLabel, 'de') || a.title.localeCompare(b.title, 'de'));

    grid.innerHTML = items.map(cardTemplate).join('');
    if (resultCount) resultCount.textContent = String(items.length);
    if (empty) empty.hidden = items.length !== 0;
  }

  categoryButtons.forEach(button => button.addEventListener('click', () => {
    activeCategory = button.dataset.filterCategory || 'all';
    categoryButtons.forEach(btn => btn.classList.toggle('is-active', btn === button));
    renderCatalog();
  }));
  searchInput?.addEventListener('input', renderCatalog);
  colorSelect?.addEventListener('change', renderCatalog);
  sortSelect?.addEventListener('change', renderCatalog);
  resetButton?.addEventListener('click', () => {
    activeCategory = 'all';
    categoryButtons.forEach(btn => btn.classList.toggle('is-active', btn.dataset.filterCategory === 'all'));
    if (searchInput) searchInput.value = '';
    if (colorSelect) colorSelect.value = 'all';
    if (sortSelect) sortSelect.value = 'default';
    renderCatalog();
  });
  renderCatalog();

  // Product modal via event delegation, so dynamically generated cards work automatically.
  const modal = qs('[data-product-modal]');
  const modalImage = qs('[data-modal-image]');
  const modalTitle = qs('[data-modal-title]');
  const modalDescription = qs('[data-modal-description]');
  const modalCategory = qs('[data-modal-category]');
  const modalColor = qs('[data-modal-color]');
  const modalType = qs('[data-modal-type]');
  const productInput = qs('[data-product-input]');
  let currentProduct = null;

  grid?.addEventListener('click', event => {
    const button = event.target.closest('[data-modal-open]');
    if (!button) return;
    currentProduct = catalog.find(item => item.id === button.dataset.modalOpen);
    if (!currentProduct || !modal) return;
    if (modalImage) { modalImage.src = currentProduct.image; modalImage.alt = currentProduct.alt; }
    if (modalTitle) modalTitle.textContent = currentProduct.title;
    if (modalDescription) modalDescription.textContent = currentProduct.description;
    if (modalCategory) modalCategory.textContent = currentProduct.categoryLabel;
    if (modalColor) modalColor.textContent = currentProduct.colorLabel;
    if (modalType) modalType.textContent = currentProduct.categoryLabel;
    document.body.classList.add('modal-open');
    if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open','');
  });

  function closeModal() {
    modal?.close?.();
    modal?.removeAttribute('open');
    document.body.classList.remove('modal-open');
  }
  qsa('[data-modal-close]').forEach(button => button.addEventListener('click', closeModal));
  modal?.addEventListener('click', event => { if (event.target === modal) closeModal(); });
  modal?.addEventListener('close', () => document.body.classList.remove('modal-open'));
  qs('[data-product-inquiry]')?.addEventListener('click', () => {
    if (productInput && currentProduct) productInput.value = currentProduct.title;
    closeModal();
    qs('#anfrage')?.scrollIntoView({behavior:'smooth', block:'start'});
    setTimeout(() => productInput?.focus(), 450);
  });

  // Stable scroll story: active state is driven by scroll position instead of
  // competing IntersectionObserver events. This avoids the "jump back" effect.
  const storySteps = qsa('[data-story-step]');
  const storyImages = qsa('[data-story-image]');
  const storyIndex = qs('[data-story-index]');
  let activeStory = -1;

  function setActiveStory(index) {
    if (index === activeStory || index < 0) return;
    activeStory = index;
    storySteps.forEach((step, i) => step.classList.toggle('is-active', i === index));
    storyImages.forEach((image, i) => image.classList.toggle('is-active', i === index));
    if (storyIndex) storyIndex.textContent = String(index + 1).padStart(2, '0');
  }

  if (storySteps.length) {
    let rafId = null;
    const updateStory = () => {
      rafId = null;
      const focusLine = window.innerHeight * 0.42;
      let closestIndex = 0;
      let closestDistance = Infinity;

      storySteps.forEach((step, index) => {
        const rect = step.getBoundingClientRect();
        const center = rect.top + rect.height * 0.5;
        const distance = Math.abs(center - focusLine);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveStory(closestIndex);
    };

    const requestUpdate = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(updateStory);
    };

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    setActiveStory(0);
    requestUpdate();
  }

  // Offline-safe inquiry preparation.
  const form = qs('[data-request-form]');
  const status = qs('[data-form-status]');
  form?.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); if (status) status.textContent = 'Bitte füllen Sie die Pflichtfelder aus.'; return; }
    const data = new FormData(form);
    const text = [
      'MERVELLE GEMSTONES – Produktanfrage','',
      `Unternehmen: ${data.get('company') || '–'}`,
      `Name: ${data.get('name') || '–'}`,
      `E-Mail: ${data.get('email') || '–'}`,
      `Telefon: ${data.get('phone') || '–'}`,
      `Steinart / Produkt: ${data.get('product') || '–'}`,
      `Verarbeitungsstufe: ${data.get('stage') || '–'}`,
      `Farbe: ${data.get('color') || '–'}`,
      `Größe: ${data.get('size') || '–'}`,
      `Menge: ${data.get('quantity') || '–'}`,'',
      `Weitere Anforderungen: ${data.get('message') || '–'}`
    ].join('\n');
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => { if (status) status.textContent = 'Anfragetext wurde erstellt und in die Zwischenablage kopiert.'; }).catch(() => { if (status) status.textContent = 'Anfrage ist vollständig. Der echte Versand wird vor Livegang angebunden.'; });
    } else if (status) status.textContent = 'Anfrage ist vollständig. Der echte Versand wird vor Livegang angebunden.';
  });
})();
