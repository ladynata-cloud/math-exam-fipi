# EGE_BAZA_COURSE_05_DATA

## Identity

- Date: 2026-10-01
- Base: course/ege-baza-backup, Draft #150
- Base SHA: 9607af93e424d08bbd50d4f23bf2e8b1bd6ec24b
- Branch: course/ege-baza-data-module
- Review: HIGH (assessment/progress and multi-module restoration)
- START: owner requested continued course development and repeated «продолжай».

## Goal

Implement the second course module: data, probability, graphs and logic, with
explanations, interactive models, distinct practice/start/checkpoint/repeat
pools, teacher guidance, navigator progress and a module-specific backup.

## Evidence and scope

- Uses the existing foundation module's static UI/state/assessment pattern.
- Source baseline: saved FIPI 2027 draft demo/specification/codifier; positions
  3, 5, 7, 8. Author tasks are not presented as actual FIPI bank items.
- Four lesson/skill prototypes, 40 author tasks (16 practice + 8 each in three
  checks), graphical/table stimuli, fixed separate assessment forms.
- Navigation selects implemented module; totals and states remain module-specific.
- Read-only state factory and backup factory reuse established logic with an
  allowlisted module descriptor; each restoration writes exactly one module.
- Existing m01 backup files remain valid; m02 never overwrites m01.
- No server, new central storage, homepage change, publishing or task-bank
  changes in the first module. New retries and full course completeness remain
  later work; exact subtype matrix is not claimed complete by this prototype.

## Acceptance and gates

- Independent answer calculations; distinct pools; stimuli consistent with tasks.
- Interactive controls work; learner cycle resumes and honours help and delay.
- Registry, references and module totals agree; backup isolation and old-file
  compatibility tested. Existing first-module/nav/backup gates remain green.
- Browser gate updated for real 360/1280 rendering and module transitions;
  known environment restriction reported as not run, never pass.
- Scoped diff, syntax, preview ZIP and link gates; independent exact-head HIGH
  review required before release unless explicitly waived under review policy.

## Risk, rollback and permissions

Risks: inaccurate stimuli, answer drift, mixed module counts or storage keys.
Mitigation: independent math oracles, reference parity, end-to-end DOM flow,
module-specific allowlist and cross-module restore tests. Rollback this delta;
m01's key/state unchanged. m02's isolated key remains for a later compatible build.

Branch, commit, push and dependent Draft PR authorized by continued development.
No merge, auto-merge or deployment. Whole-course release hold remains.
Final Draft PR includes EXECUTIVE STATUS, exact base/head, actual checks and
remaining browser/review gates. Public handoff contains no private learner data.

## Execution result

Author gates: 234 math/stimulus/parity/isolation checks, 78 module DOM checks,
26 cross-module DOM/file-input checks; regression 242 navigator, 69 backup,
81 foundation DOM, 60 foundation math answers, EGE-2027 gate. Preview: 15 files.
An initial test compared object serialization order; corrected to deep semantic
equality without removing any assertion. All final author gates pass.
Real browser gates are prepared, not run under the known socket restriction.
Independent exact-head HIGH review remains open; no merge or deployment.
