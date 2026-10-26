# Peterson 6: continuation with textbook parts 2 and 3

## Goal and scope

Date: 2026-10-26, Asia/Novosibirsk. Base: `44eab4d11046d8613b50a73b00185755c814dba6`.
Branch: `feat/peterson6-parts2-3`. Review: HIGH because shared session schema and persistent work are affected.

The owner's current request is to continue the existing sixth-grade course using the two supplied books and the expanded recent course requirements. Extend the existing `/school/peterson6/` entry, retain its first fourteen topics and all 224 existing task identities, and preserve its board/cabinet links.

Sources: Dorofeev and Peterson, Mathematics 6, BINOM, 2019, part 2 (128 pages) and part 3 (176 pages). Printed and PDF page numbers coincide. Add all 44 topic headings in these parts, original concise theory, verified selected textbook exercises, small retained steps, task-specific essential diagrams, interactive models, skill practice, fresh checks without hints and nonblocking diagnostic recommendations. Coverage of topics does not mean solutions to every textbook number. Part2 contains duplicated printed 143 and no printed 144; preserve this distinction in lookup.

Do not change the first-part source files or old deterministic practice sequences. Keep the personal storage key and support earlier saves/exports. Import must preserve active drafts. Local model state must survive task changes, practice detours and reload. Written proofs and constructions require manual review and never earn automatic correctness. Existing personal attempts remain separate from shared classroom work.

## Integration

Retain the established board SDK, authentication, role/control handoff, safe JSON bounds,48 KiB work and60 KiB session limits. Extend this trainer's strict session codec to include saved models and part-aware number search. Register Peterson version 2.0.0/state schema 2; registry readers accept supported state schemas 1 and 2 without accepting an unknown version or mismatched trainer metadata. Other trainer entries remain unchanged. Publication must coordinate the frontend and Amvera registry; an old server must reject incompatible metadata instead of silently accepting it.

The existing cabinet course link follows the same URL automatically. No learner records, account creation, messaging, login changes or personal-progress cloud migration are included. Uploaded PDFs and extracted source pages are not distributed.

## Pedagogy and design review

Start with the task and essential diagram. Help is optional, contextual and retained as assistance even after closing. Each field names the quantity/unit/format. Previous steps stay visible. Fractions use horizontal bars; proportions show cross products. Models are labelled illustrative where they are not the actual source diagram. Written reasoning needs specific reasons and manual review. New independent checks use a fresh condition without help; a seen helped problem is not relabelled independent.

The required Claude consultation is unavailable: no authorized Claude/Anthropic tool is exposed in the current integration discovery. Earlier release exceptions do not constitute a standing waiver. Source authors, independent mathematical checks, runtime review and browser evidence are internal verification, not a Claude verdict or real-pupil learning study. Continue preparation under `TRAINER_CLAUDE_CONSULTATION.md`; disclose this limitation at release.

## Acceptance

- All 58 topics load; all new selected references match the correct part, printed number/subpart and page.
- All 224 old task identities/content files and first 20 generators remain unchanged.
- Exact answer forms and independently calculated new examples/steps pass.
- All new models restore semantic state, not only visible controls.
- Manual/instruction/check/diagnostic routes preserve work and never grant false independent credit.
- Malformed, oversized, cross-task and unsupported-version snapshots are rejected atomically.
- Actual two-participant board QA covers typing, checked steps, models, detours, handoff, reload and late join for the new parts; personal storage remains untouched in shared mode.
- Desktop/mobile visual review and exact source/bundle/catalog/registry tests pass.

## Permission and rollback

Current creation request authorizes this implementation, tests, commits, push and a Draft PR. Previous publication authorization in this conversation applied to Peterson 5 / PR349, not a standing permission for a new release. Separate current release authorization is required for this increment and its coordinated backend registry deployment.

Rollback restores the prior course runtime and registry metadata together through a scoped revert. Do not delete existing personal keys, pupil data or previously published work. New personal records are additive; keep legacy records readable. Old shared rooms with incompatible trainer metadata fail closed and require a fresh current room rather than an invented state migration.
