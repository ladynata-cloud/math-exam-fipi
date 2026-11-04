# OGE homepage with interactive 3D models

## Identity and approved scope

- Owner: MathExam owner, direct request in the current conversation.
- Date: 2026-11-04 (Asia/Novosibirsk).
- Base: main, `846040b338fd21a69f52132a75e29e4a9e2669b6`.
- Branch: `feat/oge-home-3d-20261104`.
- Review: MEDIUM — isolated public homepage behavior and recoverable visual changes.
- Start: the owner's request to make the main page an OGE landing with rotating tires, apartments, upward/downward parabolas and other course models.
- Publication: standing [owner authorization](../OWNER_RELEASE_AUTHORIZATION.md); no new confirmation or external audit required.

## Goal and implementation

Make the existing homepage an OGE-first entrance with real procedural 3D models,
short copy and direct links into the existing course. Use the already vendored
Three.js library, with software canvas projection when WebGL is unavailable.
The first scene contains a tire with tread/rim, a cutaway apartment, two quadratic
curves and an equilateral triangle inscribed in its circumcircle. Model selectors
focus each group, update its caption and point to the existing relevant trainer.

Retain school/EGE lesson links, teacher contacts, cabinets, foundational course,
SEO links, verification tags and canonical URL. No changes to trainers, answers,
learner state, accounts, shared board or server behavior. No new external library,
remote assets or tracking dependencies. No new mathematical trainer archetype.

## Acceptance and gates

- Models rotate, can be paused and dragged; selectors work with keyboard input.
- Reduced motion starts paused and responds to preference changes.
- Animation stops outside the viewport and while the document is hidden.
- GPU absence retains animated 3D through software projection; unavailable JS or
  library retains the inline SVG and real navigation.
- 320, 390, 768, 1280px layouts do not overflow horizontally.
- Existing lesson CTA journeys remain available in the dedicated lesson section.
- Primary CTA opens the actual OGE course; model links open existing destinations.
- Static: node syntax checks; SEO sitemap tests, sitemap --check, SEO entrances;
  lesson-funnel privacy regression; git diff --check.
- Browser: existing showcase and SEO workflows plus `tools/oge-home.browser.cjs`.
- Final gate: `OGE_HOME_3D_OK` after browser results.

## Review, risk and rollback

Focused self-review includes mathematical sign/shape correctness, local-only
resources, user motion controls, fallback behavior and preserved entrances.
External provider review not performed under the standing owner policy.
No real-pupil pilot or physical-device test is claimed.

Main risk is graphics/performance variation. Cap DPR, limit software rendering
rate, suspend hidden animation, and preserve static SVG fallback. Preview first
verified software projection because cloud Chromium has no WebGL context.
Browser CI checks both normal graphics and forced WebGL failure.
Rollback: ordinary revert of this PR, restoring homepage and removing only its
isolated assets/test changes. No database or learner work is involved.

## Execution record

Local syntax, 12 sitemap tests, sitemap generation check, SEO entrances/canonical
checks and six lesson-funnel privacy tests passed. Desktop preview inspected;
final browser CI, merge identity and deployment evidence belong in the PR record.
The previous main release includes PR427 published-board verification; earlier
PROJECT_STATUS statements about PR340 pending publication are historical and do
not change the current source baseline. This task leaves those unrelated records
intact and records actual homepage publication in its own PR.
