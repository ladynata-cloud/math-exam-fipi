import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const manifestPath = path.join(root, "downloads", "trainers-manifest.json");
const downloadsRoot = path.join(root, "downloads", "trainers");
const tmpRoot = path.join(root, ".tmp-trainer-packages");
const panelCssHref = "/assets/download-panel.css";

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const warnings = [];
const built = [];

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

function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else if (entry.isFile()) copyFile(from, to);
  }
}

function stripDownloadPanel(html) {
  return html
    .replace(/\n?<!-- download-panel:start:[\s\S]*?<!-- download-panel:end:[\s\S]*?-->\n?/g, "\n")
    .replace(/\n?<link rel="stylesheet" href="\/assets\/download-panel\.css">\n?/g, "\n");
}

function fixLocalAssetLinks(html) {
  return html
    .replace(/href="\/assets\/site\.css"/g, 'href="assets/site.css"')
    .replace(/href="\/assets\/download-panel\.css"/g, 'href="assets/download-panel.css"');
}

function ensurePanelCss(html) {
  if (html.includes(panelCssHref)) return html;
  const link = `<link rel="stylesheet" href="${panelCssHref}">\n`;
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${link}</head>`);
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
  html = stripDownloadPanel(html);
  html = ensurePanelCss(html);
  const panel = panelFor(entry);
  if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, `${panel}\n</body>`);
  else html += `\n${panel}\n`;
  fs.writeFileSync(sourceFile, html, "utf8");
}

function promptFor(entry) {
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

- короткая инструкция для ученика;
- область задания;
- поле или кнопки для ответа;
- кнопка «Проверить»;
- кнопка «Следующее задание»;
- блок результата;
- мягкая подсказка после ошибки;
- счётчик прогресса или серия заданий, если это уместно.

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

  for (const cleanupPath of entry.cleanupHtml || []) {
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
    } else {
      warnings.push(`Не найдена папка: ${entry.sourceDir}`);
    }
  }

  const cleanHtml = fixLocalAssetLinks(stripDownloadPanel(fs.readFileSync(sourceFile, "utf8")));
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
  const promptText = promptFor(entry);
  fs.writeFileSync(path.join(destDir, promptName), promptText, "utf8");
  fs.writeFileSync(path.join(pkgDir, promptName), promptText, "utf8");

  const zipName = `${entry.slug}-package.zip`;
  createZip(pkgDir, path.join(destDir, zipName));

  injectPanel(sourceFile, entry);

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
  const homeFile = path.join(root, "index.html");
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

removeDir(tmpRoot);
ensureDir(downloadsRoot);

for (const entry of manifest.trainers || []) {
  prepareTrainer(entry);
}

updateSitePages();

manifest.updated = new Date().toISOString().slice(0, 10);
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

removeDir(tmpRoot);

console.log(`Создано/обновлено тренажёров: ${built.length}`);
for (const slug of built) console.log(`- ${slug}`);
if (warnings.length) {
  console.log("\nПредупреждения:");
  for (const warning of warnings) console.log(`- ${warning}`);
}
