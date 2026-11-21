# Город маленьких дел — игровое путешествие по карте Арженикова

## Identity

- Task: ARZHENIKOV_CHILD_ADVENTURE_20261122
- Owner: MathExam owner
- Date: 2026-11-22 (Asia/Novosibirsk)
- Base branch: main
- Base SHA: 8ede1297e8457b14e37da44ef392c0e556a5b58d
- Planned branch: feat/arzhenikov-child-adventure-20261122
- Review level: HIGH
- Related issue or ADR: existing static trainer; no architectural change or ADR acceptance implied.

## Goal

Turn the existing Arzhenikov route into a coherent, attractive children's game that the owner can link in the Habr discussion: an immediate concrete action, eight everyday places, useful feedback, collectible postcards and a clear next place. The owner's subsequent instructions add visual models for exact division, remainder, floor/ceiling interpretations and contemporary game graphics. Keep the established public address and all existing learning activities.

## Context and evidence

- The owner's direct request is to make the trainer/course/skill map visual, playful and engaging and supply a ready children's game link. The follow-up asks whether Work or API bonuses would help; it does not require a paid API integration.
- Main already includes PR #728 (512 garden conditions) and #730 (48 everyday stories). These are the existing product, not new content claimed by this task.
- At task reconciliation, a public GET returned HTTP 200 and the main HTML SHA-256 was 5bc2658dfa068553ac92ff474dd35c3036612999334c758acff535ffab41b29b, equal to the initial base. An earlier inspection had seen the older deployment; production has since caught up.
- The current route already switches city, garden and legacy skill modes. It does not stack all three activities.
- Primary historical source: https://djvu.online/file/1DTOtoJ55rIWv, part I (1923), including the two meanings of division in problems 233 and 257. https://letopis.msu.ru/peoples/8648 documents the author and six historical number stages.
- Stories, city, postcards and three-stories-before-notation are the modern MathExam adaptation. No complete historical arithmetic course or measured learning effect is claimed.
- During implementation the owner explicitly requested division with a remainder and rounding in both directions, then twice requested graphics resembling modern games. The port and graphics refinement are part of this same requested game, not an unrelated roadmap task.

## Approved scope

### In scope

- Compact child-facing entrance on the existing canonical URL; contemporary responsive game design, original generated 3D location/object atlases, companion and different place treatments. Object quantities remain exact DOM nodes; failed image loads retain the readable original symbols.
- Six visible steps per trio: three concrete stories then their three mathematical records; reversible actions and current keyboard interactions retained.
- Contextual story payoff and place postcard; direct continuation to another unfinished place or unseen trio without erasing unfinished work.
- Separate counts for unique solved stories (48) and place postcards (8); album derived from the established save, not another persistence system.
- Clear optional routes to the existing garden and eight-step division activity; adult/source explanation and direct hash compatibility.
- Integrated Port chapter: 12 original small-number missions covering exact division, quotient/remainder, full sets and minimum containers for everything; reversible capacity models, independent completion counter/save key, two-way sandbox sliders and numeric inputs. Test zero remainder and zero full groups. Floor/ceiling are choices dictated by the question, not ordinary rounding to the nearest integer.
- Focused game-loop, persistence, small-screen and reduced-motion regression checks, existing full relevant banks/browser gates, independent technical/learning review, publication verification.

### Out of scope

- Further task banks beyond the explicitly requested 12 port missions, a full first-year arithmetic curriculum, cloud progress/account changes, AI dialogue, paid API calls, leaderboards, timers or life penalties.
- Replacing or altering canonical math answers, garden independence criteria, existing save keys, unrelated courses or navigator catalog.
- Posting the Habr reply; only the owner requested a ready link to use in their own comment.

### Files or areas that must not change

- Existing life/garden banks, original map runtime, garden runtime, server/auth contracts and unrelated trainer content.

## Acceptance criteria

- [ ] A first actionable object control is fully visible in the initial 320×850 and 375×850 viewport; no horizontal overflow at 320/375/1280.
- [ ] All 48 stories and notation remain solvable; existing 512 garden conditions and legacy skill gates pass.
- [ ] A postcard follows three stories and their records; a next-place link reaches another task, keeps unfinished work, and starts unseen stories after all eight postcards.
- [ ] Replays never inflate distinct-story counts; 8 postcards and 48 stories remain separate, including save/reload and old-format migration.
- [ ] Album opens without changing the task hash or run; direct city/garden/legacy links keep working.
- [ ] No keyboard-only regression; reduced motion respected; decorative art does not carry mathematical quantities.
- [ ] All 12 port missions distinguish the four questions correctly. 14/4 gives 3 full sets, remainder 2 and 4 containers for everything; 12/4 never requires a fourth empty container; sandbox 2/6 gives 0 full sets, remainder 2 and 1 container.
- [ ] Sandbox sliders and direct number inputs synchronize, preserve invalid drafts with explanation, and never award completed missions. Port saves do not overwrite city/garden progress.
- [ ] Ready diff receives independent technical/learning review and desktop/mobile visual inspection.
- [ ] Release identifies exact validated base/head, checks current remote main immediately before merge, and verifies real published bytes.

## Checks and gates

- Required tests: tools/arzhenikov-map.browser.cjs; tools/arzhenikov-garden.test.cjs; tools/arzhenikov-garden.browser.cjs; tools/arzhenikov-life.browser.cjs; tools/arzhenikov-adventure.browser.cjs; tools/arzhenikov-harbor.test.cjs; tools/arzhenikov-harbor.browser.cjs.
- Required static checks: changed JavaScript syntax, local image dimensions/alpha and actual browser image load, git diff --check; existing public SEO workflow and any applicable required PR workflows.
- Manual checks: inspect fresh first-screen, placed objects, completion and album screenshots at phone/desktop widths.
- Final gate marker: ARZHENIKOV_CHILD_ADVENTURE_OK (issued only after applicable verification).
- Intentionally not run: paid external provider audit and real-child pilot. Automated interaction and internal review do not establish engagement or long-term learning effects.

## Review plan

- HIGH because progression, existing saved work and multi-mode routing must remain compatible.
- Before implementation: independent read-only product audit and primary-source learning review; recommendations incorporated: concrete action before notation, keep both division meanings, honest unique-story counters, no forced jump to harder number ranges.
- Ready result: independent technical and learning-design review on the actual diff; arithmetic bank checks and real Chromium interaction checks; screenshots reviewed separately.
- External provider consultation is not required under the standing owner policy and is not claimed. No bonus/credit expenditure is needed for a static deterministic game.
- Review handoffs exclude credentials, private documents and personal data. Any external verdict would need provider, PR/base/head, timestamp and source; none is fabricated from this specification.

## Risk and rollback

- Risks: route collisions; destroying unfinished work when choosing the next location; duplicated rewards; decorative design pushing controls off the phone screen; confusing completion with mastery; misleading object counts in generated art. The original paired-peach atlas cell is excluded and replaced with a separately inspected single peach.
- Rollback: ordinary revert of this one task's squash commit and established deployment. Existing storage keys and formats remain readable; no migration or destructive reset is required.
- Compatibility: additive progress API; album derives from original state; all established hash families and 48/512 banks retained. Port uses its own versioned key and validates saved arrays and undo history.

## Permissions

- Task start: the owner's direct current request to make and publish a ready game, following existing project publication authorization.
- Branch/local commits/push/Draft PR: within the requested task.
- Release authorization: [standing owner decision](../OWNER_RELEASE_AUTHORIZATION.md); owner also explicitly reiterated independent publication of agreed MathExam materials in the recent task context. No task-specific publication hold was given for this game.
- Merge/deployment: controlled release only after relevant checks and authoritative base/head verification. No force, reset, rebase, protection bypass or weakened gates.

## Execution record

- Actual branch: feat/arzhenikov-child-adventure-20261122
- Actual base: 8ede1297e8457b14e37da44ef392c0e556a5b58d
- PR: https://github.com/ladynata-cloud/math-exam-fipi/pull/731. First published candidate: 3825700610047c5405d17c6ef34ecd7a1e6b4a5e, parent 2de1212d2d4b185a61b5d26709071053d676ab3f, tree ab5b71e33a2242ae2a4ae98f4644775810f56690. Final release evidence is recorded in the PR after validation.
- External audit and real-child pilot: not performed.
- Scope deviations: none; the port and second graphics pass follow explicit additional owner instructions in this same task.
- Local validation: all 512 garden conditions and three independent port arithmetic tests PASS; all changed JavaScript/test syntax and workflow YAML parse PASS. Focused real Chromium interaction checks and the city adventure regression passed during implementation. Full life/port browser attempts were interrupted by local renderer crashes/timeouts at different points; the complete assertions remain enabled for CI and are not reported as passed locally.
- Independent internal runtime/mathematics review of local source commit 6c7faf33026b96f9d7fa78c98e1b681b19ed1cd3: PASS, with full CI still required. Findings about unfinished notation, same-location album return, packing feedback and a paired-fruit illustration were corrected.
- Concurrent main 2de1212d2d4b185a61b5d26709071053d676ab3f comes from PR #726 (Vilenkin 5 floor/volume work), nine non-overlapping files. A clean read-only virtual composition preserved the task's 20-file set and affected blob identities. Current remote main/head must still be rechecked immediately before release.
- Full game CI passed on the first published candidate: https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/44940937251. This includes the original eight-skill route, all 512 garden conditions, garden/life browser gates, all 48 stories, city progression and all 12 port missions at 320/375/1280 px. Artifact 14721392872 contains 23 actual browser screenshots.
- The first public-navigator run correctly rejected the old HTML receipt. The follow-up changes only this page's three binding fields and appends its source provenance in assets/assistant/page-rollout.json (the 21st task file). It binds the unchanged reviewed HTML to commit 3825700610047c5405d17c6ef34ecd7a1e6b4a5e; no navigator assertion, runtime or other page receipt changes. Five binding negative/control tests and the exact page restoration check pass locally. A new complete CI run remains required for the follow-up head.

## Required handoff

Use the repository EXECUTIVE STATUS fields and release base-drift fields. Keep local tests, CI, visual inspection, public verification and unperformed checks distinct.
