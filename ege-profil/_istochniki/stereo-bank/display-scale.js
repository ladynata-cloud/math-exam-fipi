/* Ворота «панель измерений показывает длины условия».

   После верного ответа (или «Решения») тренажёр подписывает любой выбранный
   отрезок: подписанный — текстом подписи, остальные — fmtLen(длина на сцене
   · unit) (trainer.js, displayLen). Значит, подписи чертежа и то, что панель
   покажет для неподписанных отрезков, должны быть в одних единицах — единицах
   условия. Проверяется для ВСЕХ задач линейки (старых и новых):

     1) каждая числовая подпись [a, b, «число»] из labels и каждый подписанный
        отрезок построения construct.segments [a, b, «число»] совпадает с тем,
        что панель показала бы для этого отрезка без подписи:
        fmtLen(|ab| на сцене · unit) — тот же fmtLen, что в data.js.
        «Число» — «12», «2,5», «√5», «2√3». Подпись, записанная иначе, чем
        пишет fmtLen, но равная ему по значению (например «√12» из текста
        условия при fmtLen «2√3»), — примечание, не расхождение: для
        подписанного отрезка панель показывает саму подпись;
     2) unit, если задан, — конечное положительное число, и только у старых
        задач (числовой id): сцены новых задач строятся в единицах условия
        (SPEC.md), им unit не нужен. Верность самого значения unit = 1/k
        по данным условия проверяют verify-legacy-*.js (у многих таких задач
        нет ни одной числовой подписи — условие даёт только объём или площадь).

   Точки — как в trainer.js (buildScene): одна точка на имя, последнее тело
   выигрывает; точки построения — «mid» или доли firstBox (resolvePt).

   node display-scale.js [-v]
   STEREO_ROOT — папка линейки (по умолчанию ../../trainers/stereo).
   Маркер успеха DISPLAY_SCALE_OK, при расхождении — код 1.            */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const STEREO_ROOT = process.env.STEREO_ROOT || path.resolve(__dirname, "..", "..", "trainers", "stereo");
const DATA_JS = path.join(STEREO_ROOT, "js", "data.js");
const VERBOSE = process.argv.includes("-v");

function load(file) {
  const ctx = { THREE: { Vector3: function (x, y, z) { this.x = x; this.y = y; this.z = z; } } };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(file, "utf8").replace(/^﻿/, "") +
    "\n;this.__api = { PROBLEMS, sceneData, fmtLen };", ctx, { filename: file });
  return ctx.__api;
}

/* «число» подписи → значение; не число («?», «a», «2r», «h/3») → null */
function labelValue(t) {
  const s = String(t == null ? "" : t).trim();
  let m = s.match(/^(\d+)(?:,(\d+))?$/);
  if (m) return Number(m[1] + (m[2] ? "." + m[2] : ""));
  m = s.match(/^(\d*)√(\d+)$/);
  if (m) return (m[1] ? Number(m[1]) : 1) * Math.sqrt(Number(m[2]));
  return null;
}

let api;
try { api = load(DATA_JS); }
catch (e) { console.log("не удалось загрузить " + DATA_JS + ": " + e.message); process.exit(1); }
const { PROBLEMS, sceneData, fmtLen } = api;
if (typeof fmtLen !== "function") { console.log("в data.js нет fmtLen"); process.exit(1); }

const errs = [], notes = [];
let nLabels = 0, nConstruct = 0, withUnit = 0, unitCovered = 0, tasksWithNum = 0;
for (const p of PROBLEMS) {
  const id = String(p.id);
  const E = m => errs.push(id + ": " + m);
  const legacy = /^\d+$/.test(id);

  /* unit */
  let u = 1;
  if (p.unit !== undefined) {
    if (!(typeof p.unit === "number" && Number.isFinite(p.unit) && p.unit > 0)) { E("unit = " + String(p.unit) + " — не положительное число"); continue; }
    if (!legacy) E("unit у новой задачи: её сцена строится в единицах условия (SPEC.md)");
    u = p.unit; withUnit++;
  }

  /* точки — как в trainer.js */
  let sd;
  try { sd = sceneData(p); } catch (e) { E("sceneData: " + e.message); continue; }
  const pts = {};
  for (const g of sd.gen) for (const [nm, pt] of Object.entries(g.pts)) pts[nm] = pt;
  const fb = sd.firstBox || { a: 1, b: 1, c: 1 };
  for (const [nm, spec] of Object.entries((p.construct && p.construct.points) || {})) {
    if (Array.isArray(spec) && spec[0] === "mid") {
      const a = pts[spec[1]], b = pts[spec[2]];
      if (!a || !b) { E("точка построения " + nm + ": нет точек " + spec[1] + ", " + spec[2]); continue; }
      pts[nm] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    } else pts[nm] = [spec[0] * fb.a, spec[1] * fb.b, spec[2] * fb.c];
  }

  const list = [
    ...(p.labels || []).map(l => ["подпись", l]),
    ...((p.construct && p.construct.segments) || []).filter(s => s.length > 2 && s[2] != null).map(s => ["подпись построения", s])
  ];
  let num = 0;
  for (const [src, [a, b, t]] of list) {
    const v = labelValue(t);
    if (v === null) continue;
    num++;
    if (src === "подпись") nLabels++; else nConstruct++;
    if (!pts[a] || !pts[b]) { E(src + " " + a + b + " «" + t + "»: нет точки на чертеже"); continue; }
    const L = Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1], pts[a][2] - pts[b][2]) * u;
    const shown = fmtLen(L);
    if (shown === String(t).trim()) {
      if (VERBOSE) console.log("  " + id + " " + src + " " + a + b + " «" + t + "» = fmtLen(" + +L.toPrecision(10) + ")");
      continue;
    }
    if (fmtLen(v) === shown)
      notes.push(id + ": " + src + " " + a + b + " «" + t + "» — та же длина, что fmtLen «" + shown + "», записана иначе (как в условии)");
    else
      E(src + " " + a + b + " «" + t + "», а на сцене |" + a + b + "|" + (u !== 1 ? " · unit" : "") + " = " +
        +L.toPrecision(10) + " — панель измерений показала бы «" + shown + "»" +
        (u !== 1 ? " (unit = " + +u.toPrecision(10) + ")" : ""));
  }
  if (num) tasksWithNum++;
  if (num && p.unit !== undefined) unitCovered++;
}

notes.forEach(n => console.log("примечание " + n));
errs.forEach(e => console.log("РАСХОЖДЕНИЕ " + e));
console.log("задач " + PROBLEMS.length + " (с числовыми подписями " + tasksWithNum + "); сверено подписей " + nLabels +
  " и подписей построения " + nConstruct + "; unit задан у " + withUnit + " (из них с числовыми подписями " + unitCovered +
  "); примечаний " + notes.length + ", расхождений " + errs.length);
if (errs.length) process.exit(1);
console.log("DISPLAY_SCALE_OK");
