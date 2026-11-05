# Clear entrances from search pages to existing practice

## Identity and permission

- Date: 2026-11-03; owner: MathExam.
- Base: main, `d74b8d599a5031a0620679a76dd08151fa171661`.
- Branch: `fix/seo-practice-entrypoints-20261103`.
- Review: SMALL; static copy and navigation, no runtime or architecture change.
- The owner approved the Google/Yandex SEO plan and explicitly authorized cloud
  implementation/publication after checks without external Claude review.
  [Standing release policy](../OWNER_RELEASE_AUTHORIZATION.md) applies.
- Related work: MAT-21; PR #418 independently restores geometry catalogue links.

## Goal and evidence

Help readers of the existing planimetry article reach appropriate grade-seven
practice, and help OGE-course visitors find the newly published PDF catalogue.

Live inspection confirmed that the OGE course had no direct HTML entrance to
`/oge/variants/2027/`, although that catalogue is published and in sitemap.
The planimetry article already explains the 7–9 grade range. The connected
search report provides a reason to make that existing answer easier to find;
its small sample does not establish a ranking problem or justify rewriting the
author's research. No private search-account metrics are committed here.

## Approved scope

- Add one ordinary link to the 104-variant catalogue in the OGE quick links.
- Align the three existing description metadata fields with the material now
  available from that course; preserve its title and canonical.
- Add a short heading above the article's existing definition/grade paragraph
  and one link to the already published first-steps course.
- Keep all original article prose, course content, exercises, existing links,
  JavaScript, styling, URLs, sitemap and learner storage unchanged.
- No new page, trainer, FAQ structured data, keyword repetition or ranking claim.

## Acceptance and gates

- Existing links and text remain; the intended heading, two links and OGE
  description metadata are the complete product delta.
- Both links work with JavaScript disabled and enabled, at mobile/desktop sizes;
  link bounds and destination heading/canonical are checked in a cloud browser.
- Extend the existing public-navigation browser check by 12 actual clicks;
  retain all previous scenarios. The isolated cloud workspace cannot launch
  Chromium (`socket() failed: Operation not permitted`), so GitHub Actions
  supplies the required browser execution rather than treating it as passed.
- Run existing sitemap, public SEO and catalog-parity checks, plus diff checks.
- Require applicable GitHub Actions, fresh main/head verification and a clean
  in-scope composition before controlled squash-merge.
- Verify the published bytes, both links and target HTTP/canonical after Pages.
- Final gate: `SEO_PRACTICE_ENTRYPOINTS_OK` after those checks are evidenced in PR.

## Review, risk and rollback

Technical self-review checks exact replacements and retention of existing
content/navigation. No mathematical or learner-flow change needs trainer design
consultation. External provider review is not performed under the owner's waiver.
The limited risk is link placement/wrapping; use the existing layout rules and
verify narrow screens. Rollback is an ordinary revert; no migration or data
cleanup is required. No secrets, account credentials or local paths are added.

## Execution record

Exact head, tested composition, CI and deployment evidence are maintained in
this task's PR. Publication is authorized after checks; no separate owner
confirmation is pending. Preserve the independent PR #418 and do not mix its
product changes into this task.
