const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const widths = [320, 1280];
const ciShardCount = 16;

function shardNumbers() {
  return Array.from({length: ciShardCount}, (_, index) => index + 1);
}

function selectLessons(lessons, shard, count) {
  assert.ok(Number.isSafeInteger(count) && count > 0 && count <= lessons.length, 'Invalid practice shard count');
  assert.ok(Number.isSafeInteger(shard) && shard >= 1 && shard <= count, 'Invalid practice shard number');
  return lessons.filter((_, index) => index % count === shard - 1);
}

function caseKey(width, lesson) {
  return width + '/' + lesson;
}

function expectedCases(lessons) {
  return widths.flatMap(width => lessons.map(([lesson]) => caseKey(width, lesson)));
}

function writeReport(directory, shard, count, completed, lessons) {
  assert.deepEqual(completed, expectedCases(selectLessons(lessons, shard, count)));
  fs.mkdirSync(directory, {recursive: true});
  const filename = path.join(directory, 'practice-' + shard + '.json');
  fs.writeFileSync(filename, JSON.stringify({shard, count, completed}) + '\n');
}

function verifyReports(directory, lessons) {
  const numbers = shardNumbers();
  const filenames = numbers.map(n => 'practice-' + n + '.json');
  assert.deepEqual(fs.readdirSync(directory).sort(), [...filenames].sort(), 'Missing or unexpected practice reports');
  const actual = [];
  for (const shard of numbers) {
    const report = JSON.parse(fs.readFileSync(path.join(directory, filenames[shard - 1]), 'utf8'));
    assert.equal(report.shard, shard);
    assert.equal(report.count, ciShardCount);
    assert.deepEqual(report.completed, expectedCases(selectLessons(lessons, shard, ciShardCount)));
    actual.push(...report.completed);
  }
  const expected = expectedCases(lessons);
  assert.equal(new Set(actual).size, actual.length, 'A browser scenario ran in more than one shard');
  assert.deepEqual(actual.sort(), expected.sort(), 'Practice coverage differs from the full lesson/width matrix');
  console.log('Verified ' + lessons.length + ' lessons at ' + widths.join(' and ') + ' px, ' + actual.length + ' browser scenarios.');
}

async function withIsolatedReader(launch, width, lesson, exercise) {
  const key = caseKey(width, lesson);
  for (let attempt = 1; attempt <= 2; attempt++) {
    // Each cold page parses the full bank. Closing its process releases all reader data.
    const browser = await launch();
    let page;
    let crashed = false;
    try {
      page = await browser.newPage({viewport: {width, height: 900}});
      page.on('crash', () => { crashed = true; });
      await exercise(page);
      return;
    } catch (error) {
      if (attempt === 2 || error.name === 'AssertionError' || (!crashed && error.name !== 'TimeoutError')) {
        console.error('Practice case failed: ' + key + ', attempt ' + attempt);
        throw error;
      }
      // Missing controls on a responsive page are test failures, not renderer restarts.
      const responds = page && await page.locator('body').getAttribute('lang', {timeout: 3000})
        .then(() => true, () => false);
      if (!crashed && responds) {
        console.error('Practice case failed on a responsive page: ' + key);
        throw error;
      }
      console.warn('Retrying complete case ' + key + ' after an unresponsive renderer.');
    } finally {
      await browser.close();
    }
  }
}

module.exports = {widths, ciShardCount, shardNumbers, selectLessons, caseKey, writeReport, verifyReports, withIsolatedReader};
