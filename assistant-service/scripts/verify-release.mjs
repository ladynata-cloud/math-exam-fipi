import { git, sourceFiles, sha256 } from './release-package.mjs';
const source = process.argv[2];
const files = sourceFiles(process.cwd(), source);
const origin = 'https://mathexam-assistant-ladynata.msk1.amvera.tech';
// Older rollback versions may predate /api/version; compare every public asset
// as well as the health boundary instead of pretending the new endpoint exists.
let last = 'Deployment not ready';
for (let attempt = 0; attempt < 48; attempt++) {
  try {
    const health = await fetch(`${origin}/healthz`, { signal: AbortSignal.timeout(10000), cache: 'no-store' });
    const status = await fetch(`${origin}/api/status`, { signal: AbortSignal.timeout(10000), cache: 'no-store' });
    if (!health.ok || !status.ok || (await health.json()).ok !== true) throw new Error('Health unavailable');
    const state = await status.json();
    if (state.mode !== 'offline' || state.externalEnabled !== false || state.localDemo !== false) throw new Error('Unexpected production mode');
    for (const [name, file] of Object.entries(files).filter(([n]) => n.startsWith('assistant-service/public/'))) {
      const asset = name.slice('assistant-service/public/'.length);
      const response = await fetch(`${origin}/${asset === 'index.html' ? '' : asset}`, { signal: AbortSignal.timeout(10000), cache: 'no-store' });
      if (!response.ok || sha256(Buffer.from(await response.arrayBuffer())) !== file.sha256) throw new Error(`Public asset mismatch: ${asset}`);
    }
    if (files['assistant-service/src/release.js']) {
      const version = await fetch(`${origin}/api/version`, { signal: AbortSignal.timeout(10000), cache: 'no-store' });
      if (!version.ok || (await version.json()).sourceCommit !== source) throw new Error('Source version mismatch');
    }
    console.log(JSON.stringify({ sourceCommit: source, healthVerified: true, checkedAt: new Date().toISOString(), sourceTree: git(process.cwd(), 'rev-parse', `${source}^{tree}`).toString().trim() }));
    process.exit(0);
  } catch (error) { last = error.message; }
  await new Promise(resolve => setTimeout(resolve, 10000));
}
throw new Error(`${last}; inspect deployment before retry or explicit code rollback`);
