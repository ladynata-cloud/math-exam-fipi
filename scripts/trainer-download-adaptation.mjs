import fs from 'node:fs';
import path from 'node:path';

export const guideUrl = '/pedagogam/kak-skachat-i-adaptirovat-trenazher/';
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
    <p class="download-note"><a href="${guideUrl}#adaptation-example">Как изменить и проверить · GIF и шаги</a></p>
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
  return `# ${entry.title}

1. Распакуйте ZIP и дважды щёлкните по файлу \`${entry.slug}.html\`. Если скачали один HTML, его можно открыть сразу.
2. Откройте \`${entry.slug}-deepseek-prompt.md\` в текстовом редакторе. Вместо \`{{изменение}}\` напишите, что хотите поменять. Пример запроса — «${entry.adaptation.example}».
3. Скопируйте запрос в DeepSeek и приложите скачанный HTML. Для изменения достаточно этого файла. Данные кабинета и файлы с чужими ответами в запросе не нужны.
4. Сохраните изменённый HTML под новым именем рядом с исходной копией. Если вернулся только код, вставьте его в текстовый редактор и сохраните с расширением \`.html\` в UTF-8.
5. Откройте новый файл без интернета. Проверьте пустой и неверный ответы, верный ответ, подсказку и переход к следующему заданию. Если вместо поля кнопки, проверьте неверный и верный выбор.

## Где менять

| Что | Где искать в HTML |
| --- | --- |
${Object.entries(edits).map(([label, text]) => `| ${label} | ${text.replaceAll('|', '\\|')} |`).join('\n')}

## Контрольные примеры

${checks.map(text => `- ${text}`).join('\n')}

## Как выглядит весь процесс

Откройте \`adapt-trainer.gif\` в браузере или просмотрите шаги выше. В примере меняется размер текста, затем проверяется работа тренажёра. \`adapt-trainer.png\` содержит все ${example.steps.length} кадров.

## Возможности копии

${offlineLimit}

${entry.adaptation.limit || ''}

Источник материалов — [MathExam](https://mathexam.space${entry.sourceHtml}).
`.replace(/\n{3,}/g, '\n\n');
}

export function writeAdaptationFiles(root, pkgDir, entry) {
  const assets = path.join(root, 'assets', 'trainer-skill-gifs');
  const example = JSON.parse(fs.readFileSync(path.join(assets, 'index.json'), 'utf8'))['adapt-trainer'];
  fs.writeFileSync(path.join(pkgDir, 'README.md'), adaptationReadme(entry, example), 'utf8');
  for (const extension of ['gif', 'png']) {
    const name = `adapt-trainer.${extension}`;
    fs.copyFileSync(path.join(assets, name), path.join(pkgDir, name));
  }
}
