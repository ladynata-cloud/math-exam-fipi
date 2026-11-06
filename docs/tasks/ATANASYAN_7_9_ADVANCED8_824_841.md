# Атанасян 7–9: начало задач повышенной трудности за 8 класс

- Owner request: «Продолжи курс Атанасян 7-9», 2026-11-04 (Asia/Novosibirsk).
- Base: `eb1eeef772a247bf00bac81a660cd2fb5a8b1878`, main.
- Branch: `content/atanasyan-advanced8-824-841-20261104`.
- Review level: HIGH, continuing the existing exact-edition course.
- Parent task: [complete course](ATANASYAN_7_9_COMPLETE_COURSE.md).
- Release authorization: [standing owner policy](../OWNER_RELEASE_AUTHORIZATION.md).

## Outcome and boundaries

Prepare the complete next source subsection: exercises 824–841, all 18 numbers,
printed pages 214–215 / PDF pages 215–216 of the supplied 2023 revised edition.
Source SHA256: `3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72`.
Each task needs an individual condition, reasoned solution, step questions,
geometric scenes, exact source reference and honest manual answer assessment.
No new numbered theory or selfcheck belongs to this subsection.

The complete advanced-grade-8 range is 824–925. This increment completes only
the first source subsection (to chapter VI); 842–925 and chapter X remain next.
Do not conflate 18 source numbers with completion of the 102-number block.

## Preservation and review boundary

Keep the 1407 published cards, their review records, engine, routes and saved
work byte-identical. Prepare the new material outside the published bundle.
An explicit isolated review build may combine the preserved 1407 with 18
`in-review` cards, but cannot manufacture a release receipt or approval.
No PDF, source scan, full OCR, real pupil information or credentials enters Git.

Author verification and numerical checks are not independent content approval.
Before promotion, obtain the independent source/mathematics/pedagogy review
required by the parent task and inspect every novel view at 320/1280 pixels.
External provider review is optional and is not performed under standing policy.
Independent approval that has not happened must remain pending.

## Checks

- Source: visually inspect exact two source pages, including figure 274.
- Mathematics: complete proofs, converse in 833, both locus directions in 832,
  construction existence in 840, degenerate square in 834, and obtuse 839.
- Models: validate all scene claims, markings, finite coordinates and step order.
- Runtime: explicit preview only; actual two-width browser inspection, retained
  answer/step and theory-return flows, old-card preservation and reproducible build.
- Repository: scoped diff, no source/private bytes, relevant existing gates and CI.
- Promotion: independent review and exact base/head guard are still required;
  tests alone cannot mark the new cards reviewed.

## Risk and rollback

Risks are incorrect proofs, a hidden existence assumption, mislabeled models,
and accidentally releasing unreviewed content. The default production build
must remain unchanged; preview generation writes only to a new external folder.
Rollback is an ordinary scoped revert, with no pupil-data deletion or migration.
Implementation, commits, push and Draft PR are authorized by the continuation.
Publication follows existing policy after applicable review and gates.

## Продолжение 5 ноября 2026

Владелец поручила продолжить тот же PR438, сверить все 18 условий,
доказательства и случаи, исправить замечания, проверить доску и сохранение.
Публикация разрешена только после действительного независимого допуска.
[Предметная сверка](../reviews/ATANASYAN_8_824_841_RECHECK.md) фиксирует полный
разбор и новые редакции. На том этапе статус in-review сохранялся до
независимой проверки исправленного результата. Это не было ожиданием
разрешения на публикацию или требованием внешнего Claude.

## Независимый допуск 6 ноября 2026

Получена отдельная предметная проверка всех 18 карточек и 72 шагов,
координатная проверка 747 точек и 220 утверждений. Координатор фактически
просмотрел все 188 изображений 94 видов при 320/1280 и исходные страницы
214–215 с рисунком 274. Доказательства и привязки сохранены в
[записи допуска](../reviews/ATANASYAN_8_824_841_ADMISSION.md).

Применён только проверенный 18-карточный суффикс: основная сборка содержит
1425 проверенных карточек, предыдущие 1407 восстанавливаются с точным
исходным хешем. Дополнительно выполняются 36 браузерных проходов по новым
публичным ссылкам, с сохранением работы, шагов и возвратом из теории.
Реальные merge/Pages и результаты проверок итогового head фиксируются в PR438.
Материалы №842–925 и глава X остаются вне этого приращения.
