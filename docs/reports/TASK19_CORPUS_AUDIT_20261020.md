# Task 19 assertion coverage audit — 20 October 2026

The published collection grows from 167 to 233 unique cards: 36 recovered
assertions and 30 additional reference assertions, each with an explanation and
an optional figure or interactive model. Earlier card IDs and progress aliases
are retained. The school wording «равны» replaces «конгруэнтны» in current and
accessible archived task19 materials.

## Checked collections

| Collection | Entries mapped | Status |
| --- | ---: | --- |
| Previous richer trainer | 105/105 | Existing authored material |
| Previous basic trainer | 63/63 | Existing authored material |
| June12 saved trainer, `geometry_statements_trainer_improved (4).html` | 178/178 | 105 previous and73 authored additions |
| [Physmathschool assertion list](https://physmathsch.ru/19_task_oge/all_questions.php) | 106/106 | Secondary curated source |

The machine-readable record is `trainers/task19-source-coverage.json`:452
source entries map to233 distinct cards. Overlapping collections are not added
together as if they were unique assertions. The June source explicitly labels
its73 taskbank assertions as authored and **not from the FIPI open bank**;
historical `fipi-*` identifiers are retained only as compatibility aliases.

Mappings include352 exact texts after whitespace normalization,99 independently
reviewed equivalent formulations, and one explicitly documented included
property: `fipi-007` is the parallelism component of `prev-042`, which also
states the middle line's length. Truth values agree in every mapping.

## Official-source limits

The [official FIPI index](https://fipi.ru/oge/otkrytyy-bank-zadaniy-oge) links to
the mathematics bank, but the bank returned HTTP503 or timed out during this
audit. Its complete current contents could not be enumerated. The official
Navigator PDFs supply34 distinct recommended task identifiers; these are
preparation recommendations, not a complete bank inventory. URLs and identifiers
are recorded in the coverage JSON. Neither an identifier alone nor a secondary
webpage establishes the exact current official task text.

Accordingly this release verifies the recovered178 and reference106 collections;
it does **not** certify exhaustive coverage of every current FIPI assertion.

## Content review and validation

An independent mathematical review checked all66 additions,36 static figures,
and30 interactive hints.304 combinations of boundary/initial model parameters
preserved their required conditions without nonnumeric results. The general
two-sides-and-an-angle assertion receives its own SSA counterexample card rather
than an overly broad equivalence mapping. Final regression tests verify source
coverage, aliases, original content, truth values, hint rendering, progress and
offline delivery. Exact-head browser CI and deployed-file verification are
recorded in the release PR.

This is a frontend content release with no progress-schema or server migration.
Rollback is a normal revert of the scoped PR.
