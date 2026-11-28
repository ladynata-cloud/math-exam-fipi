import fs from 'node:fs';
import path from 'node:path';
import supplements from '../geometry-course/textbook/assets/additional-lessons.js';

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
    fs.writeFileSync(file, html);
  }
  const embed = (file, id, source) => {
    const json = fs.readFileSync(path.join(root, source), 'utf8');
    const data = JSON.parse(json);
    const safe = json.replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    const target = path.join(packageDir, file);
    const html = fs.readFileSync(target, 'utf8');
    if (!html.includes('</head>') || html.includes('id="' + id + '"')) throw Error('Unexpected offline geometry entry: ' + file);
    fs.writeFileSync(target, html.replace('</head>', '<script type="application/json" id="' + id + '">' + safe + '</script>\n</head>'));
    return data;
  };
  const replaceOnce = (file, from, to) => {
    const target = path.join(packageDir, file), text = fs.readFileSync(target, 'utf8');
    if (text.split(from).length !== 2) throw Error('Unexpected geometry offline bootstrap: ' + file);
    fs.writeFileSync(target, text.replace(from, to));
  };
  let completeTextbook = embed('textbook/index.html', 'geometry-offline-textbook', 'geometry-course/textbook/data/course.json');
  const ids = supplements.unitFiles.map(url => {
    const id = 'geometry-offline-' + path.basename(url, '.json');
    const unit = embed('textbook/index.html', id, url.slice(1));
    completeTextbook = supplements.append(completeTextbook, unit);
    return id;
  });
  replaceOnce('README.txt', 'Каталог задачника показывает число доступных карточек.',
    'Доступно карточек в задачнике: ' + completeTextbook.lessons.length + '.');
  replaceOnce('textbook/index.html',
    "fetch('data/course.json',{cache:'no-cache'}).then(response=>{if(!response.ok)throw Error('Не удалось загрузить курс');return response.json();}).then(GeometryAdditionalLessons.forCourse)",
    "Promise.resolve(" + JSON.stringify(ids) + ".reduce((course,id)=>GeometryAdditionalLessons.append(course,JSON.parse(document.getElementById(id).textContent)),JSON.parse(document.getElementById('geometry-offline-textbook').textContent)))");
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
