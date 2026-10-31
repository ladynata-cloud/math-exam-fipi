# Fixed OGE book editions

The fixed-edition architecture is **Accepted** in
[ADR 0012](../../docs/adr/0012-fixed-oge-book-editions.md). Integrity checks,
learner scenarios and permission to publish are separate requirements.
Published `v1` bytes and `/b/oge26-1/` addresses remain immutable. The bounded
[v2 task](../../docs/tasks/OGE_BOOK_EDITION_V2_DALI_20261031.md) adds a new copy
and `/b/oge26-2/` addresses for the corrected DALI portrait startup.

## Build a new candidate

Run from the repository root with the exact owner-approved base:

```sh
python3 scripts/build-oge-book-edition.py --version v2 --base 4a90592077934d9a6d8a617b4afa50938798efb2
python3 scripts/build-oge-book-edition.py --version v2 --base 4a90592077934d9a6d8a617b4afa50938798efb2 --check
python3 tools/book-edition/verify.py --base 4a90592077934d9a6d8a617b4afa50938798efb2
python3 tools/book-edition/test_generator.py
python3 tools/book-edition/test_package.py
python3 tools/book-edition/test_deployed.py
```

Writing requires an explicit full `--base`. The generator rejects a base older
than the published-v1 anchor and refuses an edition or alias namespace present
on either that base or `origin/main`. An outdated local tracking ref cannot
authorize a rewrite of v1. The `--check` mode only compares bytes; it does not
write. Reproduction from current sources is for an unpublished candidate.
Published editions are verified from their frozen bytes and old Git blobs,
without rebuilding them from sources that may have changed.

The historical 71-source inventory is `scripts/oge-book-edition/urls.json`.
Version selection preserves its IDs and source URLs and mechanically derives
the new `bookUrl` and `frozenUrl` fields. Each package has its own `url-map.json`:

| Edition | Full prefix | Immutable aliases | Storage namespace |
| --- | --- | --- | --- |
| v1 | `/book/oge/2026-10-31/v1/` | `/b/oge26-1/NN/` | `mathExamBook:oge-2026-10-31-v1:` |
| v2 | `/book/oge/2026-10-31/v2/` | `/b/oge26-2/NN/` | `mathExamBook:oge-2026-10-31-v2:` |

Canonical content paths preserve the source tree. Short aliases preserve query
strings and fragments; the legacy inequality redirect preserves them at its
second hop. New editions receive their own visible version label. The default
CLI version remains v1, but the published namespace cannot be written.

## What is fixed

The manifest hashes the bounded source closure and every emitted file. It
records source hashes, recipe hashes, canonical metadata, short targets and
the dependency graph. Dynamic loader files and computed FIPI image filenames
have explicit closure handling. HTML copies are `noindex` and retain the
original canonical; they do not enter the public sitemap.

Optional analytics, downloadable-package panels, cabinet return adapters and
remote board integrations are removed. The standalone loader and contextual
help remain. Roads-grid requires the original validator, so its fixed copy
keeps that module with an always-inert registration branch. External Google
font requests are removed in favor of the source system-font fallbacks.

The startup boundary namespaces both Web Storage APIs. It supports method and
named-property access, enumeration, deletion, scoped clearing and the native
storage-unavailable error path. Cross-tab events expose logical keys and filter
changes in other editions and public trainers. This compatibility adapter does
not provide security isolation from all other same-origin code. It creates no
cloud result records. v2 changes only the generated configuration and label;
the storage algorithm is unchanged.

Included links stay inside the selected edition. Other instructional/contact
links receive a visible “вне книги” marker. Browser network policy forbids API
requests, and runtime checks reject resources outside the frozen paths.

## Integrity and negative controls

`verify.py` checks listed bytes, required files, original canonicals, noindex,
resource paths, early startup, exact alias/source mapping and namespace
registration. The startup configuration must identify the same edition and
the same closure as its manifest. Versions cannot share storage identities.

The append-only check reads **old manifests and Git blobs from the supplied
base**. Editing a frozen file together with its checksum cannot pass. Adding or
removing a file in an old namespace also fails. CI separately executes the
verifier copied from the exact PR base before the current verifier. Existing
protection does not depend solely on a proposed change to its implementation.

Package negative tests retain the original v1 mutations and add v2 identity,
cross-version resource, startup configuration, short-address and swapped-target
controls. Generator tests use a temporary Git repository with a genuinely stale
`origin/main` to verify refusal of published bytes. Release-verifier tests cover
both versions, including changed bytes, false 200 responses, redirected
fallbacks, missing pretty aliases and the distinction between localhost and
production evidence.

## Browser and learner gates

```sh
BOOK_PREFIX=/book/oge/2026-10-31/v1 node tools/book-edition/runtime.browser.cjs
BOOK_PREFIX=/book/oge/2026-10-31/v2 node tools/book-edition/runtime.browser.cjs
```

The runtime check requires Playwright Chromium. `PLAYWRIGHT_CHROMIUM_EXECUTABLE`
selects an installed executable and `BOOK_EDITION_ARTIFACTS` selects the output
directory; the historical v1 default remains `artifacts/book-edition/`, while
v2 defaults to `artifacts/book-edition/v2/`. Every short URL
starts in a fresh context at 320 and 1280 px: **142 entry checks per edition**.
The gate checks the exact final URL (including the source-defined `?v=1` on
entries 06 and 12), dependencies, visible-image readiness, storage identity and
horizontal overflow. Errors remain failures.

Image readiness uses native rendering visibility as well as viewport geometry.
An image inside a closed reference disclosure can have a layout rectangle while
remaining invisible and correctly unloaded. The original 15-second readiness
timeout remains. A negative control uses the same broken image closed and
opened: it is outside the visibility check while closed, must time out when
visible, and passes only after replacement with a successfully decoded image.
This does not suppress HTTP or page errors from hidden resources.

The original **10** storage/alias/reference regressions remain. A further
**3 cross-edition checks** prove distinct real division steps through reload,
event filtering with a positive same-edition control, clearing in both
directions without damaging the other edition or public data, and separate
session storage while navigating the same tab. The report binds the actual
runner and manifest hashes. `BOOK_ISOLATION_ONLY=1` is a diagnostic subset and
always leaves full-runtime `complete=false`; CI does not use it.

The cross-edition clear check closes the learner tab of the edition being
cleared and runs `clear()` from its inert index. It asserts a missing result and
zero namespace keys immediately in that same call, then waits for the native
deletion event before reading the separate raw observer. This checks both the
clear operation and its cross-tab observation without assuming synchronous
delivery or conflating it with a live trainer's state writes. A real trainer is
reopened to check the new empty state and the other edition's retained step.

CI retains Playwright 1.62.1 for the full runtime, tire-image and learner gates.
A separate Playwright 1.55.0 / Chromium 140 job runs
`tools/oge-book-dali-images.browser.cjs` for source and v2. Each run must first
reproduce the literal-image HTTP 404 with exact immutable v1 bytes at all three
widths; the browser's CDP parser initiator and server response are recorded.
Failure to reproduce is a failed control. The corrected candidate then needs
nine successful initial/help/reload stages, with unchanged JPEG, alt text,
biography and credits and no image/network/page errors. This deliberate v1
negative control never changes a failure in an ordinary v1 run into a pass.

The full learner scenarios run on source, v1 and v2. Keep evidence separate:
`source`, `frozen` and `frozen-v2` under both `artifacts/book-audit-basics/` and
`artifacts/book-audit-exam/`. For v2, set `BOOK_BASICS_OUTPUT` and
`BOOK_EXAM_OUTPUT` explicitly as CI does. Mathematics is independently checked
with `python3 tools/oge-book-exam-math.py --variants source frozen frozen-v2`.
The v2 task registry selects source plus v2 while retaining v1 evidence.

Each page's correct/wrong answer, help, next task, completion and saved result
are separate learner evidence. A hash, loaded page or storage probe does not
substitute for those scenarios. Local Chromium does not establish deployed
bytes, physical phone/printed-QR behavior, iOS/Safari/Firefox, screen keyboard
or real-pupil results. New publication requires separate owner permission and
the repository's authoritative base-drift guard.
