# Complete multiplication practice and contextual division help

## Identity and authorization

- Owner: repository owner, direct implementation request in the current conversation.
- Date: 2026-10-19 (Asia/Novosibirsk)
- Base: main at `5c61b0bc12ad9aaebfdb8484cc9987bccb59474a` (published PR261).
- Branch: `feat/multiplication-complete-route`.
- Review: MEDIUM. Extend the existing numeric action generator and navigation;
  keep canonical old tasks, persistence, bridge and access rules unchanged.
- Development, local commits, branch publication and Draft PR are authorized.
  Merge and deployment require the separate publication decision in AGENTS.md.

## Goal and evidence

Use «в уме» in column multiplication, provide many different operand lengths
and zeros, bring the existing multiplication materials into the same route,
and offer relevant multiplication practice while learning long division.
The owner screenshot shows the confusing phrase «которые перенесли».
PR261 already provides two independent progress tracks and repeatable column
practice. Existing resources include managed cabinet lessons and standalone
practice; empty placeholder pages are not working trainers.

## Scope and acceptance

- Display «в уме» for new and saved column work without changing the old
  canonical tasks or their answer/state identity.
- Add seven distinct column practice IDs: three-by-one, four-by-one,
  three-by-two, two-by-three, three-by-three, zeros and mixed. Reuse the existing
  input/check/mirror contract and repeat-example action.
- Support up to four digits times three digits, including three shifted rows,
  zero rows and addition with a number kept in mind.
- Keep all accepted digits visible. Future cells stay blank; wrong input does
  not advance. Reload and observer state restore precisely.
- Put existing substantive multiplication resources in grouped sections inside
  the multiplication rail. Preserve clear primary progression and independent
  progress; standalone resources do not claim cabinet progress. Deduplicate
  aliases and omit empty placeholders.
- Offer multiplication practice only at relevant division steps. Managed
  navigation belongs to the host cabinet, preserves the current attempt and
  offers return to it. Do not relax iframe sandbox or change bridge messages.
- Preserve accounts, learner records, other curricula, deployment configuration,
  existing canonical generation and database/schema contracts.

## Checks and review

- Arithmetic oracle, diversity and old-canonical snapshots; state restoration
  and DOM interaction across all nine column types.
- Both route renderers, real resource paths, managed/public distinction,
  progress/history and contextual division navigation including return.
- Catalog and backend registry, existing division/continuation regressions,
  relevant mathematical and learning gates, SEO and whitespace checks.
- Focused independent review, then exact-head CI before publication.
- Final gate: `MULTIPLICATION_COMPLETE_ROUTE_OK`.
- External review is not mandatory for this bounded MEDIUM change. Do not
  claim remote review without provider, exact PR/base/head and verified source.

## Risks and rollback

The main risks are shifted multiplication rows, misleading progress, and losing
the division context during a help detour. Independent oracles, restored-state
tests and host navigation checks cover them. There is no data migration or
automatic learner mutation. Reverting restores the previous presentation;
retain the added lesson decoder if real attempts have been created after release.

## Execution record

- Nine column types are implemented. The primary route has16 multiplication
  and15 division steps. Five supplementary groups retain every verified
  resource:77 additional entries and10 alternative explanations, excluding
  nine existing main-route entries from duplication and five empty placeholders.
- Local arithmetic gate:2,730 conditions,64,445 actions,2,730 restorations,
  including428 zero rows and88 additions with2 in mind. The200 pinned old
  task/state samples remain byte-identical.
- Independent focused review additionally compared4,136 legacy operand plans
  and2,000 old seeded sources against the base without a difference.
- Local column DOM30/30, cabinet route DOM15/15, public route, catalog350,
  backend288/288, existing division and continuation, sitemap and SEO checks
  passed. Contextual-help tests cover preserved drafts, return links and
  invalidated navigation contexts.
- Focused review found and corrected the public cabinet URL origin and a
  stale help-button handler after a failed session action. Browser layout and
  the full integrated gates run on the exact PR head in CI.
- No real learner/account data was changed. No merge or deployment performed.
- The Draft PR records the exact head, final checks and publication decision.
