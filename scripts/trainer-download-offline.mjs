import fs from 'node:fs';
import path from 'node:path';

const origin = 'https://mathexam.space';
const mime = { '.gif': 'image/gif', '.png': 'image/png' };
const policy = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:";

export function exportStandalone(root, html, entry) {
  const source = new URL(entry.sourceHtml, origin);
  const inline = new Set(entry.inlineAssets);
  const omit = new Set(entry.offlineOmitAssets);
  const deferred = [];
  const read = (sitePath, encoding) => fs.readFileSync(path.join(root, sitePath), encoding);
  const scriptText = code => code.replace(/<\/script/gi, '<\\/script');
  const json = value => JSON.stringify(value).replaceAll('<', '\\u003c');

  const imagePaths = [...(entry.offlineImages || [])];
  for (const id of entry.offlineCourseExamples || []) {
    const base = `/assets/course-examples/${id}`;
    imagePaths.push(`${base}.gif`, ...Array.from({ length: 5 }, (_, index) => `${base}-${index}.png`));
  }
  const media = Object.fromEntries(imagePaths.map(file => {
    const imageType = mime[path.extname(file)];
    if (!imageType) throw new Error(`Unsupported standalone image: ${file}`);
    return [file, `data:${imageType};base64,${read(file).toString('base64')}`];
  }));

  function asset(ref) {
    const url = new URL(ref, source);
    if (url.origin === origin && omit.delete(url.pathname)) return null;
    if (url.origin !== origin || !inline.delete(url.pathname)) {
      throw new Error(`Unreviewed standalone asset in ${entry.sourceHtml}: ${ref}`);
    }
    return url.pathname;
  }

  // Keep parser-blocking scripts in place. Run deferred classics in their original
  // order after the page markup, retaining data attributes and currentScript.
  html = html.replace(/<!--[\s\S]*?-->|<style\b[^>]*>[\s\S]*?<\/style\s*>|<script\b([^>]*)>[\s\S]*?<\/script\s*>|<link\b[^>]*>/gi, (tag, attrs) => {
    if (attrs !== undefined) {
      const src = attrs.match(/\s+src="([^"]+)"/i);
      if (!src) return tag;
      const key = asset(src[1]);
      if (!key) return '';
      if (/\s(?:async|type|integrity)\b/i.test(attrs)) throw new Error(`Unsupported script attributes: ${tag}`);
      const options = attrs.replace(src[0], '').replace(/\s+defer\b/i, '');
      const script = `<script data-inline-source="${key}"${options}>\n${scriptText(read(key, 'utf8'))}\n</script>`;
      if (!/\sdefer\b/i.test(attrs)) return script;
      deferred.push(script);
      return '';
    }
    if (!/^<link\b/i.test(tag)) return tag;
    if (/\brel="canonical"/i.test(tag)) return tag;
    const href = tag.match(/\shref="([^"]+)"/i)?.[1];
    if (/^https:\/\/fonts\.(?:googleapis|gstatic)\.com(?:\/|$)/i.test(href || '')) return '';
    if (!href || !/\brel="stylesheet"/i.test(tag)) throw new Error(`Unreviewed standalone link: ${tag}`);
    const key = asset(href);
    return key ? `<style data-inline-source="${key}">\n${read(key, 'utf8').replace(/<\/style/gi, '<\\/style')}\n</style>` : '';
  });

  if (inline.size || omit.size) throw new Error(`Unused standalone assets in ${entry.sourceHtml}: ${[...inline, ...omit].join(', ')}`);
  if (!/<head\b[^>]*>/i.test(html) || !/<\/body>/i.test(html)) throw new Error(`Missing head or body: ${entry.sourceHtml}`);

  const config = { source: source.href, media };
  const runtime = read('/scripts/trainer-download-runtime.js', 'utf8');
  html = html.replace(/<head\b[^>]*>/i, tag => `${tag}
<meta http-equiv="Content-Security-Policy" content="${policy}">
<script data-offline-runtime>
(${scriptText(runtime)})(${json(config)});
</script>`);
  return html.replace(/<\/body>/i, () => `${deferred.join('\n')}\n</body>`).replace(/^[\t ]+$/gm, '');
}
