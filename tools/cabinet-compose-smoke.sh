#!/usr/bin/env bash
# Run only against a new temporary directory; never use an operator's .env or DB.
# Requires Docker Engine, the Compose plugin, Bash and GNU timeout (Linux CI).
set -Eeuo pipefail
umask 077

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
docker compose version >/dev/null
docker info >/dev/null
work_dir=$(mktemp -d)
project="cabinet-ci-$(date +%s)-$$"
export CABINET_DOMAIN=cabinet.example.test
export DATA_DIR="$work_dir/data"
export CABINET_IMAGE="mathexam-cabinet-ci:$project"
mkdir -m 700 "$DATA_DIR" "$work_dir/backup" "$work_dir/restored"
: > "$work_dir/compose.env"
compose=(docker compose --project-name "$project"
  --env-file "$work_dir/compose.env"
  --project-directory "$repo_root/deploy/cabinet"
  -f "$repo_root/deploy/cabinet/compose.yaml")
dc() { "${compose[@]}" "$@"; }
stage=configuration
cleanup() {
  local result=$?
  trap - EXIT
  dc down --volumes --remove-orphans > "$work_dir/cleanup.log" 2>&1 || true
  docker rm -f "$project-rejected" >/dev/null 2>&1 || true
  # Container-created files may belong to root. The mounted directory is always
  # this script's mktemp directory, never a configured production data path.
  if docker image inspect "$CABINET_IMAGE" >/dev/null 2>&1; then
    docker run --rm --entrypoint sh -v "$work_dir:/ci" "$CABINET_IMAGE" \
      -c 'rm -rf /ci/data /ci/backup /ci/restored' >/dev/null 2>&1 || true
    docker image rm "$CABINET_IMAGE" >/dev/null 2>&1 || true
  fi
  rm -rf "$work_dir"
  if (( result != 0 )); then
    printf 'CABINET_COMPOSE_FAILED: %s (private logs and fixtures are not published)\n' "$stage" >&2
  fi
  exit "$result"
}
trap cleanup EXIT
fail() { printf '%s\n' "$1" >&2; exit 1; }

dc config --quiet
if env -u CABINET_DOMAIN "${compose[@]}" config --quiet > "$work_dir/config.log" 2>&1; then
  fail 'A missing CABINET_DOMAIN must reject the deployment.'
fi
if env -u DATA_DIR "${compose[@]}" config --quiet > "$work_dir/config.log" 2>&1; then
  fail 'A missing DATA_DIR must reject the deployment.'
fi

stage=build
dc build app
stage=bootstrap-and-backup-contracts
dc run --rm --no-deps -T app node --test \
  test/learning-bootstrap.test.js test/learning-backup.test.js
stage=proxy-validation
dc run --rm --no-deps -T caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile

expect_start_rejected() {
  local result=0
  timeout 25 "${compose[@]}" run --rm --no-deps -T --name "$project-rejected" app \
    > "$work_dir/rejected-start.log" 2>&1 || result=$?
  (( result != 0 && result != 124 && result != 137 )) || fail 'Invalid storage did not fail closed promptly.'
}

stage=missing-database
expect_start_rejected
[[ ! -e "$DATA_DIR/learning.sqlite" ]] || fail 'Startup silently created a missing database.'
stage=empty-database
: > "$DATA_DIR/learning.sqlite"
expect_start_rejected
[[ ! -s "$DATA_DIR/learning.sqlite" ]] || fail 'Startup silently initialized an empty database.'
rm "$DATA_DIR/learning.sqlite"
stage=corrupt-database
printf 'invalid-sqlite-fixture\n' > "$DATA_DIR/learning.sqlite"
expect_start_rejected
[[ $(cat "$DATA_DIR/learning.sqlite") == invalid-sqlite-fixture ]] \
  || fail 'Startup replaced a corrupt database.'
rm "$DATA_DIR/learning.sqlite"

stage=explicit-bootstrap
# The existing operator command is the only intentional initialization path.
# Its invitation is never echoed, stored in the repository or uploaded by CI.
dc run --rm --no-deps -T app node learning-admin.js bootstrap ci_teacher 'CI Teacher' \
  > "$work_dir/bootstrap.json" 2> "$work_dir/bootstrap.log"
[[ -s "$work_dir/bootstrap.json" ]] || fail 'Bootstrap did not produce a private invitation.'
dc up -d --wait --wait-timeout 60 app

check_accounts() {
  local fixture="$work_dir/identity.json"
  [[ "$1" != create ]] || fixture="$work_dir/bootstrap.json"
  dc exec -T -e CI_MODE="$1" app node -e '
    const assert = require("node:assert/strict");
    const fs = require("node:fs");
    const base = "http://127.0.0.1:3000/api/learning";
    const origin = process.env.LEARNING_PUBLIC_ORIGIN;
    const password = "SyntheticOnlyCabinet123";
    async function request(route, body, session) {
      return fetch(base + route, {
        method: body ? "POST" : "GET",
        headers: {
          ...(body ? { "Content-Type": "application/json", Origin: origin } : {}),
          ...(session ? { Cookie: session.cookie, "X-CSRF-Token": session.csrf } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(10000)
      });
    }
    (async () => {
      const fixture = JSON.parse(fs.readFileSync(0, "utf8"));
      const statusResponse = await request("/status");
      assert.equal(statusResponse.status, 200, "Cabinet status HTTP response");
      const status = await statusResponse.json();
      assert.equal(status.available, true, "Cabinet storage available");
      assert.equal(status.durable, true, "Cabinet storage durable");
      assert.ok(status.trainers.length > 0, "Trainer contracts loaded");
      if (process.env.CI_MODE === "create") {
        const activated = await request("/activate", { token: fixture.invitationToken, password });
        assert.equal(activated.status, 200, "Explicit teacher activation");
        await activated.arrayBuffer();
        const wrongOrigin = await fetch(base + "/login", {
          method: "POST",
          headers: { "Content-Type": "application/json", Origin: "https://other.example.test" },
          body: JSON.stringify({ login: "ci_teacher", password }),
          signal: AbortSignal.timeout(10000)
        });
        assert.equal(wrongOrigin.status, 403, "A different Origin cannot sign in");
        await wrongOrigin.arrayBuffer();
      }
      const login = await request("/login", { login: "ci_teacher", password, expectedRole: "teacher" });
      assert.equal(login.status, 200, "Teacher can sign in");
      const cookie = login.headers.get("set-cookie");
      assert.ok(cookie && cookie.includes("; Secure") && cookie.includes("; HttpOnly")
        && cookie.includes("SameSite=Strict"), "Production cookie protections retained");
      const account = await login.json();
      assert.equal(account.account.role, "teacher", "Teacher role retained");
      const session = { cookie: cookie.split(";")[0], csrf: account.csrfToken };
      if (process.env.CI_MODE === "create") {
        const created = await request("/teacher/students", { login: "ci_student", name: "CI Student" }, session);
        assert.equal(created.status, 201, "Authenticated student creation");
        await created.arrayBuffer();
      }
      const rosterResponse = await request("/teacher/students", null, session);
      assert.equal(rosterResponse.status, 200, "Teacher can read roster");
      const roster = await rosterResponse.json();
      assert.equal(roster.students.length, 1, "Exactly one persisted synthetic student");
      assert.equal(roster.students[0].login, "ci_student", "Student identity retained");
      if (process.env.CI_MODE === "create") {
        // This output is redirected into a private fixture, never the CI log.
        console.log(JSON.stringify({ teacherId: account.account.id, studentId: roster.students[0].id }));
      } else {
        assert.equal(account.account.id, fixture.teacherId, "Teacher ID survives restart and restore");
        assert.equal(roster.students[0].id, fixture.studentId, "Student ID survives restart and restore");
        console.log("CABINET_API_OK");
      }
    })().catch(error => { console.error(error.message); process.exitCode = 1; });
  ' < "$fixture"
}

stage=first-login
check_accounts create > "$work_dir/identity.json"
stage=restart-persistence
dc restart app
dc up -d --wait --wait-timeout 60 app
check_accounts verify

stage=crash-recovery
dc stop app
crash_result=0
# Force uncommitted pages onto disk, then kill the process without closing SQLite.
# A mere journal filename would not exercise recovery of a hot rollback journal.
dc run --rm --no-deps -T app node -e '
  const { DatabaseSync } = require("node:sqlite");
  const db = new DatabaseSync(process.env.LEARNING_DB_PATH);
  db.exec("PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; PRAGMA cache_size=5; PRAGMA cache_spill=ON");
  db.exec("CREATE TABLE ci_crash_probe(id INTEGER PRIMARY KEY, payload BLOB); BEGIN IMMEDIATE");
  const insert = db.prepare("INSERT INTO ci_crash_probe(payload) VALUES(zeroblob(65536))");
  for (let i = 0; i < 80; i++) insert.run();
  db.exec("COMMIT; BEGIN IMMEDIATE; UPDATE ci_crash_probe SET payload=randomblob(65536)");
  process.kill(process.pid, "SIGKILL");
' > "$work_dir/crash.log" 2>&1 || crash_result=$?
(( crash_result == 137 )) || fail 'Crash fixture did not terminate by SIGKILL.'
dc run --rm --no-deps -T app node -e '
  const assert = require("node:assert/strict"), fs = require("node:fs");
  const { DatabaseSync } = require("node:sqlite");
  const file = process.env.LEARNING_DB_PATH;
  assert.ok(fs.statSync(file + "-journal").size > 512, "Rollback journal was written");
  let db, requiresRecovery = false;
  try {
    db = new DatabaseSync(file, { readOnly: true });
    db.prepare("PRAGMA integrity_check").all();
  } catch (error) { requiresRecovery = /readonly/i.test(error.message); }
  finally { db?.close(); }
  assert.ok(requiresRecovery, "The journal must be genuinely hot before startup");
'
dc up -d --wait --wait-timeout 60 app
check_accounts verify
dc stop app
dc run --rm --no-deps -T app node -e '
  const assert = require("node:assert/strict");
  const { DatabaseSync } = require("node:sqlite");
  const db = new DatabaseSync(process.env.LEARNING_DB_PATH);
  try {
    const rows = db.prepare("SELECT count(*) AS n FROM ci_crash_probe WHERE payload=zeroblob(65536)").get();
    assert.equal(rows.n, 80, "Startup rolled back every uncommitted blob");
    db.exec("DROP TABLE ci_crash_probe");
  } finally { db.close(); }
'

stage=stopped-backup
dc stop app
[[ $(docker inspect --format '{{.State.Running}}' "$(dc ps -aq app)") == false ]] \
  || fail 'The app must be stopped before backup and restore.'
dc run --rm --no-deps -T -v "$work_dir/backup:/backup" app \
  node learning-admin.js backup /backup/checkpoint.sqlite

database_digest() {
  dc run --rm --no-deps -T app node -e '
    const fs = require("node:fs"); const crypto = require("node:crypto");
    console.log(crypto.createHash("sha256").update(fs.readFileSync(process.env.LEARNING_DB_PATH)).digest("hex"));
  ' 2> "$work_dir/digest.log"
}
stage=restore-no-overwrite
before=$(database_digest)
if dc run --rm --no-deps -T -v "$work_dir/backup:/backup" app \
  node learning-admin.js restore /backup/checkpoint.sqlite > "$work_dir/restore.log" 2>&1; then
  fail 'Restore unexpectedly overwrote an existing database.'
fi
[[ $(database_digest) == "$before" ]] || fail 'Rejected restore changed the existing database.'

stage=restore-to-new-volume
export DATA_DIR="$work_dir/restored"
dc run --rm --no-deps -T -v "$work_dir/backup:/backup:ro" app \
  node learning-admin.js restore /backup/checkpoint.sqlite
dc up -d --force-recreate --wait --wait-timeout 60 app
check_accounts verify
printf 'CABINET_COMPOSE_OK\n'
