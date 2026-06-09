/**
 * Admin dashboard — auth guard, CRUD, uploads.
 */

(function () {
  let settings = null;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function showStatus(msg, type = 'success', options = {}) {
    const el = $('#status-message');
    if (!msg) {
      el.hidden = true;
      return;
    }
    el.textContent = msg;
    el.className = 'message message-' + type + ' is-toast';
    el.hidden = false;
    clearTimeout(showStatus._t);
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (type !== 'loading' && !options.persist) {
      showStatus._t = setTimeout(() => {
        el.hidden = true;
      }, 5000);
    }
  }

  function setButtonLoading(button, loading, idleText, loadingText) {
    if (!button) return;
    if (loading) {
      button.dataset.idleText = button.dataset.idleText || button.textContent;
      button.textContent = loadingText || 'Bezig…';
      button.disabled = true;
    } else {
      button.textContent = idleText || button.dataset.idleText || button.textContent;
      button.disabled = false;
    }
  }

  /** Converteer #rrggbb naar waarde voor color input */
  function toColorInput(hex) {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return '#2563eb';
    return hex.slice(0, 7);
  }

  function fillForm(form, data) {
    $$('input, textarea, select', form).forEach((field) => {
      const name = field.name;
      if (!name || name === 'file' || name === 'image_file' || name === 'image2_file' || name === 'image3_file' || name === 'thumbnail_file' || name === 'hero_image_file') return;
      if (field.type === 'checkbox') {
        field.checked = !!data[name];
      } else if (field.type === 'color') {
        field.value = toColorInput(data[name]);
      } else if (data[name] !== undefined && data[name] !== null) {
        field.value = data[name];
      }
    });
  }

  function formToObject(form) {
    const fd = new FormData(form);
    const obj = {};
    for (const [k, v] of fd.entries()) {
      if (k === 'id' && !v) continue;
      if (k === 'image_file' || k === 'image2_file' || k === 'image3_file' || k === 'thumbnail_file' || k === 'hero_image_file' || k === 'file') continue;
      obj[k] = v;
    }
    const cb = form.querySelector('[name="is_featured"]');
    if (cb) obj.is_featured = cb.checked;
    return obj;
  }

  // --- Auth ---
  async function requireAuth() {
    if (!window.PortfolioDB) {
      window.location.replace('/admin');
      return false;
    }
    try {
      const session = await window.PortfolioDB.getSession();
      if (!session) {
        window.location.replace('/admin');
        return false;
      }
      return true;
    } catch (e) {
      console.error(e);
      window.location.replace('/admin');
      return false;
    }
  }

  // --- Sidebar ---
  const SIDEBAR_KEY = 'portfolio-admin-sidebar-collapsed';

  function setSidebarCollapsed(collapsed) {
    const sidebar = $('#admin-sidebar');
    const app = $('#dashboard-app');
    const toggle = $('#sidebar-toggle');
    if (!sidebar || !app || !toggle) return;

    sidebar.classList.toggle('is-collapsed', collapsed);
    app.classList.toggle('is-sidebar-collapsed', collapsed);
    toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    toggle.title = collapsed ? 'Menu uitklappen' : 'Menu inklappen';
    localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0');
  }

  function initSidebar() {
    const toggle = $('#sidebar-toggle');
    if (!toggle) return;

    const defaultCollapsed = window.matchMedia('(max-width: 900px)').matches;
    const stored = localStorage.getItem(SIDEBAR_KEY);
    const collapsed = stored === null ? defaultCollapsed : stored === '1';
    setSidebarCollapsed(collapsed);

    toggle.addEventListener('click', () => {
      setSidebarCollapsed(!$('#admin-sidebar').classList.contains('is-collapsed'));
    });
  }

  // --- Navigation ---
  function initPanels() {
    $$('.nav-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const panel = btn.dataset.panel;
        $$('.nav-item').forEach((b) => b.classList.toggle('is-active', b === btn));
        $$('.panel').forEach((p) => p.classList.toggle('is-active', p.dataset.panel === panel));
        if (window.matchMedia('(max-width: 900px)').matches) {
          setSidebarCollapsed(true);
        }
      });
    });
  }

  // --- Settings load ---
  async function loadSettings() {
    const data = await window.PortfolioDB.fetchPublicContent();
    settings = data.settings;
    fillForm($('#form-general'), settings);
    fillForm($('#form-theme'), settings);
    fillForm($('#form-contact'), settings);

    const preview = $('#profile-preview');
    if (settings?.profile_image_url) {
      preview.src = settings.profile_image_url;
      preview.hidden = false;
    } else {
      preview.hidden = true;
    }

    const heroPreview = $('#hero-bg-preview');
    if (settings?.hero_image) {
      heroPreview.src = settings.hero_image;
      heroPreview.hidden = false;
    } else {
      heroPreview.hidden = true;
    }
  }

  // --- CRUD list UI ---
  function renderItemList(containerId, items, labelFn, onEdit) {
    const container = $(containerId);
    container.innerHTML = '';
    if (!items.length) {
      container.innerHTML = '<p class="item-list-empty">Nog geen items.</p>';
      return;
    }
    items.forEach((item) => {
      const label = labelFn(item);
      const row = document.createElement('div');
      row.className = 'item-row';
      const info = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = label.title;
      const span = document.createElement('span');
      span.textContent = label.sub || '';
      info.appendChild(strong);
      info.appendChild(document.createElement('br'));
      info.appendChild(span);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Bewerken';
      btn.addEventListener('click', () => onEdit(item));
      row.appendChild(info);
      row.appendChild(btn);
      container.appendChild(row);
    });
  }

  function setupCrud(table, listId, formId, titleId, cancelId, deleteId, labelFn, mapFormToRow, options = {}) {
    const form = $(formId);
    const titleEl = $(titleId);
    const cancelBtn = $(cancelId);
    const deleteBtn = $(deleteId);
    const uploadFields = options.uploadFields || [];
    const entityLabel = options.entityLabel || 'Item';
    const storageFolder = options.storageFolder || table;
    const onEditItem = options.onEditItem;
    const onResetForm = options.onResetForm;

    const newItemTitle = titleEl.textContent;
    const submitBtn = $('button[type="submit"]', form);

    function resetForm() {
      form.reset();
      $('input[name="id"]', form).value = '';
      titleEl.textContent = newItemTitle;
      cancelBtn.hidden = true;
      deleteBtn.hidden = true;
      onResetForm?.();
    }

    async function refreshList() {
      const items = await window.PortfolioDB.fetchTable(table);
      renderItemList(listId, items, labelFn, (item) => {
        fillForm(form, item);
        $('input[name="id"]', form).value = item.id;
        titleEl.textContent = entityLabel + ' bewerken';
        cancelBtn.hidden = false;
        deleteBtn.hidden = false;
        onEditItem?.(item);
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    cancelBtn.addEventListener('click', resetForm);

    deleteBtn.addEventListener('click', async () => {
      const id = $('input[name="id"]', form).value;
      if (!id || !confirm('Weet je zeker dat je dit wilt verwijderen?')) return;
      try {
        showStatus(entityLabel + ' verwijderen…', 'loading');
        await window.PortfolioDB.deleteRow(table, id);
        showStatus(entityLabel + ' verwijderd.');
        resetForm();
        await refreshList();
      } catch (e) {
        showStatus(e.message, 'error');
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const raw = formToObject(form);
      const id = raw.id;
      delete raw.id;

      try {
        setButtonLoading(submitBtn, true, null, 'Opslaan…');
        showStatus(entityLabel + ' opslaan…', 'loading');

        let row = mapFormToRow(raw, form);

        for (const field of uploadFields) {
          const fileInput = $(`input[name="${field.input}"]`, form);
          if (!fileInput?.files?.[0]) continue;
          const path = `${storageFolder}/${id || 'new'}/${field.pathSuffix || field.column}`;
          row[field.column] = await window.PortfolioDB.uploadImage(fileInput.files[0], path);
        }

        if (id) {
          await window.PortfolioDB.updateRow(table, id, row);
          showStatus(entityLabel + ' opgeslagen — wijzigingen staan live.');
        } else {
          await window.PortfolioDB.insertRow(table, row);
          showStatus(entityLabel + ' toegevoegd — zichtbaar op de site.');
        }
        resetForm();
        await refreshList();
      } catch (err) {
        showStatus(err.message, 'error');
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });

    return refreshList;
  }

  // --- Form handlers ---
  function initSettingsForm(formId, loadingMsg, successMsg) {
    const form = $(formId);
    const submitBtn = $('button[type="submit"]', form);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = formToObject(e.target);
      try {
        setButtonLoading(submitBtn, true, null, 'Opslaan…');
        showStatus(loadingMsg, 'loading');
        settings = await window.PortfolioDB.updateSiteSettings(data);
        showStatus(successMsg);
      } catch (err) {
        showStatus(err.message, 'error');
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  }

  function initGeneralForm() {
    const form = $('#form-general');
    const submitBtn = $('button[type="submit"]', form);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = formToObject(e.target);
      try {
        setButtonLoading(submitBtn, true, null, 'Opslaan…');
        showStatus('Algemene teksten opslaan…', 'loading');
        const file = $('input[name="hero_image_file"]', form).files[0];
        if (file) {
          data.hero_image = await window.PortfolioDB.uploadImage(file, 'hero');
        }
        settings = await window.PortfolioDB.updateSiteSettings(data);
        const heroPreview = $('#hero-bg-preview');
        if (settings.hero_image) {
          heroPreview.src = settings.hero_image;
          heroPreview.hidden = false;
        }
        const fileInput = $('input[name="hero_image_file"]', form);
        if (fileInput) fileInput.value = '';
        showStatus('Algemene teksten opgeslagen — zichtbaar op de homepage.');
      } catch (err) {
        showStatus(err.message, 'error');
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  }

  function initThemeForm() {
    initSettingsForm('#form-theme', 'Thema opslaan…', 'Thema opgeslagen — kleuren en lettertype zijn bijgewerkt.');
  }

  function initContactForm() {
    initSettingsForm(
      '#form-contact',
      'Contactgegevens opslaan…',
      'Contact & social opgeslagen — links op de site zijn bijgewerkt.'
    );
  }

  function initProfileForm() {
    const form = $('#form-profile');
    const submitBtn = $('button[type="submit"]', form);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const file = $('input[name="file"]', e.target).files[0];
      if (!file) {
        showStatus('Kies eerst een afbeelding om te uploaden.', 'error');
        return;
      }
      try {
        setButtonLoading(submitBtn, true, null, 'Uploaden…');
        showStatus('Profielfoto uploaden…', 'loading');
        const url = await window.PortfolioDB.uploadImage(file, 'profile');
        settings = await window.PortfolioDB.updateSiteSettings({ profile_image_url: url });
        const preview = $('#profile-preview');
        preview.src = url;
        preview.hidden = false;
        e.target.reset();
        showStatus('Profielfoto opgeslagen — zichtbaar in de hero.');
      } catch (err) {
        showStatus(err.message, 'error');
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  }

  function setImagePreview(previewId, url, alt) {
    const img = $(previewId);
    if (!img) return;
    if (url) {
      img.src = url;
      img.alt = alt || 'Huidige afbeelding';
      img.hidden = false;
    } else {
      img.removeAttribute('src');
      img.hidden = true;
    }
  }

  function updateProjectPreviews(item) {
    setImagePreview('#projects-preview-main', item?.image_url, 'Hoofdafbeelding');
    setImagePreview('#projects-preview-image2', item?.image2_url, 'Extra afbeelding 2');
    setImagePreview('#projects-preview-image3', item?.image3_url, 'Extra afbeelding 3');
    setImagePreview('#projects-preview-thumbnail', item?.thumbnail_image_url, 'Thumbnail');
  }

  function initLogout() {
    $('#logout-btn').addEventListener('click', async () => {
      await window.PortfolioDB.signOut();
      window.location.replace('/admin');
    });
    window.PortfolioDB.onAuthChange((session) => {
      if (!session) window.location.replace('/admin');
    });
  }

  async function init() {
    const ok = await requireAuth();
    if (!ok) return;

    initSidebar();
    initPanels();
    initLogout();
    initGeneralForm();
    initThemeForm();
    initContactForm();
    initProfileForm();

    await loadSettings();

    const refreshProjects = setupCrud(
      'projects',
      '#list-projects',
      '#form-projects',
      '#projects-form-title',
      '#projects-cancel',
      '#projects-delete',
      (p) => ({ title: p.title, sub: p.is_featured ? 'Uitgelicht' : '' }),
      (raw) => ({
        title: raw.title,
        description: raw.description || '',
        long_description: raw.long_description || '',
        image_url: raw.image_url || '',
        image2_url: raw.image2_url || '',
        image3_url: raw.image3_url || '',
        thumbnail_image_url: raw.thumbnail_image_url || '',
        live_url: raw.live_url || '',
        sort_order: parseInt(raw.sort_order, 10) || 0,
        is_featured: !!raw.is_featured,
      }),
      {
        entityLabel: 'Project',
        storageFolder: 'projects',
        uploadFields: [
          { input: 'image_file', column: 'image_url', pathSuffix: 'main' },
          { input: 'image2_file', column: 'image2_url', pathSuffix: 'image2' },
          { input: 'image3_file', column: 'image3_url', pathSuffix: 'image3' },
          { input: 'thumbnail_file', column: 'thumbnail_image_url', pathSuffix: 'thumbnail' },
        ],
        onEditItem: updateProjectPreviews,
        onResetForm: () => updateProjectPreviews(null),
      }
    );

    const refreshSkills = setupCrud(
      'skills',
      '#list-skills',
      '#form-skills',
      '#skills-form-title',
      '#skills-cancel',
      '#skills-delete',
      (s) => ({ title: s.name, sub: s.category }),
      (raw) => ({
        name: raw.name,
        category: raw.category || 'Algemeen',
        sort_order: parseInt(raw.sort_order, 10) || 0,
      }),
      { entityLabel: 'Skill' }
    );

    const refreshExperiences = setupCrud(
      'experiences',
      '#list-experiences',
      '#form-experiences',
      '#experiences-form-title',
      '#experiences-cancel',
      '#experiences-delete',
      (x) => ({ title: x.title, sub: x.company }),
      (raw) => ({
        title: raw.title,
        company: raw.company || '',
        start_date: raw.start_date || '',
        end_date: raw.end_date || '',
        description: raw.description || '',
        sort_order: parseInt(raw.sort_order, 10) || 0,
      }),
      { entityLabel: 'Ervaring' }
    );

    const refreshEducations = setupCrud(
      'educations',
      '#list-educations',
      '#form-educations',
      '#educations-form-title',
      '#educations-cancel',
      '#educations-delete',
      (x) => ({ title: x.title, sub: x.school }),
      (raw) => ({
        title: raw.title,
        school: raw.school || '',
        start_date: raw.start_date || '',
        end_date: raw.end_date || '',
        description: raw.description || '',
        sort_order: parseInt(raw.sort_order, 10) || 0,
      }),
      { entityLabel: 'Opleiding' }
    );

    await Promise.all([refreshProjects(), refreshSkills(), refreshExperiences(), refreshEducations()]);
  }

  init();
})();
