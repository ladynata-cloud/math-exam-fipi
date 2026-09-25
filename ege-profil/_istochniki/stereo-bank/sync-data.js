/* Сборка trainers/stereo/js/data.js из исходников объединённого банка.

   data.js = engine.js + engine-legacy.js + тематические банки по порядку тем.
   Внутри темы СНАЧАЛА старый банк (problems-legacy-<slug>.js, 143 задачи
   открытого банка с числовыми id, в исходном порядке опубликованной линейки),
   ПОТОМ новый (problems-<slug>.js). Так позиция задачи в теме, которую
   тренажёр хранит в stereo3.last.<тема>, указывает на ту же задачу, что
   в опубликованной линейке trainers/ege-profile-stereometry-3d.

   Верификаторы проверяют ИСХОДНИКИ, поэтому перед выкладкой нужно убедиться,
   что опубликованный data.js собран именно из них, а не правился руками.

   node sync-data.js            — проверка: совпадает ли data.js со сборкой
   node sync-data.js --write    — пересобрать data.js после правки банка

   Путь к пакету стереометрии: переменная STEREO_ROOT, по умолчанию
   ../../trainers/stereo относительно этого файла (раскладка курса:
   ege-profil/_istochniki/stereo-bank → ege-profil/trainers/stereo).     */
const fs = require("fs");
const path = require("path");

/* [slug, массив нового банка, массив старого банка | null] */
const ORDER = [
  ["kub", "P_KUB", "P_LEGACY_KUB"], ["par", "P_PAR", "P_LEGACY_PAR"],
  ["sost", "P_SOST", "P_LEGACY_SOST"], ["priz", "P_PRIZ", "P_LEGACY_PRIZ"],
  ["pir", "P_PIR", "P_LEGACY_PIR"], ["cil", "P_CIL", "P_LEGACY_CIL"],
  ["kon", "P_KON", "P_LEGACY_KON"], ["shar", "P_SHAR", "P_LEGACY_SHAR"],
  ["komb", "P_KOMB", "P_LEGACY_KOMB"], ["razv", "P_RAZV", null]
];

const here = __dirname;
const near = name => [path.join(here, name), path.join(here, "..", name)].find(p => fs.existsSync(p));
const enginePath = near("engine.js"), legacyPath = near("engine-legacy.js");
if (!enginePath || !legacyPath) { console.error("engine.js / engine-legacy.js не найден"); process.exit(2); }

const stereoRoot = process.env.STEREO_ROOT || path.resolve(here, "..", "..", "trainers", "stereo");
const target = path.join(stereoRoot, "js", "data.js");

const parts = [fs.readFileSync(enginePath, "utf8"), fs.readFileSync(legacyPath, "utf8")];
const arrays = [];
for (const [slug, arr, legacyArr] of ORDER) {
  if (legacyArr) {
    parts.push(fs.readFileSync(path.join(here, "problems-legacy-" + slug + ".js"), "utf8"));
    arrays.push(legacyArr);
  }
  parts.push(fs.readFileSync(path.join(here, "problems-" + slug + ".js"), "utf8"));
  arrays.push(arr);
}
parts.push("\nconst PROBLEMS = [].concat(" + arrays.join(", ") + ");\n");
const built = parts.join("\n");

/* сводка по составу собранного банка */
function summary(code) {
  global.THREE = global.THREE || { Vector3: function (x, y, z) { this.x = x; this.y = y; this.z = z; } };
  const mod = { exports: {} };
  new Function("module", "exports", code)(mod, mod.exports);
  const P = mod.exports.PROBLEMS, T = mod.exports.TOPICS;
  const ids = new Set(P.map(p => p.id));
  if (ids.size !== P.length) throw new Error("повторяющиеся id: " + (P.length - ids.size));
  const byTopic = {};
  for (const p of P) byTopic[p.topic] = (byTopic[p.topic] || 0) + 1;
  for (const t of Object.keys(byTopic)) if (!T.includes(t)) throw new Error("тема вне TOPICS: " + t);
  const old = P.filter(p => /^\d+$/.test(p.id)).length;
  const razv = P.filter(p => /^razv-/.test(p.id)).length;
  return "всего " + P.length + ": задание 3 — " + (P.length - razv) + " (старых " + old +
    ", новых " + (P.length - razv - old) + "), «Развёртки» — " + razv + "\n  по темам: " +
    T.map(t => t + " " + (byTopic[t] || 0)).join(", ");
}

if (process.argv.includes("--write")) {
  fs.writeFileSync(target, built, "utf8");
  console.log("data.js пересобран: " + target + " (" + Buffer.byteLength(built) + " байт)");
  console.log("  " + summary(built));
  process.exit(0);
}

if (!fs.existsSync(target)) { console.error("нет файла " + target + " — задай STEREO_ROOT"); process.exit(2); }
const shipped = fs.readFileSync(target, "utf8");
const norm = s => s.replace(/\r\n/g, "\n");   /* переводы строк репозитория не считаем расхождением */
if (norm(shipped) === norm(built)) {
  console.log("OK: data.js совпадает со сборкой из исходников (" + arrays.length + " массивов, " + ORDER.length + " тем)");
  console.log("  " + summary(built));
  process.exit(0);
}
console.error("РАСХОЖДЕНИЕ: data.js не совпадает со сборкой из исходников.\n" +
  "Либо data.js правили руками, либо банк изменён без пересборки.\n" +
  "Если правка банка намеренная: node sync-data.js --write, затем снова все verify-*.js.");
process.exit(1);
