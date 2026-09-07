/**
 * Wires every `[data-chx-gallery]` product gallery to Embla: the stage is a
 * looping carousel, the thumbnail strip drives it and hides the photograph
 * that is currently on stage.
 *
 * @param {Function} EmblaCarousel
 */
export function initGalleries(EmblaCarousel) {
  for (const root of document.querySelectorAll('[data-chx-gallery]')) {
    if (root.dataset.chxGalleryReady === 'true') continue;
    root.dataset.chxGalleryReady = 'true';

    const viewport = root.querySelector('[data-chx-gallery-viewport]');
    if (!viewport) continue;

    const embla = EmblaCarousel(viewport, { loop: true, align: 'start', skipSnaps: false });
    const thumbs = root.querySelectorAll('[data-chx-gallery-thumb]');

    const syncThumbs = () => {
      const index = embla.selectedScrollSnap();
      thumbs.forEach((thumb) => {
        const active = Number(thumb.dataset.chxGalleryThumb) === index;
        if (active) thumb.setAttribute('aria-current', 'true');
        else thumb.removeAttribute('aria-current');
      });
    };

    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => embla.scrollTo(Number(thumb.dataset.chxGalleryThumb)));
    });

    root.querySelector('[data-chx-gallery-prev]')?.addEventListener('click', () => embla.scrollPrev());
    root.querySelector('[data-chx-gallery-next]')?.addEventListener('click', () => embla.scrollNext());

    embla.on('select', syncThumbs);
    embla.on('reInit', syncThumbs);
    syncThumbs();
  }
}
