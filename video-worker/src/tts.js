import fs from 'node:fs/promises';
import { runCommand } from './command.js';

const MAX_AUDIO_BYTES = 24 * 1024 * 1024;

function ttsError(message, code = 'TTS_RESPONSE_INVALID') {
  const error = new Error(message);
  error.code = code;
  return error;
}

export async function writeSpeechResponse(response, target, provider, maxBytes = MAX_AUDIO_BYTES) {
  if (!response.ok) throw ttsError(`${provider} speech request failed (${response.status})`, 'TTS_PROVIDER_FAILED');
  const length = Number(response.headers.get('content-length') || 0);
  if (Number.isFinite(length) && length > maxBytes) {
    throw ttsError(`${provider} speech response is too large`, 'TTS_RESPONSE_TOO_LARGE');
  }
  if (!response.body) throw ttsError(`${provider} speech response has no body`);

  const handle = await fs.open(target, 'wx', 0o600);
  const reader = response.body.getReader();
  let written = 0;
  let failed = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      written += value.byteLength;
      if (written > maxBytes) {
        await reader.cancel('speech response limit exceeded').catch(() => {});
        throw ttsError(`${provider} speech response is too large`, 'TTS_RESPONSE_TOO_LARGE');
      }
      await handle.write(Buffer.from(value));
    }
    if (!written) throw ttsError(`${provider} speech response is empty`);
  } catch (error) {
    failed = true;
    throw error;
  } finally {
    await handle.close();
    if (failed) await fs.rm(target, { force: true }).catch(() => {});
  }
  return target;
}

function openai(config) {
  return {
    extension: 'mp3',
    async synthesize(text, basePath) {
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
        signal: AbortSignal.timeout(120_000),
      });
      return writeSpeechResponse(response, `${basePath}.mp3`, 'OpenAI');
    },
  };
}

function yandex(config) {
  return {
    extension: 'ogg',
    async synthesize(text, basePath) {
      const form = new URLSearchParams({
        text,
        lang: 'ru-RU',
        voice: config.yandexVoice,
        format: 'oggopus',
        folderId: config.yandexFolderId,
      });
      const response = await fetch('https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize', {
        method: 'POST',
        headers: {
          Authorization: `Api-Key ${config.yandexKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form,
        signal: AbortSignal.timeout(120_000),
      });
      return writeSpeechResponse(response, `${basePath}.ogg`, 'Yandex');
    },
  };
}

function mock(config) {
  return {
    extension: 'wav',
    async synthesize(text, basePath) {
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
      });
      return target;
    },
  };
}

export function createTts(config) {
  if (config.ttsProvider === 'openai') return openai(config);
  if (config.ttsProvider === 'yandex') return yandex(config);
  return mock(config);
}
