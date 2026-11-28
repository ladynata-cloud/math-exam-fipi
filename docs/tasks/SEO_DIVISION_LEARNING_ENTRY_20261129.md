# GROW-03 — поисковый вход в курс деления уголком

- Owner: MathExam; START: «хорошо, начни доработку», 29.11.2026.
- Base: main 901bf101286c403cb1b1f07fcbbd965115666725; branch `seo/division-learning-entry-20261129`; review level SMALL (isolated copy + existing link, no runtime changes).
- Existing canonical URLs: /trainers/oge-basics/multiplication-division/division-path.html, /trainers/oge-basics/multiplication-division/division-checkpoint.html. Both are existingPages in navigator inventory; no binding or common registry edits.

## Goal / approved scope
Help a pupil recognize the problem from search and start a real exercise. Change only titles, descriptions, first-screen learning copy, and one link to the existing 8-item checkpoint; add a correct arithmetic example 84 : 4 = 21. Checkpoint title/H1 explains the purpose. No new landing pages, no changes to URL/canonical/robots/sitemap, scripts, storage, controls, board, curriculum, shared manifests, external advertising, paid API or Habr. No claim about guaranteed search snippets or rankings.

## Evidence / acceptance
Previous Google baseline 1–26.11: 122 impressions, 3 clicks overall, these exact URLs absent from the page breakdown; not proof of nonindexation. Search intent is a hypothesis. Existing course has eight steps, checkpoint eight examples with one attempt; path already links to checkpoint. Keep all previous links and JS/IDs. Compare by URL and comparable queries on 7/14/30-day checkpoints after publication; no significance claims at low volume. Fresh exact head/base, SEO/sitemap, navigator, guided division/browser and applicable gates required; 320/390 px first-screen and checkpoint interaction check required before release. Local checkout/Chromium and full git diff --check not available in this iteration; no external review requested/performed.

Static preflight: 17/17 structural assertions passed in API-fetched exact source (unique reversible anchors; unchanged canonical, scripts and IDs; no removals of existing links; known checkpoint link; sitemap; inventory; arithmetic). Targeted intersection check: 20 related open PRs (777,749,736,662,563,530,385,383,353,552,614,619,629,744,684,605,606,39,755,716) do not change either target. Not an exhaustive scan of all open PRs. Recheck before release. Rollback: revert this isolated commit, preserving student data and other branches.

Release: standing owner authorization docs/OWNER_RELEASE_AUTHORIZATION.md applies after actual gates. Draft only until exact candidate CI and review; no auto-merge bypass.
