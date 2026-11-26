# ОГЭ 1–5: исследуемая наглядность у условия (26.11.2026)

## Identity
- Base: main `b876a19a78910663aa6a976b4b3b781d7987a6d8`
- Branch: `oge-practical-visible-exploration-20261126`
- Review level: MEDIUM
- Owner approval: direct request to improve the visual models and add interactivity after the audit.
- Scope: existing eight storylines only.

## Goal
Separate neutral exploration of givens from task-specific numerical hints. Keep the native graders, progress keys and shared protocol unchanged.

## Implementation
- Roads: independently mark/clear any segment; keyboard alternative.
- Apartments and plot: annotate grid cells, without computed area or automatic count; keyboard row/column controls.
- Tariffs: choose a month and see a vertical guide and two graph points, without numeric readout.
- Paper: successive half-cuts with back/reset, no area or mass output.
- Stoves: unfold four walls with the stated door; no computed area.
- Tires: same-scale rolling model, visible contact point, progressive circumference and track, quarter/full revolution, reset, no computed percentage; move animation outside help in standalone.
- Existing contextual examples and complete solutions remain available in help. Neutral extras are initially excluded from shared board mode to preserve the current synchronization contract. Diagnostic and exam sheets, frozen book versions, native questions and answer keys are not changed.

## Acceptance and gates
- Unit/DOM: `node --test tools/oge-practical-*.test.cjs` including new exploration and rolling tests.
- Browser: all eight pages at 320/360/1280 px, keyboard/touch, no overflow, task variants and draft retention; shared-board regressions.
- Rebuild current offline download and run archive tests before release. Historical book snapshots remain unchanged.
- Verify exact base/head, CI and deployment per standing owner policy.
- No local browser, archive rebuild, external review or release evidence available at draft creation. Do not merge until required acceptance succeeds.

## Risk / rollback
New controls are isolated from answer form handlers; no storage writes, auto-correct or new API calls. Existing board protocol is unchanged. Revert this scoped PR if needed. 

## Visual refinement (owner's follow-up request)
- Two-colour cell annotations, route highlights underneath labels, dual directional tariff guides with click/select.
- Paper: proportional main diagram, progressive cut, enlarged last-cut view at explicitly separate scale, back/reset.
- Room: four proportionally sized walls, sequential reveal, selectable wall and actual door dimensions; right-angle mark on arc.
- Tires: proportional wheel geometry and aligned tracks, marked circumference, one-wheel focus and two-wheel comparison, reversible 0–360° scrubber, pause and reset, compact same-scale overview. Reduced-motion support.
- Preserve readable labels at minimum widths and no response leakage. All actual rendering, mobile/touch and offline acceptance remain required.

- Added interactive isolation of actual arc parts and room surfaces; paper labels retained at readable sizes; wall animation no longer overrides selected-wall opacity.

## Offline artifact checkpoint
Targeted rebuild preserves all unchanged compressed entries, replaces the six changed runtime members and preserves the original offline HTML shell. ZIP local/central headers and CRC32 verified for all 39 members before and after. New entries use ZIP store compression; canonical Python/Node builder and offline browser suite are still required for release evidence.
