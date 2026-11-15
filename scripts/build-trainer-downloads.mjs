import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import navigatorPreservation from "../tools/public-navigator-preservation.cjs";
import { exportStandalone } from "./trainer-download-offline.mjs";
import { adaptationPanel, adaptationPrompt, downloadPaths, guideUrl, writeAdaptationFiles } from "./trainer-download-adaptation.mjs";

const root = process.cwd();
const manifestPath = path.join(root, "downloads", "trainers-manifest.json");
const downloadsRoot = path.join(root, "downloads", "trainers");
const tmpRoot = path.join(root, ".tmp-trainer-packages");
const panelCssHref = "/assets/download-panel.css";

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const warnings = [];
const built = [];
const args = process.argv.slice(2);
const onlyArgs = args.filter(arg => arg.startsWith("--only="));
const onlySlugs = new Set(onlyArgs.map(arg => arg.slice("--only=".length)));
const downloadsOnly = args.includes("--downloads-only");
if (args.some(arg => arg !== "--downloads-only" && !onlyArgs.includes(arg))) {
  throw new Error("Usage: node scripts/build-trainer-downloads.mjs [--only=slug ...] [--downloads-only]");
}
for (const slug of onlySlugs) {
  if (!manifest.trainers.some(entry => entry.slug === slug && entry.public)) throw new Error(`Unknown public trainer: ${slug}`);
}

function repoPath(sitePath) {
  const clean = sitePath.replace(/^[\\/]+/, "");
  return path.join(root, clean);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

// Only exported copies lose the public shell. An unknown or changed pair must
// stop the build rather than be removed from a lesson or shipped offline.
function offlineHtml(file) {
  const name = path.relative(root, file).split(path.sep).join("/");
  const clean = navigatorPreservation.restorePublicNavigator(name, fs.readFileSync(file));
  if (/navigator-(?:widget|data)\.js\b/i.test(clean.toString("utf8"))) {
    throw new Error(`Unbound public navigator dependency in offline source: ${name}`);
  }
  return clean;
}

function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else if (entry.isFile() && /\.html?$/i.test(entry.name)) fs.writeFileSync(to, offlineHtml(from));
    else if (entry.isFile()) copyFile(from, to);
  }
}

// Folder bundles may use a shared script from their parent directory (for
// example the roads trainer's Board Bridge). Keep it inside the archive and
// rewrite only the packaged HTML; URL cache versions remain unchanged.
function includeFolderParentScripts(sourceDir, pkgDir) {
  const visit = folder => {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) { visit(file); continue; }
      if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
      const original = fs.readFileSync(file, 'utf8');
      const html = original.replace(/<script\b[^>]*\bsrc=(["'])(\.\.\/[^"']+)\1[^>]*>/gi, (tag, quote, ref) => {
        const [, pathname, suffix = ''] = ref.match(/^([^?#]+)([?#].*)?$/);
        const source = path.resolve(sourceDir, path.dirname(path.relative(pkgDir, file)), pathname);
        if (source.startsWith(sourceDir + path.sep)) return tag;
        if (!source.startsWith(root + path.sep) || !fs.existsSync(source) || !fs.statSync(source).isFile()) {
          throw new Error(`Missing shared folder script: ${ref} in ${file}`);
        }
        const target = path.join(pkgDir, '_shared', path.relative(root, source));
        copyFile(source, target);
        const localRef = path.relative(path.dirname(file), target).split(path.sep).join('/') + suffix;
        return tag.replace(ref, localRef);
      });
      if (html !== original) fs.writeFileSync(file, html, 'utf8');
    }
  };
  visit(pkgDir);
}

function stripDownloadPanel(html) {
  return html
    .replace(/\n?<!-- download-panel:start:[\s\S]*?<!-- download-panel:end:[\s\S]*?-->\n?/g, "\n")
    .replace(/\n?<link rel="stylesheet" href="\/assets\/(?:download-panel|download-adaptation)\.css">\n?/g, "\n")
    .replace(/\n?<script defer src="\/assets\/download-adaptation\.js"><\/script>\n?/g, "\n");
}

function fixLocalAssetLinks(html) {
  return html
    .replace(/href="\/assets\/site\.css"/g, 'href="assets/site.css"')
    .replace(/href="\/assets\/download-panel\.css"/g, 'href="assets/download-panel.css"');
}

// Opt-in bundles keep the downloadable HTML usable by itself, including file://.
// Scripts are appended in manifest order after the DOM, preserving deferred startup.
function inlineTrainerAssets(html, entry) {
  if (!Array.isArray(entry.inlineAssets) || !entry.inlineAssets.length) return html;
  const sources = new Map(entry.inlineAssets.map(sitePath => [sitePath, fs.readFileSync(repoPath(sitePath), "utf8")]));
  // Explicit online-only enhancements must not leave broken file:// requests.
  const omitted = new Set(entry.offlineOmitAssets || []);
  // Optional reference screenshots stay available in the standalone HTML offline.
  for (const imagePath of entry.inlineImageAssets || []) {
    if (!imagePath.endsWith('.png')) throw new Error(`Unsupported inline image: ${imagePath}`);
    const embedded = 'data:image/png;base64,' + fs.readFileSync(repoPath(imagePath)).toString('base64');
    let found = false;
    for (const [key, value] of sources) {
      if (value.includes(JSON.stringify(imagePath))) {
        sources.set(key, value.replaceAll(JSON.stringify(imagePath), JSON.stringify(embedded)));
        found = true;
      }
    }
    if (!found) throw new Error(`Inline image not referenced: ${imagePath}`);
  }
  const used = new Set();
  const siteRef = ref => path.posix.resolve(path.posix.dirname(entry.sourceHtml), ref.split(/[?#]/)[0]);
  html = html.replace(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>\s*<\/script>/gi, (tag, ref) => {
    const key = siteRef(ref);
    if (omitted.has(key)) return "";
    // Standalone downloads have no authenticated parent or server-side attempt.
    // Omit these managed-only integrations so file:// never requests website assets.
    if (key === "/trainers/learning-bridge.js" || key === "/trainers/oge-learning.js") return "";
    if (!sources.has(key)) return tag;
    used.add(key);
    return "";
  });
  // Removed indented tags must not leave whitespace-only lines in generated HTML.
  html = html.replace(/^[\t ]+$/gm, "");
  html = html.replace(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/gi, (tag, ref) => {
    const key = siteRef(ref);
    if (omitted.has(key)) return "";
    if (!sources.has(key)) return tag;
    used.add(key);
    return `<style data-inline-source="${key}">\n${sources.get(key).replace(/<\/style/gi, "<\\/style")}\n</style>`;
  });
  for (const key of sources.keys()) {
    if (!used.has(key)) throw new Error(`Inline asset is not referenced by ${entry.sourceHtml}: ${key}`);
  }
  const scripts = entry.inlineAssets.filter(key => key.endsWith(".js")).map(key =>
    `<script data-inline-source="${key}">\n${sources.get(key).replace(/<\/script/gi, "<\\/script")}\n</script>`
  ).join("\n");
  html = html.replace(/<\/body>/i, () => `${scripts}\n</body>`);
  // Archive/navigation links remain useful when this single file is downloaded.
  html = html.replace(/(<a\b[^>]*\bhref=")([^"#][^"]*)(")/gi, (tag, before, ref, after) => {
    if (/^(?:[a-z]+:|\/\/)/i.test(ref)) return tag;
    return `${before}${new URL(ref, `https://mathexam.space${entry.sourceHtml}`).href}${after}`;
  });
  return html;
}

function ensurePanelCss(html) {
  if (html.includes(panelCssHref)) return html;
  const link = `<link rel="stylesheet" href="${panelCssHref}">\n`;
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, (tag, offset) => `${html[offset - 1] === '\n' ? '' : '\n'}${link}${tag}`);
  return link + html;
}

function panelFor(entry) {
  const base = `/downloads/trainers/${entry.slug}`;
  return `<!-- download-panel:start:${entry.slug} -->
<section class="download-panel" id="download">
  <h2>Скачать и адаптировать</h2>
  <p>Этот тренажёр можно скачать как HTML-файл, открыть у себя на компьютере или использовать как основу для создания похожего тренажёра. Промпт для DeepSeek поможет адаптировать идею под другую тему, класс или тип ошибки.</p>
  <div class="download-actions">
    <a class="btn" href="${base}/${entry.slug}.html" download>Скачать тренажёр HTML</a>
    <a class="btn secondary btn-secondary" href="${base}/${entry.slug}-deepseek-prompt.md" download>Скачать промпт для DeepSeek</a>
    <a class="btn secondary btn-secondary" href="${base}/${entry.slug}-package.zip" download>Скачать HTML + промпт архивом</a>
  </div>
  <p class="download-note">Если в тренажёре есть дополнительные файлы, удобнее скачать архив. <a href="/pedagogam/kak-skachat-i-adaptirovat-trenazher/">Как скачать и адаптировать тренажёр</a>.</p>
</section>
<!-- download-panel:end:${entry.slug} -->`;
}

function injectPanel(sourceFile, entry) {
  let html = fs.readFileSync(sourceFile, "utf8");
  const panel = entry.adaptation ? adaptationPanel(entry, downloadPaths(entry.slug)) : panelFor(entry);
  if (entry.adaptation) {
    const markers = new RegExp(`<!-- download-panel:start:${entry.slug} -->[\\s\\S]*?<!-- download-panel:end:${entry.slug} -->`, 'g');
    const existing = [...html.matchAll(markers)];
    if (existing.length > 1) throw new Error(`Multiple download panels: ${entry.sourceHtml}`);
    if (existing.length === 1) {
      const block = `<!-- download-panel:start:${entry.slug} -->\n${panel}\n<!-- download-panel:end:${entry.slug} -->`;
      fs.writeFileSync(sourceFile, html.replace(markers, () => block), 'utf8');
      return;
    }
  }
  html = ensurePanelCss(stripDownloadPanel(html));
  if (entry.adaptation) {
    html = html.replace(/<\/head>/i, '<link rel="stylesheet" href="/assets/download-adaptation.css">\n<script defer src="/assets/download-adaptation.js"></script>\n</head>');
  }
  const markedPanel = entry.adaptation
    ? `<!-- download-panel:start:${entry.slug} -->\n${panel}\n<!-- download-panel:end:${entry.slug} -->` : panel;
  if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, (tag, offset) => {
    const newline = entry.adaptation && html[offset - 1] !== '\n' ? '\n' : '';
    return `${newline}${markedPanel}\n${tag}`;
  });
  else html += `\n${markedPanel}\n`;
  fs.writeFileSync(sourceFile, html, "utf8");
}

function promptFor(entry) {
  const interfaceRequirements = entry.interfaceRequirements || [
    "короткая инструкция для ученика;",
    "область задания;",
    "поле или кнопки для ответа;",
    "кнопка «Проверить»;",
    "кнопка «Следующее задание»;",
    "блок результата;",
    "мягкая подсказка после ошибки;",
    "счётчик прогресса или серия заданий, если это уместно."
  ];
  return `# Промпт для адаптации тренажёра в DeepSeek

Этот файл не является исходным промптом, по которому был создан тренажёр. Это аккуратный промпт для создания похожего HTML-тренажёра или адаптации идеи под другую тему.

## Роль

Ты опытный разработчик учебных HTML-тренажёров и методист по математике. Ты создаёшь спокойные интерактивные задания для школьников, которые помогают многократно тренировать один навык и получать мягкую обратную связь.

## Цель

Создай интерактивный HTML-тренажёр по теме: **${entry.topic}**.

Ориентир: «${entry.title}» на сайте mathexam.space.

## Аудитория

- Предмет: ${entry.subject}
- Уровень: ${entry.level}
- Пользователи: ученик, школьный учитель, репетитор

## Методическая логика

Тренажёр должен помогать ученику отрабатывать конкретный навык, а не просто угадывать ответ.

Описание исходной идеи:

${entry.description}

Продумай:

- какое действие ученик должен повторить много раз;
- какие типичные ошибки нужно ловить;
- какие подсказки стоит давать;
- как не показывать готовое решение слишком рано;
- когда задание можно считать освоенным.

## Интерфейс

Сделай одну HTML-страницу, которая работает без сервера. Интерфейс должен быть понятен на компьютере и телефоне.

Нужны:

${interfaceRequirements.map(item => `- ${item}`).join("\n")}

## Генерация заданий

Задания должны быть случайными, но корректными. Исключай невозможные, некрасивые или методически неудачные варианты. При повторе числа и формулировки должны меняться.

## Проверка ответа

Проверяй ответ строго по математическому смыслу. Если есть несколько допустимых записей, учти их. Ошибка должна объясняться спокойно: что именно проверить, куда посмотреть, какой шаг повторить.

## Требования к коду

- HTML, CSS и JavaScript в одном файле, если это возможно.
- Без backend и регистрации.
- Без внешних библиотек, если они не нужны.
- Код должен быть достаточно понятным, чтобы учитель мог заменить тему, числа, тексты подсказок и критерии проверки.
- Не противопоставляй тренажёр учителю: тренажёр помогает отработке, а методическая логика остаётся за педагогом.

## Что выдать

1. Полный HTML-код.
2. Краткую инструкцию, как сохранить файл и открыть его в браузере.
3. Список мест в коде, где педагог может поменять тему, числа, подсказки и тексты заданий.
`;
}

function copyAssetToPackage(assetPath, pkgDir, preserveRoot = false) {
  const src = repoPath(assetPath);
  if (!fs.existsSync(src)) {
    warnings.push(`Не найден asset: ${assetPath}`);
    return;
  }
  const rel = assetPath.replace(/^[\\/]+/, "");
  const dest = preserveRoot || rel.startsWith("assets/") || rel.startsWith("data/")
    ? path.join(pkgDir, rel)
    : path.join(pkgDir, path.basename(rel));
  copyFile(src, dest);
}

function createZip(sourceDir, zipPath) {
  fs.rmSync(zipPath, { force: true });
  if (process.platform !== "win32") {
    // Python's standard library keeps the existing builder usable on cloud/Linux.
    const result = spawnSync("python3", ["-c", `
from pathlib import Path
import sys, zipfile
source, output = map(Path, sys.argv[1:])
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for file in sorted(source.rglob('*')):
        if file.is_file():
            info = zipfile.ZipInfo(file.relative_to(source).as_posix(), (2020, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, file.read_bytes())
`, sourceDir, zipPath], { cwd: root, encoding: "utf8" });
    if (result.status !== 0) throw new Error(`Cannot create ZIP ${zipPath}: ${result.stderr || result.error || result.stdout}`);
    return;
  }
  const ps = `
$ErrorActionPreference = 'Stop'
$src = ${JSON.stringify(sourceDir)}
$dst = ${JSON.stringify(zipPath)}
if (Test-Path -LiteralPath $dst) { Remove-Item -LiteralPath $dst -Force }
$items = Get-ChildItem -LiteralPath $src
Compress-Archive -Path $items.FullName -DestinationPath $dst -Force
`;
  const result = spawnSync("powershell.exe", ["-NoProfile", "-Command", ps], {
    cwd: root,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    warnings.push(`Не удалось собрать ZIP ${zipPath}: ${result.stderr || result.stdout}`);
  }
}

function prepareTrainer(entry) {
  if (!entry.public) return;

  for (const cleanupPath of downloadsOnly ? [] : entry.cleanupHtml || []) {
    const cleanupFile = repoPath(cleanupPath);
    if (fs.existsSync(cleanupFile)) {
      fs.writeFileSync(cleanupFile, stripDownloadPanel(fs.readFileSync(cleanupFile, "utf8")), "utf8");
    }
  }

  const sourceFile = repoPath(entry.sourceHtml);
  if (!fs.existsSync(sourceFile)) {
    warnings.push(`Не найден HTML: ${entry.sourceHtml}`);
    return;
  }
  const html = stripDownloadPanel(offlineHtml(sourceFile).toString("utf8"));
  const cleanHtml = entry.adaptation
    ? exportStandalone(root, html.trimEnd() + "\n", entry)
    : inlineTrainerAssets(fixLocalAssetLinks(html), entry);

  const destDir = path.join(downloadsRoot, entry.slug);
  const pkgDir = path.join(tmpRoot, entry.slug);
  removeDir(destDir);
  removeDir(pkgDir);
  ensureDir(destDir);
  ensureDir(pkgDir);

  if (entry.mode === "folder" && entry.sourceDir) {
    const sourceDir = repoPath(entry.sourceDir);
    if (fs.existsSync(sourceDir)) {
      copyDir(sourceDir, pkgDir);
      if (entry.slug === 'oge-1-5-trainers') includeFolderParentScripts(sourceDir, pkgDir);
    } else {
      warnings.push(`Не найдена папка: ${entry.sourceDir}`);
    }
  }

  const htmlName = `${entry.slug}.html`;
  fs.writeFileSync(path.join(destDir, htmlName), cleanHtml, "utf8");
  fs.writeFileSync(path.join(pkgDir, htmlName), cleanHtml, "utf8");

  if (entry.mode === "folder" && fs.existsSync(path.join(pkgDir, "index.html"))) {
    const folderIndex = path.join(pkgDir, "index.html");
    fs.writeFileSync(folderIndex, fixLocalAssetLinks(stripDownloadPanel(fs.readFileSync(folderIndex, "utf8"))), "utf8");
  }

  for (const asset of entry.assets || []) {
    copyAssetToPackage(asset, destDir, Boolean(entry.assetCopyRoot));
    copyAssetToPackage(asset, pkgDir, Boolean(entry.assetCopyRoot));
  }

  const promptName = `${entry.slug}-deepseek-prompt.md`;
  const promptText = entry.adaptation ? adaptationPrompt(entry) : promptFor(entry);
  fs.writeFileSync(path.join(destDir, promptName), promptText, "utf8");
  fs.writeFileSync(path.join(pkgDir, promptName), promptText, "utf8");
  if (entry.adaptation) writeAdaptationFiles(root, pkgDir, entry);

  const zipName = `${entry.slug}-package.zip`;
  createZip(pkgDir, path.join(destDir, zipName));

  if (!downloadsOnly) injectPanel(sourceFile, entry);

  entry.downloadHtml = `/downloads/trainers/${entry.slug}/${htmlName}`;
  entry.prompt = `/downloads/trainers/${entry.slug}/${promptName}`;
  entry.package = `/downloads/trainers/${entry.slug}/${zipName}`;

  built.push(entry.slug);
}

function upsertBlock(filePath, id, block, beforeNeedle) {
  let html = fs.readFileSync(filePath, "utf8");
  const start = `<!-- ${id}:start -->`;
  const end = `<!-- ${id}:end -->`;
  const wrapped = `${start}\n${block}\n${end}`;
  const re = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);
  if (re.test(html)) {
    html = html.replace(re, wrapped);
  } else if (beforeNeedle && html.includes(beforeNeedle)) {
    html = html.replace(beforeNeedle, `${wrapped}\n\n${beforeNeedle}`);
  } else if (/<\/main>/i.test(html)) {
    html = html.replace(/<\/main>/i, `${wrapped}\n</main>`);
  } else {
    html += `\n${wrapped}\n`;
  }
  fs.writeFileSync(filePath, html, "utf8");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function updateOgeDownloads() {
  const section = path.join(root, 'trainers/oge-course/index.html');
  const html = fs.readFileSync(section, 'utf8');
  const first = manifest.trainers.find(entry => entry.slug === 'oge-1-5-trainers');
  const statements = manifest.trainers.find(entry => entry.slug === 'task19-trainer');
  const links = [`<a href="${first.package}" download>№1–5 · ZIP</a>`];
  const entries = manifest.trainers.filter(entry => entry.public && entry.ogeTask);
  const byTask = new Map([...entries, { ...statements, ogeTask: 19 }].map(entry => [entry.ogeTask, entry]));
  for (const [no, entry] of [...byTask.entries()].sort(([a], [b]) => a - b)) {
    links.push(`<a href="${entry.package}" download>№${no} · ${entry.topic} · ZIP</a>`);
  }
  const block = `<details id="downloads">
  <summary>Скачать тренажёры</summary>
  <p>Распакуй архив и открой HTML. В комплекте №1–5 есть также диагностика, чтение плана и проверочная по маршрутам.</p>
  <div class="downloads">
    ${links.join('\n    ')}
  </div>
  <p><a href="${guideUrl}#adaptation-example">Как изменить тренажёр · GIF и шаги</a>. Остальные задания можно <a href="#all-topics">решать на сайте</a>.</p>
</details>`;
  const downloadBlock = /<details id="downloads">[\s\S]*?<\/details>/g;
  if ([...html.matchAll(downloadBlock)].length !== 1) throw new Error('Expected one OGE download list');
  fs.writeFileSync(section, html.replace(downloadBlock, () => block), 'utf8');
}

function updateSitePages() {
  const pedagogamBlock = `<section class="section alt">
  <div class="container">
    <h2>Скачивайте и адаптируйте</h2>
    <div class="entry-grid">
      <article class="entry">
        <span class="kicker">открытая библиотека</span>
        <h3><a href="/pedagogam/kak-skachat-i-adaptirovat-trenazher/">Как скачать и адаптировать тренажёр</a></h3>
        <p>У ключевых тренажёров постепенно появляются кнопки скачивания: HTML, промпт для DeepSeek и ZIP-архив. Это помогает не только использовать готовые задания, но и создавать свои похожие тренажёры под класс, тему или тип ошибки.</p>
        <a class="go" href="/pedagogam/kak-skachat-i-adaptirovat-trenazher/">Открыть инструкцию</a>
      </article>
    </div>
    <p class="byline">Перед использованием изменённого тренажёра обязательно проверьте математику, подсказки и работу на телефоне. Нейросеть может помочь с кодом, но методическая логика остаётся за педагогом.</p>
  </div>
</section>`;
  upsertBlock(
    path.join(root, "pedagogam", "index.html"),
    "download-instructions",
    pedagogamBlock,
    '<section class="section">\n  <div class="container">\n    <h2>Читайте также</h2>'
  );

  const homeBlock = `<article class="entry">
        <span class="kicker">инструкция</span>
        <h3><a href="/pedagogam/kak-skachat-i-adaptirovat-trenazher/">Как скачать и адаптировать тренажёр</a></h3>
        <p>HTML-файлы, промпты для DeepSeek и архивы для педагогов, которые хотят использовать тренажёры как основу для своих заданий.</p>
        <a class="go" href="/pedagogam/kak-skachat-i-adaptirovat-trenazher/">Читать</a>
      </article>`;
  // This public article now lives in the tutor laboratory; keep its stable block markers.
  const homeFile = path.join(root, "laboratory", "index.html");
  let home = fs.readFileSync(homeFile, "utf8");
  const homeStart = "<!-- home-download-article:start -->";
  const homeEnd = "<!-- home-download-article:end -->";
  const homeWrapped = `${homeStart}\n      ${homeBlock}\n      ${homeEnd}`;
  const homeRe = new RegExp(`${escapeRegExp(homeStart)}[\\s\\S]*?${escapeRegExp(homeEnd)}`);
  if (homeRe.test(home)) {
    home = home.replace(homeRe, homeWrapped);
  } else {
    home = home.replace(
      /(<a class="go" href="\/articles\/pedagogicheskiy-webcoding\/">[^<]*<\/a>\s*<\/article>)/,
      `$1\n      ${homeWrapped}`
    );
  }
  fs.writeFileSync(homeFile, home, "utf8");

  const catalogBlock = `<section class="section" id="downloadable-trainers-note">
  <div class="card" style="min-height:auto">
    <h2>Можно скачать и адаптировать</h2>
    <p>У ключевых тренажёров постепенно появляются кнопки: скачать HTML, скачать промпт для DeepSeek и скачать архивом. Архив удобен, если у тренажёра есть дополнительные файлы.</p>
    <div class="actions">
      <a class="btn secondary" href="/pedagogam/kak-skachat-i-adaptirovat-trenazher/">Как скачать и адаптировать</a>
    </div>
  </div>
</section>`;
  upsertBlock(
    path.join(root, "trainers", "index.html"),
    "catalog-download-note",
    catalogBlock,
    "</main><div class=\"tools\">"
  );
}

ensureDir(downloadsRoot);
removeDir(tmpRoot);
try {
  for (const entry of manifest.trainers || []) {
    if (onlySlugs.size && !onlySlugs.has(entry.slug)) continue;
    prepareTrainer(entry);
  }

  if (!downloadsOnly && manifest.trainers.some(entry => built.includes(entry.slug) && entry.ogeTask)) updateOgeDownloads();
  if (!onlySlugs.size && !downloadsOnly) updateSitePages();

  manifest.updated = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
} finally {
  removeDir(tmpRoot);
}

console.log(`Создано/обновлено тренажёров: ${built.length}`);
for (const slug of built) console.log(`- ${slug}`);
if (warnings.length) {
  console.log("\nПредупреждения:");
  for (const warning of warnings) console.log(`- ${warning}`);
}
