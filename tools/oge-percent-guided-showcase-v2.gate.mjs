import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const commands = [
  ['node', ['--test', 'tools/oge-percent-guided-showcase-v2.test.mjs']],
  ['node', ['--test', 'tools/oge-1-5-entry-diagnostic.test.mjs']],
  [
    'node',
    [
      '--test',
      '--test-name-pattern=site discovery|board quick-select|mathematically accepted|verified control answers|progress updates|sources contain',
      'tools/oge-plans-routes-stepik-trainers.test.mjs'
    ]
  ],
  ['node', ['--test', 'board-server/test/trainer-registry.test.js']],
  ['node', ['tools/oge-percent-guided-showcase-v2.browser.mjs']],
  ['node', ['tools/trainer-inventory/cli.mjs', '--check']],
  [
    'git',
    [
      'diff',
      '--check',
      '4075a597ad3cbc63ee66ea272ad10d77b8cdba3e',
      'HEAD'
    ]
  ]
];

for (const [command, args] of commands) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: process.env,
    encoding: 'utf8',
    stdio: 'inherit',
    shell: false
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log('OGE_PERCENT_GUIDED_SHOWCASE_V2_GATE_OK');
