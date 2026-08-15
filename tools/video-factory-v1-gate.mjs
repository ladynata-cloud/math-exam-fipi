import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(file) { return fs.readFileSync(file, 'utf8'); }
function count(source, pattern) { return (source.match(pattern) || []).length; }

const studio = read('trainers/dvi/math-18-20-video-studio.html');
const config = read('video-worker/src/config.js');
const renderer = read('video-worker/src/renderer.js');
const validation = read('video-worker/src/validation.js');
const app = read('video-worker/src/app.js');
const command = read('video-worker/src/command.js');
const queue = read('video-worker/src/job-queue.js');
const jobStore = read('video-worker/src/job-store.js');
const lock = read('video-worker/src/worker-lock.js');
const tts = read('video-worker/src/tts.js');
const docker = read('video-worker/Dockerfile');
const packageLock = read('video-worker/package-lock.json');
const adr = read('docs/adr/0002-video-factory-v1.md');
const deployment = read('docs/VIDEO_FACTORY_DEPLOYMENT.md');

assert.equal(count(studio, /data-render="t(?:18|19|20)"/g), 3, 'all DVI tabs need one MP4 action');
assert.equal(count(studio, />▶ Показать, как решать</g), 3, 'learner-journey preview actions must remain visible');
assert.match(studio, /mathexam-video-api/);
assert.match(studio, /sessionStorage\.setItem\(tokenKey,token\)/);
assert.doesNotMatch(studio, /[?&](?:token|secret|key)=/i, 'credentials must not enter URLs');
assert.match(studio, /Authorization:'Bearer '\+token/);
assert.match(studio, /'Idempotency-Key':requestState\.key/);
assert.match(studio, /Страницу можно перезагрузить/);
assert.match(studio, /id:'recap-'/);
assert.match(studio, /data-captions checked disabled/);
assert.match(studio, /data-video-type/);
assert.match(studio, /videoType:back\.querySelector/);
assert.match(studio, /value="student-path"/);
assert.match(studio, /value="ideal-solution"/);
assert.match(studio, /video-focus-ring/);
assert.match(studio, /video-pointer/);
assert.match(studio, /video-click-label/);
assert.match(studio, /ВИДЕО 1 — ИДЕАЛЬНОЕ РЕШЕНИЕ/);
assert.match(studio, /ВИДЕО 2 — КАК ПРОХОДИТЬ ТРЕНАЖЁР/);
assert.match(studio, /без фоновой музыки/);
assert.doesNotMatch(studio, /тихую фоновую музыку/);

const inlineScripts = [...studio.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
assert.ok(inlineScripts.length, 'studio inline script not found');
for (const script of inlineScripts) new Function(script);

const manifestStart = studio.indexOf('function idealVideoManifest');
const manifestEnd = studio.indexOf('function showScript', manifestStart);
assert.ok(manifestStart >= 0 && manifestEnd > manifestStart, 'video manifest function must be extractable');
const buildManifest = new Function('tts', `${studio.slice(manifestStart, manifestEnd)}; return videoManifest;`);
const videoManifest = buildManifest((value) => String(value).replace(/<[^>]*>/g, ' '));
const sampleModel = {
  statement: 'Условие',
  answer: '42',
  badge: 'Задача',
  steps: [{ q: 'Вопрос', tip: 'Подсказка', opts: [
    { ok: false, h: 'Ошибка', hint: 'Проверьте ход' },
    { ok: true, h: 'Ответ', exp: '' },
  ] }],
  recap: ['Первый вывод', 'Второй вывод'],
};
const sampleManifest = videoManifest(sampleModel, 't18', 'ideal-solution');
const finalScenes = sampleManifest.scenes.filter((scene) => scene.phase === 'final');
assert.equal(finalScenes.length, 3, 'each recap item and the answer need separate readable scenes');
assert.ok(finalScenes.every((scene) => scene.narration.length < 200), 'final captions must stay compact');
assert.equal(sampleManifest.videoType, 'ideal-solution');
const journey = videoManifest(sampleModel, 't18', 'student-path');
assert.equal(journey.videoType, 'student-path');
assert.ok(journey.scenes.length <= 30, 'learner journey must fit the renderer scene cap');
assert.ok(journey.scenes.every((scene) => scene.videoType === 'student-path'), 'every learner scene must retain its rendering mode');
assert.deepEqual(
  journey.scenes.map((scene) => scene.action),
  ['observe', 'wrong', 'hint', 'correct', 'next', 'final'],
  'learner journey must demonstrate error, hint, recovery and completion',
);
assert.ok(journey.scenes.filter((scene) => ['wrong', 'hint', 'correct', 'next'].includes(scene.action)).every((scene) => scene.click));

assert.match(config, /VIDEO_PERSISTENCE_CONFIRMED/);
assert.match(config, /Mock speech is disabled in production/);
assert.match(config, /'silent'/);
assert.match(config, /VIDEO_STUDIO_URL must use HTTPS in production/);
assert.match(renderer, /window\.MathExamVideoStudio\.prepare/);
assert.match(renderer, /clickDelayMs/);
assert.match(renderer, /amix=inputs=2/);
assert.match(renderer, /videoType === 'student-path' && scene\.click === true/);
assert.match(renderer, /scene\.videoType !== 'student-path'/);
assert.match(renderer, /presentation\?\.targetY/);
assert.match(renderer, /durationHintMs: scene\.duration_hint_ms/);
assert.match(renderer, /TTS_PROVIDER_MISMATCH/);
assert.match(renderer, /launchBrowser/);
assert.match(renderer, /new URL\(config\.studioUrl\)\.origin/);
assert.match(renderer, /chromiumSandbox: true/);
assert.doesNotMatch(renderer, /--no-sandbox/);
assert.match(app, /request\.headers\.authorization/);
assert.match(app, /Origin is not allowed/);
assert.match(app, /store\.admit\(jobRequest, idempotencyKey\)/);
assert.match(app, /path\.basename\(target\) !== `\$\{job\.id\}\.mp4`/);
assert.match(docker, /USER mathexam/);
assert.match(docker, /VIDEO_DATA_DIR=\/data/);
assert.match(docker, /npm ci --omit=dev/);
assert.match(packageLock, /"playwright": "1\.55\.0"/);
assert.match(jobStore, /serializedAdmission/);
assert.match(jobStore, /dailyTtsCharacterBudget/);
assert.match(jobStore, /maxRetainedBytes/);
assert.match(lock, /assertOwnership/);
assert.doesNotMatch(lock, /\.stale-/, 'v1 must never auto-take over a stale volume lock');
assert.match(command, /COMMAND_TIMEOUT/);
assert.match(command, /JOB_ABORTED/);
assert.match(command, /maxFileBytes/);
assert.match(queue, /activeController\?\.abort\(\)/);
assert.match(queue, /status: 'queued'/);
assert.match(jobStore, /PERSISTENCE_CLEANUP_FAILED/);
assert.match(jobStore, /activeAttempts/);
assert.match(jobStore, /activeOutputs/);
assert.match(tts, /response\.body\.getReader\(\)/);
assert.match(tts, /config\.ttsProvider === 'silent'/);
assert.match(tts, /anullsrc=r=24000:cl=mono/);
assert.doesNotMatch(tts, /aevalsrc|sin\(2\*PI\*/, 'silent mode must not generate background music');
assert.match(validation, /'ideal-solution', 'student-path'/);
assert.match(validation, /videoType/);
assert.match(adr, /Status: Proposed/);
assert.match(adr, /independently deployed Amvera application/i);
assert.match(deployment, /video\.mathexam\.space/);

console.log('VIDEO_FACTORY_V1_AUTHORING_CHECK_OK');
