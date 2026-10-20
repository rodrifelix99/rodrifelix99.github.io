// The Index: every project, the career and the contact in one list, for
// anyone who would rather read than fly. Filters work on the archive rows.

const dialog = document.getElementById('index') as HTMLDialogElement | null;

if (dialog) {
  let opener: HTMLElement | null = null;

  document.querySelectorAll<HTMLElement>('[data-open-index]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      opener = el;
      dialog.showModal();
      dialog.querySelector<HTMLElement>('.ix__close')?.focus();
    });
  });
  dialog.querySelectorAll<HTMLElement>('[data-close-index]').forEach((el) => el.addEventListener('click', () => dialog.close()));
  // A click on the backdrop closes it, like any sheet.
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    // "Fly there" moves focus with the camera, so only restore it otherwise.
    if (opener && !dialog.dataset.flying) opener.focus();
    delete dialog.dataset.flying;
  });
  dialog.querySelectorAll<HTMLElement>('[data-goto]').forEach((el) => {
    el.addEventListener('click', () => { dialog.dataset.flying = '1'; }, { capture: true });
  });

  const chips = [...dialog.querySelectorAll<HTMLButtonElement>('[data-filter]')];
  const rows = [...dialog.querySelectorAll<HTMLElement>('[data-filter-list] > li')];
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const id = chip.dataset.filter!;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    rows.forEach((r) => {
      const tags = (r.dataset.tags || '').split(' ');
      const show = id === 'all' || tags.includes(id) || (id === 'prog' && tags.includes('proto'));
      r.hidden = !show;
    });
  }));
}
