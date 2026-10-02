# ЕГЭ профиль: понятный старт по №1, №2, №7 и №8

## Identity and authorization
- Owner: Наталья Михайловна; 2026-10-02.
- Repository: ladynata-cloud/math-exam-fipi; branch: course/profile-foundations-2027.
- Base main: 14f364617a83ab545f8e95b002bd74968c5f5980; tree: 1a43d6f08429173570b3d849d70e4d929c3b9b37.
- Review level: HIGH (local learning progress). Existing static stepwise trainer and SVG model patterns are reused; no new platform/board protocol.
- Current explicit START and publication authorization: «5 задачу из списка пока что не нужно. Хорошо, делай. выложи облачно.» The fifth suggested algebra exercise (quadratic in sine / second-part №14) is excluded. Existing standing course-publication permission removes separate final acceptance; external review is not claimed. Ordinary math, browser, data and release checks remain mandatory; global policy unchanged.

## Scope
- First learning release for planimetry №1, vectors №2, introductory trigonometry and four approved algebra themes: exponential equation, logarithmic equation, recovering cosine from sine/quadrant, double-angle expressions (№7/8 in the 2027 draft).
- Dynamic SVG exploration, student constructions, keyboard alternatives, graduated steps/hints, genuinely fresh independent tasks, explicit local progress and export.
- Reuse existing course resources; expose the new route in the profile navigator and board picker. Preserve existing trainers, student keys and basic-EGE homepage priority.
- Update the profile landing page to distinguish the 2027 start from legacy 2026 navigation; do not relabel legacy exam IDs as new positions.
- Out of scope: new №14 trigonometric equations, №16 inequalities, complete profile course, accounts/cloud student journal, hosting/domain changes, paid services, new automations.

## Sources and coverage
- Official FIPI 2027 mathematics demo/specification archive linked from https://fipi.ru/ege/demoversii-specifikacii-kodifikatory (currently a project).
- New exercises are original pedagogical analogues, not a copied official bank or a claim of exhaustive FIPI coverage. Source snippets in repository are not necessary; keep downloaded textbooks private.

## Gates and release
- Independent arithmetic/geometry/trigonometry oracle tests; meaningful browser checks for guided/independent/error/remediation/return, 360/768/1280 widths, keyboard, reduced motion, corrupted state, legacy keys, export and board iframe.
- Existing relevant profile and board tests; diff/link check. Publish via one PR and existing Pages hosting. Before merge re-read main/head/checks/threads and verify exact touched blobs. If main drifts, verify composed scope and rerun applicable gates; no force/reset/rebase/protection bypass.
- Rollback by ordinary revert of this release. New namespaced progress key never clears existing results; retain exports on rollback. Publication and final SHA evidence belong in PR.

## Internal content contract
Scripts use an IIFE and append lessons to globalThis.ProfileLessons; CommonJS exports their own lesson array for tests. No dependencies/eval/network.
Lesson: {id,group,title,position,summary,intro (trusted HTML),why,model (optional ID),prereq:{title,text (HTML),href},tasks:[...],links:[{title,href}]}.
Task: {id,prompt (trusted HTML),steps:[{prompt,answer:number|string,choices?:string[],hint,why}],answer:number|string,explanation}. Final independent answer is numeric (fraction input supported) unless choices explicitly supplied via task.choices. Task IDs globally stable. At least 5 distinct variants per lesson, last 3 reserved for independent checks. All generated parameters constrained to valid math. Optional meta supports independent oracle tests.
Models register globalThis.ProfileModels[id] = function(container) { ...; return cleanupFunction; }. Each provides meaningful student action, labeled controls and feedback; pointer actions also have buttons or numeric/select keyboard controls. Use class lab-svg with viewBox and max width 100%; model own IDs prefixed. No autoplay; no revealed practice answers. Model text says laboratory values are separate from practice.
The shared engine renders trusted lesson content, owns validation/storage/route/help tracking and all practice buttons. Geometry files: geometry-data.js / geometry-models.js. Algebra/trig files: algebra-data.js / algebra-models.js. Root owns app.js/checks.js/state.js/index.html/style.css and integration.
