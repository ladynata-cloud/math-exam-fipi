# College logarithms learning route

Date: 2026-11-06. Base: main 8448ccecff1334cfa4e404c6040f855f2bb258e5.
Branch: feat/college-logarithms. Review: MEDIUM (bounded static trainer using existing bridge, parser and registry; no protocol/server contract changes).

## Approved outcome
The owner explicitly requests implementation, mathematical and browser/mobile checks, real teacher/pupil synchronization and publication. Build ten progressive chapters: definition, computation, identity, properties, transformations, graphs, equations, inequalities and two short-answer exam preparation chapters. All content is original practice, not a claim of official FIPI provenance or exact current exam numbering.

## Architecture and scope
Reuse college-functions safe number/set parser, MathExamBoard SDK, authoritative board-compat registry and existing board canvas. New isolated trainer, strict semantic state, picker/catalog/sitemap entry, scoped CI/tests. No learner accounts, private assignments, server authorization, protocol or existing trainer behavior changes. Personal progress stays browser-local; shared work never changes personal results. ADR0001 is Proposed; existing code and gates establish the contract.

## Learning design review
Definition precedes computation; validity precedes transformations; monotonicity precedes inequalities. Each task has checked, retained intermediate steps, three hints, targeted error explanation and mode without hints. Graph tasks require computed and plotted points before revealing the curve. Separate parameter laboratory shows domain, monotonicity, asymptote and characteristic points. 0<a<1 reverses inequalities; all original logarithm arguments remain strictly positive.

## Acceptance / gates
Independent numerical/interval checks of every task; complete DOM journeys; rejected malformed/forged shared states; real local Socket.IO teacher/student transport, reverse control, reload, notes and graphs. Chromium desktop and 320/390 mobile checks. Existing parser/course and registry/picker tests, SEO/sitemap checks, syntax and diff check. Gate COLLEGE_LOGARITHMS_OK. Live page and production registry/room verification after deployment.

## Permissions and rollback
Implementation and publication authorized by current owner request and OWNER_RELEASE_AUTHORIZATION.md. No external consultation requested/performed. Revert this scoped PR through ordinary GitHub workflow to remove trainer and catalog/registry entry; no server or pupil data migration. Main risks: invalid interval endpoints, stale backend registry and hydration races. Browser and transport evidence required before success claim.

## Execution record
Local validation: 158/158 tests pass (124 mathematical/DOM/validation, 2 actual SDK + Socket.IO shared-room journeys, 32 registry/server checks). Original college functions/cabinet checks also pass (134). Twelve sitemap regressions, 552 canonical routes, SEO links and source/rendered catalog parity pass. Manual cloud Chromium: definition task, wrong ODZ, hints, all ten steps of decreasing graph, point/curve visibility and parameter laboratory. Responsive iframe viewports 320 and 390: no horizontal overflow; condition and graph remain within 900px first viewport (320 graph bottom 838px). Dedicated full-host two-browser/ink test runs in CI before merge. Real-learner teaching trial and external review not performed. Native server and parser contracts unchanged. Rejected draft control test was corrected to re-grant control after a participant disconnect, matching the existing server policy; exact catalog/registry counts updated for the new entry.
