import fs from 'node:fs';
import { spawn } from 'node:child_process';

function commandError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const detached = process.platform !== 'win32';
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env || process.env,
      windowsHide: true,
      detached,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout = [];
    const stderr = [];
    let outputBytes = 0;
    let settled = false;
    let forcedError = null;
    const maxBytes = options.maxBytes || 1024 * 1024;
    const timeoutMs = options.timeoutMs || 180_000;

    const signalTree = (signal) => {
      if (!child.pid || child.exitCode !== null) return;
      try {
        if (detached) process.kill(-child.pid, signal);
        else child.kill(signal);
      } catch {
        child.kill(signal);
      }
    };
    const stop = (error) => {
      if (forcedError) return;
      forcedError = error;
      signalTree('SIGTERM');
      const hardKill = setTimeout(() => signalTree('SIGKILL'), 5000);
      hardKill.unref();
    };
    const collect = (target) => (chunk) => {
      outputBytes += chunk.length;
      if (outputBytes <= maxBytes) target.push(chunk);
      else stop(commandError(`${command} produced too much diagnostic output`, 'COMMAND_OUTPUT_LIMIT'));
    };

    child.stdout.on('data', collect(stdout));
    child.stderr.on('data', collect(stderr));
    const timeout = setTimeout(() => {
      stop(commandError(`${command} exceeded its execution deadline`, 'COMMAND_TIMEOUT'));
    }, timeoutMs);
    timeout.unref();

    const monitor = options.monitorFile && options.maxFileBytes
      ? setInterval(() => {
        fs.stat(options.monitorFile, (error, stat) => {
          if (!error && stat.size > options.maxFileBytes) {
            stop(commandError(`${command} exceeded its output file limit`, 'COMMAND_OUTPUT_LIMIT'));
          }
        });
      }, 250)
      : null;
    if (monitor) monitor.unref();

    const cleanup = () => {
      clearTimeout(timeout);
      if (monitor) clearInterval(monitor);
    };
    child.once('error', (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(forcedError || error);
    });
    child.once('close', (code) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (forcedError) return reject(forcedError);
      const out = Buffer.concat(stdout).toString('utf8');
      const err = Buffer.concat(stderr).toString('utf8');
      if (code === 0) resolve({ stdout: out, stderr: err });
      else reject(new Error(`${command} exited with code ${code}: ${err.slice(-1200)}`));
    });
  });
}
