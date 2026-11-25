/**
 * Fades `[data-chx-reveal]` items up as they enter the viewport.
 *
 * A root opts in with `[data-chx-reveal-root]`; the hidden state only applies
 * once this script adds `.chx-reveal-on` to it, so without JS (or with reduced
 * motion) everything stays visible. Items inside one root that come into view
 * together are staggered through the `--chx-reveal-delay` custom property.
 */
const STAGGER_MS = 120;

function init() {
  const roots = document.querySelectorAll('[data-chx-reveal-root]:not(.chx-reveal-on)');
  if (!roots.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      // Stagger only the items that arrive in the same callback.
      let index = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const item = entry.target;
        item.style.setProperty('--chx-reveal-delay', `${index * STAGGER_MS}ms`);
        item.classList.add('is-revealed');
        observer.unobserve(item);
        index += 1;
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.15 }
  );

  for (const root of roots) {
    root.classList.add('chx-reveal-on');
    for (const item of root.querySelectorAll('[data-chx-reveal]')) observer.observe(item);
  }
}

init();
document.addEventListener('shopify:section:load', init);
