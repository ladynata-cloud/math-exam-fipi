# Yandex verification files for the owner's two accounts

## Identity

- Task: publish the two owner-supplied Yandex verification HTML files.
- Date: 2026-10-19 (Asia/Novosibirsk).
- Base branch: main.
- Base SHA: cb6588932c65a632e0797a5cb1165ddbe1fdf8ee.
- Branch: fix/yandex-two-accounts-20261019.
- Review level: SMALL, additive static provider-verification metadata.
- ADR: not applicable.

## Goal and evidence

The owner wants to inspect search performance in Yandex Webmaster. Her two
account screenshots show ownership verification pending, with public file
verification codes 2b30631ace7b54fc and eeec12c427a8fc19. Both requested URLs
returned HTTP 404 before this task. The homepage already has a different
Yandex verification meta tag; that existing tag must remain intact.

Historical project status describes a previous verification in October 2026.
That record does not establish access for either account shown in the current
screenshots. No current Webmaster statistics have been read.

## Approved scope

- Add yandex_2b30631ace7b54fc.html and yandex_eeec12c427a8fc19.html at site root,
  using exactly the minimal HTML and corresponding codes shown by Yandex.
- Record this scope and validation in this document and the single task PR.
- Preserve existing pages, verification tags, sitemap, robots and all learner
  and hosting behavior. Do not change DNS or account settings.
- Yandex service-side confirmation remains an action for the owner in her
  authenticated browser; publication alone is not successful confirmation.

## Acceptance criteria and gates

- Both file names and body codes match the owner-provided screenshots.
- Both files contain only the supplied HTML verification document.
- The committed diff contains only the two new HTML files and this scope.
- git diff --check passes.
- The repository's applicable Public SEO and sitemap CI passes on the PR head.
- After publication, both public HTTPS URLs return 200 and exact file bytes.
- Final gate: YANDEX_TWO_ACCOUNTS_FILES_PASS.
- Student/runtime tests are not applicable: no student/runtime code changes.

## Review, risks and rollback

- Self-review the complete small diff and the account-code mapping.
- External review is optional for this static metadata change; none is claimed.
- The files allow the two accounts identified by the owner to prove ownership.
  These public verification codes are intended for publication, not passwords
  or session credentials. No other account information is committed.
- Rollback: remove only these two newly added HTML files through a scoped PR.
  Preserve the existing verification meta tag and other site contents.

## Permission and execution

The owner explicitly replied "разрешаю" on 2026-10-19 to the concrete request
to add and immediately publish both named files for her two accounts. This is
the task's authorization for implementation, commit, push, PR, merge and Pages
publication, including completing the small change without another approval
round. Global repository policy is unchanged. The conversation is the actual
authorization source; this document is only its execution record.

The PR records the final head, gates, merge result and production checks.
