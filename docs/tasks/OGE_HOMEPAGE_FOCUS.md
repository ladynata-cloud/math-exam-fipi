# OGE-first homepage
## Identity
- Owner: repository owner; direct request in current conversation to make OGE central.
- Date: 2026-10-07.
- Base: main, 5092ccd5750db9e260a743d96b1e706449721824.
- Branch: content/oge-homepage-focus-20261007.
- Review level: SMALL.
## Goal
Make OGE mathematics the primary homepage route with simple choices and retain access to other courses.
## Context and evidence
The base index.html foregrounds grade 7. Existing OGE course provides topic, foundation, geometry and variant links.
PROJECT_STATUS still labels logarithmic inequalities in progress; base commit already merged that work in PR #200. No status-only changes are included.
## Approved scope
Only index.html and this task record. Update title, description, navigation, hero and primary cards; place other courses below OGE. Preserve existing additional resources and author/contact sections. Reuse existing CSS with page-local responsive adjustments.
No trainers, learner records, board, authentication, shared CSS or backend changes.
## Acceptance criteria
- OGE leads title, H1, navigation and primary action.
- Three initial choices: course, foundations, diagnostic for tasks 1–5.
- Diagnostic is explicitly limited, not represented as a full exam.
- Other school/EGE courses remain accessible.
- Internal target paths exist; HTML nesting, IDs and anchors pass.
## Checks and gates
- Self-review of complete diff.
- HTMLParser nesting, unique IDs, single H1 and local anchors: passed.
- All homepage internal paths checked against complete base Git tree: passed.
- OGE course part1 and geometry anchors verified in source.
- git diff --no-index --check on source snapshots: no whitespace diagnostics.
- Gate: OGE_HOME_STATIC_OK.
- Browser rendering and full runtime suites not run: source-only navigation edit; no runtime scripts changed. Visual layout not independently browser-verified.
## Review and risk
External review optional for SMALL; not requested or claimed.
Risk: visual wrapping or accidental navigation regression. Responsive wrapping rules added; target paths checked.
Rollback: restore index.html from base in a reviewed follow-up. No data migration.
## Permissions
Current direct user instruction authorizes implementation, branch and Draft PR.
Merge, auto-merge and deployment require separate owner authorization under AGENTS.md and mathexam-pr.
## Execution
Source retrieved through GitHub connector at fixed base. Local source snapshots used for checks; full clone unavailable in restricted network.
Two-file commit and Draft PR only. No merge or deployment.
