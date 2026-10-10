# Owner-provided search verification

## Identity and instruction

- Task: `SEO_SEARCH_VERIFICATION_20261011`
- Date: 2026-10-11 (Asia/Novosibirsk)
- Base: `main` at `a51f188b74ccd781622e3e94b3a419f895ca9c73`
- Branch: `feat/seo-search-verification-20261011`
- Review: `SMALL`, focused independent internal review.
- Related work: SEO discovery PR #238; no architecture change.

The site owner explicitly agreed to verify mathexam.space in Yandex Webmaster
and Google Search Console, then supplied a screenshot of the Yandex ownership
page for `https://mathexam.space`. Publish the exact supplied public verification
tag in the homepage head. Checked commits, PR, merge and publication remain
covered by the standing owner instruction.

## Scope

- Add the supplied Yandex meta tag to `index.html` without changing its visible
  content, executable scripts, styles, canonical address or indexing directives.
- Record this small follow-up and the completed integration of SEO PR #238.
- Keep the optional SEO preservation check usable with a post-SEO base: when
  that base already has the homepage topic-links block, compare the full body
  unchanged instead of stripping the original addition only from the new copy.
- A Google verification tag has not yet been supplied; none is invented.
- No DNS, credentials, analytics, account delegation, student data or service
  terms are changed. The owner completes the verification action in the service.

## Acceptance and release

- Exactly one Yandex verification meta tag appears inside the homepage head,
  with the exact value transcribed from the owner's supplied screenshot.
- Removing the inserted tag restores the base homepage byte for byte.
- Existing SEO metadata, public sitemap and source-preservation checks pass.
- Relevant GitHub workflows pass for the reviewed head. Confirm current remote
  main immediately before integration; preserve concurrent work.
- Verify merge tree and parent, successful Pages deployment, and the live
  homepage containing the supplied tag before asking the owner to confirm.
- Service-side ownership and sitemap submission are separate from publishing
  the tag and are not claimed without visible confirmation.

The PR records exact commit, CI and live-release evidence. Rollback is an
ordinary revert; removing the tag may invalidate the service's later ownership
checks, so do not remove a verified tag during routine homepage updates.
