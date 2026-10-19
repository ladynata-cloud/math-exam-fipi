# Arithmetic practice inventory and continuation audit

Date: 2026-10-19. Baseline: `7183175`. Scope: links authored in `learning/division-course-map.js`, plus their route hub. Read-only inspection and local synthetic browser work; no learner accounts or production attempts were changed.

## Coverage

The original audit at `7183175` covered **16 multiplication steps, 15 division steps, 77 supplementary cards, and 10 alternative lesson links**: **118 distinct linked URLs**, or **119 URLs including the hub**, across **16 shared implementation families**. The rounding preparation update, based on `cf3b55b`, adds one separate Claude rounding exercise immediately before estimation. The current manifest therefore contains **31 primary steps, 1 preparation, 77 supplementary cards, and 10 aliases**: **119 distinct linked URLs**, **120 including the hub**, and **17 shared implementation families**. Managed progress still counts only 16 multiplication and 15 division steps; the preparation is not an assigned cabinet task. These URL counts do not represent separate mathematical engines. For example, 48 school URLs share the workshop, nine arithmetic URLs share one level-based trainer, and ten Soviet topics share one authored-example application.

The complete per-URL manifest, including title, category, repeat control, source evidence, aliases, sample diversity, and continuation targets, is `tools/fixtures/arithmetic-practice-inventory.json`. Rebuild with:

```sh
node tools/arithmetic-practice-inventory.cjs --write
node tools/arithmetic-practice-inventory.cjs --check
```

The tool checks local paths and supported school, Soviet, arithmetic-level, and generated-fraction identifiers. It also requires the exact rounding-preparation query `?place=1&from=division`, which starts at tens and provides the division return route. It samples seeds 0–199 through pure generator APIs where available. Fingerprints use conditions and questions, **excluding seed and identity fields**. Current default contract generation is sampled; preserved version-1 tasks are not mistaken for new generation. Sampling measures observed diversity, not an infinite number of distinct possible mathematical facts. Standalone generators without a pure exported API are identified by source inspection and exercised by the focused DOM tests.

| Practice category | Linked URLs |
| --- | ---: |
| Seeded generated tasks, including school and managed routes | 89 |
| Arithmetic levels with repeated generation | 9 |
| Multiplication-table elevator | 1 |
| Authored Soviet cycles with a visible generated continuation | 10 |
| Legacy column multiplication with random/custom operands | 1 |
| Fixed decimal introduction followed by generated sets | 1 |
| Fraction/decimal live generator alongside a finite exam bank | 1 |
| Generated part/whole word problems | 1 |
| Small fraction-expression families with a generated continuation | 2 |
| Fixed OGE fraction bank with generated arithmetic continuation | 1 |
| Generated formula practice | 2 |
| Claude stepwise rounding with nine selectable places | 1 |
| **Total linked URLs** | **119** |

The hub is navigation, not a task. No linked lesson is classified as an explanation-only dead end: each has practice, or now exposes a direct, skill-matched practice continuation.

## Gaps and scoped changes

1. **All ten linked Soviet topics cycle through 12 authored examples.** Their generator, revisions, demonstration videos, and saved histories remain intact. A visible “Ещё примеры этого навыка” block on the working screen opens the corresponding generator in another tab. This block is still present after completing an example.
2. **The OGE №6 fraction page is a finite bank of 174 cards.** Repeating the bank does not create new exam prototypes. The working page and result screen now offer separate live practice for ordinary fractions and decimal fractions. The fraction trainer's own bank result has the same explicit continuation. These links train individual arithmetic operations; they do not claim to generate every composite examination prototype.
3. **Two EGE-path fraction-expression lessons repeat small families:** `fractions` has seven distinct sampled conditions; `practice-fraction-expression` has 15. Their original conditions remain stable. The public display and the parent cabinet support panel (outside the sandboxed trainer frame) now link to the school generator for brackets and order of operations with fractions, rather than substituting a different one-operation skill.
4. **School practice used a capped log length as its next seed.** Once 3000 events for one topic filled the log, repeated “Следующая задача” requests selected the same condition. Practice now advances its previous seed, retaining the existing state schema. The previous saved practice seed is captured before the introductory explanation opens, so reload followed by practice also advances. Review and diagnostic selection are unchanged.
5. **No simple matching live generator existed for natural-number ×10/100 or zero actions.** The small additional `soviet-math/arithmetic-practice.html` covers just these two skills. Operands stay small. Zero actions alternate addition, subtraction, multiplication by zero, and a short expression broken into three separate actions. Wrong answers remain on the same step. Help first describes the method; “Разбор по шагам” explicitly reveals the current action. Completion distinguishes help, and “Ещё пример” has no attempt limit. Its own browser-storage key cannot overwrite Soviet-course history. Corrupt stored work remains byte-for-byte intact, with writes blocked and a visible message.

The later rounding preparation uses the existing Claude page `trainers/rounding-stepwise.html`, not the older OGE rounding trainer. It offers tens, hundreds, thousands, tens of thousands, hundreds of thousands, millions, units, tenths, and hundredths, plus mixed practice. “Следующий пример” continues with generated conditions. Its card and estimation support links open a separate tab and preserve the original task. Focused coverage is `tools/rounding-stepwise.dom.cjs`, `tools/rounding-stepwise.browser.cjs`, and `tools/learning-rounding-preparation.dom.cjs`.

## Exact Soviet topic continuations

| Topic | Live practice target |
| --- | --- |
| `groups` | `/trainers/arifmetika.html?course=preoge&level=t2a` |
| `times-table` | `/trainers/arifmetika.html?course=preoge&level=n2d` |
| `multiply-by-ten-hundred` | `/soviet-math/arithmetic-practice.html?topic=multiply-by-ten-hundred` |
| `zero-actions` | `/soviet-math/arithmetic-practice.html?topic=zero-actions` |
| `column-multiply` | `/trainers/oge-basics/multiplication-division/course-column-mixed.html` |
| `decimal-multiply` | `/trainers/drobi-oge-trainer.html#practice=decimal-multiply` |
| `decimal-multiply-ten` | `/school/index.html?course=vilenkin5#lesson/v5f-decimal-times-ten` |
| `fraction-multiply` | `/trainers/drobi-oge-trainer.html#practice=fraction-multiply` |
| `fraction-of-number` | `/trainers/fractions-part-whole-assignment.html` — default “Найти часть” |
| `order` | `/trainers/oge-basics/order-of-operations.html` |

The four fraction-generator routes are an explicit own-property allowlist: `fraction-multiply`, `decimal-multiply`, `fraction-mixed`, `decimal-mixed`. Unknown hashes, `constructor`, `__proto__`, and inherited object names fall back to the normal chooser. The multiply routes select multiplication only. Mixed routes choose the four arithmetic operations within the selected number type.

## Validation

```sh
NODE_PATH=/path/to/jsdom/node_modules node --test tools/arithmetic-supplements.dom.cjs
node tools/arithmetic-practice-inventory.cjs --check
```

The focused tests cover:

- Actual URL selection and 20 next-example requests in all nine linked arithmetic levels; visual arrays and board cells are checked, not only a constant page heading.
- 2000 generated conditions per new small skill, bounded operands, arithmetic correctness, and seed wrap.
- Repeated new examples, double clicks, wrong answers, assistance accounting, draft restore, and malformed-storage preservation on the additional page.
- Visible continuation links for all ten Soviet topics without replacing their active authored examples.
- All four exact fraction deep links, 25 completed/repeated conditions each, and invalid-hash handling.
- Bank result continuations and both public/managed fraction-expression links, with no link added to an unrelated decimal lesson.
- School continuation with a full 3000-record log, multiple following attempts, and reload.

## Limits retained deliberately

“Unlimited practice” means attempts can continue, with variation within the chosen skill. It does not mean infinitely many unique multiplication-table facts or ever-larger numbers. School `v6f-properties-product` deliberately varies the remaining factor in `−0.25 × a × 4` (eight sampled conditions); the signed-multiplication overview has 12 sampled conditions. These are narrow teaching families, not terminal screens.

The original authored banks, old task specifications, and historical attempt identities are preserved. Additional public practice opens separately and uses the destination's existing local progress; it does not silently add independent successes to the pupil's managed account. The timer-based elevator and the broader legacy column trainer remain optional supplementary formats, not the first teaching steps. Existing advanced supplemental wording is not represented as a complete readability rewrite in this audit.
