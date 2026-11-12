/**
 * Intake modal.
 *
 * Catches clicks on any link to a MyDose book-consultation URL and opens it in
 * the intake dialog, on the branded intake.chopinwellness.com host. That host
 * only allows framing from chopinwellness.com (CSP frame-ancestors), so on any
 * other domain (myshopify preview, theme editor) the link opens as a page.
 */
(function () {
  const dialog = document.querySelector('[data-chx-intake]');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const frame = dialog.querySelector('[data-chx-intake-frame]');
  const INTAKE_HOST = 'intake.chopinwellness.com';
  const SOURCE_HOSTS = ['app.mydose.ai', INTAKE_HOST];
  const host = window.location.hostname;
  const canFrame = /(^|\.)chopinwellness\.com$/.test(host) || host === '127.0.0.1' || host === 'localhost';

  let opener = null;

  const intakeUrl = (link) => {
    let url;
    try {
      url = new URL(link.href);
    } catch (e) {
      return null;
    }
    if (!SOURCE_HOSTS.includes(url.hostname) || !url.pathname.startsWith('/patient/book-consultation/')) return null;
    url.hostname = INTAKE_HOST;
    return url.href;
  };

  const open = (src, trigger) => {
    opener = trigger;
    if (frame.getAttribute('src') !== src) frame.setAttribute('src', src);
    dialog.showModal();
  };

  const close = () => {
    if (dialog.open) dialog.close();
  };

  // Where the modal can run, intake links stop being links: the URL moves to a
  // data attribute and the href goes away, so middle-click, ctrl/cmd-click and
  // the context menu's "open in new tab" have nothing to open. Elsewhere the
  // href is rewritten to the intake host so a new tab at least lands there.
  const SELECTOR = 'a[href*="/patient/book-consultation/"]';

  const prepare = (link) => {
    const src = intakeUrl(link);
    if (!src) return;
    if (!canFrame) {
      link.href = src;
      return;
    }
    link.dataset.chxIntakeSrc = src;
    link.removeAttribute('href');
    link.removeAttribute('target');
    link.setAttribute('role', 'button');
    link.setAttribute('tabindex', '0');
  };

  const prepareIn = (root) => {
    if (root.matches?.(SELECTOR)) prepare(root);
    root.querySelectorAll?.(SELECTOR).forEach(prepare);
  };

  prepareIn(document);

  // Sections re-rendered by variant changes, quizzes or the theme editor.
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) prepareIn(node);
      });
    }
  }).observe(document.body, { childList: true, subtree: true });

  if (!canFrame) return;

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    const link = event.target.closest('[data-chx-intake-src]');
    if (!link) return;
    event.preventDefault();
    open(link.dataset.chxIntakeSrc, link);
  });

  // role="button" contract: Enter and Space activate.
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const link = event.target.closest?.('[data-chx-intake-src]');
    if (!link) return;
    event.preventDefault();
    open(link.dataset.chxIntakeSrc, link);
  });

  dialog.querySelectorAll('[data-chx-intake-close]').forEach((button) => button.addEventListener('click', close));

  // Click on the backdrop (outside the panel) closes it.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });

  dialog.addEventListener('close', () => {
    // Clearing the frame resets the form, so reopening starts clean and no
    // audio or timers keep running behind the closed dialog.
    frame.removeAttribute('src');
    if (opener) opener.focus();
    opener = null;
  });
})();
