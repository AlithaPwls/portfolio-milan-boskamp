/**
 * Projectdetailpagina — laadt één project op basis van id in de URL.
 */

(function () {
  const $ = (sel) => document.querySelector(sel);

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function getProjectId() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('id');
    if (fromQuery) return fromQuery;

    const match = window.location.pathname.match(/\/project\/([^/]+)\/?$/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  function applyTheme(settings) {
    if (!settings) return;
    const root = document.documentElement;
    if (settings.primary_color) root.style.setProperty('--color-primary', settings.primary_color);
    if (settings.background_color) root.style.setProperty('--color-bg', settings.background_color);
    if (settings.text_color) root.style.setProperty('--color-text', settings.text_color);
    if (settings.font_family) root.style.setProperty('--font-family', settings.font_family);
    if (settings.button_radius) root.style.setProperty('--radius-button', settings.button_radius);
  }

  function renderSiteChrome(settings, projectTitle) {
    const name = settings?.owner_name || 'Portfolio';
    document.title = (projectTitle || 'Project') + ' — ' + name;
    $('#site-logo').textContent = name;
    $('#footer-text').innerHTML =
      '&copy; <span id="footer-year"></span> ' + escapeHtml(name);
    $('#footer-year').textContent = new Date().getFullYear();
  }

  function showError() {
    $('#project-loading').hidden = true;
    $('#project-content').hidden = true;
    $('#project-error').hidden = false;
  }

  function setDetailImage(figureId, imgId, url, alt) {
    const figure = $(figureId);
    const img = $(imgId);
    if (!url) {
      figure.hidden = true;
      img.removeAttribute('src');
      return;
    }
    img.src = url;
    img.alt = alt;
    figure.hidden = false;
  }

  function renderProject(project, settings) {
    renderSiteChrome(settings, project.title);

    const alt = project.title || 'Projectafbeelding';

    $('#project-title').textContent = project.title || 'Project';

    setDetailImage('#project-image-main', '#project-image-main-img', project.image_url, alt);

    const descriptionEl = $('#project-description');
    const longDescription = project.long_description || '';
    if (longDescription) {
      descriptionEl.textContent = longDescription;
      descriptionEl.hidden = false;
    } else {
      descriptionEl.textContent = '';
      descriptionEl.hidden = true;
    }

    setDetailImage('#project-image-secondary', '#project-image-secondary-img', project.image2_url, alt);
    setDetailImage('#project-image-tertiary', '#project-image-tertiary-img', project.image3_url, alt);

    $('#project-loading').hidden = true;
    $('#project-error').hidden = true;
    $('#project-content').hidden = false;
  }

  function initNav() {
    const toggle = $('#nav-toggle');
    const nav = document.querySelector('.nav');
    toggle?.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open);
    });
    nav?.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => nav.classList.remove('is-open'));
    });
  }

  async function init() {
    initNav();

    const id = getProjectId();
    if (!id) {
      showError();
      return;
    }

    try {
      const { settings, project } = await window.PortfolioDB.fetchProjectById(id);
      if (!project) {
        showError();
        return;
      }
      applyTheme(settings);
      renderProject(project, settings);
    } catch (err) {
      console.error(err);
      showError();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
