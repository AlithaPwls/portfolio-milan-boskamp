/**
 * Admin dashboard — auth guard, CRUD, uploads.
 */

(function () {
  let settings = null;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function showStatus(msg, type = 'success') {
    const el = $('#status-message');
    el.textContent = msg;
    el.className = 'message message-' + type;
    el.hidden = !msg;
    if (msg) {
      clearTimeout(showStatus._t);
      showStatus._t = setTimeout(() => {
        el.hidden = true;
      }, 4000);
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
      if (!name || name === 'file' || name === 'image_file') return;
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
      if (k === 'image_file' || k === 'file') continue;
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

  // --- Navigation ---
  function initPanels() {
    $$('.nav-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const panel = btn.dataset.panel;
        $$('.nav-item').forEach((b) => b.classList.toggle('is-active', b === btn));
        $$('.panel').forEach((p) => p.classList.toggle('is-active', p.dataset.panel === panel));
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

  function setupCrud(table, listId, formId, titleId, cancelId, deleteId, labelFn, mapFormToRow) {
    const form = $(formId);
    const titleEl = $(titleId);
    const cancelBtn = $(cancelId);
    const deleteBtn = $(deleteId);

    const newItemTitle = titleEl.textContent;

    function resetForm() {
      form.reset();
      $('input[name="id"]', form).value = '';
      titleEl.textContent = newItemTitle;
      cancelBtn.hidden = true;
      deleteBtn.hidden = true;
    }

    async function refreshList() {
      const items = await window.PortfolioDB.fetchTable(table);
      renderItemList(listId, items, labelFn, (item) => {
        fillForm(form, item);
        $('input[name="id"]', form).value = item.id;
        titleEl.textContent = 'Item bewerken';
        cancelBtn.hidden = false;
        deleteBtn.hidden = false;
      });
    }

    cancelBtn.addEventListener('click', resetForm);

    deleteBtn.addEventListener('click', async () => {
      const id = $('input[name="id"]', form).value;
      if (!id || !confirm('Weet je zeker dat je dit wilt verwijderen?')) return;
      try {
        await window.PortfolioDB.deleteRow(table, id);
        showStatus('Verwijderd.');
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
        let row = mapFormToRow(raw, form);

        const fileInput = $('input[name="image_file"]', form);
        if (fileInput?.files?.[0]) {
          const url = await window.PortfolioDB.uploadImage(fileInput.files[0], 'projects/' + (id || 'new'));
          row.image_url = url;
        }

        if (id) {
          await window.PortfolioDB.updateRow(table, id, row);
          showStatus('Opgeslagen.');
        } else {
          await window.PortfolioDB.insertRow(table, row);
          showStatus('Toegevoegd.');
        }
        resetForm();
        await refreshList();
      } catch (err) {
        showStatus(err.message, 'error');
      }
    });

    return refreshList;
  }

  // --- Form handlers ---
  function initGeneralForm() {
    $('#form-general').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = formToObject(e.target);
      try {
        settings = await window.PortfolioDB.updateSiteSettings(data);
        showStatus('Algemene teksten opgeslagen.');
      } catch (err) {
        showStatus(err.message, 'error');
      }
    });
  }

  function initThemeForm() {
    $('#form-theme').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = formToObject(e.target);
      try {
        settings = await window.PortfolioDB.updateSiteSettings(data);
        showStatus('Thema opgeslagen.');
      } catch (err) {
        showStatus(err.message, 'error');
      }
    });
  }

  function initContactForm() {
    $('#form-contact').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = formToObject(e.target);
      try {
        settings = await window.PortfolioDB.updateSiteSettings(data);
        showStatus('Contactgegevens opgeslagen.');
      } catch (err) {
        showStatus(err.message, 'error');
      }
    });
  }

  function initProfileForm() {
    $('#form-profile').addEventListener('submit', async (e) => {
      e.preventDefault();
      const file = $('input[name="file"]', e.target).files[0];
      if (!file) {
        showStatus('Kies eerst een afbeelding.', 'error');
        return;
      }
      try {
        const url = await window.PortfolioDB.uploadImage(file, 'profile');
        settings = await window.PortfolioDB.updateSiteSettings({ profile_image_url: url });
        const preview = $('#profile-preview');
        preview.src = url;
        preview.hidden = false;
        e.target.reset();
        showStatus('Profielfoto bijgewerkt.');
      } catch (err) {
        showStatus(err.message, 'error');
      }
    });
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
        image_url: raw.image_url || '',
        live_url: raw.live_url || '',
        sort_order: parseInt(raw.sort_order, 10) || 0,
        is_featured: !!raw.is_featured,
      })
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
      })
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
      })
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
      })
    );

    await Promise.all([refreshProjects(), refreshSkills(), refreshExperiences(), refreshEducations()]);
  }

  init();
})();
