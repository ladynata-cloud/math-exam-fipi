# Cloud foundation validation — items 1–5

Base: `8307f6aa20651303f5f94b70ae28503832778af5`. Review level HIGH.
The 100-item register is in `docs/assistant-program/progress.json`.

- 173 service tests passed, including immutable source packaging, tamper and
  symlink rejection, normal push, stale-base/baseline rejection, rollback and
  preservation of unrelated synthetic data/configuration, public version bounds
  and HTTP Host guard.
- 10 browser scenarios passed on the real isolated offline service and synthetic
  fixtures. Nine contexts produced nine videos, nine PNGs and nine trace ZIPs.
- Both source-course knowledge integrity gates passed; `git diff --check` passed.
- Workflow action versions are pinned to official action Git SHAs.
- Public version text is rendered as text, never HTML. No private configuration
  is returned. No production data, key or browser session was used.

Not run locally: Docker (unavailable in this runtime), GitHub Actions for this
new head, real Amvera transport/deployment/rollback, permanent hosted preview,
external independent release review. Existing production remains the prior
PR405–407 package; none of these new changes is reported as deployed.

Local publication/rollback tests used temporary bare Git repositories and
synthetic data. They establish the code behavior, not Amvera access or a live
rollback. Cloud credentials must be provisioned before the publication workflow
can be activated. Review and release decisions remain separate from coding.
