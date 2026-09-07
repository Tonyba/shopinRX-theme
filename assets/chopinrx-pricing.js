/**
 * Billing-period toggle for the product pricing cards.
 *
 * Each `[data-chx-pricing]` section holds one segmented control whose buttons
 * carry a selling plan id, and one card per variant. Choosing a segment writes
 * the plan id into every card's hidden `selling_plan` input and swaps the
 * card's prices for that plan, so the card's own submit button adds the right
 * variant with the right frequency.
 */
export function initPricing() {
  for (const root of document.querySelectorAll('[data-chx-pricing]')) {
    if (root.dataset.chxPricingReady === 'true') continue;
    root.dataset.chxPricingReady = 'true';

    const segments = Array.from(root.querySelectorAll('[data-chx-plan]'));
    if (segments.length === 0) continue;

    const cards = Array.from(root.querySelectorAll('[data-chx-plan-card]'));

    /** @param {HTMLElement} segment */
    const select = (segment) => {
      const planId = segment.dataset.chxPlan;

      for (const item of segments) {
        const active = item === segment;
        item.setAttribute('aria-checked', active ? 'true' : 'false');
        item.tabIndex = active ? 0 : -1;
      }

      for (const card of cards) {
        const input = card.querySelector('[data-chx-plan-input]');
        if (input) input.value = planId;

        let prices;
        try {
          prices = JSON.parse(card.dataset.chxPrices || '{}');
        } catch {
          prices = {};
        }
        const price = prices[planId];
        if (!price) continue;

        const figure = card.querySelector('[data-chx-plan-price]');
        const firstLabel = card.querySelector('[data-chx-plan-first-label]');
        const after = card.querySelector('[data-chx-plan-after]');

        if (figure) figure.textContent = price.first;
        if (firstLabel) firstLabel.textContent = segment.dataset.chxPlanFirstLabel || '';
        if (after) after.textContent = `${price.after}${segment.dataset.chxPlanAfterSuffix || ''}`;
      }
    };

    segments.forEach((segment, index) => {
      segment.addEventListener('click', () => select(segment));

      // Arrow keys move the selection, as a radio group expects.
      segment.addEventListener('keydown', (event) => {
        let target = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') target = segments[(index + 1) % segments.length];
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
          target = segments[(index - 1 + segments.length) % segments.length];
        if (!target) return;
        event.preventDefault();
        select(target);
        target.focus();
      });
    });
  }
}

/**
 * In-page anchors such as "Start intake" scroll to the pricing section. On
 * desktop the theme scrolls `.page-wrapper` rather than the window, so the
 * scroll is animated here and re-aims at the target each frame.
 */
export function initAnchorLinks() {
  if (document.documentElement.dataset.chxAnchorsReady === 'true') return;
  document.documentElement.dataset.chxAnchorsReady = 'true';

  const scrollerOf = (element) => {
    let node = element.parentElement;
    while (node && node !== document.body) {
      const { overflowY } = getComputedStyle(node);
      if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node;
      node = node.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  };

  const scrollTo = (target) => {
    const scroller = scrollerOf(target);
    const isRoot = scroller === document.scrollingElement || scroller === document.documentElement;
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    const offset = () => {
      const top = target.getBoundingClientRect().top - (isRoot ? 0 : scroller.getBoundingClientRect().top);
      return scroller.scrollTop + top - margin;
    };

    // The theme sets scroll-behavior: smooth on the scroller and rewrites
    // history while it scrolls, which cancels a browser-driven smooth scroll a
    // few pixels in. Every step is therefore an instant scroll of its own.
    const jump = (top) => scroller.scrollTo({ top, behavior: 'instant' });

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      jump(offset());
      return;
    }

    const from = scroller.scrollTop;
    const duration = 600;
    const started = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const progress = Math.min(1, (now - started) / duration);
      jump(from + (offset() - from) * ease(progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  document.addEventListener(
    'click',
    (event) => {
      const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
      if (!link || link.getAttribute('href').length < 2) return;

      const target = document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)));
      if (!target) return;

      event.preventDefault();
      history.pushState(null, '', link.getAttribute('href'));
      scrollTo(target);
    },
    true
  );
}
