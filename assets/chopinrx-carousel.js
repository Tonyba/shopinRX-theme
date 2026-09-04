/**
 * Wires every `[data-chx-carousel]` on the page to an Embla instance.
 *
 * Embla is passed in rather than imported so the section can resolve the
 * bundle through `asset_url` and avoid relative-path resolution on the CDN.
 *
 * @param {Function} EmblaCarousel
 */
export function initCarousels(EmblaCarousel) {
  for (const root of document.querySelectorAll('[data-chx-carousel]')) {
    if (root.dataset.chxCarouselReady === 'true') continue;
    root.dataset.chxCarouselReady = 'true';

    const viewport = root.querySelector('[data-chx-carousel-viewport]');
    if (!viewport) continue;

    const embla = EmblaCarousel(viewport, {
      align: 'start',
      containScroll: 'trimSnaps',
      loop: false,
      skipSnaps: false,
    });

    const prev = root.querySelector('[data-chx-carousel-prev]');
    const next = root.querySelector('[data-chx-carousel-next]');

    const syncControls = () => {
      if (prev) prev.disabled = !embla.canScrollPrev();
      if (next) next.disabled = !embla.canScrollNext();
    };

    prev?.addEventListener('click', () => embla.scrollPrev());
    next?.addEventListener('click', () => embla.scrollNext());

    embla.on('select', syncControls);
    embla.on('reInit', syncControls);
    syncControls();

    // A carousel inside a hidden tab panel measures as zero-width, so re-measure
    // once its panel is revealed.
    root.closest('[data-chx-panel]')?.addEventListener('chx:tabshown', () => embla.reInit());
  }
}
