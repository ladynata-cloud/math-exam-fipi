import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

// Only the exported geometry copy is adapted. Published sources, lesson banks,
// storage namespaces and the classroom board contracts stay byte-identical.
export function prepareGeometryFolder(root, sourceDir, packageDir) {
  const relative = name => path.relative(packageDir, name).split(path.sep).join('/');
  const htmlFiles = [];
  function visit(folder) {
    for (const entry of fs.readdirSync(folder, {withFileTypes: true})) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(file);
    }
  }
  visit(packageDir);
  for (const file of htmlFiles) {
    const sourceFile = path.join(sourceDir, relative(file));
    let html = fs.readFileSync(file, 'utf8');
    const assets = text => text.replace(/<(?:script|link)\b[^>]*\b(?:src|href)=(["'])([^"']+)\1[^>]*>/gi, (tag, quote, ref) => {
      if (/^(?:https?:|data:|#|\/\/)/i.test(ref)) return tag;
      const [, pathname, suffix = ''] = ref.match(/^([^?#]+)([?#].*)?$/);
      const asset = ref.startsWith('/') ? path.join(root, pathname.slice(1)) : path.resolve(path.dirname(sourceFile), pathname);
      if (asset.startsWith(sourceDir + path.sep)) {
        if (!ref.startsWith('/')) return tag;
        const target = path.join(packageDir, path.relative(sourceDir, asset));
        return tag.replace(ref, path.relative(path.dirname(file), target).split(path.sep).join('/') + suffix);
      }
      if (!/\.(?:js|css)$/i.test(pathname)) return tag;
      if (!asset.startsWith(root + path.sep) || !fs.existsSync(asset) || !fs.statSync(asset).isFile()) throw Error('Missing geometry package dependency: ' + ref + ' in ' + relative(file));
      const target = path.join(packageDir, '_shared', path.relative(root, asset));
      fs.mkdirSync(path.dirname(target), {recursive: true});
      fs.copyFileSync(asset, target);
      return tag.replace(ref, path.relative(path.dirname(file), target).split(path.sep).join('/') + suffix);
    });
    // An outbound website link must remain an actual website link when the
    // archive is opened from disk. Internal topic and teacher links stay local.
    const anchors = text => text.replace(/<a\b[^>]*\bhref=(["'])([^"']+)\1[^>]*>/gi, (tag, quote, ref) => {
      if (/^(?:[a-z]+:|#|\/\/)/i.test(ref)) return tag;
      const clean = ref.split(/[?#]/)[0];
      const target = ref.startsWith('/') ? path.join(root, clean.slice(1)) : path.resolve(path.dirname(sourceFile), clean);
      const onlineOnly = ['ichenskaya-7-works', 'board'].some(name => {
        const directory = path.join(sourceDir, name);
        return target === directory || target.startsWith(directory + path.sep);
      });
      if (!onlineOnly && (target === sourceDir || target.startsWith(sourceDir + path.sep))) {
        const index = fs.existsSync(path.join(target, 'index.html'));
        if (!ref.startsWith('/') && !index) return tag;
        const local = path.join(packageDir, path.relative(sourceDir, target), ...(index ? ['index.html'] : []));
        const suffix = ref.slice(clean.length);
        return tag.replace(ref, (path.relative(path.dirname(file), local).split(path.sep).join('/') || '.') + suffix);
      }
      const url = new URL(ref, 'https://mathexam.space/geometry-course/' + relative(file)).href;
      return tag.replace(ref, url);
    });
    // Inline programs contain their own HTML string literals. Rewriting those
    // with a tag regexp would alter the lesson runtime and its saved-work paths.
    html = html.split(/(<script\b[\s\S]*?<\/script>)/gi).map(part => /^<script\b/i.test(part)
      ? part.replace(/^<script\b[^>]*>/i, tag => assets(tag))
      : anchors(assets(part))).join('');
    // Store repeated instructional media once in the archive. Only the guide's
    // resource addresses change; decoded bytes and all lesson programs stay exact.
    html = html.replace(/(<script>\s*window\.COURSE_CONFIG=)([\s\S]*?)(;\s*<\/script>)/, (match, start, raw, end) => {
      const config = JSON.parse(raw);
      if (!config.experimentGuides) return match;
      const localMedia = value => {
        if (typeof value !== 'string' || !value.startsWith('data:image/')) return value;
        const media = /^data:image\/(png|gif);base64,([A-Za-z0-9+/=]+)$/.exec(value);
        if (!media) throw Error('Unexpected guide media encoding in ' + relative(file));
        const bytes = Buffer.from(media[2], 'base64');
        if (bytes.toString('base64') !== media[2]) throw Error('Noncanonical guide media');
        const target = path.join(packageDir, '_shared/geometry-experiment-gifs', createHash('sha256').update(bytes).digest('hex') + '.' + media[1]);
        fs.mkdirSync(path.dirname(target), {recursive: true});
        if (fs.existsSync(target) && !fs.readFileSync(target).equals(bytes)) throw Error('Guide media hash collision');
        fs.writeFileSync(target, bytes);
        return path.relative(path.dirname(file), target).split(path.sep).join('/');
      };
      for (const clip of config.experimentGuides.clips) {
        clip.gif = localMedia(clip.gif); clip.poster = localMedia(clip.poster);
        clip.frames = clip.frames.map(localMedia);
      }
      return start + JSON.stringify(config).replace(/</g, '\\u003c') + end;
    });
    fs.writeFileSync(file, html);
  }
  const embed = (file, id, source) => {
    const json = fs.readFileSync(path.join(root, source), 'utf8');
    JSON.parse(json); // malformed data stops the export before it is published
    const safe = json.replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    const target = path.join(packageDir, file);
    const html = fs.readFileSync(target, 'utf8');
    if (!html.includes('</head>') || html.includes('id="' + id + '"')) throw Error('Unexpected offline geometry entry: ' + file);
    fs.writeFileSync(target, html.replace('</head>', '<script type="application/json" id="' + id + '">' + safe + '</script>\n</head>'));
  };
  const replaceOnce = (file, from, to) => {
    const target = path.join(packageDir, file), text = fs.readFileSync(target, 'utf8');
    if (text.split(from).length !== 2) throw Error('Unexpected geometry offline bootstrap: ' + file);
    fs.writeFileSync(target, text.replace(from, to));
  };
  embed('textbook/index.html', 'geometry-offline-textbook', 'geometry-course/textbook/data/course.json');
  replaceOnce('textbook/index.html',
    "fetch('data/course.json',{cache:'no-cache'}).then(response=>{if(!response.ok)throw Error('Не удалось загрузить курс');return response.json();})",
    "Promise.resolve(JSON.parse(document.getElementById('geometry-offline-textbook').textContent))");
  embed('first-steps/index.html', 'geometry-offline-first-steps', 'learning/atanasyan-first-steps/course.json');
  replaceOnce('first-steps/entry.js',
    "bundleUrl: '../../learning/atanasyan-first-steps/course.json',",
    "bundle: JSON.parse(document.getElementById('geometry-offline-first-steps').textContent),");
  replaceOnce('_shared/learning/atanasyan-first-steps/app.js',
    "companionHref: '/geometry-course/ichenskaya-7-works/'",
    "companionHref: 'https://mathexam.space/geometry-course/ichenskaya-7-works/'");
  replaceOnce('_shared/learning/atanasyan-first-steps/app.js',
    "href: 'https://mathexam.space/geometry-course/textbook/#'",
    "href: '../textbook/index.html#'");
}
