'use strict';

/* Record the SAME continuous canvas used by the trainer. Each question holds
 * for 2.4 s, its explained action for 7.2 s, and the complete result for 8 s.
 * Only the helper gently zooms; the accumulated solution never disappears.
 *
 * NODE_PATH=/path/to/node_modules node tools/soviet-math-render.cjs
 * --topics=bonds,divide-simple  render/check a subset of stable topic IDs
 * --check                     verify files, hashes and source freshness only
 * --replace                   explicitly replace selected existing recordings
 * --jobs=2                    simultaneous encoders (1–3; default 2)
 *
 * Append-only by default. A changed source, missing recording or untracked MP4
 * is an error, never a reason to silently overwrite an existing lesson.
 * Requires @napi-rs/canvas, ffmpeg and ffprobe. No browser or remote service.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const run = promisify(execFile);
const root = path.resolve(__dirname, '..');
const media = path.join(root, 'soviet-math/media');
const manifestPath = path.join(media, 'manifest.json');
const course = require('../soviet-math/course.js');
const board = require('../soviet-math/board.js');
const sources = require('../soviet-math/sources.js');
const settings = Object.freeze({ width: 1280, height: 800, fps: 30,
  questionSeconds: 2.4, explanationSeconds: 7.2, endSeconds: 8,
  cameraSeconds: 2.4, cameraFrames: 72, crf: 24 });
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const exists = filename => fs.stat(filename).then(() => true, error => {
  if (error.code === 'ENOENT') return false; throw error;
});

async function probe(filename, expected = settings) {
  const result = JSON.parse((await run('ffprobe', ['-v', 'error', '-show_streams',
    '-show_format', '-of', 'json', filename], { maxBuffer: 1024 * 1024 })).stdout);
  const videos = result.streams.filter(stream => stream.codec_type === 'video');
  assert.equal(videos.length, 1, 'Exactly one video stream required');
  assert.equal(result.streams.length, 1, 'Silent MP4 must contain no audio stream');
  const stream = videos[0];
  assert.equal(stream.codec_name, 'h264');
  assert.equal(stream.pix_fmt, 'yuv420p');
  assert.equal(stream.width, expected.width);
  assert.equal(stream.height, expected.height);
  assert.equal(stream.r_frame_rate, expected.fps + '/1');
  return { seconds: Number(result.format.duration), bytes: Number(result.format.size) };
}

function argumentsForRun() {
  const options = { replace: false, check: false, jobs: 2, ids: course.topics.map(t => t.id) };
  for (const arg of process.argv.slice(2)) {
    if (arg === '--replace') options.replace = true;
    else if (arg === '--check') options.check = true;
    else if (arg.startsWith('--topics=')) options.ids = arg.slice(9).split(',');
    else if (arg.startsWith('--jobs=')) options.jobs = Number(arg.slice(7));
    else throw Error('Unknown option: ' + arg);
  }
  assert.ok(options.ids.length && new Set(options.ids).size === options.ids.length);
  assert.ok(options.ids.every(id => course.topics.some(topic => topic.id === id)), 'Unknown topic ID');
  assert.ok(Number.isInteger(options.jobs) && options.jobs >= 1 && options.jobs <= 3, 'jobs must be 1–3');
  assert.ok(!(options.replace && options.check), '--check and --replace are incompatible');
  return options;
}

async function main() {
  const options = argumentsForRun();
  const rendererHash = hash(await fs.readFile(path.join(root, 'soviet-math/board.js')));
  const inputFiles = ['soviet-math/board.js', 'soviet-math/course.js',
    'soviet-math/primary.js', 'soviet-math/advanced.js', 'soviet-math/sources.js',
    'trainers/oge-basics/multiplication-division/division-guided-core.js',
    'trainers/oge-basics/multiplication-division/division-lab-core.js'];
  const inputSnapshot = await Promise.all(inputFiles.map(async file => hash(await fs.readFile(path.join(root, file)))));
  const signature = topic => {
    const plan = course.make(topic.id, 0), source = sources.forTopic(topic.id);
    assert.ok(source && typeof source.label === 'string' && source.label.length, 'Missing textbook citation: ' + topic.id);
    // A renderer improvement may be used for new lessons without invalidating
    // older videos. Only their mathematical content and citation must agree.
    return { topic, plan, source,
      sourceHash: hash(JSON.stringify({ topic, plan, source })) };
  };
  await fs.mkdir(media, { recursive: true });
  let manifest = { version: 1, sourceHashVersion: 1, renderer: 'tools/soviet-math-render.cjs',
    description: 'Авторские упражнения по темам учебников; непрерывная запись решения, без звука.',
    width: settings.width, height: settings.height, fps: settings.fps, lessons: [] };
  if (await exists(manifestPath)) {
    manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    assert.equal(manifest.version, 1, 'Unsupported manifest version; do not overwrite it');
    assert.equal(manifest.sourceHashVersion, 1, 'Unsupported source hash contract; do not overwrite it');
    assert.ok(Array.isArray(manifest.lessons));
    assert.equal(new Set(manifest.lessons.map(item => item.id)).size, manifest.lessons.length);
  }
  // Every MP4 must have a recorded identity, including files outside this run.
  for (const name of await fs.readdir(media)) {
    if (name.endsWith('.mp4') && !manifest.lessons.some(entry => entry.file === name)) {
      throw Error('Untracked MP4; reconcile manifest before rendering: ' + name);
    }
  }
  const pending = [];
  for (const id of options.ids) {
    const item = signature(course.topics.find(topic => topic.id === id));
    const old = manifest.lessons.find(entry => entry.id === id);
    const filename = path.join(media, id + '.mp4');
    if (old) {
      assert.equal(old.file, id + '.mp4', 'Stable video path changed: ' + id);
      if (!options.replace) {
        assert.ok(await exists(filename), 'Manifest refers to missing file: ' + id + '; use --replace to repair explicitly');
        assert.equal(hash(await fs.readFile(filename)), old.sha256, 'Video hash changed: ' + id);
        assert.equal(item.sourceHash, old.sourceHash, 'Source changed: ' + id + '; use --replace only after review');
        const meta = await probe(filename, old.renderSettings || manifest);
        assert.ok(Math.abs(meta.seconds - old.seconds) < .05, 'Video duration changed: ' + id);
        console.log('VERIFIED ' + id + ' ' + meta.seconds.toFixed(1) + ' s');
        continue;
      }
    } else if (options.check) throw Error('No video manifest entry: ' + id);
    pending.push(item);
  }
  if (!pending.length) { console.log('SOVIET_MATH_VIDEO_OK ' + options.ids.length); return; }

  const modules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.env.NODE_PATH?.split(path.delimiter)[0];
  const canvasLibrary = modules ? createRequire(path.join(modules, 'package.json'))('@napi-rs/canvas') : require('@napi-rs/canvas');
  // The renderer names DejaVu explicitly; registering available system files
  // makes headless font metrics match browser rendering on the same machine.
  for (const file of ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf']) {
    if (await exists(file)) canvasLibrary.GlobalFonts.registerFromPath(file);
  }
  let checkpoint = Promise.resolve();
  function saveEntry(entry) {
    checkpoint = checkpoint.then(async () => {
      const at = manifest.lessons.findIndex(item => item.id === entry.id);
      if (at < 0) manifest.lessons.push(entry); else manifest.lessons[at] = entry;
      const order = course.topics.map(topic => topic.id);
      manifest.lessons.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
      const temp = manifestPath + '.tmp';
      await fs.writeFile(temp, JSON.stringify(manifest, null, 2) + '\n');
      await fs.rename(temp, manifestPath);
    });
    return checkpoint;
  }
  async function render(item) {
    const { topic, plan, source, sourceHash } = item;
    const scratch = await fs.mkdtemp(path.join(os.tmpdir(), 'soviet-video-' + topic.id + '-'));
    const canvas = canvasLibrary.createCanvas(settings.width, settings.height);
    const sequence = [], clips = [];
    let frame = 0, elapsed = 0;
    const still = async (count, drawOptions, duration) => {
      const filename = 'frame-' + String(frame++).padStart(5, '0') + '.png';
      board.draw(canvas, plan, count, { title: topic.title, source: source.label, ...drawOptions });
      await fs.writeFile(path.join(scratch, filename), canvas.toBuffer('image/png'));
      sequence.push("file '" + filename + "'", 'duration ' + duration.toFixed(6));
      elapsed += duration;
      return filename;
    };
    console.log('RENDERING ' + topic.id + ' (' + plan.steps.length + ' actions)');
    try {
      for (let step = 0; step < plan.steps.length; step++) {
        clips.push({ step: step + 1, questionAt: Number(elapsed.toFixed(3)),
          explanationAt: Number((elapsed + settings.questionSeconds).toFixed(3)) });
        await still(step, { activeStep: step, reveal: false, camera: 'overview' }, settings.questionSeconds);
        // A continuous 2.4-second focus movement followed by a long still hold.
        // The question, all prior lines and the main angle retain their places.
        for (let k = 0; k < settings.cameraFrames; k++) {
          const last = k === settings.cameraFrames - 1;
          await still(step, { activeStep: step, reveal: true, camera: 'detail',
            progress: k / (settings.cameraFrames - 1) }, settings.cameraSeconds / settings.cameraFrames +
              (last ? settings.explanationSeconds - settings.cameraSeconds : 0));
        }
      }
      const final = await still(plan.steps.length, { camera: 'overview' }, settings.endSeconds);
      // concat needs its final file repeated to honor the final duration.
      sequence.push("file '" + final + "'");
      await fs.writeFile(path.join(scratch, 'frames.txt'), sequence.join('\n') + '\n');
      const result = path.join(scratch, topic.id + '.mp4');
      await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', '-n',
        '-f', 'concat', '-safe', '1', '-i', path.join(scratch, 'frames.txt'),
        '-t', elapsed.toFixed(6), '-vf', 'fps=' + settings.fps, '-c:v', 'libx264',
        '-preset', 'fast', '-threads', '2', '-crf', String(settings.crf),
        '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', result],
      { timeout: 600000, maxBuffer: 4 * 1024 * 1024 });
      const meta = await probe(result);
      assert.ok(Math.abs(meta.seconds - elapsed) < .08, 'Truncated video: ' + topic.id);
      // An edit during a long recording must never produce a falsely fresh hash.
      for (let i = 0; i < inputFiles.length; i++) {
        assert.equal(hash(await fs.readFile(path.join(root, inputFiles[i]))), inputSnapshot[i],
          'Input changed during encoding: ' + inputFiles[i] + '; rerun after it is stable');
      }
      const bytes = await fs.readFile(result);
      const entry = { id: topic.id, file: topic.id + '.mp4', seconds: meta.seconds,
        bytes: meta.bytes, sha256: hash(bytes), sourceHash, rendererHash,
        renderSettings: settings,
        source, exampleIndex: 0, steps: plan.steps.length, timeline: clips,
        finalAt: Number((elapsed - settings.endSeconds).toFixed(3)) };
      const destination = path.join(media, entry.file);
      // Copy exclusive before any manifest write. Replacement is always opt-in.
      await fs.copyFile(result, destination, options.replace ? 0 : require('node:fs').constants.COPYFILE_EXCL);
      await saveEntry(entry);
      console.log('RECORDED ' + topic.id + ' ' + meta.seconds.toFixed(1) + ' s ' + meta.bytes + ' bytes');
    } finally { await fs.rm(scratch, { recursive: true, force: true }); }
  }
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(options.jobs, pending.length) }, async () => {
    while (next < pending.length) await render(pending[next++]);
  }));
  await checkpoint;
  console.log('SOVIET_MATH_VIDEO_OK ' + options.ids.length);
}

main().catch(error => { console.error(error.stack || String(error)); process.exitCode = 1; });
