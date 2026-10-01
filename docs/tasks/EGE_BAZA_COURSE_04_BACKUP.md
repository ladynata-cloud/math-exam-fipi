# MathExam task specification

## Identity

- Task: EGE_BAZA_COURSE_04_BACKUP
- Owner: site owner
- Date: 2026-10-01
- Base branch: course/ege-baza-navigator (Draft #149)
- Base SHA: 939dd318bf03cdf44357f14792cfc72cabbde3f4
- Planned branch: course/ege-baza-backup
- Review level: HIGH (restoration writes learner progress)
- Related: product plan step 4; existing local import/export patterns
- ADR: no new server or platform archetype; scoped static backup envelope

## Goal

Let a learner retain a downloadable copy of course work and restore it in
another browser with a clear preview, explicit replacement confirmation and
protection against overwriting progress that changed after the preview.

## Context and evidence

The owner requested continued course development toward one complete handoff
for Codex. Drafts #147–149 remain unmerged. The foundation module owns the
local key mathexam.ege-baza.foundation.v1; its state includes practice attempts,
help, answers and three fixed assessment runs. Navigator reads it without
writing. A TXT report currently cannot restore these data. Remote main remains
010e89c75c0fe110b57c983c728b8216fb38cd9d.

## Approved scope

### In scope

- Versioned allowlisted JSON backup envelope for the implemented module.
- Strict validation, preview of current/imported results, cancellation,
  explicit confirmation, single-key replacement, blocked/quota/error handling.
- Preserve the exact allowed history of hints, attempts, skips and timestamps;
  imported scores are recomputed, never trusted as a standalone field.
- Detect changed storage before applying a preview and before module writes;
  keep original storage keys and compatible state shape.
- Course navigation and module report link to backup; teacher instructions.
- Regression gates, browser gate additions, preview ZIP and handoff notes.

### Out of scope

Server sync, accounts, personal data, other course keys, score merging, a new
task bank, retry forms, completion of all content, homepage changes, deployment.
General multi-module history and new check forms remain separate steps.

### Files or areas that must not change

Published OGE/profile trainers, server/API, workflows, hosting, secrets,
foundation task data and grading thresholds.

## Acceptance criteria

- [ ] Export and import round-trip allowed progress without loss of assistance.
- [ ] Bad, excessive, unknown-version/module data cannot write storage.
- [ ] Preview and cancel do not write; confirmation explains replacement.
- [ ] Changed current storage invalidates preview; unrelated keys survive.
- [ ] Write failure leaves old results intact and is never reported as success.
- [ ] Restored partial assessment resumes, completed checks stay completed,
  delayed repeat retains its original availability time.
- [ ] Existing course/module gates pass; browser results reported separately.

## Checks and gates

- New backup unit/DOM tests, navigator and foundation regressions.
- Syntax, diff, scoped-file and private-data checks; reproducible ZIP.
- Real browser tests for file download/upload, confirmation and concurrent tabs.
- Gate marker: EGE_BAZA_BACKUP_OK; browser not replaceable by DOM tests.
- Known browser launch restriction may block visual/real-download checks.

## Review plan

- HIGH: independent/external review required before release unless explicitly
  waived by the owner with rationale. Author tests do not satisfy that review.
- Handoff: scoped public repository material only, no learner exports.
- External provenance: provider, PR, base/head SHA, verdict, source/timestamp.

## Risk and rollback

- Replacement may overwrite newer work: preview snapshot comparison plus clear
  confirmation and current-copy download action. Import is replace, not merge.
- Atomic single localStorage write; existing module key and schema preserved.
- Roll back this delta; existing module continues to read the same saved state.
- Local storage is not an anti-cheat system. No atomic cross-tab lock claimed.

## Permissions

Current owner instruction to continue the full course authorizes this bounded
implementation, task branch, commit, push and dependent Draft PR.
Merge, auto-merge and deployment are not authorized. Whole-course release hold
remains. No new confirmation is needed for routine development decisions.

## Execution record

Recorded in the exact-head Draft PR, including pass/fail/not-run gates and the
standard EXECUTIVE STATUS fields required by AGENTS.md.


### Local execution results

- PASS: EGE_BAZA_BACKUP_OK, 69 checks, including preview/cancel, partial checks,
  assistance preservation, wrong format/size/version, quota/read denial,
  changed snapshots, stale module forms, unrelated-key retention and reset safety.
- PASS: navigator 238 checks, foundation 81 DOM checks and 60 math answers.
- PASS: portable ZIP with ten files, syntax and diff checks.
- Fixed test harness: round-trip compares object values, not incidental JSON
  property order. No assertion of preserved data was removed.
- NOT RUN: new real-browser backup gate; this environment's Chromium launch
  restriction (socket denied) was already reproduced in the previous task.
  Browser/mobile/download checks and exact-head independent review stay open.
- No merge, deployment, auto-merge, data migration or private-data commit.
