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
  [directory + 'engine.js']: '3407b8649699cd683a4fd16f4b49497d0aab3136b0b65fdbe23a4f9a6aa0fd1a',
  [directory + 'style.css']: '57e438c58312be2c4c98506cec5f2bbfa8e5bce63adedb5cb6bbdb6bd518d915'
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
