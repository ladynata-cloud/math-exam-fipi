# Visible homepage navigator

Date: 2026-11-05. Review: MEDIUM (bounded static UI integration).
Base: main `4d5c746c92b8ea1c33f5bd96b75b89779398d3bd`.
Branch: `fix/navigator-visible-20261105`.

## Approved scope and evidence

Owner reports that the navigator is absent from mathexam.space and requests its
immediate appearance in the lower-right corner. The live page and main both
have no public navigator inclusion. The owner's final 5 November source package
contains a complete browser-local navigator with 187 catalogue records, but its
README explicitly records that it is not installed on the public site.

Install that final version on the homepage and six main public entrances listed
in `assets/assistant/pages.json`. The green launcher says «Навигатор» and is
visible on initial load without scrolling; its panel opens on request. Preserve
the supplied dialogue logic, route catalogue, Shadow DOM isolation, keyboard
handling, privacy guards and in-memory-only history. Version the stylesheet.
Existing trainer/course helpers, private cabinets, server/provider APIs,
mathematical content, storage, and the older broad PR385 remain outside scope.

This is a bounded static integration, not a new inference or account boundary.
The current user request authorizes implementation; publication follows
[OWNER_RELEASE_AUTHORIZATION](../OWNER_RELEASE_AUTHORIZATION.md). Branch,
commits, push, Draft PR, controlled merge and deployment after checks are allowed.
No further owner approval or external provider audit is required.

## Acceptance and review

- Visible fixed lower-right launcher on the homepage and six entry pages.
- One widget per page; no horizontal overlay overflow at 320, 844 and 1280px.
- Opening, sending with button/Enter, correct division route, privacy redaction,
  Escape, close, clear and reload on real integrated pages.
- All 187 catalogue destinations remain valid, including the existing external
  cabinet link; no account login or real pupil data is exercised.
- All seven existing package regression suites passed before integration;
  preserve the 43-case consolidation suite in the repository.
- Required: syntax, navigation regression, relevant SEO/sitemap, browser CI,
  diff review and live homepage check after deployment.
- Gate: `PUBLIC_NAVIGATOR_VISIBLE_OK`.

Focused technical review checks safe link rendering, textContent use, no
external inference, bounded transient history, scoped keyboard handling and
unchanged host-page bytes outside the exact inclusion. No mathematical content
changes. External review and physical-device testing are not performed.

## Risk and rollback

The launcher may cover a small bottom-right part of a page; responsive sizing
and actual page checks are required. Rollback is a normal revert of this release
commit. It removes the includes/assets and does not migrate or delete data.
Before merge, requery main/head; if changed, inspect the virtual merge and rerun
affected gates. Record final SHA, CI, deployment and live evidence in the PR.
