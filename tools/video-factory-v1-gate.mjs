import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(file) { return fs.readFileSync(file, 'utf8'); }
function count(source, pattern) { return (source.match(pattern) || []).length; }

const studio = read('trainers/dvi/math-18-20-video-studio.html');
const config = read('video-worker/src/config.js');
const renderer = read('video-worker/src/renderer.js');
const app = read('video-worker/src/app.js');
const docker = read('video-worker/Dockerfile');
const adr = read('docs/adr/0002-video-factory-v1.md');
const deployment = read('docs/VIDEO_FACTORY_DEPLOYMENT.md');

assert.equal(count(studio, /data-render="t(?:18|19|20)"/g), 3, 'all DVI tabs need one MP4 action');
assert.equal(count(studio, />▶ Предпросмотр</g), 3, 'preview actions must remain visible');
assert.match(studio, /mathexam-video-api/);
assert.match(studio, /sessionStorage\.setItem\(tokenKey,token\)/);
assert.doesNotMatch(studio, /[?&](?:token|secret|key)=/i, 'credentials must not enter URLs');
assert.match(studio, /Authorization:'Bearer '\+token/);
assert.match(studio, /Страницу можно перезагрузить/);

const inlineScripts = [...studio.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
assert.ok(inlineScripts.length, 'studio inline script not found');
for (const script of inlineScripts) new Function(script);

assert.match(config, /VIDEO_PERSISTENCE_CONFIRMED/);
assert.match(config, /Mock speech is disabled in production/);
assert.match(config, /VIDEO_STUDIO_URL must use HTTPS in production/);
assert.match(renderer, /window\.MathExamVideoStudio\.prepare/);
assert.match(renderer, /new URL\(config\.studioUrl\)\.origin/);
assert.match(renderer, /chromiumSandbox: true/);
assert.doesNotMatch(renderer, /--no-sandbox/);
assert.match(app, /request\.headers\.authorization/);
assert.match(app, /Origin is not allowed/);
assert.match(app, /path\.basename\(target\) !== `\$\{job\.id\}\.mp4`/);
assert.match(docker, /USER mathexam/);
assert.match(docker, /VIDEO_DATA_DIR=\/data/);
assert.match(adr, /Status: Proposed/);
assert.match(adr, /independently deployed Amvera application/i);
assert.match(deployment, /video\.mathexam\.space/);

console.log('VIDEO_FACTORY_V1_AUTHORING_CHECK_OK');
