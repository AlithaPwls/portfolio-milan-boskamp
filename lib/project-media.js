/**
 * Gedeelde projectafbeeldingen — cards en detailpagina.
 */
(function () {
  const PROJECT_SLIDE_MS = 10000;

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function buildSlideshowMarkup(images, alt, className) {
    const slides = images
      .map(
        (url, i) =>
          `<img class="card-image card-image-slide${i === 0 ? ' is-active' : ''}" src="${escapeHtml(url)}" alt="${alt}" loading="${i === 0 ? 'eager' : 'lazy'}" />`
      )
      .join('');

    return `
      <div class="${className}" data-slideshow data-interval="${PROJECT_SLIDE_MS}">
        ${slides}
      </div>
    `;
  }

  function buildProjectMedia(project) {
    const thumbnail = project.thumbnail_image_url || project.image_url || '';
    const image2 = project.image2_url || '';
    const alt = project.title ? escapeHtml(project.title) : 'Projectafbeelding';

    if (thumbnail && image2) {
      return buildSlideshowMarkup([thumbnail, image2], alt, 'card-media');
    }

    const single = thumbnail || image2;
    if (!single) return '';

    return `
      <div class="card-media">
        <img class="card-image" src="${escapeHtml(single)}" alt="${alt}" loading="lazy" />
      </div>
    `;
  }

  function initProjectSlideshows(root) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    root.querySelectorAll('[data-slideshow]').forEach((media) => {
      const slides = [...media.querySelectorAll('.card-image-slide')];
      if (slides.length < 2) return;

      const interval = parseInt(media.dataset.interval, 10) || PROJECT_SLIDE_MS;
      let index = 0;

      setInterval(() => {
        slides[index].classList.remove('is-active');
        index = (index + 1) % slides.length;
        slides[index].classList.add('is-active');
      }, interval);
    });
  }

  window.PortfolioMedia = {
    PROJECT_SLIDE_MS,
    buildProjectMedia,
    initProjectSlideshows,
  };
})();
