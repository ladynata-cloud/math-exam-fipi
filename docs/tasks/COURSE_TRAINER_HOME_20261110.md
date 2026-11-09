# Return home from courses and trainers

- Owner START: «обеспечь возврат на главную с каждой страницы курсов и тренажеров сайта».
- Date: 10 November 2026, Asia/Novosibirsk.
- Base: main / 049eeb943bc3df5e43dd4d643d76f3c3003d568e.
- Branch: fix/course-trainer-home-navigation. Review level: HIGH (shared navigation).
- Publication: authorized for this task by docs/OWNER_RELEASE_AUTHORIZATION.md.

## Scope and acceptance

Every active public course/trainer HTML page exposes an explicit «← На главную»
link to `/`, independently of browser history, referral/session query values,
and the navigator conversation panel. Redirects must resolve to covered pages.
Existing public navigator pages receive the shared home code in the same bundle;
uncovered pages receive the standalone script. Byte equality guards the two
copies and avoids adding a network dependency to the existing bundle.

The lessons header/footer logos also return home, with a visible header menu
entry. The common bar sits in document flow, avoiding overlays on answers.
Iframe and explicit embedded modes retain their parent navigation. Public
standalone board shells still expose home. Teacher/private panels, empty
placeholders, source reports, offline and frozen book editions are excluded
with explicit reasons in the coverage checker. No exercises, grading, saved
work, account protocol or board synchronization is changed.

## Checks and review

Required: source-wide coverage, home navigation DOM/browser checks (320/1280),
native link destination/click, repeated-load idempotence, iframe isolation,
unchanged storage, public navigator regression/preservation, exact HTML source
bindings, syntax/diff checks and applicable GitHub CI. Independent technical
review is required. External provider review is optional and not performed.
The published site is accepted only after merge identity, Pages and live
resource/link checks. Record environment failures separately from test passes.

## Risk and rollback

Potential risks are altered page layout and unwanted navigation within a shared
workspace. Isolated styles, an in-flow bar, explicit embed checks and browser
checks cover these boundaries. Roll back this scoped commit without deleting
or migrating saved results. Use the normal release workflow and fresh main/head
guard; do not force, reset, rebase or weaken existing tests.
