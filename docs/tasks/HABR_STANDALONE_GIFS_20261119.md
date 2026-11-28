# GIF instructions for eight standalone Habr entries

## Identity and authorization

- Owner: Наталья; date: 2026-11-19.
- Request: add GIF instructions to the trainers linked from the article, keeping the interactive board untouched.
- Source base tree: `53036a535470c7dc00821610f22b9ef43bb3fcaa`, the root executor's composed #651 candidate. This is not a claim of deployment.
- Planned branch: `task/habr-entry-gifs-20261119`; root is sole publisher.
- Review level: `HIGH` for artifact provenance and the multi-page integration. No Proposed ADR is accepted by this task.
- Standing owner authorization applies, subject to the precise #651 → #632 release ordering and all later holds. The delegated developer may prepare isolated files only: no commit, push, PR, comment, merge or deployment.

## Goal and scope

Provide opt-in real browser demonstrations for exactly the eight URLs in `tools/habr-gifs-capture-20261119.json`. Seven canonical HTML files share one player; the two section routes share their index. There are 47 logical capture frames. The board URL is excluded.

The standalone helper offers a collapsed panel, poster/manual frames, transcript, explicit play/stop, one active animation, reduced-motion behavior and offscreen/page-hide pause. Media loads only when the user opens help. It makes no learner-storage reads/writes. Its iframe guard runs before mounting or network access. Mathematical controls, source engines, stores and static task content are unchanged.

Six pages load one exact marked stylesheet/deferred-script block. OGE's canonical `build.py` inlines the same CSS/player before `</head>`; the real output retains its existing prohibition on external scripts and its early UTF-8 declaration. The seven changes invert to their complete immutable before documents through a separate full-payload-bound proof. Unknown edits are never stripped; all old navigator/math source receipts remain unchanged.

The public sections index is distinct from `trainers/sections-from-zero.html`. The latter, all shared model/storage assets and all board wrappers/bridges/server files remain byte-identical. Existing sections/offline transformations receive the precisely restored source through their current navigator normalization. No product generator model is replaced.

## Capture and media lifecycle

1. Root reviews the source patch and creates its immutable source checkpoint from the specified base, preserving existing ancestry. The separate capture patch pins that checkpoint tree and all 48 actual initial runtime dependencies. Helpers/services not fetched during these scenarios are excluded.
2. Root places both normal commits on `task/habr-entry-gifs-*`. The push workflow records in native Chromium only; the recorder requires GitHub Actions, matching `GITHUB_SHA`, clean tracked sources, a reviewed checkpoint tree in ancestry and exact source hashes. No local Chromium run is claimed.
3. The capture job uses fresh synthetic contexts and a read-only loopback GET/HEAD server. Remote traffic is denied. Google Fonts requests are intentionally denied with a disclosed native-system fallback; all unexpected remote/local failures reject the recording. The helper is never opened during recording, avoiding recursive GIF capture and missing-media requests.
4. Accept only complete raw and encoded receipts for all eight IDs in approved order. Match actual recording head/tree, plan/scenario/runtime/recorder/encoder hashes, Playwright/browser/executable identity, PNG/GIF bytes and pixel/duration roundtrip checks. Download through the standard GitHub workflow-artifact tool. Incomplete artifacts are diagnostic only.
5. Inspect every contact sheet and all eight animations, then test native playback/mobile layout. No static/JSDOM result replaces this step.
6. Import only each encoded clip directory into `assets/habr-entry-gifs/<id>/`, encoded `media-receipt.json` as `assets/habr-entry-gifs/media.json`, raw capture receipt as `receipts/capture.json`, and the eight raw recording JSON objects as `receipts/<id>.recording.json`. Keep plan/recorder/encoder and all 48 recorded source files unchanged. This is a media-only descendant commit and needs no re-recording if those identities remain exact.
7. In that import commit remove only the temporary `capture-eight-standalone-trainers` job. Preserve `validate-and-strict-media` unchanged. Its standard strict gate must then pass on the actual import head. This completes a one-time capture task without disabling validation.
8. Complete all applicable fresh CI, independent final review, normal merge guards and deployment/live-byte verification. Root follows the original authorized release ordering; this additional Habr work does not replace #632's separate 63 clips.

The neutral pre-import `media.json` has `complete:false`; opening help explains that the example is being prepared and does not render a broken image. The strict media gate intentionally fails until all genuine media are imported. Do not publish that pending state as completed GIF work.

## Preservation and checks

Required source proof: `tools/habr-gifs-integration.test.cjs` verifies all seven full-document inverses, negative mutation controls, actual OGE inline-only output and exact board/model/storage/offline identities against the source base. `tools/habr-gifs-player.test.cjs` covers lazy loading, manual frames, transcript, playback/stop, reduced motion, route replacement, iframe refusal and late-resource races.

Completed in the isolated implementation environment:

- 11 integration/player checks; four recorder/plan/path checks; seven encoder integrity tests using explicitly synthetic disposable fixtures.
- Existing article demo checks: 4/4.
- Existing OGE learner preservation: 147 documents, 1702 links; unchanged inline engine and static controls.
- Existing OGE DOM suite: 130/130; actual generated HTML keeps the offline script assertion unchanged.
- Existing public navigator preservation: 4/4; source-binding negative tests: 5/5.
- Sections generator `--check` and independent geometry tests: 8/8.
- Syntax checks and source-hash validation. These are not native Chromium evidence.

A scoped legacy download rebuild exposed pre-existing drift in the negative-line and trigonometry exports plus the manifest date. Running the same rebuild with the original seven source documents produced exactly the same changed bytes, proving the help integration does not affect that generation. These five regenerated files were discarded in the isolated environment; all published/offline files in this patch remain byte-identical. The unrelated stale export repair is not included. The sections offline output remains current and byte-identical under its own builder check.

## Risk, rollback and review

The main new risk is a misleading or stale demonstration. Exact runtime/scenario receipts, the strict import gate and visual review are required. An incomplete native run is never retried blindly or accepted by relabeling source hashes.

Rollback of this optional help removes only its exact includes/player/media; it never restores an older mathematical/storage writer. All synthetic capture progress disappears with its disposable context. Real learner data is not accessed.

Independent focused review found and corrected an OGE charset-placement issue and a stale-image callback race; the final player and inverse checks passed independently. External-provider review was not performed under the standing waiver. Full exact-head release review remains root's responsibility after real artifacts and current CI.

## Execution status

Prepared source and capture patches only. No PR/push/merge/deployment performed by the delegated developer. Native capture, artifact download, visual acceptance, native mobile playback, final media import, final full CI and production verification remain outstanding. Four held Drafts and Proposed ADR0015/#630 remain untouched.
