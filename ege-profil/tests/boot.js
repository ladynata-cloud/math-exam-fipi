/* Общий загрузчик страниц курса для jsdom-проверок.

   jsdom подгружает внешние <script src> асинхронно, а проверки написаны
   синхронно. Поэтому локальные скрипты страницы (registry.js,
   progress-adapters.js, progress-code.js) подставляются в разметку до
   разбора: страница проверяется вместе с настоящим содержимым этих файлов,
   а отсутствующий или переименованный файл сразу валит проверку. */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.join(__dirname, '..');

/* Читает страницу и вклеивает в неё локальные скрипты. */
function readPage(file){
  const full = path.join(ROOT, file);
  const dir = path.dirname(full);
  const html = fs.readFileSync(full, 'utf8');
  return html.replace(/<script src="([^"]+)"><\/script>/g, (whole, src) => {
    if (/^(https?:)?\/\//.test(src)) return whole;
    const code = fs.readFileSync(path.join(dir, src), 'utf8');
    return '<script data-inlined-from="' + src + '">\n' + code + '\n</script>';
  });
}

/* Возвращает boot(file, seed, url) поверх общего VirtualConsole. */
function makeBoot(errors){
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(String((e && e.message) || e)));
  return function boot(file, seed, url){
    const dom = new JSDOM(readPage(file), {
      runScripts: 'dangerously',
      url: url || 'https://mathexam.space/' + file,
      virtualConsole: vc, pretendToBeVisual: true,
      beforeParse(win){
        win.requestAnimationFrame = () => 0;
        win.fetch = () => Promise.reject(new Error('offline'));
        if (seed) seed(win);
      }
    });
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    return dom.window;
  };
}

module.exports = { ROOT, readPage, makeBoot };
