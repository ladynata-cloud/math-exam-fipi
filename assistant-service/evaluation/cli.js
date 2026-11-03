import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { requireValue } from '../src/errors.js';
import { preparePilot, approvalTemplate, liveConfig, readPrivateJson, writePrivate, ARTIFACT_PATH,
  LIVE_LEDGER_PATH, CampaignLedger, runPilot, simulatedFetch, reviewTemplate, reviewMarkdown, safeError, scoreReview } from './pilot.js';

function options(args, allowed) {
  const output = {};
  requireValue(args.length % 2 === 0, 'EVAL_ARGUMENT_INVALID');
  for (let i = 0; i < args.length; i += 2) {
    requireValue(allowed.includes(args[i]) && !Object.hasOwn(output, args[i]) && args[i + 1], 'EVAL_ARGUMENT_INVALID');
    output[args[i]] = args[i + 1];
  }
  return output;
}
function saveBundleReport(bundle, prefix) {
  return report => {
    writePrivate(path.join(ARTIFACT_PATH, `${prefix}-report.json`), report);
    writePrivate(path.join(ARTIFACT_PATH, `${prefix}-review.md`), reviewMarkdown(bundle, report));
    // Never overwrite an operator's completed review. This file is always a
    // separate blank template; reviewed input must be saved under another name.
    writePrivate(path.join(ARTIFACT_PATH, `${prefix}-review-template.json`), reviewTemplate(report));
  };
}
export async function main(args = process.argv.slice(2), env = process.env) {
  const [command = 'plan', ...rest] = args;
  requireValue(['plan', 'dry-run', 'live', 'review'].includes(command), 'EVAL_ARGUMENT_INVALID');
  if (command === 'review') {
    const opts = options(rest, ['--report', '--scores']);
    requireValue(opts['--report'] && opts['--scores'], 'EVAL_ARGUMENT_INVALID');
    const result = scoreReview(readPrivateJson(opts['--report']), readPrivateJson(opts['--scores']));
    writePrivate(path.join(ARTIFACT_PATH, 'human-review-result.json'), result); return result;
  }
  const opts = options(rest, command === 'live' ? ['--approval'] : []);
  const bundle = preparePilot();
  if (command === 'plan') {
    writePrivate(path.join(ARTIFACT_PATH, 'plan.json'), bundle.plan);
    writePrivate(path.join(ARTIFACT_PATH, 'approval.pending.json'), approvalTemplate(bundle.plan));
    writePrivate(path.join(ARTIFACT_PATH, 'review.md'), reviewMarkdown(bundle));
    writePrivate(path.join(ARTIFACT_PATH, 'review-template.json'), {
      schemaVersion: 1, reportDigest: null, reviewerRole: null, reviewedAt: null,
      caseReviews: bundle.requests.map(row => ({ caseId: row.caseId,
        scores: { math: null, nextStep: null, clarity: null, feedback: null, honesty: null },
        requiredPointsMet: null, criticalError: null, notes: '' }))
    });
    return bundle.plan;
  }
  let ledger, temporary;
  try {
    if (command === 'dry-run') {
      // No environment keys or global fetch are consulted. The simulation uses
      // an isolated temporary ledger and cannot consume the live campaign.
      temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-evaluation-simulation-'));
      ledger = new CampaignLedger(path.join(temporary, 'simulation.sqlite'));
      const report = await runPilot({ bundle, ledger, mode: 'dry-run', config: bundle.config,
        fetchImpl: simulatedFetch(), saveReport: saveBundleReport(bundle, 'dry-run') });
      return { kind: report.kind, counts: report.counts, campaignStatus: report.campaign.status,
        modelQuality: report.modelQuality, reportDigest: report.reportDigest, reservedMicros: report.reservedMicros };
    }
    requireValue(opts['--approval'], 'EVAL_APPROVAL_REQUIRED');
    requireValue(bundle.plan.manifest.revision.head && bundle.plan.manifest.revision.clean, 'EVAL_UNCOMMITTED_SOURCE');
    const approval = readPrivateJson(opts['--approval']);
    const config = liveConfig(bundle.plan, approval, env);
    // This is the only CLI path that can use a network transport. There is no
    // configurable model, corpus, endpoint, campaign ID, ledger, retry or reset.
    ledger = new CampaignLedger(LIVE_LEDGER_PATH);
    const report = await runPilot({ bundle, ledger, mode: 'live', approval, config,
      saveReport: saveBundleReport(bundle, 'live') });
    return { kind: report.kind, counts: report.counts, campaignStatus: report.campaign.status,
      modelQuality: report.modelQuality, reportDigest: report.reportDigest,
      reservedMicros: report.reservedMicros, errorCode: report.campaign.errorCode };
  } finally {
    ledger?.close();
    if (temporary) fs.rmSync(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const result = await main(); console.log(JSON.stringify(result, null, 2));
    if (result.campaignStatus && result.campaignStatus !== 'completed') process.exitCode = 1;
  } catch (error) {
    console.error(JSON.stringify({ error: safeError(error), modelQuality: 'NOT_MEASURED' })); process.exitCode = 1;
  }
}
