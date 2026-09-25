#!/bin/bash
# Изолированный прогон одного банка в Chromium (для правки банка, не для выкладки).
#   bash topic-run.sh <slug> <ИМЯ_МАССИВА> "<Тема>"
#   bash topic-run.sh kub P_KUB "Куб"                   — новый банк темы
#   bash topic-run.sh legacy-kub P_LEGACY_KUB "Куб"     — старый банк темы
# Собирает временную копию стерео-пакета с data.js только из этого банка
# (engine.js + engine-legacy.js + банк), гоняет все задачи темы, скриншоты
# кладёт в SHOTS_DIR (по умолчанию ./shots-<slug>/ рядом со скриптом —
# это рабочие файлы, в репозиторий их не коммитить).
# STEREO_ROOT — папка стерео-пакета (по умолчанию ege-profil/trainers/stereo),
# PW_CHROME — путь к Chrome/Chromium, если у Playwright нет своего.
set -e
SLUG="$1"; VAR="$2"; TOPIC="$3"
HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="${STEREO_ROOT:-$HERE/../../trainers/stereo}"   # раскладка курса: ege-profil/trainers/stereo
ENGINE="$HERE/engine.js"; [ -f "$ENGINE" ] || ENGINE="$HERE/../engine.js"
LEGACY="$HERE/engine-legacy.js"; [ -f "$LEGACY" ] || LEGACY="$HERE/../engine-legacy.js"
DST="$(mktemp -d)/st-$SLUG"
mkdir -p "$DST/js" "$DST/css"
cp "$SRC/trainer.html" "$DST/"
cp "$SRC/css/style.css" "$DST/css/"
cp "$SRC/js/trainer.js" "$DST/js/"
cp "$SRC/js/three.min.js" "$DST/js/"
[ -f "$SRC/js/progress-mail.js" ] && cp "$SRC/js/progress-mail.js" "$DST/js/"
cat "$ENGINE" "$LEGACY" "$HERE/problems-$SLUG.js" > "$DST/js/data.js"
printf '\nconst PROBLEMS = [].concat(%s);\n' "$VAR" >> "$DST/js/data.js"
node --check "$DST/js/data.js"
STEREO_ROOT="$DST" node "$HERE/render-test.js" "$TOPIC" --shots="${SHOTS_DIR:-$HERE/shots-$SLUG}"
