import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import {
  PILOT_A_PATHS,
  runRepositoryInventory,
  validateUrlFixture,
  writeInventoryOutputs
} from './index.mjs';

function parseArguments(argv) {
  const options = {
    check: false,
    intakeRoot: null,
    outputDir: null
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--check') {
      options.check = true;
    } else if (argument === '--intake-root') {
      options.intakeRoot = argv[++index] ?? null;
      if (!options.intakeRoot) throw new Error('INTAKE_ROOT_VALUE_REQUIRED');
    } else if (argument === '--output') {
      options.outputDir = argv[++index] ?? null;
      if (!options.outputDir) throw new Error('OUTPUT_VALUE_REQUIRED');
    } else {
      throw new Error(`UNKNOWN_ARGUMENT:${argument}`);
    }
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, '..', '..');
  const outputDir = options.outputDir
    ? path.resolve(options.outputDir)
    : path.join(scriptDir, '.output');
  const fixture = JSON.parse(
    await readFile(path.join(repoRoot, 'tools', 'fixtures', 'trainer-public-url-conformance.json'), 'utf8')
  );
  const fixtureResult = validateUrlFixture(fixture);
  if (!fixtureResult.ok) {
    throw new Error(`PUBLIC_URL_FIXTURE_FAILED:${fixtureResult.failures.join(',')}`);
  }
  const report = await runRepositoryInventory({
    repoRoot,
    intakeRoot: options.intakeRoot ? path.resolve(options.intakeRoot) : null,
    outputDir: options.check ? null : outputDir
  });
  const missingPilot = report.pilotA.filter(item => PILOT_A_PATHS.includes(item.canonicalPath) && item.error);
  if (missingPilot.length) throw new Error('PILOT_A_INCOMPLETE');
  if (!options.check) await writeInventoryOutputs(outputDir, report);
  process.stdout.write(`${JSON.stringify({
    candidates: report.findings.counts.candidates,
    errors: report.findings.counts.descriptorsWithErrors,
    releaseBlockersReported: report.findings.counts.releaseBlockers,
    fixtureVectors: fixtureResult.executed,
    deterministicFingerprint: report.deterministicFingerprint,
    output: options.check ? 'not-written' : 'ignored-output-directory'
  })}\n`);
  if (options.check) {
    process.stdout.write('TRAINER_FACTORY_INVENTORY_V1_CHECK_OK\n');
  }
}

main().catch(error => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
