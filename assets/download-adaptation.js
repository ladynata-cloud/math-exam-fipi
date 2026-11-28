/* The request is copied locally. Sending it and attaching the HTML are manual. */
(function () {
  'use strict';
  const panel = document.querySelector('[data-trainer-download]');
  if (!panel) return;
  const form = panel.querySelector('.download-prompt');
  const wish = form.querySelector('.download-wish');
  const copy = form.querySelector('.download-copy');
  const manual = form.querySelector('.download-prompt-text');
  const status = form.querySelector('.download-copy-status');
  const url = panel.querySelector('a[download][href$="-deepseek-prompt.md"]').href;
  const disclosure = panel.querySelector('details');
  let template, pending;

  function loadPrompt() {
    pending ||= fetch(url).then(async response => {
      if (!response.ok) throw new Error('Prompt unavailable');
      template = await response.text();
    }).finally(() => { pending = null; });
    return pending;
  }

  form.hidden = false;
  disclosure.addEventListener('toggle', () => {
    if (disclosure.open && !template) loadPrompt().catch(() => {});
  });
  copy.addEventListener('click', async () => {
    if (copy.getAttribute('aria-busy') === 'true') return;
    copy.setAttribute('aria-busy', 'true');
    status.textContent = '';
    try {
      if (!template) await loadPrompt();
      const request = template.replace('{{изменение}}', () => wish.value.trim() || '[Напишите, что хотите изменить.]');
      try {
        await navigator.clipboard.writeText(request);
        manual.hidden = true;
        status.textContent = 'Промпт скопирован. Приложите HTML к сообщению в DeepSeek.';
      } catch {
        manual.hidden = false;
        manual.value = request;
        manual.focus();
        manual.select();
        status.textContent = 'Текст выделен. Скопируйте его через меню браузера или сочетанием Ctrl+C.';
      }
    } catch {
      status.textContent = 'Промпт можно скачать отдельным файлом или открыть из ZIP.';
    } finally {
      copy.removeAttribute('aria-busy');
    }
  });
})();
