---
name: trainer-inventory
description: Run the read-only MathExam Trainer Factory inventory, provenance, dependency, storage, publication-surface, and collision audit. Use when classifying tracked trainer HTML files or an explicitly owner-approved intake root before any publication task.
---

# Trainer inventory

Produce evidence for an owner decision. Never publish, authorize a trainer,
change runtime metadata, or infer permission from a discovered file.

## Preconditions

1. Read `AGENTS.md`, `docs/tasks/TRAINER_FACTORY_V1.md`,
   `docs/tasks/TRAINER_FACTORY_INVENTORY_V1.md`, and
   `docs/REVIEW_POLICY.md`.
2. Confirm the exact approved base, branch, and clean worktree.
3. Treat `trainers/board-compat.json` as runtime source data and its validated
   server projection as runtime authority.
4. Require an explicit owner-provided path and permission before using
   `--intake-root`. Never search the machine for unpublished trainers.

## Run the inventory

Run the repository cohort:

```text
node tools/trainer-inventory/cli.mjs
```

Use `--intake-root <path>` only for the exact owner-approved root. The tool must
remain read-only for all inputs. Generated output belongs under
`tools/trainer-inventory/.output/`, which is ignored by Git.

The run must:

- compute stable candidate IDs, byte hashes, sizes, canonical paths, canonical
  public URLs, and reference evidence;
- inventory assets, origins, network, storage, script, style, iframe, Bridge,
  Socket.IO, and state-contract signals without executing candidate code;
- report the four publication surfaces independently;
- cross-check, but never replace or grant, runtime manifest authority;
- classify exact duplicates, canonical-path and URL collisions, and unresolved
  provenance fail-closed;
- continue after a per-candidate parse error and report the error;
- produce deterministic machine JSON, a human summary, and a sanitized handoff.

## Validate

Run:

```text
node --test tools/trainer-inventory/test/*.test.mjs
node tools/trainer-inventory/cli.mjs --check
node tools/trainer-inventory/gate.mjs
```

`--check` is a scoped inventory check and may emit only
`TRAINER_FACTORY_INVENTORY_V1_CHECK_OK`. It does not prove the Phase 1 test,
server-regression, committed-diff, or clean-worktree gates. Only `gate.mjs`
runs the complete sequence above, including the board-server regression and
committed `git diff --check`, and may emit
`TRAINER_FACTORY_INVENTORY_V1_GATE_OK`. Any failed subprocess or dirty
worktree prevents the full marker.

The gate must cover the committed public-URL conformance fixture, descriptor
schema, manifest equality checks, Pilot A, at least 5,000 synthetic candidates,
malformed HTML, missing assets, storage/network signals, unsafe path text,
deterministic repeat and incremental reuse, read-only input hashes, ignored
outputs, and absence of outbound requests.

## Stop conditions

Stop and report instead of editing or publishing when:

- a candidate has unknown provenance or lacks usage authority;
- any duplicate `trainerId`, full canonical path, ASCII case-fold path,
  normalized public URL, or unresolved exact-blob duplicate exists;
- a repeated descriptor runtime field differs from the current manifest;
- a candidate requires platform-core, Bridge, registry endpoint, Socket.IO,
  security, authentication, or deployment changes;
- the approved base or scope changes.

Passing inventory is evidence only. It is not owner approval for a track, URL,
site discovery, board discovery, batch membership, mirror behavior, push,
merge, or deployment. Stop with
`TRAINER_FACTORY_INVENTORY_V1_GATE_OK` only when every Phase 1 gate passes.
