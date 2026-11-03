# Standing publication authorization

Owner request, 2026-11-02: allow publications of approved MathExam work without
repeated release consent or mandatory external audit. Review level: SMALL.
Base: 86edc03e88df972ed3eebcd293238a9e10b3b87d.

Scope: reconcile active repository instructions, PR/release workflows, task and
PR templates, drift scenarios and project status. Preserve exact candidate
checks, mathematical/technical gates, provenance and deployment verification.
Later explicit task-specific restrictions override standing permission.
No runtime, access control, branch protection, pupil data or deployment code changes.

Validation: final diff review, git diff --check, JSON/YAML parse, relative links
and active-policy consistency review. Runtime tests not needed for prose only.
External review not performed under the owner's current instruction.
Release: controlled squash merge under OWNER_RELEASE_AUTHORIZATION.md.
Rollback: scoped revert PR if the owner changes the policy.
