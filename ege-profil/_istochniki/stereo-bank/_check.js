/* Структурная проверка банка задач.

   node _check.js <файл банка> <ИМЯ_МАССИВА> <Тема> <число задач>
   node _check.js --all          — все 19 массивов объединённого банка:
                                   размер каждого по таблице EXPECTED, итог
                                   288 (281 задания 3 + 7 «Развёрток»)
                                   + уникальность id между ними

   Общее для всех задач: количество, тема, уникальные id, ответ разбирается,
   нет HTML в cond (выводится как текст), есть hint и sol, сцена строится,
   точки в labels / givenFaces / construct и концы рёбер существуют.

   Новый банк (problems-<slug>.js, id вида kub-01): id начинается с "<slug>-",
   ответ — целое или конечная десятичная дробь бланка (не более 2 знаков),
   сцена — scene.bodies, подсказка не короче 15 символов.

   Старый банк (problems-legacy-<slug>.js, 143 задачи открытого банка):
   id — номер задачи Решу ЕГЭ (только цифры), сцена — ровно одно из
   scene.prims (тела известных видов) или dims [a, b, c]. Эти задачи
   перенесены дословно, поэтому их особенности не правятся, а перечислены
   ниже как допустимые — любая НОВАЯ особенность считается ошибкой. */
const path = require("path");
const load = require("./_load.js");

/* известные особенности старых задач (как в открытом банке и опубликованной линейке) */
const LEGACY_ALLOWED = {
  /* ответ с тремя знаками после запятой: 1,125 = 9/8 — так в первоисточнике */
  ansNotBlank: { "27118": "1,125" },
  /* подсказка-формула короче 15 символов */
  shortHint: {
    "27079": "V = abc.", "27141": "6a² = 24.", "27083": "h = V/Sосн.",
    "27176": "V = ⅓·S·h.", "27058": "Sбок = 2πrh.", "245358": "Sбок = C·h.",
    "27136": "Sбок = πrl.", "27137": "Sбок = πrl.", "27163": "R² = 6² + 8²."
  }
};
const LEGACY_PRIM_KINDS = ["box", "boxes", "prism", "prism_rt", "prism_rh", "pyramid",
  "pyramid_rect", "tetra", "cyl", "cone", "sphere"];

function checkBank(bankPath, varName, topic, need) {
  const api = load(bankPath, varName);
  const errs = [];
  const ids = new Set();
  const m = path.basename(bankPath).match(/^problems-(legacy-)?([a-z0-9]+)\.js$/);
  if (!m) return { api, errs: ["имя файла банка не problems-<slug>.js / problems-legacy-<slug>.js: " + bankPath] };
  const legacy = !!m[1], slug = m[2];

  if (need !== null && api.PROBLEMS.length !== need)
    errs.push(`задач ${api.PROBLEMS.length}, требуется ${need}`);

  for (const p of api.PROBLEMS) {
    const at = p.id || "(без id)";
    if (legacy) {
      if (!/^\d+$/.test(p.id || "")) errs.push(`${at}: id старой задачи — только цифры (номер Решу ЕГЭ)`);
    } else if (!p.id || !p.id.startsWith(slug + "-")) errs.push(`${at}: id должен начинаться с "${slug}-"`);
    if (ids.has(p.id)) errs.push(`${at}: id повторяется`);
    ids.add(p.id);
    if (p.topic !== topic) errs.push(`${at}: topic "${p.topic}", ожидалась "${topic}"`);
    if (typeof p.cond !== "string" || p.cond.length < 30) errs.push(`${at}: cond слишком короткий`);
    else if (/[<>]/.test(p.cond)) errs.push(`${at}: в cond есть HTML — он выводится как текст`);

    /* ответ */
    const a = api.parseAns(p.ans);
    if (typeof p.ans !== "string" || !/^\d+(,\d+)?$/.test(p.ans)) errs.push(`${at}: ответ "${p.ans}" — не число бланка (цифры, запятая)`);
    else if (!isFinite(a)) errs.push(`${at}: ответ не разбирается: "${p.ans}"`);
    else if (Math.abs(a * 100 - Math.round(a * 100)) > 1e-9) {
      if (!(legacy && LEGACY_ALLOWED.ansNotBlank[p.id] === p.ans))
        errs.push(`${at}: ответ "${p.ans}" — не конечная дробь бланка (макс. 2 знака)`);
    }

    /* подсказка и решение */
    if (typeof p.hint !== "string" || !p.hint.trim()) errs.push(`${at}: нет подсказки`);
    else if (p.hint.length < 15 && !(legacy && LEGACY_ALLOWED.shortHint[p.id] === p.hint))
      errs.push(`${at}: подсказка короче 15 символов`);
    if (!Array.isArray(p.sol) || !p.sol.length || p.sol.some(l => typeof l !== "string" || !l.trim()))
      errs.push(`${at}: нет решения (sol) или в нём пустая строка`);

    /* формат сцены */
    if (legacy) {
      const hasPrims = !!(p.scene && Array.isArray(p.scene.prims)), hasDims = Array.isArray(p.dims);
      if (hasPrims === hasDims) errs.push(`${at}: у старой задачи должно быть ровно одно из scene.prims / dims`);
      if (hasDims && !(p.dims.length === 3 && p.dims.every(x => typeof x === "number" && isFinite(x) && x > 0)))
        errs.push(`${at}: dims — три положительных числа`);
      if (hasPrims) for (const pr of p.scene.prims)
        if (!LEGACY_PRIM_KINDS.includes(pr.kind)) errs.push(`${at}: неизвестный вид тела старого формата "${pr.kind}"`);
      if (p.scene && p.scene.bodies) errs.push(`${at}: у старой задачи scene.bodies — это формат нового банка`);
    } else if (!(p.scene && Array.isArray(p.scene.bodies) && p.scene.bodies.length))
      errs.push(`${at}: нет scene.bodies`);

    /* сцена и точки */
    let sc;
    try { sc = api.sceneData(p); } catch (e) { errs.push(`${at}: sceneData: ${e.message}`); continue; }
    const pts = {};
    sc.gen.forEach(g => Object.assign(pts, g.pts));
    for (const [nm, v] of Object.entries(pts))
      if (!v.every(x => typeof x === "number" && isFinite(x))) errs.push(`${at}: точка ${nm} с нечисловой координатой`);
    if (!(isFinite(sc.s) && sc.s > 0)) errs.push(`${at}: масштаб сцены ${sc.s}`);
    /* точки построения тоже становятся доступными */
    const fb = sc.firstBox || { a: 1, b: 1, c: 1 };
    for (const [nm, spec] of Object.entries((p.construct && p.construct.points) || {})) {
      if (Array.isArray(spec) && spec[0] === "mid") {
        if (!(spec[1] in pts) || !(spec[2] in pts)) errs.push(`${at}: construct mid по несуществующим точкам ${spec[1]},${spec[2]}`);
        pts[nm] = [0, 0, 0];
      } else pts[nm] = [spec[0] * fb.a, spec[1] * fb.b, spec[2] * fb.c];
    }
    const needPt = (nm, where) => { if (!(nm in pts)) errs.push(`${at}: точка "${nm}" не существует (${where})`); };
    for (const L of (p.labels || [])) { needPt(L[0], "labels"); needPt(L[1], "labels"); if (typeof L[2] !== "string") errs.push(`${at}: подпись labels не строка`); }
    for (const gf of (p.givenFaces || [])) for (const nm of gf.face) needPt(nm, "givenFaces");
    if (p.construct) {
      for (const sg of (p.construct.segments || [])) { needPt(sg[0], "construct.segments"); needPt(sg[1], "construct.segments"); }
      for (const ring of [...(p.construct.fills || []), ...(p.construct.solid || [])])
        for (const nm of ring) needPt(nm, "construct.fills/solid");
    }
    /* концы рёбер */
    for (const g of sc.gen)
      for (const [a1, b1] of g.edges)
        if (!(a1 in pts) || !(b1 in pts)) errs.push(`${at}: ребро ${a1}-${b1} по несуществующим точкам`);
  }
  /* разрешения должны оставаться точными: не перечислять то, чего уже нет */
  if (legacy) {
    for (const kind of Object.keys(LEGACY_ALLOWED))
      for (const [id, val] of Object.entries(LEGACY_ALLOWED[kind])) {
        const p = api.PROBLEMS.find(q => q.id === id);
        if (p && (kind === "ansNotBlank" ? p.ans : p.hint) !== val)
          errs.push(`${id}: исключение ${kind} устарело — значение в банке изменилось`);
      }
  }
  return { api, errs };
}

function report(label, errs, okLine) {
  if (errs.length) {
    console.log(`ПРОВЕРКА НЕ ПРОЙДЕНА — ${label} (${errs.length}):`);
    errs.forEach(e => console.log("  - " + e));
    return false;
  }
  console.log(okLine);
  return true;
}

if (process.argv[2] === "--all") {
  const TOPIC = {
    kub: "Куб", par: "Параллелепипед", sost: "Составные тела", priz: "Призма", pir: "Пирамида",
    cil: "Цилиндр", kon: "Конус", shar: "Шар", komb: "Комбинации тел", razv: "Развёртки"
  };
  /* ожидаемый размер каждого массива: пропавшая или лишняя задача — ошибка.
     Старые — как в опубликованной линейке (143), новые — после удаления пяти
     дублей (138), «Развёртки» — 7. Меняется только вместе с README банка
     и счётчиками курса («из 281» на главной и в навигаторе) */
  const EXPECTED = {
    P_LEGACY_KUB: 14, P_KUB: 13, P_LEGACY_PAR: 33, P_PAR: 32, P_LEGACY_SOST: 6, P_SOST: 6,
    P_LEGACY_PRIZ: 14, P_PRIZ: 13, P_LEGACY_PIR: 16, P_PIR: 16, P_LEGACY_CIL: 9, P_CIL: 9,
    P_LEGACY_KON: 29, P_KON: 28, P_LEGACY_SHAR: 8, P_SHAR: 8, P_LEGACY_KOMB: 14, P_KOMB: 13,
    P_RAZV: 7
  };
  const TOTAL = 288, TASK3 = 281;   /* всего; без «Развёрток» (приложение сверх задания 3) */
  let ok = true, total = 0, razv = 0;
  const allIds = new Map();
  const dupErrs = [], sizeErrs = [];
  const seenArr = new Set();
  for (const slug of Object.keys(TOPIC)) {
    const banks = slug === "razv" ? [false] : [true, false];
    for (const legacy of banks) {
      const file = "./problems-" + (legacy ? "legacy-" : "") + slug + ".js";
      const arr = "P_" + (legacy ? "LEGACY_" : "") + slug.toUpperCase();
      seenArr.add(arr);
      if (!(arr in EXPECTED)) sizeErrs.push(`${arr}: нет в таблице ожидаемых размеров`);
      const { api, errs } = checkBank(file, arr, TOPIC[slug], arr in EXPECTED ? EXPECTED[arr] : null);
      ok = report(file, errs, `OK: ${file} — ${api.PROBLEMS.length} задач «${TOPIC[slug]}» (по таблице ${EXPECTED[arr]}), структура чистая`) && ok;
      total += api.PROBLEMS.length;
      if (slug === "razv") razv += api.PROBLEMS.length;
      for (const p of api.PROBLEMS) {
        if (allIds.has(p.id)) dupErrs.push(`${p.id}: и в ${allIds.get(p.id)}, и в ${file}`);
        allIds.set(p.id, file);
      }
    }
  }
  for (const arr of Object.keys(EXPECTED)) if (!seenArr.has(arr)) sizeErrs.push(`${arr}: в таблице есть, а банк не проверялся`);
  const sumExp = Object.values(EXPECTED).reduce((a, b) => a + b, 0);
  if (sumExp !== TOTAL) sizeErrs.push(`таблица ожидаемых размеров даёт ${sumExp}, а не ${TOTAL}`);
  if (total !== TOTAL) sizeErrs.push(`всего задач ${total}, ожидалось ${TOTAL}`);
  if (total - razv !== TASK3) sizeErrs.push(`задач задания 3 (без «Развёрток») ${total - razv}, ожидалось ${TASK3}`);
  ok = report("размеры банка", sizeErrs, `OK: всего ${total} = ${total - razv} задания 3 + ${razv} «Развёрток», ${seenArr.size} массивов — по таблице`) && ok;
  for (const kind of Object.keys(LEGACY_ALLOWED))
    for (const id of Object.keys(LEGACY_ALLOWED[kind]))
      if (!allIds.has(id)) dupErrs.push(`${id}: в исключениях ${kind}, но такой задачи в банке нет`);
  ok = report("id между банками", dupErrs, `OK: ${total} задач, id уникальны во всём банке, исключения старых задач актуальны`) && ok;
  process.exit(ok ? 0 : 1);
}

const [, , bankPath, varName, topic, countStr] = process.argv;
const { api, errs } = checkBank(bankPath, varName, topic, +countStr);
process.exit(report(bankPath, errs, `OK: ${api.PROBLEMS.length} задач «${topic}» — структура чистая`) ? 0 : 1);
