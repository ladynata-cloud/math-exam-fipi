import { spawn } from 'node:child_process';

export function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env || process.env,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout = [];
    const stderr = [];
    let outputBytes = 0;
    const maxBytes = options.maxBytes || 1024 * 1024;
    const collect = (target) => (chunk) => {
      outputBytes += chunk.length;
      if (outputBytes <= maxBytes) target.push(chunk);
    };
    child.stdout.on('data', collect(stdout));
    child.stderr.on('data', collect(stderr));
    child.once('error', reject);
    child.once('close', (code) => {
      const out = Buffer.concat(stdout).toString('utf8');
      const err = Buffer.concat(stderr).toString('utf8');
      if (code === 0) resolve({ stdout: out, stderr: err });
      else reject(new Error(`${command} exited with code ${code}: ${err.slice(-1200)}`));
    });
  });
}

