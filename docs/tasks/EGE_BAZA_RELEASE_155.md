# ЕГЭ база — единая интеграция и публикация (#155)

Owner request: current conversation, 2026-10-02 (Asia/Novosibirsk).
Base: `main` at `010e89c75c0fe110b57c983c728b8216fb38cd9d`.
Branch: `release/ege-baza-main-155`. Review level: NEW_ARCHETYPE.

## Authorized scope and release exception

The owner explicitly authorizes implementation, integration, commit, push, final PR, merge and publication to the existing mathexam.space. For this release only, the owner waives independent review and separate approval of the final commit, including reapproval after compatible main drift. The reason is to accelerate delivery and assess the working site. No external approval is claimed. Global policy, branch protection, authentication and hosting settings remain unchanged.

## Implementation

- Integrate the complete relevant tree of #153 (`2dc564cd296c67b4a74c3e277a656ba763a550b5`, tree `c2088d018c6d486941192c636d14104cc9744a25`) onto fresh main; retain current unrelated work.
- Make basic EGE the homepage's first learning path while retaining OGE, profile EGE, geometry and teacher links.
- Connect all 32 registry entries to real learning/practice/report pages. Add 28 thematic lessons with parameterized tasks, selected manipulable models, guided questions, independent variants, diagnostic, exam practice and local progress.
- Fix the old p20a condition/model mismatch. Add deleting digits for divisibility by 22, unequal three-stage average speed and deriving circumference from shortest ring distances.
- Add interactive algebraic transposition with the same operation on both sides, cancellation, sign prediction, animation and no-motion alternative. Distinguish a term from a factor.
- Re-fetch official demo/spec and open variant; preserve basic PDFs, provenance and explicit incomplete-bank coverage.
- Add isolated local persistence to formerly session-only algebra, percent and reasoning sections, leaving legacy keys unchanged.

## Gates

Independent mathematical calculations, exhaustive alternatives for constructive answers, substitutions for equation roots, browser lesson flows and explicit misconception checks, real mobile/desktop browser, source integrity, malformed-state handling, preservation of old keys, export, static link checks and extracted-preview browser checks. Record exact executed gates in the release report.

## Limits

This is not an exhaustive FIPI bank or proof of coverage of every subtype. No real pupil study, external review, physical-device or screen-reader audit is claimed. The new generated checks are a diagnostic sample rather than official KIM. The stand-alone full OGE equation course and Merzlyak/Pogorelov course projects are outside this release.

## Rollback

Revert the release commit through a normal reviewed revert. Existing student keys require no migration; new keys can remain dormant. Do not clear browser storage. No backend or board-server change belongs to this release.
