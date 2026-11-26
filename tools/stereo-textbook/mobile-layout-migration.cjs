'use strict';
// Content-only release gates froze the former UI. Preserve those checks against
// byte-exact archived files and also pin the explicitly requested layout update.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),manifest=require('./mobile-layout-migration.json');
const {restorePublicNavigator}=require('../public-navigator-preservation.cjs');
const {beforeHarmonization}=require('./harmonization-input-migration.cjs');
const {beforeCompactPreview}=require('./harmonization-preview-migration.cjs');
const {beforeRightAngles}=require('./right-angle-renderer-migration.cjs');
const {beforeProfileComposition}=require('./visibility-profile-runtime-migration.cjs');
const {SCHEMA_PATH, beforeRightAngleSchema} = require('./sphere-schema-migration.cjs');
const originals={
 'stereo-course/textbook/assets/engine.js':'9da6fb10924d50793521740ea779d81ef78fe3dfee5dbd71ab138b7d345dba74',
 'stereo-course/textbook/assets/style.css':'56b3ec43f680dde578320a9ea1c5969a9a15d2d0344bfa1eda903f5bd3e09f51',
 'stereo-course/textbook/index.html':'af453fa854b9995f3a41bbf1a476564116a8efff43cee2234716e2c5489b5e55'
};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function historicalRead(file,read=name=>fs.readFileSync(path.join(root,name))){
 if (file === 'stereo-course/assets/math-text.js') {
  const bytes = read(file);
  const before = '8be99c2d6158875410e43b0a113e9092b453f6ea2572cfe96016c1afcc1bb52b';
  if (hash(bytes) === before) return bytes;
  assert.equal(hash(bytes), '70c13e249bb55c45054a1a9d20a646fda866972aafbda7e0d2259710479a9e5b', 'exact reviewed fraction-spacing correction');
  const old = Buffer.from(bytes.toString('utf8').replace(`      let container = parent;
      if (mixed) {
        container = span(parent, 'stereo-mixed-number', '');
        appendAtoms(container, whole[1]);
        container.append(document.createTextNode(whole[2]));
      }
      // Keep authored spaces adjacent to the slash inside the corresponding term.
      fraction(container, text.slice(left.start, slash), text.slice(slash + 1, right.end));`, `      if (mixed) {
        const node = span(parent, 'stereo-mixed-number', '');
        appendAtoms(node, whole[1]);
        node.append(document.createTextNode(whole[2]));
        fraction(node, numerator, denominator);
      } else fraction(parent, numerator, denominator);`));
  assert.equal(hash(old), before, 'all previously frozen math renderer bytes');
  return old;
 }
 if (file === SCHEMA_PATH) return beforeRightAngleSchema(read(file));
 if(!Object.hasOwn(originals,file))return beforeProfileComposition(file,beforeRightAngles(file,beforeCompactPreview(file,read(file))));
 assert.equal(manifest.base,'0d96ad84f0dd9dcadf123b3845db75c5476be93a');
 assert.deepEqual(Object.keys(manifest.files).sort(),Object.keys(originals).sort());
 const row=manifest.files[file];assert.equal(row.beforeSHA256,originals[file]);
 assert.equal(row.beforeFixture,'tools/stereo-textbook/fixtures/mobile-layout-before/'+path.basename(file));
 assert.match(row.afterSHA256,/^[a-f0-9]{64}$/);
 const bytes = beforeHarmonization(file, restorePublicNavigator(file, read(file)));
 assert.equal(hash(bytes),row.afterSHA256,'exact reviewed companion migration / reading layout: '+file);
 const before=read(row.beforeFixture);assert.equal(hash(before),originals[file],'archived pre-layout bytes: '+file);
 return before;
}
module.exports={historicalRead,originals};
