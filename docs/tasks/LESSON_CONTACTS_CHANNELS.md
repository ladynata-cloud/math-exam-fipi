# MathExam: lesson enquiries and channel subscriptions

## Identity
- Date: 2026-10-25 (Asia/Novosibirsk)
- Task: LESSON_CONTACTS_CHANNELS
- Owner: repository owner
- Base branch: main
- Base SHA: 76f99426e32e7afa5917a26f540ea84274e5d9b0
- Branch: feat/lesson-contacts-channels
- Review level: SMALL (static HTML invitations and isolated CSS; no runtime boundary change)
- ADR: not applicable

## Goal and approved scope
Help visitors contact the tutor about private online lessons, or subscribe to new
materials. The owner requested distributed invitations and supplied both personal
Telegram/VK URLs plus the Telegram and MAX channel URLs in this conversation.
This is the task's start instruction; no separate release instruction is assumed.

- Add a public /lessons/ page describing lessons and the next contact step.
- Add normal HTML contact/subscription links to the home page, course catalog,
  OGE course entrance, foundations entrance and all six topic pages.
- Add a navigation entry and a prominent home-page lesson invitation.
- Distinguish personal contact from channel subscriptions; retain existing VK
  community and Dzen destinations.
- Include the new page in the reviewed sitemap seed list and generated sitemap.
- Match the site's simple, calm educational wording.
- No popups, forced subscriptions, tracking, data collection forms or new backend.
- No trainer logic, learning content, progress, cabinets or board changes.
- No unverified prices, availability or outcome promises.

## Acceptance and checks
- All 11 affected public pages expose the four owner-supplied URLs without JS.
- Desktop and mobile layouts have readable contact controls and no overflow.
- Existing course navigation and foundations tabs continue to work.
- The new page has a self canonical, consistent metadata and a sitemap entry.
- Required: seo-sitemap.test.py, build-sitemap.py --check, seo-check.py,
  git diff --check, real Chromium mobile/desktop/link/no-JS inspection.
- Gate: LESSON_CONTACTS_STATIC_OK, only after all checks pass.
- External Claude review not required for SMALL; no trainer consultation applies.
- Review: self-review of exact diff, contact destinations and script preservation.

## Risk and rollback
- Visual crowding on pages with different styles: scoped me-* CSS, mobile checks.
- VK URL is the owner's profile, not a guaranteed direct-message dialog; page text
  explains that the visitor still needs to send a message in the chosen service.
- MAX invite can be revoked by its owner; update all static copies if it changes.
- Rollback: revert the single task commit, restoring previous HTML and sitemap.
- Public contact details were explicitly supplied for publication by the owner.
  No credentials or private student information are included.

## Permissions
- Start, branch, implementation, commit, push and Draft PR: authorized by this
  task's conversation, including "пусть будут оба канала задействованы".
- Merge, auto-merge and deployment: pending separate explicit authorization.

## Execution record
- Repository main and live home-page structure inspected; pre-existing status
  contains historical/in-flight entries and is not treated as release evidence.
- Production release is not claimed. Final checks and commit are recorded in PR.
- Local UI verification uses intercepted external clicks; no messages are sent.

## Validation result
- PASS: 12 existing sitemap regression tests; exact generated sitemap (527 URLs);
  SEO entrances/canonical checks; new page metadata, anchor and local-link checks.
- PASS: Chromium at 360px and 1280px, 22 page/layout/destination checks; all four
  owner-supplied destinations present on every route; no overflow or duplicate IDs.
- PASS: all 11 routes expose contacts with JavaScript disabled; invitations hidden
  in print; real intercepted Telegram click; foundations tabs and OGE anchor.
- PASS: visual inspection of desktop/mobile lessons and home mobile screenshots;
  contact controls are readable, in normal flow and separate from subscriptions.
- PASS: all existing executable script elements and inline styles match base.
- Earlier environment failures: default Playwright browser absent and CDN returned
  invalid archives. A temporary npm Chromium binary completed the checks after
  removing an empty stale temporary executable. The test harness was corrected
  to await CSS loading and intercept new-tab requests at context level.
- No unresolved product failure. External login/message delivery, pupil pilot,
  production deployment and postdeployment verification were not run.
- Final gate: LESSON_CONTACTS_STATIC_OK.
