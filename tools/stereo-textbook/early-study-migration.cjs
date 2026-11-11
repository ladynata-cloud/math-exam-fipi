'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');

const directory = 'stereo-course/textbook/assets/';
const originals = {
  [directory + 'engine.js']: '14cb7f4c44b7e6aa78da563503592cd97a8f62ae7d6e57dc23942565a7d3a413',
  [directory + 'style.css']: 'a105ca117d3a452d04788042c1c7b417336705c3677139f878d084edaf77d98b'
};
const reviewed = {
  [directory + 'engine.js']: '4f7f2916a498014d2133ce65bc8bb25ad9624b01ed3d3c0c268ecd0b715ee7cb',
  [directory + 'style.css']: '7236b9a4d4d724e6527e105c146cb0a01e0129651719fc49a3a26d713121d5f1'
};
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function restoreEarlyStudy(file, read) {
  const current = read(file);
  if (!Object.hasOwn(originals, file)) return current;
  assert.equal(hash(current), reviewed[file], 'exact early-study update: ' + file);
  const archived = read('tools/stereo-textbook/fixtures/early-study-before/' + path.basename(file));
  assert.equal(hash(archived), originals[file], 'exact pre-update reading layout: ' + file);
  return archived;
}

module.exports = {restoreEarlyStudy};
