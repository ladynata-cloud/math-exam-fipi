import fs from 'node:fs';
import path from 'node:path';

export const guideUrl = '/pedagogam/kak-skachat-i-adaptirovat-trenazher/';
export const adaptationIncludes = '<link rel="stylesheet" href="/assets/download-adaptation.css">\n'
  + '<script defer src="/assets/download-adaptation.js"></script>\n';
export const offlineLimit = 'Личный кабинет, синхронная доска и переходы к другим материалам MathExam доступны на сайте. Загруженная копия хранит работу в браузере, если браузер разрешает это для локальных файлов.';

const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

export function downloadPaths(slug) {
  const base = `/downloads/trainers/${slug}/${slug}`;
  return { downloadHtml: `${base}.html`, prompt: `${base}-deepseek-prompt.md`, package: `${base}-package.zip` };
}

export function adaptationPanel(entry, paths) {
  return `<section class="download-panel" id="download" data-trainer-download="${entry.slug}">
  <details>
    <summary>Скачать и изменить</summary>
    <p>HTML открывается в браузере без интернета. В ZIP тот же тренажёр, промпт, инструкция и GIF.</p>
    <p class="download-note">${offlineLimit}</p>
    <div class="download-actions">
      <a href="${paths.downloadHtml}" download>Скачать тренажёр HTML</a>
      <a class="secondary" href="${paths.prompt}" download>Скачать промпт для DeepSeek</a>
      <a class="secondary" href="${paths.package}" download>Скачать комплект ZIP</a>
    </div>
    <div class="download-prompt" hidden>
      <label>Что хотите изменить?
        <textarea class="download-wish" rows="2" maxlength="1000" placeholder="${escape(entry.adaptation.example)}"></textarea>
      </label>
      <button type="button" class="download-copy">Скопировать промпт для DeepSeek</button>
      <textarea class="download-prompt-text" rows="5" readonly hidden aria-label="Промпт для ручного копирования"></textarea>
      <p class="download-copy-status" role="status"></p>
    </div>
    <p class="download-note"><a href="${guideUrl}#${entry.adaptation.gif || 'adaptation-example'}">Как изменить и проверить · GIF и шаги</a></p>
  </details>
</section>`;
}

export function adaptationPrompt(entry) {
  const { edits, checks } = entry.adaptation;
  const html = `${entry.slug}.html`;
  return `Я прикладываю рабочую копию тренажёра MathExam «${entry.title}». Тема — ${entry.topic}. Уровень — ${entry.level}.

Пожелание: {{изменение}}

Сначала открой приложенный файл ${html}. Если его нет, попроси прислать файл. Сохрани существующий тренажёр и внеси одно согласованное изменение.

Нужные разделы файла ${html} перечислены ниже.
${Object.entries(edits).map(([label, text]) => `- ${label}. ${text}`).join('\n')}

При замене чисел согласуй условие, рисунок, ответ, подсказки и разбор. При изменении оформления сохрани математику. Учитывай допустимые записи, границы и ограничения. Сохрани авторство MathExam и запуск двойным щелчком без библиотек из сети, регистрации и отправки данных. Сохрани отдельные проверки самостоятельного решения и решения с помощью, если они есть в исходнике.

Проверь изменённую копию по этим примерам.
${checks.map(text => `- ${text}`).join('\n')}
- Проверь, что пустой ответ не засчитывается, неверный отклоняется, а верный принимается. Для заданий без поля ввода проверь пропущенный шаг, неверный выбор и верный выбор.

Верни полный HTML под новым именем ${entry.slug}-my.html. Перечисли, что изменилось, и дай три ожидаемых результата проверки. Отметь проверки, которые требуется выполнить вручную.
`;
}

export function adaptationReadme(entry, example) {
  const { edits, checks } = entry.adaptation;
  const gifDescription = entry.adaptation.gif === 'adapt-geometry'
    ? 'На примере ромба видно, как заменить числа, сверить чертёж и проверить новый ответ.'
    : entry.adaptation.gif === 'adapt-graph'
    ? 'На примере графика с выколотой точкой видно, как согласовать формулу, ограничения и ответ после замены числа.'
    : entry.adaptation.gif === 'adapt-derivative'
    ? 'На примере касательной видно, как согласовать две точки, рисунок и производную: прежний ответ 2 отклоняется, новый ответ 1,5 принимается.'
    : entry.adaptation.gif === 'adapt-finance'
    ? 'В примере меняется срок февральской просрочки. После пересчёта таблицы прежняя переплата 375,1 тыс. ₽ отклоняется, а 363,1 тыс. ₽ принимается.'
    : entry.adaptation.gif === 'adapt-log-inequality'
    ? 'В первом варианте меняется знаменатель с 6 на 8. На оси точка 1 остаётся исключённой, а новая граница 6 входит в ответ.'
    : entry.adaptation.gif === 'adapt-divisibility'
    ? 'В задаче меняются числа. Копия отклоняет прежний пример 2030, принимает 2050 и проверяет новый максимум 2059.'
    : 'В примере меняется размер текста, затем проверяется работа тренажёра.';
  const localEditing = entry.adaptation.localEditing ? `
## Как сохранить и править копию в Windows

Для первой правки сохраните файл как \`${entry.slug}-my.html\`: оставьте начало имени, поскольку оно используется некоторыми учебными модулями. В Блокноте выберите «Файл → Сохранить как», тип «Все файлы» и кодировку UTF-8. Проверьте, что имя заканчивается на \`.html\`, а не на \`.html.txt\`.

Небольшую правку текста можно сделать самостоятельно: откройте HTML через «Открыть с помощью → Блокнот», найдите нужную фразу сочетанием Ctrl+F, измените её и сохраните Ctrl+S. Вернитесь в браузер и обновите страницу Ctrl+R. Изменение чисел требует также пересчитать ответ и проверить рисунок, ограничения и подсказки по примерам ниже.
` : '';
  return `# ${entry.title}

1. Распакуйте ZIP и дважды щёлкните по файлу \`${entry.slug}.html\`. Если скачали один HTML, его можно открыть сразу.
2. Откройте \`${entry.slug}-deepseek-prompt.md\` в текстовом редакторе. Вместо \`{{изменение}}\` напишите, что хотите поменять. Пример запроса — «${entry.adaptation.example}».
3. Скопируйте запрос в DeepSeek и приложите скачанный HTML. Для изменения достаточно этого файла. Данные кабинета и файлы с чужими ответами в запросе не нужны.
4. Сохраните изменённый HTML под новым именем рядом с исходной копией. Если вернулся только код, вставьте его в текстовый редактор и сохраните с расширением \`.html\` в UTF-8.
5. Откройте новый файл без интернета. Проверьте пустой и неверный ответы, верный ответ, подсказку и переход к следующему заданию. Если вместо поля кнопки, проверьте неверный и верный выбор.
${localEditing}

## Где менять

| Что | Где искать в HTML |
| --- | --- |
${Object.entries(edits).map(([label, text]) => `| ${label} | ${text.replaceAll('|', '\\|')} |`).join('\n')}

## Контрольные примеры

${checks.map(text => `- ${text}`).join('\n')}

## Как выглядит весь процесс

Откройте \`adapt-trainer.gif\` в браузере или просмотрите шаги выше. ${gifDescription} \`adapt-trainer.png\` содержит все ${example.steps.length} кадров.

## Возможности копии

${offlineLimit}

${entry.adaptation.limit || ''}

Источник материалов — [MathExam](https://mathexam.space${entry.sourceHtml}).
`.replace(/\n{3,}/g, '\n\n');
}

export function writeAdaptationFiles(root, pkgDir, entry) {
  const assets = path.join(root, 'assets', 'trainer-skill-gifs');
  const slug = entry.adaptation.gif || 'adapt-trainer';
  const example = JSON.parse(fs.readFileSync(path.join(assets, 'index.json'), 'utf8'))[slug];
  if (!example) throw new Error(`Unknown adaptation GIF: ${slug}`);
  fs.writeFileSync(path.join(pkgDir, 'README.md'), adaptationReadme(entry, example), 'utf8');
  for (const extension of ['gif', 'png']) {
    fs.copyFileSync(path.join(assets, `${slug}.${extension}`), path.join(pkgDir, `adapt-trainer.${extension}`));
  }
}
