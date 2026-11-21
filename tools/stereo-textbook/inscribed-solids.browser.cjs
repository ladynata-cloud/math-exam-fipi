'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('playwright');
const {wrongStepAnswers} = require('./wrong-step-answers.cjs');
const course = require('../../stereo-course/textbook/data/course.json');
const groups = {
  solids: {manifests:[require('./inscribed-solids.json'),require('./circumspheres.json'),require('./round-bodies.json')],count:31},
  volume: {manifests:[require('./box-volumes.json')],count:21},
  prism: {manifests:[require('./prism-volumes.json')],count:26},
  cross: {manifests:[require('./cross-sections.json')],count:3},
  oblique: {manifests:[require('./oblique-prisms.json')],count:12},
  pyramids: {manifests:[require('./pyramid-volumes.json')],count:9},
  projections: {manifests:[require('./pyramid-projections.json')],count:10},
  frusta: {manifests:[require('./pyramid-frusta.json')],count:4},
  cones: {manifests:[require('./cone-volumes.json')],count:7},
  sectors: {manifests:[require('./cone-nets-and-frusta.json')],count:4},
  spheres: {manifests:[require('./sphere-measures.json')],count:13},
  sphereApplications: {manifests:[require('./sphere-applications.json')],count:9},
  volumeSelfcheck: {manifests:[require('./volume-selfcheck.json')],count:17},
  prismApplications: {manifests:[require('./prism-applications.json')],count:7},
  normalPrismApplications: {manifests:[require('./normal-prism-applications.json')],count:4},
  pyramidAngleApplications: {manifests:[require('./pyramid-angle-applications.json')],count:5},
  pyramidComparisonApplications: {manifests:[require('./pyramid-comparison-applications.json')],count:5},
  cylinderApplications: {manifests:[require('./cylinder-applications.json')],count:5},
  inscribedVolumeApplications: {manifests:[require('./inscribed-volume-applications.json')],count:6},
  sphereVolumeAngles: {manifests:[require('./sphere-volume-angles.json')],count:4},
  volumeChapterEnd: {manifests:[require('./volume-chapter-end.json')],count:7},
  vectorBasics: {manifests:[require('./vector-basics.json')],count:6},
  vectorPairs: {manifests:[require('./vector-pairs.json')],count:5},
  vectorProperties: {manifests:[require('./vector-properties.json')],count:11},
  spatialVectorSums: {manifests:[require('./spatial-vector-sums.json')],count:11},
  oppositeDifference: {manifests:[require('./opposite-and-difference-vectors.json')],count:9},
  vectorOriginPaths: {manifests:[require('./vector-origin-and-paths.json')],count:5},
  diagonalPaths: {manifests:[require('./prism-diagonals-and-vector-paths.json')],count:7},
  signedVectorCombinations: {manifests:[require('./signed-vector-combinations.json')],count:6},
  prismVectorEquations: {manifests:[require('./prism-vector-equations.json')],count:6},
  pyramidVectorMidpoints: {manifests:[require('./pyramid-vector-midpoints.json')],count:6},
  midlinesVectorCoefficients: {manifests:[require('./midlines-vector-coefficients.json')],count:6},
  collinearityVectorConditions: {manifests:[require('./collinearity-vector-conditions.json')],count:10},
  coplanarVectorDirections: {manifests:[require('./coplanar-vector-directions.json')],count:9},
  parallelepipedDirectedBases: {manifests:[require('./parallelepiped-directed-bases.json')],count:7},
  fieldsAndMidpointVectors: {manifests:[require('./fields-and-midpoint-vectors.json')],count:8},
  centroidsInTetrahedra: {manifests:[require('./centroids-in-tetrahedra.json')],count:15},
  heightAndMidpointProofs: {manifests:[require('./height-and-midpoint-proofs.json')],count:3},
  vectorChapterSelfcheck: {manifests:[require('./vector-chapter-selfcheck.json')],count:28},
  additionalDirectedEdgeSums: {manifests:[require('./additional-directed-edge-sums.json')],count:14},
  vectorSpanAndBarycentres: {manifests:[require('./vector-span-and-barycentres.json')],count:15},
  vectorChapterSixEnd: {manifests:[require('./vector-chapter-six-end.json')],count:14},
  cartesianCoordinateStart: {manifests:[require('./cartesian-coordinate-start.json')],count:14},
  coordinateVectorsAndDiagrams: {manifests:[require('./coordinate-vectors-and-diagrams.json')],count:13},
  signedCoordinateArithmetic: {manifests:[require('./signed-coordinate-arithmetic.json')],count:18},
  coordinateSpanRatios: {manifests:[require('./coordinate-span-ratios.json')],count:13},
  spatialPointsAndCentroid: {manifests:[require('./spatial-points-and-centroid.json')],count:14},
  midpointsAndVectorLengths: {manifests:[require('./midpoints-and-vector-lengths.json')],count:20}
};
const group = groups[process.env.TEXTBOOK_PRACTICE_GROUP || 'solids'];
assert(group, 'Unknown textbook practice group');
const manifests = group.manifests;
const root = path.resolve(__dirname, '../..');
const cards = course.lessons.filter(card => manifests.some(manifest => Object.hasOwn(manifest.cards, card.id)));
const contentTypes = {'.html':'text/html;charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json'};

async function serve(request, response) {
  const url = new URL(request.url, 'http://localhost');
  let target = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!target.startsWith(root + path.sep)) return response.writeHead(403).end();
  if (url.pathname.endsWith('/')) target = path.join(target, 'index.html');
  try {
    const bytes = await fs.readFile(target);
    response.setHeader('Content-Type', contentTypes[path.extname(target)] || 'application/octet-stream');
    response.end(bytes);
  } catch {
    response.writeHead(404).end();
  }
}

async function exercise(page, card, base, width) {
  await page.goto(base + '?exercise=' + card.id + '#' + card.id);
  await page.waitForFunction(title => document.querySelector('main>header>h1')?.textContent === title, card.title);
  const model = page.locator('[data-main-model] svg');
  const bounds = await model.boundingBox();
  assert(bounds.width >= 180 && bounds.height >= 260 && bounds.y + bounds.height <= 901, card.id + ': model on first screen');
  assert.equal(await page.locator('[data-step]').count(), 0);
  const views = new Set([await model.getAttribute('data-view')]);
  const errors = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert(errors <= 1, card.id + ': no horizontal scrolling at ' + width);
  const rotate = page.getByRole('button', {name:'Повернуть вправо', exact:true});
  if (card.visualization.model.planar) {
    assert.equal(await rotate.count(), 0, 'the exact plane angle is shown face-on');
  } else {
    const before = await model.getAttribute('data-yaw');
    await rotate.click();
    assert.notEqual(await model.getAttribute('data-yaw'), before);
  }
  const out = process.env.INSCRIBED_SOLIDS_ARTIFACTS;
  if (out) {
    await fs.mkdir(out, {recursive:true});
    await page.screenshot({path:path.join(out, width + '-' + card.id + '.png')});
  }

  await page.locator('[data-main-help]>summary').click();
  for (const hint of card.help) {
    const toggle = page.locator('[data-help="' + hint.id + '"]>summary');
    await toggle.click();
    await page.waitForFunction(view => document.querySelector('[data-main-model] svg')?.dataset.view === view, hint.view || 'neutral');
    views.add(await model.getAttribute('data-view'));
    await toggle.click();
  }
  let checked = 0;
  for (const step of card.steps) {
    await page.locator('[data-steps]+button').click();
    const section = page.locator('[data-step="' + step.id + '"]');
    await section.locator(':scope > details > summary').click();
    views.add(await model.getAttribute('data-view'));
    if (!step.input) continue;
    const field = section.getByLabel(step.input.prompt, {exact:true});
    const button = section.getByRole('button', {name:'Проверить этот шаг'});
    const feedback = section.locator('form [role="status"]');
    for (const wrong of wrongStepAnswers(card.id, step)) {
      await field.fill(wrong);
      await button.click();
      assert.equal(await feedback.getAttribute('data-answer-status'), 'wrong', card.id + ' ' + step.id);
      assert((await feedback.textContent()).length > 10);
    }
    await field.fill(step.input.accepted[0]);
    await button.click();
    assert.equal(await feedback.getAttribute('data-answer-status'), 'correct', card.id + ' ' + step.id);
    checked++;
  }
  assert(checked >= 1);
  assert.deepEqual([...views].sort(), Object.keys(card.visualization.model.views).sort(), card.id + ': reachable figure views');
  const final = page.locator('#final-answer');
  const text = card.answer.accepted?.[0] || 'Мой довод опирается на перпендикулярность и касание.';
  await final.fill(text);
  await page.locator('[data-final-form] button[type="submit"]').click();
  const feedback = page.locator('[data-final-feedback]');
  if (card.answer.mode === 'exact') assert.equal(await feedback.getAttribute('data-answer-status'), 'correct');
  else assert.match(await feedback.innerText(), /сохранено/u);
  await page.reload();
  await page.waitForFunction(title => document.querySelector('main>header>h1')?.textContent === title, card.title);
  assert.equal(await final.inputValue(), text);
  for (const step of card.steps.filter(step => step.input))
    assert.equal(await page.locator('#step-' + step.id).inputValue(), step.input.accepted[0]);
  return checked;
}

(async () => {
  let server, browser;
  try {
    let base = process.env.INSCRIBED_SOLIDS_LIVE_URL;
    if (!base) {
      server = http.createServer(serve);
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
      base = 'http://127.0.0.1:' + server.address().port + '/stereo-course/textbook/';
    }
    const errors = [];
    let checks = 0;
    // The complete bank is loaded twice per journey to check recovery after reload.
    // Recycle the renderer processes between small sets, while keeping the same
    // learner context throughout every individual attempt and reload.
    const batchSize = 4;
    for (const width of [320,390,1280]) {
      for (let start = 0; start < cards.length; start += batchSize) {
        browser = await chromium.launch({
          headless:true, executablePath:process.env.GEOMETRY_CHROMIUM,
          args:['--disable-dev-shm-usage','--js-flags=--max-old-space-size=240']
        });
        try {
          for (const card of cards.slice(start,start+batchSize)) {
            const context = await browser.newContext({viewport:{width,height:900}});
            try {
              const page = await context.newPage();
              page.setDefaultTimeout(90000);
              page.on('pageerror', error => errors.push(error.message));
              checks += await exercise(page, card, base, width);
            } finally {
              await context.close();
            }
          }
        } finally {
          await browser.close();
          browser = undefined;
        }
      }
    }
    assert.equal(cards.length,group.count);
    assert.deepEqual(errors, []);
    console.log('TEXTBOOK_PRACTICE_BROWSER_OK: ' + cards.length*3 + ' phone and desktop journeys, ' + checks + ' wrong/correct step checks, model states and retained drafts');
  } finally {
    await browser?.close();
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  }
})().catch(error => {console.error(error);process.exitCode = 1;});
