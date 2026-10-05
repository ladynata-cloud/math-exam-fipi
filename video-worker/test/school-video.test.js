import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { runCommand } from '../src/command.js';
import { clickDelayMs, createRenderer, renderMotionSegment, renderSegment, validateManifest } from '../src/renderer.js';
import { resolveAudioMode, studioUrlFor, validateJobRequest, viewportFor } from '../src/validation.js';

test('school render requests have fixed routes, presets, audio options and captions', () => {
  const studio = 'https://mathexam.space/trainers/dvi/math-18-20-video-studio.html?extra=1';
  for (const task of ['homework-help', 'linear-equation', 'adjacent-angles']) {
    for (const preset of [1, 2, 3]) {
      const request = validateJobRequest({ task, preset, captions: false }, { ttsProvider: 'silent' });
      assert.equal(request.captions, true);
      assert.equal(request.videoType, 'ideal-solution');
      assert.equal(resolveAudioMode(request, 'silent'), 'silent');
      assert.equal(resolveAudioMode(request, 'openai'), 'silent');
      assert.equal(studioUrlFor(task, studio), 'https://mathexam.space/video-lessons/studio.html');
      assert.deepEqual(viewportFor('16:9', task), { width: 1280, height: 720 });
      assert.deepEqual(viewportFor('9:16', task), { width: 720, height: 1280 });
    }
    assert.throws(() => validateJobRequest({ task, preset: 1, videoType: 'student-path' }), /ideal-solution/);
    assert.equal(validateJobRequest({ task, preset: 1, audioMode: 'voice' }, { ttsProvider: 'silent' }).audioMode, 'silent');
    assert.equal(validateJobRequest({ task, preset: 1, audioMode: 'voice' }, { ttsProvider: 'yandex' }).audioMode, 'silent');
    assert.equal(validateJobRequest({ task, preset: 1, audioMode: 'clicks' }, { ttsProvider: 'openai' }).audioMode, 'silent');
  }
  assert.equal(studioUrlFor('18', studio), studio);
  assert.deepEqual(viewportFor('16:9', '18'), { width: 1920, height: 1080 });
  assert.throws(() => validateJobRequest({ task: 'linear-equation', preset: 1, audioMode: 'music' }), /Режим звука/);
  assert.throws(() => validateJobRequest({ task: 'linear-equation', preset: 1, narration: 'custom' }), /Неизвестный/);
  assert.throws(() => validateJobRequest({ task: 'linear-equation', preset: 1, url: 'https://evil.test' }), /Неизвестный/);
});

test('school manifests retain renderer scene and trusted content validation', () => {
  const manifest = {
    format: 'mathexam-video-manifest', tab: 'tlinear-equation', videoType: 'ideal-solution',
    scenes: ['explanation', 'pause'].map((id) => ({
      id, narration: 'Сначала попробуй самостоятельно.', duration_hint_ms: 5000, action: 'observe', click: false,
    })),
  };
  assert.equal(validateManifest(manifest, 'linear-equation', 'ideal-solution'), manifest);
  assert.throws(() => validateManifest({ ...manifest, tab: 't18' }, 'linear-equation', 'ideal-solution'), /unexpected scene/);
  assert.throws(() => validateManifest({ ...manifest, scenes: [{ ...manifest.scenes[0], action: 'script' }, manifest.scenes[1]] }, 'linear-equation', 'ideal-solution'), /learner action/);
  for (const motion_ms of [-1, 4001, NaN, Infinity, '2000', null]) {
    assert.throws(() => validateManifest({ ...manifest, scenes: [{ ...manifest.scenes[0], motion_ms }, manifest.scenes[1]] }, 'linear-equation', 'ideal-solution'), /motion duration/);
  }
  for (const motion_ms of [0, 2000, 4000]) {
    const animated = { ...manifest, scenes: [{ ...manifest.scenes[0], motion_ms }, manifest.scenes[1]] };
    assert.equal(validateManifest(animated, 'linear-equation', 'ideal-solution'), animated);
  }
  assert.throws(() => validateManifest({ ...manifest, scenes: [{ ...manifest.scenes[0], duration_hint_ms: 1000, motion_ms: 2000 }, manifest.scenes[1]] }, 'linear-equation', 'ideal-solution'), /motion duration/);
});

test('internal Chromium injection retains sandbox options and cleans aborted work', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'mathexam-video-browser-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const marker = new Error('controlled launch failure');
  let launchOptions;
  const config = { ttsProvider: 'silent', workDir: path.join(root, 'work'), mediaDir: path.join(root, 'videos'), commandTimeoutMs: 30_000 };
  const renderer = createRenderer(config, { synthesize: () => assert.fail('must not synthesize') }, {
    chromium: { launch: async (options) => { launchOptions = options; throw marker; } },
  });
  await assert.rejects(renderer({ id: 'test', ttsProvider: 'silent', request: { task: 'homework-help', preset: 1, audioMode: 'clicks' } },
    { assertOwnership: async () => {} }), (error) => error === marker);
  assert.equal(launchOptions.chromiumSandbox, true);
  assert.ok(!launchOptions.args.includes('--no-sandbox'));
  assert.deepEqual(await fs.readdir(config.workDir), []);
});

test('real FFmpeg outputs distinguish no audio, local clicks and supplied voice', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'mathexam-video-audio-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const frame = path.join(root, 'frame.ppm');
  await fs.writeFile(frame, Buffer.concat([Buffer.from('P6\n320 180\n255\n'), Buffer.alloc(320 * 180 * 3, 220)]));
  const config = { ffmpegPath: 'ffmpeg', ttsProvider: 'openai', maxOutputBytes: 5 * 1024 * 1024, commandTimeoutMs: 30_000 };
  const voice = path.join(root, 'voice.wav');
  await runCommand('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1', voice]);
  for (const mode of ['silent', 'clicks', 'voice']) {
    const output = path.join(root, `${mode}.mp4`);
    // The nonexistent path proves non-voice modes never consume supplied audio.
    const duration = mode === 'voice' ? 2 : 1;
    await renderSegment(config, frame, mode === 'voice' ? voice : '/nonexistent/audio.wav', output, duration, undefined, true, mode);
    const probe = await runCommand('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', output]);
    const metadata = JSON.parse(probe.stdout);
    assert.equal(metadata.streams.filter((stream) => stream.codec_type === 'video').length, 1);
    assert.equal(metadata.streams.filter((stream) => stream.codec_type === 'audio').length, mode === 'silent' ? 0 : 1);
    assert.ok(Number(metadata.format.duration) >= duration - 0.05,
      'a pause after short narration must survive the audio and click mix');
    if (mode === 'clicks') {
      const pcm = path.join(root, 'clicks.pcm');
      await runCommand('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', output, '-vn', '-f', 's16le', '-ac', '1', '-ar', '24000', pcm]);
      const samples = await fs.readFile(pcm);
      let peak = 0;
      let earlyPeak = 0;
      for (let offset = 0; offset + 1 < samples.length; offset += 2) {
        const value = Math.abs(samples.readInt16LE(offset));
        peak = Math.max(peak, value);
        if (offset < 24000 * 2 * 0.5) earlyPeak = Math.max(earlyPeak, value);
      }
      assert.ok(peak > 1000, 'click must be audible');
      assert.ok(peak < 6000, 'action sound must remain a quiet tap');
      assert.ok(earlyPeak < 20, 'local click track must have no speech or music before the click');
      // Check the encoded sound, not its filter string: the former 1450 Hz beep
      // concentrates its energy above 1 kHz; a soft tap must not do that.
      const start = Math.round(clickDelayMs(duration, true) * 24);
      const count = 2400;
      let lowEnergy = 0, highEnergy = 0;
      for (let hz = 100; hz <= 6000; hz += 50) {
        let real = 0, imaginary = 0;
        for (let i = 0; i < count; i++) {
          const sample = samples.readInt16LE((start + i) * 2);
          const angle = 2 * Math.PI * hz * i / 24000;
          real += sample * Math.cos(angle); imaginary += sample * Math.sin(angle);
        }
        const energy = real * real + imaginary * imaginary;
        if (hz <= 1000) lowEnergy += energy; else highEnergy += energy;
      }
      assert.ok(lowEnergy > highEnergy * 2, 'soft tap energy must be concentrated below 1 kHz');
    }
  }
});

test('animated school segment changes frames and holds its last frame without any audio stream', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'mathexam-video-motion-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const frames = path.join(root, 'frames');
  await fs.mkdir(frames);
  // Lossless colored source frames make motion independent of DOM/font details.
  for (let i = 0; i <= 12; i++) {
    const pixels = Buffer.alloc(96 * 54 * 3, 240);
    for (let y = 18; y < 36; y++) for (let x = 4 + i * 5; x < 24 + i * 5; x++) {
      const offset = (y * 96 + x) * 3;
      pixels[offset] = 20; pixels[offset + 1] = 80; pixels[offset + 2] = 180;
    }
    const ppm = path.join(root, 'source.ppm');
    await fs.writeFile(ppm, Buffer.concat([Buffer.from('P6\n96 54\n255\n'), pixels]));
    await runCommand('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', ppm, path.join(frames, `${String(i).padStart(4, '0')}.png`)]);
  }
  const output = path.join(root, 'motion.mp4');
  await renderMotionSegment({ ffmpegPath: 'ffmpeg', commandTimeoutMs: 30_000, maxOutputBytes: 5 * 1024 * 1024 }, frames, output, 3);
  const metadata = JSON.parse((await runCommand('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', output])).stdout);
  assert.equal(metadata.streams.filter(stream => stream.codec_type === 'audio').length, 0);
  assert.equal(metadata.streams.filter(stream => stream.codec_type === 'video').length, 1);
  assert.ok(Math.abs(Number(metadata.format.duration) - 3) < 0.05);
  const centers = [];
  for (const seconds of [0, 0.5, 1.5, 2.5]) {
    const image = path.join(root, `decoded-${seconds}.rgb`);
    await runCommand('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(seconds), '-i', output, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', image]);
    const bytes = await fs.readFile(image);
    let xTotal = 0, count = 0;
    for (let y = 0; y < 54; y++) for (let x = 0; x < 96; x++) {
      if (bytes[(y * 96 + x) * 3] < 80) { xTotal += x; count++; }
    }
    assert.ok(count > 250);
    centers.push(xTotal / count);
  }
  assert.ok(centers[1] > centers[0] + 15, 'the encoded object actually moves');
  assert.ok(centers[2] > centers[1] + 15, 'the animation reaches its destination');
  assert.ok(Math.abs(centers[3] - centers[2]) < 1, 'the final frame remains in the reading pause');
});
