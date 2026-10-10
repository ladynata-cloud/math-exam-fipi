# Owner-provided Google Search Console verification

## Identity and instruction

- Task: `SEO_GOOGLE_VERIFICATION_20261011`
- Date: 2026-10-11 (Asia/Novosibirsk)
- Base: `main` at `89e61f80b56f9c3344ee96fbaff7946c90b251bd`
- Branch: `feat/seo-google-verification-20261011`
- Review: `SMALL`, focused independent internal review.
- Related work: SEO PR #238 and Yandex verification PR #239; no ADR or
  architecture change is involved.

The site owner is confirming `https://mathexam.space/` in Google Search Console
and supplied the complete service-generated HTML meta tag in the task chat.
Publish that exact public challenge so the owner can complete verification.
Checked commits, PR, merge and production publication remain covered by the
standing owner instruction already verified in this session.

## Context and evidence

- PR #239 is published as `388accb4dd067a621f90fd1066823412a28bfd88`.
  Pages run 38082856663 succeeded; the public homepage matched the release
  byte for byte and contained exactly one supplied Yandex tag inside `head`.
- The owner's subsequent Yandex screenshot shows role `Owner` and verification
  date 2026-10-11. A later screenshot shows the public `sitemap.xml` accepted
  into the processing queue. Processing and search indexing are not yet proved.
- Google is a URL-prefix property for `https://mathexam.space/`; its HTML-tag
  verification step is still pending publication and the owner's confirmation.

## Concurrent main update

The original Google head was reviewed and passed both CI workflows on base
`388accb4dd067a621f90fd1066823412a28bfd88`. Main then advanced through the
owner-requested Soviet-course PR #240, merged as
`89e61f80b56f9c3344ee96fbaff7946c90b251bd`. Its only overlap with this task
was the operational status document. A read-only virtual merge identified
that conflict; the composed status preserves both task histories.

All 86 non-overlapping files from PR #240 retain their new-main blobs. The
new-main-to-Google delta is still exactly the homepage meta tag, this task
specification, and the operational status document. Ordinary branch updating
and conflict resolution are covered by the owner's standing instruction;
no force, reset, rebase or gate weakening is used. Review and relevant CI are
repeated for the new composition before controlled publication.

## Scope and acceptance

- Add exactly one `google-site-verification` tag with the owner-supplied value
  inside the homepage head. Keep the existing Yandex tag intact.
- Removing the new line must restore the whole base homepage byte for byte.
- Update the operational status with the completed Yandex steps and this
  Google follow-up. Use this separate task specification and one scoped PR.
- Preserve all visible content, runtime scripts, styles, canonical URLs,
  indexing directives, public sitemap, book links and account behavior.
- No DNS, credentials, service-account delegation, analytics or terms changes.
  The owner performs the final verification action in Google.

## Checks and review

- Exact tag value and cardinality checked against the owner's original text;
  both verification tags must occur once inside `head`.
- Whole-homepage byte preservation after removing the single inserted line.
- `python3 tools/seo-check.py --base 89e61f80b56f9c3344ee96fbaff7946c90b251bd`
- `python3 tools/build-sitemap.py --check`
- `git diff --check`, scoped changed-file inspection, and focused independent
  internal review of the final head/tree. No external reviewer is required.
- Relevant GitHub workflows must pass on the final reviewed PR head.
- No new tests or additional visual gate are needed for one invisible meta tag;
  required existing CI remains unchanged.

## Release and rollback

Query authoritative remote `main` immediately before merging. Verify the merge
parent and complete reviewed tree, successful Pages deployment, then compare
the live homepage with the immutable release and check both exact meta tags.
Only after that tell the owner the Google Confirm button is ready.

The PR records commit, review, CI and production evidence. Google ownership,
sitemap submission and search indexing are recorded only after actual service
evidence. An ordinary revert can remove this change; keep verified tags during
routine homepage updates because services can check ownership again later.
