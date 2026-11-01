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
external provider review (not performed under the active standing owner policy). Existing production remains the prior
PR405–407 package; none of these new changes is reported as deployed.

Local publication/rollback tests used temporary bare Git repositories and
synthetic data. They establish the code behavior, not Amvera access or a live
rollback. Cloud credentials must be provisioned before the publication workflow
can be activated. The standing authorization covers release after technical checks; no further publication permission is pending.

PR409 initial head f89da2a was based on 8307f6a. Main advanced through unrelated
PR398 and governance PR408 to 441069556e65fddf0f0485533f746d080b025114.
The virtual merge was clean (tree 3fbc5c445650f2754e23a7ce0e3da6073e9bbfaa).
An ordinary merge preserved both changes; only this task's authorization text
was then reconciled with the new project-wide policy. No runtime conflict.
