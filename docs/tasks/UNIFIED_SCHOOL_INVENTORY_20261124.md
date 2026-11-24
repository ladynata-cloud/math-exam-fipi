# UNIFIED_SCHOOL_INVENTORY_20261124
- Date: 2026-11-24. Review SMALL for read-only repository tooling; no runtime or architecture mutation.
- Base: 85a9971123fc752390c63f9a59e4bcd1be40378e. Branch: audit/unified-school-inventory-20261124. Scope: frozen source-only sitemap inventory and pilot-resource audit, reproducible read-only CLI and tests.
- Owner instruction: sequentially develop MathExam under the Fable strategy and preserve previous work. Latest owner grants publication of agreed changes after checks. No paid APIs or new agents. This task does not approve ADR 0015 or change the educational website.
- Preparation while #749 gates are running: no modification of #749, no separate active pull request until prior task has a clear gate. Existing URLs, site content, sitemap, robots, user storage, offline archives and all workflows unchanged.
- Acceptance: exact source ref, complete tree, 632 unique URLs, reproducible snapshot, fixture tests for bad URLs/missing/symlink, no false HTTP/index claims. Existing SEO scripts remain canonical gates.
- Checks: code-mode executed the exact inventory helper on the full repository Git tree and fixtures; 632/632 regular HTML and zero problem paths. New Node CLI/test not executed in a full local checkout yet; must run on a full checkout containing the pinned commit, before merge. No release/merge claim.
- Rollback: revert only docs and audit tool. No user data.
- [Report](../reports/SCHOOL_JOURNEY_BASELINE_20261124.md).
