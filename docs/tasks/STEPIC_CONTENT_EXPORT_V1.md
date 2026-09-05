# Stepik Content Export v1

## Identity

- Task: `STEPIC_CONTENT_EXPORT_V1`
- Owner: repository owner
- Date: 2026-09-05
- Base branch: `main`
- Base SHA: `5774dbb31a34bc43c73a6fe29ce5af0863d44bf6`
- Base tree: `863d4dbff7e00a5dba30fbe9ee47ff8bd210211e`
- Planned branch: `codex/stepik-content-export-v1`
- Review level: `MEDIUM`
- Related issue or ADR: none

## Goal

Add a small, read-only command-line exporter that preserves an existing Stepik
course's API JSON, structure, module, lesson and step order, and available
`step-sources`, then writes a manifest and a safe teacher-facing table of
contents to an explicitly selected directory outside the repository.

## Context and evidence

- The owner externally verified the base SHA and tree through the GitHub branch
  API and explicitly authorized local development from that snapshot.
- No Stepik API client existed in the repository before this task.
- The requested API root is `https://stepik.org/api/`; the only permitted POST
  is OAuth token acquisition at `https://stepik.org/oauth2/token/`.
- Network access to the supplied official documentation was unavailable in this
  environment. Local behavior is therefore validated against synthetic API
  fixtures and must not be represented as verified real-account compatibility.
- Course ID `294611` is only a proposed ID. A future authorized real run must
  verify the returned course title; the mathematical-likbez course ID is unknown.

## Approved scope

### In scope

- `tools/stepik/`: standard-library Python exporter, tests and owner instructions.
- This task specification.
- A minimal `.gitignore` addition only if required.
- Local commits and a portable binary diff/archive after passing local checks.

### Out of scope

- Any real Stepik request, credential use, or real course export in this task.
- Student data, personal data, attempts, comments, payments, or grades.
- Stepik create, edit, delete, publish, or any other content mutation.
- Site, trainer, board, registry, server, existing-check, workflow, or Git setting changes.
- GitHub Actions, automatic execution, push, PR, merge, deployment, or Stepik changes.

### Files or areas that must not change

- Everything outside `tools/stepik/` and this task specification, except a
  strictly necessary `.gitignore` line.

## Acceptance criteria

- [x] A course ID is required and the course title is obtained from the API.
- [x] Raw JSON responses for courses, sections, units, lessons and step-sources
      are preserved without rewriting learning content.
- [x] Module, unit, lesson and step ordering is retained, including repeated lessons.
- [x] Pagination is followed where exposed by the API.
- [x] Manifest records UTC export time, course identity/title, counts, file SHA-256
      values, errors, unavailable objects, and `COMPLETE`/`INCOMPLETE` status.
- [x] A teacher-facing module → lesson → step HTML table of contents is generated
      by escaping content and never executing received HTML or scripts.
- [x] Referenced media remain links and are labeled as not downloaded; the output
      is not described as an autonomous platform backup.
- [x] Output must be explicitly selected outside both repository and published site.
- [x] Authentication secrets come only from environment variables; tokens and
      authorization data are neither logged nor written to output.
- [x] Only GET is allowed for API reads; the sole POST exception is the exact OAuth
      token URL. Cross-origin redirects never receive authorization.
- [x] Synthetic tests cover order, pagination, repeated lessons, empty course,
      unavailable step-source, authorization failure, timeout, rate limiting,
      incomplete status, and pre-send mutation blocking.

## Checks and gates

- Required tests: `python3 -m unittest discover -s tools/stepik/tests -v`
- Required static checks: `python3 -m py_compile tools/stepik/*.py tools/stepik/tests/*.py`
- Manual checks: CLI help, forbidden in-repository output, secret/path scan.
- Final gate marker: `STEPIC_CONTENT_EXPORT_V1_LOCAL_GATE_OK`
- Not run: real Stepik access, push, PR, merge, deployment.

## Review plan

- Review-level rationale: a new external read-only OAuth/API integration with
  filesystem output, bounded to a standalone tool and no application runtime.
- External review required: owner decision pending under `MEDIUM`.
- Sanitized handoff: code, synthetic fixtures/results, base/head identity, and
  repository-relative paths only; no credentials or real exports.

## Risk and rollback

- Main risks: accidental mutation, credential disclosure, incomplete exports
  appearing complete, unsafe redirect authorization, and order loss.
- Rollback: revert the task commit; the tool has no application runtime hook.
- Data considerations: real exports must stay outside the repository and site.

## Permissions

- `START` granted in current conversation: yes
- Branch creation, local implementation, tests, and local commit: yes
- Push and Draft PR in this iteration: no
- Merge, auto-merge, deployment, and Stepik mutation: no

## Execution record

- Actual branch: `codex/stepik-content-export-v1`
- Actual base SHA/tree: as specified above.
- Tests passed: 14 synthetic unit tests; Python compilation; CLI help; scope,
  secret-pattern, and diff checks; local gate marker emitted.
- Tests failed: none.
- Tests not run: official-document retrieval, real Stepik access, real course-title
  verification, push, PR, merge, and deployment.
- Scope deviations: none.
- Commit: recorded in the final handoff because recording it here would change it.
