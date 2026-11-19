/** Export model inputs only. Rubrics and runtime mappings are deliberately excluded. */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { EVALUATION_DIRECTORY, EvaluationValidationError, loadEvaluation } from './evaluate-predictions.mjs';

export async function prepareEvaluation(outputDirectory, evaluationDirectory = EVALUATION_DIRECTORY) {
  if (typeof outputDirectory !== 'string' || !outputDirectory.trim()) throw new EvaluationValidationError('An output directory is required');
  if (path.resolve(outputDirectory) === path.resolve(evaluationDirectory)) throw new EvaluationValidationError('Model export must be separate from the source evaluation directory');
  const evaluation = await loadEvaluation(evaluationDirectory);
  const manifest = {
    schemaVersion: 1, type: 'evaluation-model-inputs', evalSetHash: evaluation.evalSetHash,
    inputHash: evaluation.inputHash, rubricHash: evaluation.rubricHash,
    cases: evaluation.inputs.length, bySite: evaluation.counts,
    messagesReadyForModel: true, referenceDataIncluded: false,
    instruction: 'Send each messages array unchanged. Keep id locally for matching predictions. Do not supply rubrics, expected behavior, or held-out scores to the model.',
  };
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(path.join(outputDirectory, 'inputs.jsonl'), evaluation.inputs.map(row => JSON.stringify(row)).join('\n') + '\n', { flag: 'wx' });
  await writeFile(path.join(outputDirectory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  return manifest;
}

async function cli(args) {
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!['--output', '--evaluation'].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--') || Object.hasOwn(options, args[i])) throw new EvaluationValidationError('Use --output DIRECTORY [--evaluation SOURCE_DIRECTORY] once each');
    options[args[i]] = args[i + 1];
  }
  const manifest = await prepareEvaluation(options['--output'], options['--evaluation']);
  process.stdout.write(JSON.stringify(manifest) + '\n');
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  cli(process.argv.slice(2)).catch(error => { process.stderr.write(`${error.name}: ${error.message}\n`); process.exitCode = 1; });
}
