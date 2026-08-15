# ADR 0002: Isolated Video Factory v1

- Status: Proposed
- Date: 2026-08-15
- Decision owner: ladynata-cloud
- Review class: NEW_ARCHETYPE

## Context

The DVI video studio already knows how to create a variant, describe its scenes,
show each scene and provide Russian narration text. A teacher can preview this
sequence but still has to record every explanation manually. Automated video
creation needs privileged speech credentials, a browser, FFmpeg, durable job
state and significantly more CPU/memory than student progress synchronization.

Running that work inside `board-server` would couple video failures and resource
spikes to student/teacher progress. Passing a credential in a public studio URL
would also leak it through history, screenshots, analytics and referrers.

## Decision

Create `video-worker` as an independently deployed Amvera application.

1. The studio sends a small, validated render request to the worker. It includes
   only a known task (`18`, `19`, `20`), a known preset (`1..3`), format (`16:9`
   or `9:16`), supported speech options and a captions flag.
2. Privileged access uses `Authorization: Bearer …`. The teacher enters the
   secret into the studio session; it is kept in `sessionStorage`, never in a
   URL or committed page. The server stores neither the bearer nor TTS keys.
3. The worker navigates only to its configured trusted studio URL. Clients
   cannot submit a URL, HTML, script, narration or FFmpeg arguments.
4. A file-backed queue under the worker's persistent `/data` is the v1 source of
   truth. An exclusive heartbeat lock and fencing checks prevent overlapping
   containers from replaying the same active job. Interrupted active jobs are
   re-queued only after the new worker owns that lock. Each attempt uses unique
   work and temporary-output names.
5. TTS is behind a provider interface. V1 implements OpenAI and Yandex
   SpeechKit using server-only environment variables.
6. Chromium renders the existing studio API one scene at a time. The worker
   adds a controlled narration caption, takes a frame in the requested aspect
   ratio, and FFmpeg combines each frame and audio segment before concatenating
   an H.264/AAC MP4.
7. Admission is atomic and requires an idempotency key. Global hourly job,
   daily reserved TTS-character, pending-job, retained-media and per-job work
   quotas bound provider cost and disk usage. TTS responses are streamed with a
   byte cap, and subprocesses have deadlines and output-file limits. Provider
   account spend caps remain a mandatory deployment control.
8. Production configuration is fail-closed: startup requires a strong admin
   token, an HTTPS studio URL, explicit allowed origins, a real TTS provider and
   `VIDEO_PERSISTENCE_CONFIRMED=1`. Development may use the mock provider and
   localhost only when `NODE_ENV` is not `production`.
9. The studio treats automation as an enhancement. Preview and script export
   continue to work when the worker is missing or unavailable.

## API boundary

- `GET /healthz` — non-secret health and queue counts.
- `POST /api/v1/jobs` — atomically validate and enqueue a job; bearer and
  `Idempotency-Key` required.
- `GET /api/v1/jobs/:id` — sanitized status; bearer required.
- `GET /api/v1/jobs/:id/video` — stream a ready MP4; bearer required.

Job identifiers are random opaque values. They are not credentials. Every job
endpoint still requires the bearer. Errors and logs are sanitized and never
include request authorization or provider payloads.

## Consequences

### Positive

- video load and failure are isolated from learning/progress traffic;
- no privileged token is embedded in a public student or teacher link;
- the existing authored scenes stay the single teaching-content source;
- a provider can be replaced without changing the studio or render contract;
- the worker can later move media to object storage without changing job APIs.

### Costs and limitations

- Amvera needs a second application, domain, persistent `/data` and secrets;
- file-backed v1 is single-replica and deliberately limited to one renderer;
- the teacher must keep the studio tab/session or re-enter the service secret;
- output is downloadable but not automatically published to video platforms;
- object storage and multi-worker leasing are deferred until real volume needs it.

## Alternatives considered

- **Render in the browser:** rejected because reliable MP4 encoding and TTS keys
  would live on an untrusted client and long renders are fragile.
- **Render inside board-server:** rejected because CPU, browser and disk pressure
  could interrupt durable progress collection.
- **Pass a signed token in each URL:** rejected because the requested links are
  public/shareable and URL credentials leak easily.
- **Adopt a third-party video SaaS immediately:** deferred to avoid coupling the
  authored trainer scenes and private keys to a new external data processor.
- **Multi-worker database queue now:** deferred; it adds operational complexity
  before job volume is known.

## Required acceptance and rollout gates

This ADR is deliberately **Proposed**. It becomes Accepted only when the owner
explicitly accepts the exact Draft PR version after independent review (or a
policy-compliant exact-head waiver). Merge, creation/configuration of the second
Amvera application and production deployment remain separate authorizations.
