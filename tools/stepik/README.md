# Stepik Content Export v1

This is a deliberately read-only, standard-library Python exporter for an
**existing** Stepik course. It reads `https://stepik.org/api/`, preserves the
received course/section/unit/lesson/step-source JSON, and creates a manifest and
an escaped teacher-facing table of contents. Linked media are not downloaded,
so the result is **not** a complete autonomous backup of Stepik.

## Security boundary

- API content requests are GET-only.
- The only permitted POST is OAuth client-credentials token acquisition at the
  exact URL `https://stepik.org/oauth2/token/`.
- There are no create, update, delete or publish commands.
- All HTTP redirects are blocked before a follow-up request, including API and OAuth redirects.
- TLS verification remains enabled.
- Credentials are read only from `STEPIK_CLIENT_ID` and `STEPIK_CLIENT_SECRET`.
  The token stays in memory and is never written or logged.
- The exporter does not request students, attempts, comments, payments or grades.
- Output is rejected if it is inside this repository (including its published site).

## Local verification without credentials

```bash
python3 -m unittest discover -s tools/stepik/tests -v
python3 -m py_compile tools/stepik/*.py tools/stepik/tests/*.py
python3 tools/stepik/export_course.py --help
```

The tests use only artificial API responses. They do not prove access to a real
Stepik account or compatibility with the current live API.

## Completeness and partial results

`sections`, `units`, and `steps` must be present as lists. IDs must be positive
integers; booleans, strings, and other types are rejected. Response collections
must be lists of objects, singular IDs must match the request, and batch IDs
must belong to the requested set. Violations produce errors and `INCOMPLETE`;
received JSON is saved before these checks. A valid `sections=[]` is complete.

Pagination yields one page at a time. Each page is written before requesting
the next, so a later timeout leaves earlier pages and their checksums on disk.
An unavailable course produces an `INCOMPLETE` manifest when output is writable.
Authentication failure before a course request remains a CLI error.

The PR #117 correction passed 24 synthetic tests, including missing fields,
invalid IDs and response shapes, page-two timeout retention, API/OAuth redirect
blocking, preserved order/reused lessons, and recalculated SHA-256 checksums.
Use `python3 tools/stepik/gate.py` for tests, compilation, and CLI help.
On Windows set `PYTHONUTF8=1` for the process and `PYTHONPYCACHEPREFIX` to an
external temporary directory; do not change system settings or store logs here.

## Later, explicitly authorized cloud run

Do not put credentials, tokens, or exports in the repository. In an environment
where protected variables remain available to the command being executed, set
`STEPIK_CLIENT_ID` and `STEPIK_CLIENT_SECRET`, then explicitly run:

```bash
python3 tools/stepik/export_course.py 294611 --output /outside/repository/stepik-294611
```

`294611` is only the proposed course ID from the owner conversation. Before
accepting an export, inspect `manifest.json` and verify that `course.title` is
the intended “ОГЭ по математике 2026: задания 1–5 без ошибок” course. Do not
reuse a lesson ID as a course ID. The mathematical-likbez course ID is unknown
and must not be guessed.

Codex Cloud secrets are available to a setup script but are removed before the
agent phase. Do not work around that boundary by copying secrets or tokens into
files. Instead, use a separate explicitly initiated trusted job or terminal in
which protected environment variables are available for the duration of this
single exporter command. Do not configure the exporter to run on every future
Codex task.

A successful process exit means the requested objects were read. It is still
necessary to confirm the course title and that `manifest.status` is `COMPLETE`.
An `INCOMPLETE` export retains its errors and unavailable-object list and exits
with status 3; do not treat it as a successful complete export.
