/* Optional browser transport. The host page deliberately includes this script
   from its own configured assistant service; loading it sends no conversation. */
(() => {
  'use strict';

  const script = document.currentScript;
  if (!script || !script.src) return;
  const endpoint = new URL('/api/v1/dialogue', script.src);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname);
  if (endpoint.protocol !== 'https:' && !(local && endpoint.protocol === 'http:')) return;

  async function ask(request, {signal} = {}) {
    if (!request || !['uzel', 'mathexam'].includes(request.site) || signal?.aborted) return null;
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, {once: true});
    const timer = setTimeout(abort, 4500);
    try {
      const response = await fetch(endpoint.href, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        cache: 'no-store',
        redirect: 'error',
        body: JSON.stringify(request),
        signal: controller.signal
      });
      if (!response.ok) return null;
      const result = await response.json();
      if (result?.version !== 1 || result.site !== request.site ||
          typeof result.reply !== 'string' || !Array.isArray(result.links)) return null;
      return result;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    }
  }

  window.SiteDialogueClient = Object.freeze({enabled: true, ask});
  window.dispatchEvent(new Event('site-dialogue-ready'));
})();
