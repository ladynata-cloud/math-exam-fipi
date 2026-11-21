'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {execFileSync} = require('node:child_process');
const {restorePublicNavigator} = require('../public-navigator-preservation.cjs');
const root = path.resolve(__dirname, '../..');
const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'atanasyan-geometry-package-'));
const zip = path.join(root, 'downloads/trainers/geometry-course/geometry-course-package.zip');
const files = JSON.parse(execFileSync('python3', ['-c',
  "import json,pathlib,sys,zipfile\nwith zipfile.ZipFile(sys.argv[1]) as z:\n names=z.namelist()\n assert all(not pathlib.PurePosixPath(n).is_absolute() and '..' not in pathlib.PurePosixPath(n).parts for n in names)\n z.extractall(sys.argv[2])\n print(json.dumps(names))", zip, folder], {encoding: 'utf8'}));
const read = name => fs.readFileSync(path.join(folder, name), 'utf8');
const source = name => fs.readFileSync(path.join(root, name));
const embedded = (name, id) => {
  const match = read(name).match(new RegExp('<script type="application/json" id="' + id + '">([\\s\\S]*?)</script>'));
  assert(match, name + ': embedded source bank');
  return JSON.parse(match[1]);
};
const course = require(root + '/geometry-course/data/course.json');
assert.equal(course.units.length, 63);
assert.equal(files.filter(file => /^atlas\/[^/]+\.html$/.test(file)).length, 63);
for (const unit of course.units) {
  const name = 'atlas/' + unit.id + '.html';
  const original = restorePublicNavigator('geometry-course/' + name, source('geometry-course/' + name)).toString('utf8');
  // The exporter only turns website links into absolute website URLs; the
  // mathematics, labels and inline lesson scripts stay exactly as built.
  const scripts = html => [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]);
  assert.deepEqual(scripts(read(name)), scripts(original), unit.id + ': exact standalone inline sources');
  assert(!/navigator-(?:data|widget)\.js/.test(read(name)), unit.id + ': public shell omitted');
}
const textbook = require(root + '/geometry-course/textbook/data/course.json');
const first = require(root + '/learning/atanasyan-first-steps/course.json');
assert.deepEqual(embedded('textbook/index.html', 'geometry-offline-textbook'), textbook);
const {unitFiles,append}=require('../../geometry-course/textbook/assets/additional-lessons.js');
const completeTextbook=unitFiles.reduce((course,file)=>{
  const unit=JSON.parse(source(file.slice(1)));
  assert.deepEqual(embedded('textbook/index.html','geometry-offline-'+path.basename(file,'.json')),unit);
  return append(course,unit);
},textbook);
assert.deepEqual(embedded('first-steps/index.html', 'geometry-offline-first-steps'), first);
assert.equal(textbook.lessons.length, 1425);
assert.equal(first.lessons.length, 255);
assert(!read('textbook/index.html').includes("fetch('data/course.json'"));
assert(read('first-steps/entry.js').includes("bundle: JSON.parse(document.getElementById('geometry-offline-first-steps').textContent)"));
for (const name of ['app.js', 'state.js', 'style.css']) {
  let expected = source('learning/atanasyan-first-steps/' + name).toString('utf8');
  if (name === 'app.js') expected = expected.replace("companionHref: '/geometry-course/ichenskaya-7-works/'", "companionHref: 'https://mathexam.space/geometry-course/ichenskaya-7-works/'")
    .replace("href: 'https://mathexam.space/geometry-course/textbook/#'", "href: '../textbook/index.html#'");
  assert.equal(read('_shared/learning/atanasyan-first-steps/' + name), expected, 'only the two exact exported navigation links may change');
}
const core = ['index.html', 'geometry-course.html', 'teacher-atlas.html', 'textbook/index.html', 'first-steps/index.html', 'grade7/index.html', 'legacy7.html', ...course.units.map(unit => 'atlas/' + unit.id + '.html'), ...files.filter(file => /^trainers\/[^/]+\.html$/.test(file))];
let resources = 0;
for (const name of core) {
  const resourceHTML = read(name).replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/gi, '$1</script>');
  for (const match of resourceHTML.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)=["']([^"']+)["'][^>]*>/gi)) {
    const ref = match[1];
    if (/^https:/i.test(ref) && /rel=["']canonical["']/.test(match[0])) continue;
    assert(!/^(?:https?:|\/\/|\/)/i.test(ref), name + ': no network dependency ' + ref);
    const target = path.resolve(folder, path.dirname(name), ref.split(/[?#]/)[0]);
    assert(target.startsWith(folder + path.sep) && fs.existsSync(target), name + ': package contains ' + ref);
    resources++;
  }
  const staticHTML = read(name).replace(/<script\b[\s\S]*?<\/script>/gi, '');
  for (const match of staticHTML.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
    const ref = match[1];
    if (/^(?:[a-z]+:|#|\/\/)/i.test(ref)) continue;
    assert(!ref.startsWith('/'), name + ': internal links must be relative');
    const target = path.resolve(folder, path.dirname(name), ref.split(/[?#]/)[0]);
    assert(target.startsWith(folder + path.sep) && fs.existsSync(target), name + ': internal link exists ' + ref);
    assert(fs.statSync(target).isFile(), name + ': file:// needs explicit index.html, not a directory ' + ref);
  }
}
const legacy = require(root + '/geometry-course/data/legacy.json');
assert.equal(legacy.length, 70);
assert.equal(files.filter(file => /^trainers\/[^/]+\.html$/.test(file)).length, 70);
const manifest = require(root + '/downloads/trainers-manifest.json');
const entry = manifest.trainers.find(item => item.slug === 'geometry-course');
assert.match(entry.title, /7–9/);
assert.match(entry.level, /7–9/);
assert(read('README.txt').includes('Доступно карточек в задачнике: ' + completeTextbook.lessons.length + '.'), 'readme matches the fully embedded bank');
for (const entrypoint of ['index.html', 'geometry-course.html']) {
  assert.match(read(entrypoint), /href="https:\/\/mathexam\.space\/geometry-course\/ichenskaya-7-works\//, 'adjacent course remains an explicit website link');
  assert(!/href="(?:\.\/)?ichenskaya-7-works\//.test(read(entrypoint)), 'an uncopied adjacent bank must not be offered as an offline course');
}
console.log('ATANASYAN_HARMONIZATION_DOWNLOAD_OK ' + JSON.stringify({topics: 63, textbookCards: completeTextbook.lessons.length, firstSteps: 255, legacy: 70, localResources: resources, zipFiles: files.length}));
module.exports = {folder, root, course, textbook, first, completeTextbook};
if (require.main === module) fs.rmSync(folder, {recursive: true, force: true});
