/**
 * Scroll-to-top button.
 *
 * Shows once the page is scrolled past the first screen and scrolls back up on
 * click. On desktop the theme scrolls `.page-wrapper` rather than the window,
 * so both are watched and the active one is animated.
 */
(function () {
  const button = document.querySelector('[data-chx-top]');
  if (!button) return;

  const wrapper = document.querySelector('.page-wrapper');
  const root = document.scrollingElement || document.documentElement;

  const scroller = () => (wrapper && wrapper.scrollTop > 0 ? wrapper : root);

  let ticking = false;
  const update = () => {
    ticking = false;
    const top = Math.max(wrapper ? wrapper.scrollTop : 0, root.scrollTop);
    button.toggleAttribute('data-visible', top > window.innerHeight * 0.8);
  };

  // Element scroll events do not bubble, so `.page-wrapper` is caught in the
  // capture phase alongside the window's own scroll.
  document.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { capture: true, passive: true }
  );

  button.addEventListener('click', () => {
    const target = scroller();
    // The theme sets scroll-behavior: smooth on the scroller and rewrites
    // history while it scrolls, which cancels a browser-driven smooth scroll.
    // Every step is therefore an instant scroll of its own.
    const jump = (top) => target.scrollTo({ top, behavior: 'instant' });

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      jump(0);
      return;
    }

    const from = target.scrollTop;
    const duration = Math.min(900, 300 + from / 10);
    const started = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const progress = Math.min(1, (now - started) / duration);
      jump(from * (1 - ease(progress)));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  update();
})();
