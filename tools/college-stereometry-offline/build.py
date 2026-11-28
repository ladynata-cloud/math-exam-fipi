"""Build or check the editable ZIP directly from the published lesson sources."""

import argparse
import io
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


ROOT = Path(__file__).resolve().parents[2]
TOOLS = Path(__file__).resolve().parent
LESSON = ROOT / "trainers/college-stereometry/pyramids"
VIEWER = ROOT / "stereo-course/assets"
PACKAGE_NAME = "college-stereometry-lesson-6-package.zip"
DOWNLOAD_PATH = f"/downloads/trainers/college-stereometry-lesson-6/{PACKAGE_NAME}"
PACKAGE = ROOT / DOWNLOAD_PATH.lstrip("/")


def offline_index():
    html = (LESSON / "index.html").read_text(encoding="utf-8")
    replacements = (
        ('  <link rel="canonical" href="https://mathexam.space/trainers/college-stereometry/pyramids/">\n', ""),
        ("../../../stereo-course/assets/", ""),
        (' href="/" target="_self" data-mathexam-home-link aria-label="На главную MathExam"',
         ' href="#research" aria-label="К исследованию"'),
        ('aria-label="Навигация по курсу"', 'aria-label="Офлайн-комплект"'),
        ('        <a href="../lessons/#lesson-5">← Урок 5</a>\n', ""),
        ('        <a href="../">Все 6 уроков</a>', '        <a href="guide.html">Как изменить задание</a>'),
        (f'        <a class="primary" href="{DOWNLOAD_PATH}" download>Скачать тренажёр (ZIP)</a>\n', ""),
        ('<a href="../../../">На главную</a><a href="../../">Все тренажёры</a>',
         '<a href="#research">К исследованию</a><a href="guide.html">Инструкция</a>'),
    )
    for old, new in replacements:
        expected = 2 if old == "../../../stereo-course/assets/" else 1
        if html.count(old) != expected:
            raise ValueError(f"Review offline HTML conversion for {old!r}")
        html = html.replace(old, new)
    return html.encode("utf-8")


def build():
    files = {"index.html": offline_index(), "LICENSE": (ROOT / "LICENSE").read_bytes()}
    for folder, names in (
        (LESSON, ("content.js", "lesson.css", "lesson.js")),
        (VIEWER, ("task-scenes.css", "task-scene-viewer.js")),
        (TOOLS, ("guide.html", "edit-homework.gif")),
    ):
        for name in names:
            files[name] = (folder / name).read_bytes()
    buffer = io.BytesIO()
    with ZipFile(buffer, "w") as archive:
        for name, data in files.items():
            info = ZipInfo(name, (2026, 11, 16, 0, 0, 0))
            archive.writestr(info, data, compress_type=ZIP_DEFLATED, compresslevel=9)
    return buffer.getvalue()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Check the tracked ZIP against its sources")
    args = parser.parse_args()
    bundle = build()
    if args.check:
        if not PACKAGE.is_file() or PACKAGE.read_bytes() != bundle:
            parser.exit(1, "Lesson 6 ZIP must be rebuilt with this script.\n")
        print("Lesson 6 ZIP matches its sources.")
    else:
        PACKAGE.parent.mkdir(parents=True, exist_ok=True)
        PACKAGE.write_bytes(bundle)
        print(PACKAGE.relative_to(ROOT))
