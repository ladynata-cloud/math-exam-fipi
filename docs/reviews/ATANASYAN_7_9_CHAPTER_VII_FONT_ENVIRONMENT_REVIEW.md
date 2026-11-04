# Chapter VII: independent font-environment diagnosis

**PASS for the28-view environment diagnostic only. The original full6 whole-course gate remains a recorded failure.**

The completed full6 traversal reported14 failing historical320px views in exercises450,452,454,494 and536; all new chapterVII views passed. The browser reviewer reproduced five representative failures on both the unchanged published893-card bundle and the preview1083-card bundle. Actual Chromium CDP identified DejaVuSerif with synthesized italic, although the application requests `Georgia, "Times New Roman", serif` in italic. The system font collection lacks Liberation, a dependency explicitly installed by the existing Playwright CI command.

The installed primary runtime already supplies Liberation2.1.5 font files. A scratch-only Fontconfig file includes the normal system configuration and exposes only the16 Liberation TTF files through symlinks. It adds no family aliases or CSS overrides, installs nothing system-wide, and changes no source, model, application or gate. Actual Chromium CDP then identifies **LiberationSerif-Italic** through the application's existing fallback stack. `fc-match Georgia` alone is not an adequate browser-font measurement.

All14 original failures were rerun on each surface using the repository's unchanged inspection function: **28/28 pass, zero issues**. All28 complete screenshots were covered by actual inspection of22 unique full PNGs in three unscaled, uncropped native-pixel contact sheets. The small construction labels, circle cases, parquet, case controls and descriptions remain legible.

This isolates a missing documented browser dependency; it does not claim universal font support or turn the earlier failure into a pass. The unchanged complete gate and chapterVII images still need a full run/review in the normalized environment. The JSON preserves original failure provenance, actual fonts and glyph metrics, exact font/script/config/content hashes and the complete image manifest. No publication approval is given.

Evidence: `ATANASYAN_7_9_CHAPTER_VII_FONT_ENVIRONMENT_REVIEW.json`, SHA256 `3f6e2f8b19489ff3f9379b1c5a67a39f9875d023c39b9b57944f5422bf793cd5`.
