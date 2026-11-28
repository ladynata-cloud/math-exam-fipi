# Board registry: adding trainers without breaking unrelated tests

The reviewed authorization manifest is `trainers/board-compat.json`. Adding a
mirror is an explicit capability change, not a global counter update.

1. Implement the trainer, register its ID and version with the bridge, and test
   its math, state limits, and teacher/student behavior.
2. Add one explicit manifest entry with its actual path, versions and flags.
   New structured-state mirrors must use `allowLegacyHtml: false`. The two
   historical legacy exceptions are deliberately asserted by name.
3. Add the relevant picker routes and course links. For a new public learner
   page, add the reviewed public entry if necessary, run
   `python3 tools/build-sitemap.py`, and keep the exact public navigator pair.
4. Run `node --test board-server/test/trainer-registry.test.js` and the trainer's
   own regression tests. CI also checks HTTP, packaged server, and browser
   authorization parity; wait for all affected workflows before merging.

Shared registry tests project their expected permissions independently from the
committed manifest (test-only helper in `tools/fixtures/board-registry-expectations.cjs`).
They must never compare the runtime to itself or assert a fixed catalog size.
They still check exact IDs, paths, versions, state/protocol flags, digest,
file existence, duplicate rejection, and rejection of unregistered paths.
Adding/removing a synthetic mirror is checked against a relative delta.
Trainer-specific tests should continue to assert their own explicit capability
and entry paths; removal/downgrade of an existing capability must be reviewed,
not hidden by regenerating tests.

The historical navigator rollout hashes and provenance are not a live URL
counter. Coverage checks inspect every current sitemap URL, including newly
added public pages; historical receipts and dedicated-interface exceptions
remain strict.

After merging, deployment of both the static site and board server must be
verified; check registry digest/health and a real two-client lesson before
claiming synchronization works in production.
