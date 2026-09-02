# Чего не хватает и что с этим делать

В переданном архиве были только страницы сайта и тренажёр планиметрии.
Не пришли:

- `pryamougolny-treugolnik-trenazher.html` (TID `righttri-t1`) и его архив
  `pt-src-1.3.zip` с `ui-test.js` и независимой верификацией банка;
- `vectors-yashchenko-t2.html` (TID `ege-t2-yashchenko`) и его архив
  `vectors-t2-trainer-1.0.zip` с `ui-vec-test.js`.

Оба уже прописаны в `index.html` (карточки, пилюли маршрута, адаптеры
`righttri` и `vec2y`), в `review.html` (TRAINERS и 23 типа в NAMES) и в
`RV.CABINET` — кабинет учителя показывает их сводку по данным из журнала.
До появления файлов ссылки «Открыть» и «Повторить» ведут в пустоту.

## Что сделать, когда файлы придут

1. Положить оба HTML в `trainers/`, их тесты и верификации — в `tests/`
   (в верификациях поправить `require` на `../src/<тренажёр>/…`, как это
   сделано для планиметрии).

2. В каждом тренажёре повторить правку зеркала — ровно ту же, что уже сделана
   в `trainers/planimetry-yashchenko-t1.html`:

   **Стили**, рядом с блоком `html.board …`:

   ```css
   html.mirror body{transform:scaleX(-1)}
   .boardtools{display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end}
   #fsBtn{display:none}
   html.board #fsBtn{display:inline-block}
   ```

   **Разметка**, вместо одиночной кнопки «Режим доски»:

   ```html
   <div class="boardtools">
     <button class="btn" id="boardBtn" aria-pressed="false" title="Крупный шрифт для показа на доске">Режим доски</button>
     <button class="btn" id="mirrorBtn" aria-pressed="false" title="Для проекторов, дающих зеркальное изображение">Зеркало</button>
     <button class="btn" id="fsBtn" title="Развернуть страницу на весь экран">Во весь экран</button>
   </div>
   ```

   **Скрипт**, рядом с существующей `setBoard` (её саму не трогать):

   ```js
   /* Зеркало не сохраняется: это настройка проектора, а не ученика. */
   function setMirror(on){
     document.documentElement.classList.toggle('mirror', on);
     const b = $('#mirrorBtn'); b.setAttribute('aria-pressed', String(on)); b.textContent = on ? 'Убрать зеркало' : 'Зеркало';
   }
   function canFullscreen(){
     const r = document.documentElement;
     return !!(r.requestFullscreen || r.webkitRequestFullscreen);
   }
   function toggleFullscreen(){
     const r = document.documentElement;
     try{
       if (document.fullscreenElement || document.webkitFullscreenElement)
         (document.exitFullscreen || document.webkitExitFullscreen).call(document);
       else
         (r.requestFullscreen || r.webkitRequestFullscreen).call(r);
     }catch(e){ /* на доске без поддержки просто ничего не происходит */ }
   }
   function urlFlag(name){
     return new RegExp('(^|[?&])' + name + '=1(&|$)').test(location.search || '');
   }
   ```

   и в `init()`, сразу после обработчика `#boardBtn`:

   ```js
   $('#mirrorBtn').addEventListener('click', () => setMirror(!document.documentElement.classList.contains('mirror')));
   if (canFullscreen()) $('#fsBtn').addEventListener('click', toggleFullscreen);
   else $('#fsBtn').remove();
   if (stats.board) setBoard(true);
   if (urlFlag('board')) setBoard(true);
   if (urlFlag('mirror')) setMirror(true);
   ```

   Порядок важен: сохранённая настройка применяется первой, `?board=1`
   поверх неё, разбор `?mode=review` остаётся последним, как был.

3. В `tests/board-mirror-test.js` продублировать блоки 2–4, подставив путь к
   новому тренажёру и его TID; в `tests/teacher-test.js` сид уже содержит оба
   TID, менять там ничего не нужно.

4. Прогнать всё: `npm test` в `ege-profil/`.

## Отдельно: клики по чертежу у тренажёра треугольника

У него, в отличие от планиметрии, есть перетаскиваемые SVG-хитбоксы. Проверить
на настоящем Chromium с касанием (`has_touch`, `is_mobile`), а не только
мышью: `touch-action:none` должен стоять на контейнере `<svg>`, а во время
жеста узлы нельзя пересоздавать — только обновлять атрибуты на месте.
Зеркало это не меняет (координаты пересчитывает браузер), но проверить стоит
именно под `?mirror=1`.
