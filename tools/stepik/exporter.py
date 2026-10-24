#!/usr/bin/env python3
"""Read-only Stepik course content exporter.

The exporter preserves every received JSON response as bytes and builds separate
navigation metadata. It never calls content mutation endpoints.
"""
from __future__ import annotations

import argparse
import base64
import datetime as dt
import hashlib
import html
import json
import os
from pathlib import Path
import sys
import time
from typing import Any, Callable, Iterator
import urllib.error
import urllib.parse
import urllib.request

API_ROOT = "https://stepik.org/api/"
TOKEN_URL = "https://stepik.org/oauth2/token/"
ALLOWED_HOST = "stepik.org"
USER_AGENT = "MathExam-Stepik-Content-Exporter/1.0"


class ExportError(RuntimeError):
    """A safe, non-secret error suitable for a manifest."""


class AuthorizationError(ExportError):
    pass


class RequestTimeout(ExportError):
    pass


class RateLimitError(ExportError):
    pass


class MethodNotAllowed(ExportError):
    pass


class SafeRedirectHandler(urllib.request.HTTPRedirectHandler):
    """Block every redirect before any follow-up request, including OAuth."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: ANN001
        raise ExportError("HTTP redirect blocked before follow-up request")


class StepikClient:
    """Minimal allowlisted HTTP client: API GET plus exact OAuth-token POST."""

    def __init__(
        self,
        token: str | None = None,
        *,
        timeout: float = 30,
        max_rate_retries: int = 3,
        opener: Any | None = None,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        self._token = token
        self.timeout = timeout
        self.max_rate_retries = max_rate_retries
        self._opener = opener or urllib.request.build_opener(SafeRedirectHandler())
        self._sleep = sleep

    @staticmethod
    def _validate(method: str, url: str) -> None:
        parsed = urllib.parse.urlsplit(url)
        if method == "GET":
            if parsed.scheme != "https" or parsed.hostname != ALLOWED_HOST or not url.startswith(API_ROOT):
                raise MethodNotAllowed("GET is restricted to https://stepik.org/api/")
            return
        if method == "POST" and url == TOKEN_URL:
            return
        raise MethodNotAllowed(f"HTTP method blocked before send: {method}")

    def request(self, method: str, url: str, data: bytes | None = None) -> bytes:
        method = method.upper()
        self._validate(method, url)
        headers = {"Accept": "application/json", "User-Agent": USER_AGENT}
        if self._token and method == "GET":
            headers["Authorization"] = f"Bearer {self._token}"
        request = urllib.request.Request(url, data=data, headers=headers, method=method)
        for attempt in range(self.max_rate_retries + 1):
            try:
                with self._opener.open(request, timeout=self.timeout) as response:
                    return response.read()
            except urllib.error.HTTPError as exc:
                if exc.code in (401, 403):
                    raise AuthorizationError(f"Stepik authorization failed (HTTP {exc.code})") from None
                if exc.code == 429:
                    if attempt >= self.max_rate_retries:
                        raise RateLimitError("Stepik rate limit persisted after retries") from None
                    value = exc.headers.get("Retry-After", "1") if exc.headers else "1"
                    try:
                        delay = min(max(float(value), 0.0), 60.0)
                    except ValueError:
                        delay = 1.0
                    self._sleep(delay)
                    continue
                raise ExportError(f"Stepik request failed (HTTP {exc.code})") from None
            except (TimeoutError, urllib.error.URLError) as exc:
                reason = getattr(exc, "reason", exc)
                if isinstance(reason, TimeoutError) or "timed out" in str(reason).lower():
                    raise RequestTimeout("Stepik request timed out") from None
                raise ExportError("Stepik network request failed") from None
        raise AssertionError("unreachable")

    def get_json(self, url: str) -> tuple[dict[str, Any], bytes]:
        raw = self.request("GET", url)
        try:
            value = json.loads(raw)
        except (UnicodeDecodeError, json.JSONDecodeError):
            raise ExportError("Stepik returned invalid JSON") from None
        if not isinstance(value, dict):
            raise ExportError("Stepik returned a non-object JSON response")
        return value, raw

    @classmethod
    def authenticate_from_environment(cls, **kwargs: Any) -> "StepikClient":
        client_id = os.environ.get("STEPIK_CLIENT_ID")
        client_secret = os.environ.get("STEPIK_CLIENT_SECRET")
        if not client_id or not client_secret:
            raise AuthorizationError(
                "STEPIK_CLIENT_ID and STEPIK_CLIENT_SECRET must be supplied through protected environment settings"
            )
        basic = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
        temporary = cls(**kwargs)
        temporary._validate("POST", TOKEN_URL)
        body = urllib.parse.urlencode({"grant_type": "client_credentials"}).encode()
        request = urllib.request.Request(
            TOKEN_URL,
            data=body,
            headers={
                "Accept": "application/json",
                "Authorization": f"Basic {basic}",
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": USER_AGENT,
            },
            method="POST",
        )
        try:
            with temporary._opener.open(request, timeout=temporary.timeout) as response:
                payload = json.loads(response.read())
        except urllib.error.HTTPError as exc:
            raise AuthorizationError(f"Stepik OAuth failed (HTTP {exc.code})") from None
        except (TimeoutError, urllib.error.URLError):
            raise RequestTimeout("Stepik OAuth request timed out") from None
        except (UnicodeDecodeError, json.JSONDecodeError):
            raise AuthorizationError("Stepik OAuth returned invalid JSON") from None
        token = payload.get("access_token") if isinstance(payload, dict) else None
        if not isinstance(token, str) or not token:
            raise AuthorizationError("Stepik OAuth response did not contain an access token")
        return cls(token=token, **kwargs)

    def paginated(self, path: str) -> Iterator[tuple[dict[str, Any], bytes, str]]:
        url = urllib.parse.urljoin(API_ROOT, path)
        while url:
            payload, raw = self.get_json(url)
            yield payload, raw, url
            meta = payload.get("meta", {})
            if not isinstance(meta, dict):
                raise ExportError("Stepik pagination meta is not an object")
            has_next = bool(meta.get("has_next") or meta.get("has-page-next"))
            if not has_next:
                break
            parsed = urllib.parse.urlsplit(url)
            query = urllib.parse.parse_qs(parsed.query, keep_blank_values=True)
            current = int((query.get("page") or [1])[-1])
            query["page"] = [str(current + 1)]
            url = urllib.parse.urlunsplit(parsed._replace(query=urllib.parse.urlencode(query, doseq=True)))


def _objects(payload: dict[str, Any], key: str) -> list[dict[str, Any]]:
    if key not in payload:
        raise ExportError(f"Stepik response field {key!r} is missing")
    value = payload[key]
    if not isinstance(value, list):
        raise ExportError(f"Stepik response field {key!r} is not a list")
    if any(not isinstance(item, dict) for item in value):
        raise ExportError(f"Stepik response field {key!r} contains a non-object")
    return value


def _valid_id(value: Any) -> bool:
    return type(value) is int and value > 0


class CourseExporter:
    def __init__(self, client: StepikClient, output: Path, *, now: Callable[[], dt.datetime] | None = None):
        self.client = client
        self.output = output
        self.now = now or (lambda: dt.datetime.now(dt.timezone.utc))
        self.errors: list[dict[str, Any]] = []
        self.unavailable: list[dict[str, Any]] = []
        self.written: list[Path] = []

    def _write_raw(self, relative: str, raw: bytes) -> None:
        path = self.output / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(raw)
        self.written.append(path)

    def _write_json(self, relative: str, value: Any) -> None:
        self._write_raw(relative, (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode())

    def _references(self, obj: dict[str, Any], key: str, resource: str) -> list[int]:
        value = obj.get(key)
        if not isinstance(value, list):
            self.errors.append({"resource": resource, "id": obj.get("id"),
                                "error": f"required field {key!r} missing or not a list"})
            return []
        if any(not _valid_id(item) for item in value):
            self.errors.append({"resource": resource, "id": obj.get("id"),
                                "error": f"field {key!r} contains a non-positive-integer ID"})
        return [item for item in value if _valid_id(item)]

    def _get_one(self, resource: str, object_id: int) -> dict[str, Any] | None:
        try:
            if not _valid_id(object_id):
                raise ExportError("requested ID must be a positive integer")
            payload, raw = self.client.get_json(f"{API_ROOT}{resource}/{object_id}")
            self._write_raw(f"raw/{resource}/{object_id}.json", raw)
            values = _objects(payload, resource)
            if len(values) != 1:
                raise ExportError("expected exactly one object in response")
            if not _valid_id(values[0].get("id")) or values[0]["id"] != object_id:
                raise ExportError("response ID does not match requested ID")
            return values[0]
        except ExportError as exc:
            self.errors.append({"resource": resource, "id": object_id, "error": str(exc)})
            self.unavailable.append({"resource": resource, "id": object_id})
            return None

    def _get_pages(self, resource: str, query: str, batch: int,
                   requested: set[int]) -> list[dict[str, Any]]:
        found: list[dict[str, Any]] = []
        try:
            for index, (payload, raw, _url) in enumerate(self.client.paginated(f"{resource}?{query}"), 1):
                self._write_raw(f"raw/{resource}/batch-{batch}-page-{index}.json", raw)
                for item in _objects(payload, resource):
                    if not _valid_id(item.get("id")) or item["id"] not in requested:
                        self.errors.append({"resource": resource, "batch": batch,
                                            "error": "response ID outside requested set or invalid"})
                        continue
                    found.append(item)
        except ExportError as exc:
            self.errors.append({"resource": resource, "batch": batch, "error": str(exc)})
        return found

    def _get_referenced_collection(self, resource: str, ids: list[int]) -> list[dict[str, Any]]:
        found: list[dict[str, Any]] = []
        for batch, start in enumerate(range(0, len(ids), 100), 1):
            requested = ids[start : start + 100]
            query = urllib.parse.urlencode([("ids[]", item) for item in requested])
            found.extend(self._get_pages(resource, query, batch, set(requested)))
        return found

    def export(self, course_id: int) -> dict[str, Any]:
        course = self._get_one("courses", course_id)
        if course is None:
            course = {"id": course_id, "sections": []}
        title = course.get("title")
        if not isinstance(title, str) or not title.strip():
            self.errors.append({"resource": "courses", "id": course_id, "error": "course title missing"})
            title = "(title unavailable)"

        section_order = self._references(course, "sections", "courses")
        sections = self._get_referenced_collection("sections", section_order)
        sections_by_id = {item["id"]: item for item in sections}
        unit_orders = {key: self._references(section, "units", "sections")
                       for key, section in sections_by_id.items()}
        unit_ids = [unit_id for section_id in section_order
                    for unit_id in unit_orders.get(section_id, [])]
        units = self._get_referenced_collection("units", unit_ids)
        units_by_id = {item.get("id"): item for item in units}

        lesson_cache: dict[int, dict[str, Any] | None] = {}
        step_cache: dict[int, dict[str, Any] | None] = {}
        structure_modules: list[dict[str, Any]] = []
        unique_lessons: set[int] = set()
        unique_steps: set[int] = set()

        for section_id in section_order:
            section = sections_by_id.get(section_id)
            if section is None:
                self.errors.append({"resource": "sections", "id": section_id, "error": "referenced section unavailable"})
                self.unavailable.append({"resource": "sections", "id": section_id})
                continue
            unit_order = unit_orders[section_id]
            module = {"section_id": section_id, "title": section.get("title", ""), "lessons": []}
            for unit_id in unit_order:
                unit = units_by_id.get(unit_id)
                if unit is None:
                    self.errors.append({"resource": "units", "id": unit_id, "error": "referenced unit unavailable"})
                    self.unavailable.append({"resource": "units", "id": unit_id})
                    continue
                lesson_id = unit.get("lesson")
                if not _valid_id(lesson_id):
                    self.errors.append({"resource": "units", "id": unit_id, "error": "lesson reference missing"})
                    continue
                if lesson_id not in lesson_cache:
                    lesson_cache[lesson_id] = self._get_one("lessons", lesson_id)
                lesson = lesson_cache[lesson_id]
                unique_lessons.add(lesson_id)
                lesson_entry = {"unit_id": unit_id, "lesson_id": lesson_id, "title": "", "steps": []}
                if lesson is not None:
                    lesson_entry["title"] = lesson.get("title", "")
                    step_ids = self._references(lesson, "steps", "lessons")
                    for step_id in step_ids:
                        unique_steps.add(step_id)
                        if step_id not in step_cache:
                            step_cache[step_id] = self._get_one("step-sources", step_id)
                        source = step_cache[step_id]
                        lesson_entry["steps"].append({"step_id": step_id, "available": source is not None})
                module["lessons"].append(lesson_entry)
            structure_modules.append(module)

        structure = {"course_id": course_id, "title": title, "modules": structure_modules}
        self._write_json("structure.json", structure)
        self._write_toc(structure)
        checksums = self._checksums()
        manifest = {
            "status": "INCOMPLETE" if self.errors or self.unavailable else "COMPLETE",
            "exported_at": self.now().astimezone(dt.timezone.utc).isoformat().replace("+00:00", "Z"),
            "course": {"id": course_id, "title": title},
            "counts": {
                "modules": len(structure_modules),
                "lessons": len(unique_lessons),
                "steps": len(unique_steps),
            },
            "files": checksums,
            "errors": self.errors,
            "unavailable_objects": self.unavailable,
            "media_policy": "Links retained; referenced files were not downloaded.",
            "backup_scope": "Content export; not a complete autonomous backup of Stepik.",
        }
        manifest_path = self.output / "manifest.json"
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return manifest

    def _checksums(self) -> list[dict[str, Any]]:
        entries = []
        for path in sorted(self.written):
            data = path.read_bytes()
            entries.append({
                "path": path.relative_to(self.output).as_posix(),
                "sha256": hashlib.sha256(data).hexdigest(),
                "bytes": len(data),
            })
        return entries

    def _write_toc(self, structure: dict[str, Any]) -> None:
        out = [
            "<!doctype html><meta charset=\"utf-8\">",
            "<title>Stepik course export contents</title>",
            f"<h1>{html.escape(str(structure['title']))}</h1>",
            "<p><strong>Content export only.</strong> Linked media files were not downloaded. "
            "This is not a complete autonomous backup of Stepik.</p>",
        ]
        for module in structure["modules"]:
            out.append(f"<section><h2>{html.escape(str(module['title']))}</h2><ol>")
            for lesson in module["lessons"]:
                out.append(f"<li>{html.escape(str(lesson['title']))}<ol>")
                for step in lesson["steps"]:
                    status = "available" if step["available"] else "unavailable"
                    out.append(f"<li>Step {int(step['step_id'])} — {status}</li>")
                out.append("</ol></li>")
            out.append("</ol></section>")
        out.append("<p>External images, videos and attachments: file not downloaded.</p>")
        self._write_raw("contents.html", ("\n".join(out) + "\n").encode())


def validate_output_directory(path: Path, repo_root: Path) -> Path:
    output = path.expanduser().resolve()
    repo = repo_root.resolve()
    try:
        output.relative_to(repo)
    except ValueError:
        pass
    else:
        raise ExportError("Output directory must be outside the repository and published site")
    if output == Path(output.anchor):
        raise ExportError("Refusing to use a filesystem root as output directory")
    if output.exists() and any(output.iterdir()):
        raise ExportError("Output directory must be new or empty")
    return output


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Read and preserve an existing Stepik course as JSON")
    parser.add_argument("course_id", type=int, help="existing Stepik course ID")
    parser.add_argument("--output", required=True, type=Path, help="new/empty directory outside this repository")
    parser.add_argument("--timeout", type=float, default=30, help="request timeout in seconds")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.course_id <= 0:
        print("error: course_id must be a positive integer", file=sys.stderr)
        return 2
    repo_root = Path(__file__).resolve().parents[2]
    try:
        output = validate_output_directory(args.output, repo_root)
        output.mkdir(parents=True, exist_ok=True)
        client = StepikClient.authenticate_from_environment(timeout=args.timeout)
        manifest = CourseExporter(client, output).export(args.course_id)
    except ExportError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    print(f"Export {manifest['status']}: {output}")
    return 0 if manifest["status"] == "COMPLETE" else 3


if __name__ == "__main__":
    raise SystemExit(main())
