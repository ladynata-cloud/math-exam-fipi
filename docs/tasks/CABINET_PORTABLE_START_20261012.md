# Portable cabinet launch after a hosting outage

## Identity

- Date: 2026-10-12
- Base branch: `main`
- Base SHA: `6d3eb6391ece697d5b5217817dbdbc2653090da4`
- Branch: `ops/cabinet-portable-start-20261012`
- Review level: `HIGH` (deployment and persistent student data)
- Architecture: [ADR 0010](../adr/0010-unified-learning.md), `Accepted`

## Goal and authority

Prepare the existing cabinet application to run on a separately selected VPS,
with a durable database, HTTPS, and an explicit fresh-account setup procedure.
The owner requested migration away from the unavailable host and subsequently
authorized recreating all accounts from scratch because the relevant pupils
had not yet worked in their cabinets. This authorizes preparation; no server,
subscription, location, or purchase has been selected in this task.

An existing recovery archive has been preserved privately. Its age no longer
blocks a fresh launch. No archive, pupil roster, credential, or database belongs
in this repository. Do not erase or overwrite the old deployment or archive.

## Scope

- Portable Docker Compose configuration reusing the existing root Dockerfile.
- A single application instance, explicit persistent host storage, and a Caddy
  reverse proxy with a separately configured cabinet hostname.
- Fail closed on ordinary startup if the database is missing, empty, or invalid.
- Deliberate first-teacher setup with the existing operator CLI; subsequent
  pupil and parent creation uses the existing teacher interface.
- Russian operator instructions for backup, restore, update and rollback.
- Isolated CI exercising the actual container and persistence workflow using
  synthetic accounts only.

Excluded: account/schema/authentication changes, new curriculum, GitHub Pages
or public-link changes, live DNS edits, provider purchases, live deployment,
production account creation, and removal of the old environment. A hostname in
an example is a proposal, not an existing or verified endpoint.

## Acceptance and gates

- Compose does not publish the application port and requires an explicit host
  directory and hostname.
- Restart retains the same synthetic account and database.
- Ordinary startup refuses missing or invalid database files; explicit bootstrap
  is the only documented way to start a fresh database.
- Existing stopped-server backup and new-destination restore are exercised.
- Private invitations and data do not enter CI logs, artifacts, or Git.
- Run `git diff --check`, shell syntax checks, independent diff review, and the
  dedicated Docker Compose workflow.
- Run relevant existing bootstrap/backup tests locally when dependencies allow.
- Full curriculum/browser gates are not required for this deployment-only diff;
  no application or trainer source is changed. Actual HTTPS/DNS, external backup
  delivery and real account login must be verified on the selected VPS later.
- Final gate: `CABINET_PORTABLE_START_OK` only after container checks pass.

## Review, risks and rollback

Independent review is required. External review remains pending under the
repository HIGH policy; no old waiver is represented as current review evidence.
Remote review content must exclude private roster, secrets and databases.

Risks: wrong hostname/Origin, missing volume, database locking with multiple
processes, loss of the only backup, and assuming a successful HTTP response is
proof of successful persistence. One process owns SQLite. Operator database
commands run with the application stopped. Backups must also be copied to a
separate provider and their restoration checked before calling them operational.

Rollback before launch is removal of the unmerged preparation branch. After an
authorized launch, stop the new application, retain its current private data,
and use the prior verified image with compatible data or restore a verified
snapshot into a new directory. Never overwrite a database or silently replace
new work with the preserved historical archive.

## Permissions and execution

The current migration request authorizes a scoped branch, implementation, tests,
commit, push and Draft PR. Merge/release and purchases are not performed here.
Provider access and the chosen destination remain prerequisites for deployment.
Test results, review findings and exact head SHA are recorded in the Draft PR.
