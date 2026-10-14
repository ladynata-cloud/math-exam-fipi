# Amvera public endpoint recovery

## Identity

- Task: reconnect the existing public site to the restored Amvera applications.
- Owner: repository owner.
- Date: 2026-10-15 (Asia/Novosibirsk).
- Base branch: `main`.
- Base SHA: `7397baf0ebe2b36c8263229117ae5fe44ddf2d45`.
- Planned branch: `fix/amvera-endpoints-20261015`.
- Review level: `MEDIUM`.
- Related ADR: no architecture change; existing endpoint contracts remain.

## Goal and evidence

After the hosting outage the cabinet is operating at
`https://mathexam-board-ladynata.msk1.amvera.tech`, while public entry links,
board clients, legacy progress clients and video-export controls still use the
old `.amvera.io` applications. The existing managed-trainer bridge already
allows the exact restored cabinet origin. Video application recovery targets
`https://mathexam-video-ladynata.msk1.amvera.tech`.

## Approved scope

- Replace obsolete frontend cabinet, board, legacy progress and video API
  destinations with the exact restored HTTPS application origins.
- Reconnect saved ordinary-board and group-board server addresses only when
  they identify the exact old trusted board origin. Preserve custom servers,
  local development, lesson identifiers, tokens and pending work.
- Update existing endpoint expectations and add targeted recovery regressions.
- Record operational status without claiming publication or production tests.

Out of scope: server code/configuration, databases, credentials, authentication
or origin-allowlist changes, new lessons/media, historical documentation and
download archives. Transient ordinary-board rooms are not recreated by URL
migration. No new render jobs are submitted.

## Acceptance criteria and checks

- Public runtime destinations use the restored origins.
- Saved board endpoints migrate narrowly; unrelated addresses and private
  session contents remain intact.
- Existing strict group URL checks and managed-trainer origin checks pass.
- Targeted endpoint, navigation, route, legacy progress and video-authoring
  checks pass; changed scripts parse and `git diff --check` passes.
- One Draft PR records exact base/head, checks, risks and limits.

Final gate marker: `AMVERA_ENDPOINT_RECOVERY_OK`.
Real browser, production sign-in, shared-room collaboration, authenticated
export/download and hosting checks belong to separately recorded deployment
verification; they are not run by this implementation task.

## Review and rollback

Bounded frontend endpoint migration is MEDIUM because several established
clients change their destination without changing protocols, permissions or
storage formats. Focused independent review and targeted regression checks are
required. External provider review is not required by this level.

Risk: restored services must expose the existing contracts and restored data;
changing URLs alone cannot recover missing history. A saved legacy room can
remain unavailable after the server restart. Custom servers are retained.
Rollback: revert this PR; no database migration is involved. Existing saved
group sessions may contain the restored origin after successful opening, which
remains usable if this frontend patch is reverted.

## Permissions

The current owner request to restore the project authorizes this recovery work,
branch, local commit, push and Draft PR. This document records that scope; it is
not an approval marker or external-review evidence. Merge, auto-merge and
deployment are not performed by this task and require separate authorization.

## Execution record

Exact head, PR, review findings and test results are recorded in the Draft PR.

Local validation:
- Endpoint recovery regressions: 6/6 passed; movement/strict-origin tests: 6/6.
- Catalog references, Grade 7 route map, algebra/Yashchenko progress gates,
  video factory authoring and EGE navigator DOM (269 checks): passed.
- Sitemap tests (6), 513-URL sitemap consistency, SEO entrances and changed
  script parsing (25 scripts): passed; `git diff --check`: passed.
- Existing DVI progress gate fails on its missing learning-generator anchor;
  existing OGE focus-navigation gate fails on its primary foundations link.
  Both failures reproduced on unchanged files from the exact base. Neither
  obsolete test expectation is weakened or repaired in this endpoint task.
- Focused independent internal review: approved with no blocking findings.
  Ordinary-board migration deliberately covers the exact app-generated old
  URL; manually entered uppercase-host or explicit-port variants are retained.
- Browser suites, live mutations and deployment: not run by this task.

Targeted recovery gate: `AMVERA_ENDPOINT_RECOVERY_OK`; the two pre-existing
unrelated gate failures above remain explicitly open.
