# PR395: authorized main integration and release revalidation

Date: 2026-11-01, Asia/Novosibirsk. Task:
[GRADE6_LCM_NAVIGATION_INTEGRATION_20261101](../tasks/GRADE6_LCM_NAVIGATION_INTEGRATION_20261101.md).

## Result and authorization boundary

The owner's specifically authorized history-preserving branch merge resolves
one documentation heading while retaining the original cabinet/LCM code and
the concurrently released lesson showcase. The same Draft PR395 carries this
continuation. It does not merge PR395 into main or publish the new cabinet.

| Identity | SHA |
| --- | --- |
| Original preparation base | `37718f1c0138ba031314b8f4716b73c9d963bc81` |
| Newly authorized branch-integration base | `2a9e70be5f7648d9fb41ad22236eeab35bf205d0` |
| Original reviewed PR395 head, first merge parent | `7df31a8363cf07e331e6c2ffe2e059f3032848b9` |
| Second merge parent, published PR393 | `2a9e70be5f7648d9fb41ad22236eeab35bf205d0` |
| Previously tested virtual tree with the status conflict | `be313e12f68d1cfd5da0ad6ac999893c798405d4` |
| Resolved merge tree before evidence-only documentation | `9a30c346cbe0f56e301e6c0bb5cc0f04801eedc3` |

The final public head and tree are recorded in the PR body after publication,
avoiding a self-referential commit ID inside its own files. The normal merge
preserves both parents. Evidence-only documentation is a separate logical
commit; no reset, rebase, force update or rewritten ancestor is used.

## Provenance and exact resolution

The only concurrent main commit is the squash of
[PR393](https://github.com/ladynata-cloud/math-exam-fipi/pull/393), whose owner
separately authorized the exact old base and showcase head
`c874b1dc2daaf8dfedbbb455e863830220801cb5`. Its sole parent is the original
PR395 base. The concurrent changes cover 16 paths: public showcase/homepage,
its tests, workflow and reports, and the shared status document.

Read-only `git merge-tree` found one conflict in `docs/PROJECT_STATUS.md`:
the headings "Merged" and "Merged and release recorded" for the already
released PR391. The owner explicitly chose the latter and required all records
from both tasks to survive. The ordinary branch merge made exactly that
resolution. The resolved status file equals the tested virtual status with
only the three conflict markers and alternate heading removed.

The original 114-path PR395 delta is retained in the resolved merge. Every
one of its 113 non-status blobs and modes is exact, including all 18 changed
runtime files under `learning/` and `courses/`. All 15 non-status PR393 blobs
and modes are exact to new main. No backend, authentication, storage, trainer
content, CSS, JavaScript or test assertion is modified by this continuation.

The subsequent documentation changes are limited to this report, the current
task's base/authorization notes, a pointer in the original preparation report,
and the machine-readable revalidation evidence. The shared status file gets
no additional editorial change. Its existing showcase-preparation wording is
retained; the linked PR393 release record carries the later publication fact.

## Revalidation and evidence binding

[Machine-readable evidence](grade6-lcm-navigation-20261101/revalidation-20261101.json)
separates the completed full virtual-tree rerun from the final narrow checks.
The resolved merge tree differs from the tested virtual tree in the status
document alone. Every test, runtime module, source dataset, dependency lockfile,
workflow and public demo dependency therefore has exactly the tested bytes.
All 6,097 tracked files in the tested snapshot were checked against its Git
tree after execution, with zero mismatches.

| Completed virtual-tree revalidation | Result |
| --- | --- |
| Source/static/DOM commands | 21 groups PASS |
| Cabinet/course Node cases | 123 PASS |
| Course Python coverage cases | 10 PASS |
| Combined LCM browser | 15 groups PASS; 10 guided examples and six fresh checks |
| Combined navigation browser | 10 groups PASS |
| Original textbook and helper browsers | 8 + 7 groups PASS |
| Expanded reference browser | PASS at 320, 390 and 1280 px; 168 primes |
| Showcase/SEO commands | 7 groups PASS; 12 Python + 6 Node tests |
| Showcase learner/browser paths | 21 unique cases PASS, 23 executions including two repeated homepage checks |

The LCM matrix preserves all 44 author cards and 203 steps, separate method
attempts, drafts, accepted answers, help provenance and 194 synthetic retained
source attempts. No real pupil attempt is used as a test fixture. Combined
browser runs report no JavaScript errors or unexpected external/provider calls.

Six fresh LCM screenshots received independent visual review at 320, 390 and
1280 px: long factor steps, desktop first screen, history return, topic entry
and the open helper. The current question, answer and check action are clear.
This is a targeted six-image review, not a repeat claim for all 41 original
preparation images. Some lower text and a transient success notification can
still sit behind the closed mobile helper; current answer controls do not.

Final checks after resolving the heading cover exact source and delta identity,
catalog generation, the unchanged arithmetic cases, source/helper projections,
whitespace, conflict-marker removal and evidence sanitation. Full source gates
are carried forward only by the exact tested-byte binding above. Exact-new-head
GitHub CI is recorded separately in PR395; prior-head CI is not relabelled as
new-head CI.

## Failures, environment and limitations

- The initial old-base release attempt stopped as required. Its unresolved
  virtual status also failed `git diff --check` on three conflict markers.
  The owner-authorized resolution removes those markers; this failure history
  is retained rather than silently rewritten.
- Initial local browser starts were blocked by loopback `EPERM`. The same
  gates passed after a scoped local-runtime escalation.
- The expanded-support browser terminated in the optional single-process
  launch mode. A matching-browser download returned an invalid empty archive.
  The unchanged test then passed with the installed Chromium 140 headless
  shell using normal multiprocess defaults. No TLS bypass, assertion change
  or product edit was used. All local browser version claims remain Chromium
  140, not the uninstalled requested revision.
- Node 24.22.1 reported test-file counts for some `node --test` invocations.
  Eleven unchanged files were additionally executed directly, establishing
  their 100 inner cases. Together with eight cabinet and 15 catalogue DOM
  cases, this confirms the 123-case total. Python was 3.12.14; jsdom 26.1.0,
  linkedom 0.18.14 and Playwright 1.62.1 were used.
- The original head's 19 workflows and successful unchanged retry remain
  historical evidence. The initial privacy-assertion failure recorded there
  is not deleted or converted to success.
- Physical phones/keyboards, Safari/Firefox and a real pupil trial were not
  performed. A new production save/resume check remains a post-release gate.

## Independent review and external-review exception

Independent read-only review verified the sole heading resolution, preserved
parent order, exact source/task preservation and evidence carry-forward.
Final published-head review and CI references are attached to the PR body.

The owner's direct "3. Разрешаю" approved the presented version's one-time
HIGH external-review exception: the authorized provider was unavailable and
independent internal review plus technical gates were completed. This is an
owner exception for the unchanged implementation, not an external-provider
approval. No copied approval marker, historical PR389 exception, paid retry
or new provider activation is used. The new head still needs the separate
owner production-release decision.

## New release comparison and next decision

Do not reuse the old full patch ID after the approved status/evidence changes.
The new review baseline is the complete delta from main
`2a9e70be5f7648d9fb41ad22236eeab35bf205d0` to the newly published head. The PR
records its full changed-file set, tree, stable patch ID and exact CI. That
delta, including the authorized documentation, is the one to verify at release.

Immediately before any future production merge, requery authoritative remote
main and compare it with the newly authorized base. Any further base movement
restarts the project's drift guard. The old production authorization remains
invalid; this branch-integration permission does not revive it.

After approval of the exact new base/head, the planned delivery remains the
existing Pages and Amvera board path, followed by public/cabinet byte checks
and permitted saved-continuation verification. Preserve the provider startup
wrapper, settings and `/data`; the unchanged separate assistant needs no
duplicate delivery. Do not separately merge original PR389 or PR392.

Rollback remains the original owner-approved-revert procedure, retaining all
saved records and PR391's matching source/helper pair. No database migration,
credential update, real-profile write or production mutation is performed by
this continuation.
