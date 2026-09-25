/* Загрузка движка + банка в node (без браузера).
   Использование:
     const api = require("./_load.js")("./problems-kub.js", "P_KUB");
     const old = require("./_load.js")("./problems-legacy-kub.js", "P_LEGACY_KUB");
     const both = require("./_load.js")(["./problems-legacy-kub.js", "./problems-kub.js"],
                                        "P_LEGACY_KUB, P_KUB");
   Движок = engine.js + engine-legacy.js: без генераторов старого банка
   sceneData не построит задачи с числовыми id (scene.prims / dims).
   Оба файла ищутся рядом с этим файлом, затем уровнем выше — так скрипт
   работает и в папке исходников, и в распакованном пакете выкладки.
   api: { PROBLEMS, TOPICS, sceneData, sceneDataLegacy, parseAns, fmtLen, SUB, segKey } */
const fs = require("fs");
const path = require("path");

function findNear(name) {
  for (const p of [path.join(__dirname, name), path.join(__dirname, "..", name)]) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(name + " не найден ни рядом с _load.js, ни уровнем выше");
}

module.exports = function load(bankPath, varName) {
  if (!global.THREE) {
    global.THREE = { Vector3: function (x, y, z) { this.x = x; this.y = y; this.z = z; } };
  }
  const eng = fs.readFileSync(findNear("engine.js"), "utf8");
  const legacy = fs.readFileSync(findNear("engine-legacy.js"), "utf8");
  const banks = (Array.isArray(bankPath) ? bankPath : [bankPath])
    .map(b => fs.readFileSync(path.resolve(__dirname, b), "utf8"));
  const code = eng + "\n" + legacy + "\n" + banks.join("\n") + "\nconst PROBLEMS = [].concat(" + varName + ");\n";
  const mod = { exports: {} };
  new Function("module", "exports", code)(mod, mod.exports);
  return mod.exports;
};
