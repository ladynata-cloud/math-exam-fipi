# OGE homepage: 25 tilted task orbits

## Identity

- Task: one differently inclined orbit per OGE course number, with its task types.
- Owner: MathExam owner, current explicit request.
- Date: 2026-11-04 (Asia/Novosibirsk).
- Base: main @ 7811aedd7702cb3b29ec33ff1216b49512a59f32.
- Branch: feat/oge-25-tilted-orbits-20261104.
- Review level: MEDIUM; bounded public homepage illustration/navigation.
- Related ADR: none; no trainer archetype or architectural change.

## Goal

Turn the homepage exhibit into 25 inclined orbits, each carrying models of its own
course task types. Visitors can inspect the whole universe, one orbit or one model,
and open the corresponding existing course trainer.

## Context and evidence

PR #431 published the eight-model/three-orbit homepage. PR #432 subsequently
published the owner's invitation “Начни уже с чего-нибудь!”. Both are present in
the verified base and retained. Older PROJECT_STATUS pending-release wording does
not override this production evidence. No separate status PR is needed.
The course's actual trainers/oge-course/index.html supplies all number-to-trainer
mappings. For numbers 1–5, practical plots vary between exam variants: the UI
explicitly calls these illustrations of the shared 1–5 block rather than claiming
that a particular number always means tires, apartments, etc.

## Approved scope

In scope: homepage-only scene, 25-number picker, subtype controls and captions,
public course-map asset, responsive framing, tests, existing showcase workflow and
this task record. Exactly 25 paths and 53 illustrative subtype satellites.
Out of scope / do not change: trainers and their content, scoring, accounts,
persistence, private student information, API contracts, dependencies, deployment
configuration and unrelated homepage copy (including the owner's invitation).

## Acceptance criteria

- Exactly 25 orbit planes with distinct normal directions and a shared center.
- At least two subtype models per number; 53 total, matching the course map.
- Independent orbital and axial motion, pause, reduced motion, pointer rotation.
- Whole-scene → selected orbit → selected model → back navigation, with accessible
  pressed states and working existing trainer URLs; canvas picking supplements
  keyboard-accessible buttons.
- Camera contains all visible models/paths at supported widths through a full
  orbit and after selection; reduced motion defaults to a still image.
- Static illustration and links remain usable if JavaScript, Three or catalog
  loading fails; the software renderer supports the orbital line paths.
- No loss of existing course, lesson, cabinet or owner invitation entrances.

## Checks and gates

- Syntax checks for page scripts and tests; git diff --check.
- Sitemap tests, sitemap build --check, SEO checks, lesson-funnel contract tests.
- OGE_HOME_ORBITS_OK: real geometry/scene with renderer stub, 120 simulated seconds
  at four stage sizes, all 53 models traverse four quadrants in their own plane,
  25 distinct normals, visible projected vertices fit, every orbit/subtype
  selection and link verified, actual raycast picking of the die.
- OGE_HOME_3D_OK: browser checks at 320/390/768/1280, all 25 numbers and 53 subtypes
  at every width, pressed states, URLs, keyboard, motion/pause/drag, reduced motion,
  JS/library/catalog/WebGL fallbacks and original owner CTA.
- Applicable exact-head CI, managed-preview visual review, final CI screenshots.
- After merge: exact parent/tree/delta identity, Pages commit and live byte/UI checks.
- Local browser automation not run: managed preview used; existing CI runs browsers.

## Review plan

Focused self-review of orbit transforms, bounds, geometry, mapping and fallback.
Distinct planes are tested by their transformed normal vectors; paths and satellite
positions share each orbit's local XY plane. Models counter-rotate relative to the
plane so their independent spin remains readable. Bounds account for all rotations.
Parabolas retain exact samples and coefficient-sign captions; die face pairs sum to
seven; paper areas halve. Other models are clearly illustrative, not task conditions.
No new learning sequence or scoring: external trainer consultation not applicable.
External provider review not performed under standing authorization and current
explicit waiver. No provider approval or real-pupil pilot is claimed.

## Risk and rollback

The overview is dense by design; one-orbit and individual views provide detail.
The software painter is approximate and can be slower; paths use inexpensive line
loops, overview tires use lighter geometry, DPR/frame caps and visibility suspension
remain. Models can briefly overlap in projection.
Rollback is an ordinary scoped revert PR. No migrations, data deletion, history
rewriting or changes to security controls are involved.

## Permissions and execution

The current request authorizes START and scoped implementation, branch, commits,
push and Draft PR. docs/OWNER_RELEASE_AUTHORIZATION.md and the explicit current
session authorization cover controlled squash/publication after checks, without
another permission request or mandatory Claude review.
Actual PR/head, check results, fresh base/head guard, release and live verification
are recorded in the PR report. Scope deviations: none.
