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

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link) return;
    const src = intakeUrl(link);
    if (!src) return;
    event.preventDefault();
    if (canFrame) open(src, link);
    else window.location.assign(src);
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
