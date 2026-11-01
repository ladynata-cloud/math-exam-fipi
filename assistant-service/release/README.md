# Cloud release and preview

PR checks create an isolated offline instance with synthetic data, run desktop /
mobile scenarios, test a nonroot Docker image and export that image for 3 days.
This is an ephemeral cloud preview, not a publicly reachable or permanent site.
Screenshots, videos and traces are retained 7 days even on browser failure. Never
use real pupil data or a real pilot key in that fixture.

The manual `MathExam assistant — prepare or publish exact source` workflow runs
only from main. `prepare` creates a source-only manifest and package without any
hosting credential. `publish` additionally needs these **provisioned environment
secrets**, whose presence has not been established by this implementation:

- `ASSISTANT_AMVERA_SSH_KEY`: authorized deployment identity.
- `ASSISTANT_AMVERA_KNOWN_HOSTS`: independently verified Git host public identity.

Use the `assistant-production` GitHub environment. Provisioning identities,
protecting the environment and enabling a permanent separate Amvera preview are
operator actions; this patch does not change permissions or buy infrastructure.
Do not copy a personal browser session or disable host verification. The remote
is fixed to the existing assistant application, never the board application.

Inputs: exact source commit on main, exact currently deployed **source** commit,
and exact current Amvera master **deployment** commit. A stale base or changed
managed file refuses publication. Existing root Amvera configuration, unrelated
files, /data and server settings remain in place. A legacy deployment whose
source/Dockerfile differs must first be reconciled; never bypass that failure.

Rollback uses the same workflow with the previous known working source commit,
the current source as baseline, and current Amvera master as expected deployment.
It creates a new normal commit. This is a code rollback only: it never undoes a
schema migration or rewinds data. Assess schema compatibility before a later
persistence release. A failed health verification does not automatically issue
another deployment or rollback; inspect actual hosting state first.

After push, the workflow requires public health, private offline mode, exact
public asset hashes and (where implemented) exact `/api/version` source identity.
The receipt separates a successful Git push from verified healthy service.
