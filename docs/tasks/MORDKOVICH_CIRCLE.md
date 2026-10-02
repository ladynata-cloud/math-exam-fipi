# Мордкович: от числовой окружности к тригонометрии

Owner: Наталья Михайловна. Date: 2026-10-03 (Новосибирск).
Base: `cd5d5a97f25109b70743f3ea85513ab8950dba36`, branch `course/mordkovich-unit-circle`.
Review: HIGH (learning state). Existing static/SVG trainer patterns and board iframe are reused; no new platform protocol.

## Approved scope
Detailed ordered route from the 11 user-supplied screenshots: §4 №4.1–4.20, §5 №5.1–5.14, §6 №6.1–6.41. Two screenshots repeat earlier pages; deduplicate. Retain all visible subparts and distinguish textbook tasks from authored preparation. Edition/year is not established by these screenshots, do not invent it. Uploads themselves remain private and are not committed.

Interactive directed movement, turns/radians, arcs, projections, coordinate slices, trigonometric ratios, signs and inequalities; guided reasoning and separate independent attempts; keyboard and small-screen access. Expose through profile navigation and existing board. No unrelated textbook expansion, quadratic-in-sine exam block, hosting/account changes or cloud student journal.

## Permission and release
Owner requested these trainers as a continuation of the just-published cloud course, with standing permission to publish updated courses and waiver of separate external review/final acceptance. No external review is claimed. Preserve technical protections, base/head checks and normal math/browser self-checks. Global rules stay unchanged. One task, one branch, one PR. Rollback by ordinary revert; preserve namespaced local student data.

## Gates
Check exact source coverage, all answers and step consistency; representative source-independent calculations; all exercise paths in a real browser; mobile 360, tablet/desktop, keyboard, reduced motion, local corrupted-state protection and export, board iframe and existing course regression. Record final head/checks/Pages/live result in PR. Never claim entire textbook coverage.

## Data contract (implementation coordination)
Each data module exports an array of lessons via CommonJS and appends it to `globalThis.MordLessons`. Lesson: `{id,order,chapter,title,summary,intro,lab,tasks}`. `intro` is clear authored HTML, no LaTeX renderer needed. Task: `{id,book,part,title,prompt,steps,fields,explanation,lab,meta}`. book e.g. `4.5`; part Cyrillic `а`; IDs ASCII `m4-5-a`. Every task has 2+ meaningful steps, each `{prompt,fields,hint,why}`. Final `fields` are the independent answer. Do not put answer keys inside prompts.

Field: `{id,label,kind,expected,options?,tolerance?}`. Kinds: `number` (safe arithmetic pi/sqrt parser, expected finite number); `choice` (expected string, options `[{value,label}]`); `multi` (unordered expected string array, options as above); `order` (expected ordered string array, options as above); `point` (expected angle in radians modulo 2pi, learner places point on live circle, tolerance default 0.035rad). IDs unique within one question. Numeric answers accept fractions/root/pi notation. For families of all solutions use formula choice/multi with plausible distractors, explicit k∈Z and all branches, rather than asking only one root. For intervals use formula choices with correct open/closed ends; add construction steps by endpoints/point selection. Choices will be shuffled by UI. Do not expose real expected values in option values: use opaque stable a/b/c IDs.

Lab config: `{mode:'arc'|'angle'|'coordinates'|'slice'|'functions'|'compare', angle?:number,start?:number,end?:number,axis?:'x'|'y',threshold?:number,relation?:'>'|'<'|'>='|'<=',points?:[{label,angle}],goal?:string}`. Values in radians. Lab mounts via `MordLab.mount(container,config,{onChange,onHelp,practice})`, returns `{getAngle(),destroy()}`. Practice exact readings initially hidden; reveal marks attempt assisted. No automatic animation; all pointer actions have keyboard/numeric alternatives. Task lab overrides lesson lab if supplied.

New route `/ege-profil/circle/`. Source data files: `chapter4.js`, `chapter5.js`, `chapter6a.js` (6.1–6.19), `chapter6b.js` (6.20–6.41). Tests per file owned by content authors; integration and UI are separate.
