#!/usr/bin/env python3
"""Local gate for Stepik Content Export v1."""
from __future__ import annotations

from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
commands = [
    [sys.executable, "-m", "unittest", "discover", "-s", "tools/stepik/tests", "-v"],
    [sys.executable, "-m", "py_compile", "tools/stepik/exporter.py", "tools/stepik/export_course.py", "tools/stepik/gate.py", "tools/stepik/tests/test_exporter.py"],
    [sys.executable, "tools/stepik/export_course.py", "--help"],
]
for command in commands:
    subprocess.run(command, cwd=ROOT, check=True)
print("STEPIC_CONTENT_EXPORT_V1_LOCAL_GATE_OK")
