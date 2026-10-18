# Search discovery: division by estimation

## Identity and goal

- Owner: MathExam site owner; request accepted in the current conversation.
- Date: 2026-10-19 (Asia/Novosibirsk).
- Base: `main` at `5c61b0bc12ad9aaebfdb8484cc9987bccb59474a`.
- Branch: `content/seo-division-estimation-20261019`.
- Review: SMALL; static explanatory content using existing page components.
- Goal: help unfamiliar learners find a useful division explanation and enter
  the existing practice, including choosing a quotient digit by estimation.
- No architecture or ADR change.

## Context and evidence

- The existing public topic has a worked 276 : 12 example, decimal division,
  a self-canonical URL and trainer links. It lacks the common «столбиком» name
  and a worked estimation explanation.
- Wordstat's Popular view was inspected for «деление уголком» and «деление
  столбиком»: all regions and all device types, displayed period
  08.09.2026–07.10.2026. Relevant broad rows included «деление в столбик
  объяснение» (6,915), «деление в столбик тренажер» (5,474), «как объяснить
  ребенку деление столбиком» (4,437), and «как научиться делению в столбик»
  (2,046). These overlapping query counts are not unique people, exact-match
  demand or predicted visits. The service warned some data may be unavailable.
- «Уголком» also returned polynomial-division queries; this page concerns
  arithmetic with numbers, not polynomial division.
- PR261 is merged at the named base. Its release record reports Pages
  39176065477 succeeded and 83/83 production asset comparisons passed.
  This task does not rerun or claim new verification of learner/account flows.

## Approved scope

- Update only the division topic's visible copy and consistent metadata.
- Add estimation, exact multiplication/remainder checks and both corrections.
- Link to the existing focused quotient-estimation trainer.
- Regenerate the sitemap if the new public link adds a discovered route.
- Record a short promotion brief and a post-publication measurement procedure.
- Reconcile the current project status within this task.
- Preserve URL, canonical, shared styles, all trainer runtimes, saved learner
  state, other topics, verification files and sitemap generation rules.
- Fractions, video production, posting to social networks, paid advertising,
  account changes and deployment are outside this first implementation.

## Acceptance and checks

- One readable H1; title, description, Open Graph, Twitter and JSON-LD agree.
- Explanation is useful without JavaScript and all arithmetic is correct.
- Existing links work and the estimation link names its destination clearly.
- Existing sitemap tests, sitemap freshness and SEO checks with base
  preservation; focused math/link review and `git diff --check`.
- Attempt desktop/narrow-screen preview; record an environment block honestly.
- Final gate: `SEO_DIVISION_ESTIMATION_OK` when applicable checks pass.
- Runtime/backend regression suites are not required: no runtime changes.

## Review, risk and rollback

SMALL self-review; no external provider review required. Main risks are
misleading estimation wording or broken navigation. Revert this focused page
change to roll back; URLs and saved attempts remain compatible. Rankings and
traffic improvements are not guaranteed. Keep handoffs free of credentials,
private learner data and machine-specific paths.

## Permissions

The owner's «давай, хорошо» authorizes this scoped implementation, branch,
local commits, push and Draft PR. Merge, auto-merge and deployment require a
separate decision under AGENTS.md and the mathexam-pr skill.

## Execution and handoff

The new link makes the existing quotient-estimation trainer discoverable by
the sitemap builder. The first freshness check correctly reported one missing
URL; regeneration adds that one route without changing generation rules.
The browser could not reach the local preview server (connection refused), so
desktop and narrow-screen visual verification remain not run. Shared layout
and styles are unchanged; this limitation must remain visible in the PR.

Actual base and branch are the identity above. Exact final head, PR, passed,
failed and not-run checks, gate and next owner decision are recorded in the
PR's EXECUTIVE STATUS report. No publication is inferred from a passing gate.
