/**
 * Publieke portfolio — laadt content uit Supabase en rendert secties.
 */

(function () {
  const $ = (sel) => document.querySelector(sel);

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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

  function renderHero(settings) {
    const name = settings?.owner_name || 'Portfolio';
    document.title = name + ' — Portfolio';
    $('#site-logo').textContent = name;
    $('#hero-eyebrow').textContent = 'Portfolio bouwkundig tekenen';
    $('#hero-title').textContent = settings?.hero_title || name;
    $('#hero-subtitle').textContent = settings?.hero_subtitle || '';
    $('#footer-text').innerHTML =
      '&copy; <span id="footer-year"></span> ' + escapeHtml(name);
    $('#footer-year').textContent = new Date().getFullYear();

    const heroBg = $('#hero-bg');
    const heroBgImage = $('#hero-bg-image');
    if (settings?.hero_image) {
      heroBgImage.src = settings.hero_image;
      heroBg.hidden = false;
      $('#hero').classList.add('has-hero-bg');
    } else {
      heroBgImage.removeAttribute('src');
      heroBg.hidden = true;
      $('#hero').classList.remove('has-hero-bg');
    }

    const img = $('#hero-profile');
    const placeholder = $('#hero-profile-placeholder');
    if (settings?.profile_image_url) {
      img.src = settings.profile_image_url;
      img.alt = 'Profielfoto van ' + name;
      img.hidden = false;
      placeholder.hidden = true;
    } else {
      img.hidden = true;
      placeholder.hidden = false;
    }
  }

  function renderAbout(settings) {
    $('#about-text').textContent = settings?.about_text || 'Nog geen tekst toegevoegd.';
  }

  function projectDetailUrl(id) {
    return 'project/?id=' + encodeURIComponent(id);
  }

  function renderProjects(projects) {
    const grid = $('#projects-grid');
    const empty = $('#projects-empty');
    grid.innerHTML = '';

    if (!projects.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    const sorted = [...projects].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    sorted.forEach((p) => {
      const card = document.createElement('a');
      card.className = 'card card-interactive';
      card.href = projectDetailUrl(p.id);
      card.setAttribute('role', 'listitem');
      const mediaHtml = window.PortfolioMedia.buildProjectMedia(p);
      const badge = p.is_featured ? '<span class="card-badge">Uitgelicht</span>' : '';
      card.innerHTML = `
        ${mediaHtml}
        <div class="card-body">
          ${badge}
          <h3>${escapeHtml(p.title)}</h3>
          <p>${escapeHtml(p.description)}</p>
          <span class="card-cta">Bekijk project →</span>
        </div>
      `;
      grid.appendChild(card);
    });

    window.PortfolioMedia.initProjectSlideshows(grid);
  }

  function renderSkills(skills) {
    const container = $('#skills-container');
    const empty = $('#skills-empty');
    container.innerHTML = '';

    if (!skills.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    const byCategory = {};
    skills.forEach((s) => {
      const cat = s.category || 'Algemeen';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(s);
    });

    Object.keys(byCategory)
      .sort()
      .forEach((cat) => {
        const group = document.createElement('div');
        group.className = 'skills-group';
        const tags = byCategory[cat]
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((s) => `<span class="skill-tag">${escapeHtml(s.name)}</span>`)
          .join('');
        group.innerHTML = `<h3>${escapeHtml(cat)}</h3><div class="skill-tags">${tags}</div>`;
        container.appendChild(group);
      });
  }

  function renderTimeline(list, containerId, emptyId) {
    const container = $(containerId);
    const empty = $(emptyId);
    container.innerHTML = '';

    if (!list.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    list.forEach((item) => {
      const el = document.createElement('article');
      el.className = 'timeline-item';
      const dates = [item.start_date, item.end_date].filter(Boolean).join(' — ');
      const subtitle = item.company || item.school || '';
      el.innerHTML = `
        <h3>${escapeHtml(item.title)}</h3>
        <p class="timeline-meta">${escapeHtml(subtitle)}${dates ? ' · ' + escapeHtml(dates) : ''}</p>
        <p>${escapeHtml(item.description)}</p>
      `;
      container.appendChild(el);
    });
  }

  function renderContact(settings) {
    const email = settings?.contact_email;
    const emailEl = $('#contact-email');
    if (email) {
      emailEl.href = 'mailto:' + email;
      emailEl.textContent = email;
    } else {
      emailEl.href = '#';
      emailEl.textContent = 'Geen e-mail ingesteld';
    }

    const social = $('#social-links');
    social.innerHTML = '';
    const links = [
      { url: settings?.linkedin_url, label: 'LinkedIn' },
      { url: settings?.instagram_url, label: 'Instagram' },
    ].filter((l) => l.url);

    links.forEach((l) => {
      const a = document.createElement('a');
      a.href = l.url;
      a.textContent = l.label;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      social.appendChild(a);
    });
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

    try {
      const data = await window.PortfolioDB.fetchPublicContent();
      const { settings, projects, skills, experiences, educations } = data;

      applyTheme(settings);
      renderHero(settings);
      renderAbout(settings);
      renderProjects(projects);
      renderSkills(skills);
      renderTimeline(experiences, '#experience-list', '#experience-empty');
      renderTimeline(educations, '#education-list', '#education-empty');
      renderContact(settings);
    } catch (err) {
      console.error(err);
      $('#load-error').hidden = false;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
