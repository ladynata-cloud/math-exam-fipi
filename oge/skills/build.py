#!/usr/bin/env python3
"""Build the public skill lessons from reviewed local sources, without network.

Run from any directory: python oge/skills/build.py
The generated page is self-contained; the course landing loads none of it.
"""

from pathlib import Path
import hashlib
import json
import subprocess

ROOT = Path(__file__).resolve().parent
TOPICS = ("topics-arithmetic.json", "topics-functions.json", "topics-geometry.json")
EXPANSIONS = ("expansion-arithmetic.json", "expansion-functions.json", "expansion-geometry.json")
MODULES = (
    "series-arithmetic.js", "series-equations.js", "series-functions.js",
    "series-exam-bridges.js", "series-foundation-bridges.js", "series-runtime.js",
    "exam-format.js", "engine.js",
)

topics = [topic for name in TOPICS
          for topic in json.loads((ROOT / name).read_text(encoding="utf-8"))]
topic_index = {topic["id"]: topic for topic in topics}
routes = []
for topic in topics:
    topic["overviewTaskIds"] = [task["id"] for task in topic["quick"]]
for name in EXPANSIONS:
    expansion = json.loads((ROOT / name).read_text(encoding="utf-8"))
    for addition in expansion["topics"]:
        target = topic_index[addition["topicId"]]
        for key in ("skills", "quick", "creative"):
            target[key].extend(addition.get(key, []))
    for update in expansion.get("skillUpdates", []):
        matches = [skill for topic in topics for skill in topic["skills"]
                   if skill["id"] == update["id"]]
        if len(matches) != 1:
            raise ValueError("Unknown or duplicated skill update: " + update["id"])
        matches[0].update(update)
    routes.extend(expansion.get("routes", []))

data = {
    "version": 3,
    "date": "2026-11-11",
    "status": "Короткая практика, мастерские и карты навыков",
    "scope": "Основы математики и ОГЭ №6–19",
    "limits": [
        "Четыре задания на старте темы — короткая практика, не полный экзаменационный банк.",
        "Карта навыков и мастерские открываются по желанию.",
        "Решения после помощи учитываются отдельно от самостоятельных.",
        "Дополнительные занятия не заменяют все подтипы действующих тренажёров.",
        "Проверка после перерыва запускается по желанию, без внешних напоминаний.",
        "Один результат не подтверждает освоение всей темы.",
        "Результаты этого раздела сохраняются в текущем браузере; синхронизация с кабинетом не подключена.",
    ],
    "topics": topics,
    "routes": routes,
    "sourceDataSha256": {
        name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
        for name in TOPICS + EXPANSIONS
    },
}

(ROOT / "course-data.json").write_text(
    json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
subprocess.run(["node", str(ROOT / "export-series.js")], cwd=ROOT, check=True,
               capture_output=True, text=True, encoding="utf-8")

css = (ROOT / "styles.css").read_text(encoding="utf-8")
layout = (ROOT / "app-fragment.html").read_text(encoding="utf-8")
scripts = "\n".join((ROOT / name).read_text(encoding="utf-8") for name in MODULES)
serialized = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
head = """<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Практика, мастерские и карта навыков ОГЭ | MathExam</title>
<meta name="description" content="Короткие занятия по основам математики и заданиям ОГЭ №6–19. Обычная практика, мастерские по желанию и карта навыков внутри темы.">
<link rel="canonical" href="https://mathexam.space/oge/skills/">
<meta property="og:type" content="website">
<meta property="og:title" content="Практика и карта навыков ОГЭ | MathExam">
<meta property="og:description" content="Выбери тему, потренируйся и при желании разбери её глубже.">
<meta property="og:url" content="https://mathexam.space/oge/skills/">
<style>
html{color-scheme:light dark}body{margin:0;padding:16px 10px;background:light-dark(#f6f7f2,#0d151e)}
@media(max-width:520px){body{padding:8px}}
</style>
"""
page = (head + "<style>\n" + css + "\n</style>\n</head>\n<body>\n" + layout
        + "\n<script>window.OGE_DATA=" + serialized + ";</script>\n<script>\n"
        + scripts + "\n</script>\n</body>\n</html>\n")
(ROOT / "index.html").write_text(page, encoding="utf-8")
catalog = json.loads((ROOT / "series-catalog.json").read_text(encoding="utf-8"))
print(json.dumps({
    "topics": len(topics), "skills": sum(len(t["skills"]) for t in topics),
    "ordinary": sum(len(t["quick"]) for t in topics),
    "workshops": sum(len(t["creative"]) for t in topics),
    "families": len(catalog["families"]), "routes": len(catalog["routes"]),
    "output": "oge/skills/index.html",
}, ensure_ascii=False))
