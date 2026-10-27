# MathExam task — public navigation chat

## Identity

- Task: `MATHEXAM_PUBLIC_ASSISTANT_V1`
- Owner: repository owner
- Date: 2026-10-27 (Asia/Novosibirsk)
- Base branch: `feat/math-assistant-cabinets-20261027`
- Base SHA: `1fcc4fa36267f5667c42409861ef0b92f97b333c`
- Branch: `feat/public-assistant-20261027`
- Review level: `HIGH` — broad public-page wiring, free-text UI and safe navigation.
- Related accepted ADR: [0011](../adr/0011-independent-assistant.md).
- Dependencies: Draft #360, #359 and #358; none is a production release.

## Goal

Give visitors a compact chat-style helper on the main site and public trainer
pages. It finds checked materials and navigation routes, gives a modest next
step when someone is stuck, and occasionally offers the existing tutor contact
route. Preserve trainer interaction, learner privacy and zero model spending.

## Context and evidence

The owner's direct request to add the helper to the main site and trainers, with
occasional tutor advice during difficulty, is the current task's START. It
authorizes this separate preparation branch and Draft PR, not publication.

The preceding cabinet helper is private and must not become an anonymous public
model endpoint. No provider credential is configured. The owner now considers
OpenAI, GigaChat and Qwen as teaching models; their adapters, account eligibility,
data conditions and new evaluation/spending limits remain separate work.

The repository has no universal public JavaScript bootstrap. Public coverage
must be measured against actual pages and catalogues, not inferred from the
board registry or from every tracked HTML file. The sitemap is a useful baseline
but deliberately omits some usable noindex course apps. Private cabinets, board
shells, source/fixtures, archives and offline exports are different surfaces.

The existing public tutor destination is `/lessons/#contact`. The helper must
link there after visitor intent, never send a messenger/email or invent lesson
availability, fees or promised results.

## Approved scope

### In scope

- A shared static chat panel, closed by default, named MaxExam 0.0 and explicitly
  described as a navigator using prepared site materials.
- Checked public topic/course links, context from the page pathname only,
  navigation questions and modest difficulty support; no invented exercise answer.
- Optional tutor referral after repeated explicit difficulty, at most once per
  current page conversation, or immediately on an explicit tutor request.
- Mechanical script/style inclusion across a reviewed, reproducible public-page
  manifest, including the home page and supported standalone trainer families.
- Mobile/desktop accessibility, inert text rendering, bounded messages/history,
  explicit conversation clearing and suppression in embedded/private surfaces.
- Local-only message handling: no model call, chat persistence, account lookup,
  analytic event or transmission of entered text. Use available analytics masking
  hooks without claiming control over arbitrary third-party page scripts.
- Deterministic navigation/coverage tests, representative real-browser journeys,
  compatibility checks and exact-head CI evidence.

### Out of scope

- A publicly accessible paid inference endpoint, provider keys, API accounts,
  new infrastructure, model comparison calls or automatic model-weight training.
- Scraping task state, drawings, grades, credentials, query strings, browser
  storage or personal cabinet records to infer a visitor profile.
- Automatic navigation, opening a contact service or sending messages without
  the visitor choosing the link.
- Trainer content, scoring, random generators, saved progress, board protocols,
  private cabinet UI, offline downloadable packages or pricing changes.
- Merge, auto-merge and deployment.

### Areas retained

Existing page bytes must match the base after removal of the exact new inclusion
block. Canonicals, metadata, sitemap entries, mathematical code and internal
links are retained. New helper assets are isolated from trainer styles and keys.

## Acceptance criteria

- [x] The home page and reviewed standalone public trainer pages include exactly
      one helper block; private, board/source/archive/export/redirect pages do not.
- [x] The coverage manifest explicitly accounts for sitemap and public catalogue
      entries, including JavaScript-only public lesson/game shells.
- [x] The closed widget leaves trainer controls usable; desktop and 390px layouts
      have reachable controls and no introduced horizontal overflow.
- [x] Topic/course queries return existing intended destinations; ambiguous
      questions get choices instead of confident invented routes.
- [x] Account/access questions never ask visitors to paste a login secret or
      expose another pupil's profile; progress claims match each course boundary.
- [x] Repeated difficulty can offer tutor help once while retaining a free
      material option; login failure does not trigger a tutoring sales prompt.
- [x] Entered markup, URLs and credentials cannot execute, become arbitrary links,
      leak through requests or persist in browser storage.
- [x] Dialog keyboard/focus, close/clear and iframe suppression work without
      swallowing unrelated trainer keyboard actions.
- [x] Navigation, inclusion, SEO and representative trainer/browser gates pass.
- [x] The final report distinguishes prepared code from real publication and
      retains provider/review/access blockers accurately.

## Checks and gates

- New pure navigation tests, link/anchor verification and difficulty state tests.
- Reproducible coverage/inclusion checks and exact base-byte preservation.
- Real browser home/textbook/trainer navigation, narrow mobile, privacy/rendering,
  keyboard, clearing, referral frequency and embedded/private suppression.
- Existing SEO/sitemap/catalogue tests and affected trainer gates in CI.
- Syntax, `git diff --check`, scope and sanitized handoff review.
- Gate: `MATHEXAM_PUBLIC_ASSISTANT_PREPARED_OK`.
- Intentionally not run: provider inference/billing, real visitor data collection
  and deployment. None is authorized by this task.

## Review plan

- HIGH because one shared component is wired broadly into public pages.
- Trainer design consultation is not applicable: this adds a navigation panel
  without creating a trainer, changing its learning sequence or grading it.
- Independent navigation/privacy/compatibility review before handoff.
- External exact-head review remains required by [policy](../REVIEW_POLICY.md)
  unless the owner gives an explicit reasoned exception. No prior permission is
  an external verdict or waiver.
- External handoff uses only minimal public code and synthetic cases, with
  provider, PR, base/head, verdict and a verifiable source/time if completed.

## Risk and rollback

Main risks are covering a private or archived page, wrong navigation, intrusive
referrals, CSS/keyboard conflicts, accidental visitor-data capture and confusing
prepared replies with a live model. Keep an exact inclusion marker and a checked
page manifest. Removing that block disables the widget without changing trainer
state. No data migration or external model configuration belongs to rollback.

## Permissions

- Current START, branch, local commits, push and Draft PR: yes.
- Existing public source/page inspection and local synthetic browser tests: yes.
- Provider credentials/calls, external messages and new paid infrastructure: no.
- Merge/auto-merge/deployment: no, pending a separate exact-head release decision.

## Execution record

- Actual branch and base: as above.
- Head, PR, final coverage counts and validation: final task report / Draft PR.
- Production reconciliation: remote main remains
  `92d733a49692744ce043503c57f29b77bfb09a24`; prior read-only public index,
  sitemap and robots checks matched that source. Cabinet preparation is unmerged.

## Required handoff

```text
EXECUTIVE STATUS

Task:
PR:
Base:
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision:
```
