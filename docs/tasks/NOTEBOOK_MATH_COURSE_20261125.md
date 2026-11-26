# Математика по школьной тетради — индивидуальный маршрут
- Task: NOTEBOOK_MATH_COURSE_20261125
- Date: 2026-11-25
- Base branch: main
- Base SHA: 85f4aa28803bc0203cccf3a1b5ad5d64d6d05d14
- Branch: course/notebook-math-20261125
- Review level: MEDIUM (existing semantic board bridge; no new protocol)

## Goal and approved scope
Owner asked to turn all supplied notebook photographs into an interactive course, with worked examples, analogous tasks and access through the board. 50 lessons, 142 practice tasks across eight domains; representative reconstructed notebook examples (not a verbatim transcription), corrected errors, staged solutions, hints, local practice progress, lesson homework sheet, responsive interactive SVG and numerical models. New course is discoverable in the existing board picker and registry. No raw images, pupil identifiers, server contract or existing trainer modifications. No public search-index promotion: noindex for individualized resource.

## Acceptance and validation
- Data inventory and answer keys, bounded semantic state, section geometry, registry/picker tests.
- Browser: every lesson opens at narrow width, step reveal, standalone answer and progress; synthetic real board room, teacher/student state, graphic coefficients, response, reload and cube section, personal storage isolation.
- Existing board-platform preflight; relevant affected CI must pass.
- No external review requested; not performed under standing owner policy.
- Real pupil pilot not performed. Unclear handwritten portions are reconstructed by mathematical topic, not treated as literal source. Original diagrams are replaced with clean mathematical models, not pupil photos.
- Risks: registry server deploy can lag static site, so verify actual public board registration and two-browser room before claiming production synchronization. Rollback: revert scoped PR; preserve existing board and user data.
- Owner granted START in current conversation by explicitly requesting implementation. Standing release authorization: docs/OWNER_RELEASE_AUTHORIZATION.md. No merge without applicable checks and exact base/head verification.
