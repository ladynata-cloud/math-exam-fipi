# Chapter IV: independent browser-capture harness review

**PASS for the reviewed additive harness change.** This is a static code review
and syntax check, not an execution result or a visual approval of course cards.

Reviewer: independent chapter-IV source/model review agent, separate from the
editor of this harness change. Date: 2026-10-26. Comparison base:
`9cf995d30c400a6e581a3168bb8ef8f5c76ed945`.

| Reviewed file | SHA-256 |
| --- | --- |
| `tools/geometry-textbook/browser_check.js` | `07b49df556ebb6ee97ddcabbd3a4e3d12d570c7d4816446555356e214fd12577` |
| `.github/workflows/atanasyan-planimetry.yml` | `91f8b1ab37378fd3aee0b5a1a674a5166412522bde6df05448c022a20a1ca462` |

The new optional environment variable selects chapter labels whose already
inspected model views receive extra PNG captures. Selected labels must exist in
the release scope. Each additional evidence entry records the card, chapter,
view, width and file. CI selects IV; it still invokes the full browser mode.

All existing coverage, assertions, interactions, saved-work checks, error
handling, screenshot records, mobile/desktop widths and completion criteria
are retained. The source/model job and its commands are unchanged, as are
the browser timeout, artifact retention and failure behavior. A direct
comparison removed only the newly added capture lines, evidence field and
workflow environment entry; both remaining files were byte-for-byte identical
to their base versions. No existing test or failure condition was weakened.

The extra capture occurs after the existing exact-view, label and layout
inspection. It does not call app actions, change the selected model view,
advance lesson steps, edit the bundle or review status, or alter saved answers
and board state. Locator screenshots can scroll their target into the viewport
and wait for rendering; these are capture effects, not lesson-state mutations.
The existing inspection uses SVG-local geometry and horizontal-overflow checks,
so the extra capture does not replace its measured result. The next authored
view continues through the original mount/setView/inspect path.

`node --check tools/geometry-textbook/browser_check.js` and `git diff --check`
passed. Added captures consume time and artifact space; actual full-run
completion, rendered pixels and CI timing require the separate browser evidence.
No unresolved static-review finding was identified at these hashes.
