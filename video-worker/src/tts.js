import fs from 'node:fs/promises';
import { runCommand } from './command.js';

const MAX_AUDIO_BYTES = 24 * 1024 * 1024;

function ttsError(message, code = 'TTS_RESPONSE_INVALID') {
  const error = new Error(message);
  error.code = code;
  return error;
}

function requestSignal(signal) {
  const timeout = AbortSignal.timeout(120_000);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

function aborted(signal) {
  if (!signal?.aborted) return;
  throw ttsError('Speech synthesis was cancelled', 'JOB_ABORTED');
}

export async function writeSpeechResponse(response, target, provider, maxBytes = MAX_AUDIO_BYTES, signal) {
  if (!response.ok) throw ttsError(`${provider} speech request failed (${response.status})`, 'TTS_PROVIDER_FAILED');
  const length = Number(response.headers.get('content-length') || 0);
  if (Number.isFinite(length) && length > maxBytes) {
    throw ttsError(`${provider} speech response is too large`, 'TTS_RESPONSE_TOO_LARGE');
  }
  if (!response.body) throw ttsError(`${provider} speech response has no body`);

  const handle = await fs.open(target, 'wx', 0o600);
  const reader = response.body.getReader();
  const onAbort = () => { reader.cancel('speech synthesis cancelled').catch(() => {}); };
  signal?.addEventListener('abort', onAbort, { once: true });
  let written = 0;
  let failed = false;
  try {
    while (true) {
      aborted(signal);
      const { done, value } = await reader.read();
      if (done) break;
      written += value.byteLength;
      if (written > maxBytes) {
        await reader.cancel('speech response limit exceeded').catch(() => {});
        throw ttsError(`${provider} speech response is too large`, 'TTS_RESPONSE_TOO_LARGE');
      }
      await handle.write(Buffer.from(value));
    }
    aborted(signal);
    if (!written) throw ttsError(`${provider} speech response is empty`);
  } catch (error) {
    failed = true;
    throw error;
  } finally {
    signal?.removeEventListener('abort', onAbort);
    await handle.close();
    if (failed) await fs.rm(target, { force: true }).catch(() => {});
  }
  return target;
}

function openai(config) {
  return {
    extension: 'mp3',
    async synthesize(text, basePath, options = {}) {
      try {
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: config.openaiModel,
            voice: config.openaiVoice,
            input: text,
            response_format: 'mp3',
            instructions: 'Speak in clear, calm Russian as a mathematics teacher. Read formulas carefully.',
          }),
          signal: requestSignal(options.signal),
        });
        return await writeSpeechResponse(response, `${basePath}.mp3`, 'OpenAI', MAX_AUDIO_BYTES, options.signal);
      } catch (error) {
        aborted(options.signal);
        throw error;
      }
    },
  };
}

function yandex(config) {
  return {
    extension: 'ogg',
    async synthesize(text, basePath, options = {}) {
      const form = new URLSearchParams({
        text,
        lang: 'ru-RU',
        voice: config.yandexVoice,
        format: 'oggopus',
        folderId: config.yandexFolderId,
      });
      try {
        const response = await fetch('https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize', {
          method: 'POST',
          headers: {
            Authorization: `Api-Key ${config.yandexKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: form,
          signal: requestSignal(options.signal),
        });
        return await writeSpeechResponse(response, `${basePath}.ogg`, 'Yandex', MAX_AUDIO_BYTES, options.signal);
      } catch (error) {
        aborted(options.signal);
        throw error;
      }
    },
  };
}

function mock(config) {
  return {
    extension: 'wav',
    async synthesize(text, basePath, options = {}) {
      const target = `${basePath}.wav`;
      const duration = Math.max(1.5, Math.min(8, 1 + String(text).length / 45));
      await runCommand(config.ffmpegPath, [
        '-hide_banner', '-loglevel', 'error', '-y',
        '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono',
        '-t', duration.toFixed(3), '-c:a', 'pcm_s16le', '-fs', String(MAX_AUDIO_BYTES), target,
      ], {
        timeoutMs: config.commandTimeoutMs,
        monitorFile: target,
        maxFileBytes: MAX_AUDIO_BYTES,
        signal: options.signal,
      });
      return target;
    },
  };
}

export function silentDuration(text, durationHintMs) {
  const derived = 1.8 + String(text).length / 16;
  const hinted = Number(durationHintMs) / 1000;
  const target = Number.isFinite(hinted) && hinted > 0 ? Math.max(derived, hinted) : derived;
  return Math.max(3.5, Math.min(30, target));
}

function silent(config) {
  return {
    extension: 'wav',
    async synthesize(text, basePath, options = {}) {
      const target = `${basePath}.wav`;
      const duration = silentDuration(text, options.durationHintMs);
      const fadeOutStart = Math.max(0, duration - 0.8).toFixed(3);
      await runCommand(config.ffmpegPath, [
        '-hide_banner', '-loglevel', 'error', '-y',
        '-f', 'lavfi', '-i',
        `aevalsrc=0.018*(sin(2*PI*220*t)+sin(2*PI*277.18*t)+sin(2*PI*329.63*t)):s=24000:d=${duration.toFixed(3)}:c=mono`,
        '-af', `afade=t=in:st=0:d=0.6,afade=t=out:st=${fadeOutStart}:d=0.8`,
        '-c:a', 'pcm_s16le', '-fs', String(MAX_AUDIO_BYTES), target,
      ], {
        timeoutMs: config.commandTimeoutMs,
        monitorFile: target,
        maxFileBytes: MAX_AUDIO_BYTES,
        signal: options.signal,
      });
      return target;
    },
  };
}

export function createTts(config) {
  if (config.ttsProvider === 'openai') return openai(config);
  if (config.ttsProvider === 'yandex') return yandex(config);
  if (config.ttsProvider === 'silent') return silent(config);
  return mock(config);
}
