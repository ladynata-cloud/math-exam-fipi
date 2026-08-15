import fs from 'node:fs/promises';
import { runCommand } from './command.js';

const MAX_AUDIO_BYTES = 24 * 1024 * 1024;

async function responseBuffer(response, provider) {
  if (!response.ok) throw new Error(`${provider} speech request failed (${response.status})`);
  const length = Number(response.headers.get('content-length') || 0);
  if (length > MAX_AUDIO_BYTES) throw new Error(`${provider} speech response is too large`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length || buffer.length > MAX_AUDIO_BYTES) {
    throw new Error(`${provider} speech response has an invalid size`);
  }
  return buffer;
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
      const target = `${basePath}.mp3`;
      await fs.writeFile(target, await responseBuffer(response, 'OpenAI'), { mode: 0o600 });
      return target;
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
      const target = `${basePath}.ogg`;
      await fs.writeFile(target, await responseBuffer(response, 'Yandex'), { mode: 0o600 });
      return target;
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
        '-t', duration.toFixed(3), '-c:a', 'pcm_s16le', target,
      ]);
      return target;
    },
  };
}

export function createTts(config) {
  if (config.ttsProvider === 'openai') return openai(config);
  if (config.ttsProvider === 'yandex') return yandex(config);
  return mock(config);
}
