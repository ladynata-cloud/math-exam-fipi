/* One visible sequence for the public course and the private saved route.
 * Stage order is guidance, never a gate or a claim of mastery. Browser-local
 * workshops stay explicitly separate from managed attempts. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Grade7RouteMap=api;})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const courses = [
  {
    "id": "algebra",
    "title": "Алгебра · Макарычев",
    "lead": "Девять остановок от рациональных чисел до уравнений. Порядок помогает ориентироваться, все остановки открыты.",
    "stages": [
      {
        "id": "algebra-numbers",
        "title": "Рациональные числа",
        "lead": "Знак, дробная запись и действия с числами.",
        "items": [],
        "local": [
          {
            "id": "alg-rational",
            "title": "Рациональные числа: знак, доля и положение",
            "url": "/school/index.html?course=makarychev7-start#lesson/alg-rational"
          },
          {
            "id": "m7f-decimals",
            "title": "Дроби и десятичная запись",
            "url": "/school/index.html?course=makarychev7-start#lesson/m7f-decimals"
          },
          {
            "id": "m7f-signed-products",
            "title": "Умножение и деление чисел со знаками",
            "url": "/school/index.html?course=makarychev7-start#lesson/m7f-signed-products"
          }
        ],
        "videos": [
          "negative-numbers",
          "fractions"
        ]
      },
      {
        "id": "algebra-numeric",
        "title": "Числовые выражения",
        "lead": "Порядок действий и запись решения без исчезающих строк.",
        "items": [
          "path:grade7-a-expression-structure"
        ],
        "local": [
          {
            "id": "alg-order",
            "title": "Числовые выражения: управляй порядком действий",
            "url": "/school/index.html?course=makarychev7-start#lesson/alg-order"
          },
          {
            "id": "m7f-calculation-plan",
            "title": "Вычисление по действиям без потерянных строк",
            "url": "/school/index.html?course=makarychev7-start#lesson/m7f-calculation-plan"
          }
        ],
        "videos": [
          "numeric-expressions"
        ]
      },
      {
        "id": "algebra-variables",
        "title": "Выражения с переменными",
        "lead": "От слов и букв к подстановке конкретного значения.",
        "items": [
          "path:grade7-a-substitution-negative-fraction"
        ],
        "local": [
          {
            "id": "alg-variable",
            "title": "Переменная: одна буква — одно значение",
            "url": "/school/index.html?course=makarychev7-start#lesson/alg-variable"
          },
          {
            "id": "m7f-expression-language",
            "title": "Переведи условие на язык выражений",
            "url": "/school/index.html?course=makarychev7-start#lesson/m7f-expression-language"
          },
          {
            "id": "m7f-allowed-values",
            "title": "Когда выражение имеет смысл",
            "url": "/school/index.html?course=makarychev7-start#lesson/m7f-allowed-values"
          }
        ],
        "videos": [
          "variable-expressions"
        ]
      },
      {
        "id": "algebra-compare",
        "title": "Сравнение выражений",
        "lead": "Сравни значения и объясни знак разности.",
        "items": [],
        "local": [
          {
            "id": "alg-compare",
            "title": "Сравнение выражений: знак разности",
            "url": "/school/index.html?course=makarychev7-start#lesson/alg-compare"
          },
          {
            "id": "m7f-compare-difference",
            "title": "Сравнение через разность",
            "url": "/school/index.html?course=makarychev7-start#lesson/m7f-compare-difference"
          }
        ],
        "videos": [
          "compare-expressions"
        ]
      },
      {
        "id": "algebra-properties",
        "title": "Свойства действий",
        "lead": "Удобное вычисление, общий множитель и минус перед скобками.",
        "items": [
          "path:grade7-a-opposite-expression"
        ],
        "local": [
          {
            "id": "alg-properties",
            "title": "Распределение: множитель для каждого слагаемого",
            "url": "/school/index.html?course=makarychev7-start#lesson/alg-properties"
          },
          {
            "id": "m7f-convenient-calculation",
            "title": "Свойства действий: считай удобнее",
            "url": "/school/index.html?course=makarychev7-start#lesson/m7f-convenient-calculation"
          },
          {
            "id": "m7f-common-factor",
            "title": "Общий множитель: собери сумму в произведение",
            "url": "/school/index.html?course=makarychev7-start#lesson/m7f-common-factor"
          }
        ],
        "videos": [
          "arithmetic-properties"
        ]
      },
      {
        "id": "algebra-identities",
        "title": "Тождества и преобразования",
        "lead": "Подобные слагаемые, скобки и проверка равенства.",
        "items": [
          "path:grade7-a-two-variable-collect"
        ],
        "local": [
          {
            "id": "alg-identity",
            "title": "Тождества и подобные: объясни равенство",
            "url": "/school/index.html?course=makarychev7-start#lesson/alg-identity"
          },
          {
            "id": "m7f-collect-like",
            "title": "Подобные слагаемые и скобки",
            "url": "/school/index.html?course=makarychev7-start#lesson/m7f-collect-like"
          },
          {
            "id": "m7f-identity-check",
            "title": "Тождество: доказательство или контрпример",
            "url": "/school/index.html?course=makarychev7-start#lesson/m7f-identity-check"
          }
        ],
        "videos": [
          "identities"
        ]
      },
      {
        "id": "algebra-roots",
        "title": "Уравнение и его корни",
        "lead": "Проверь подстановкой и сохрани равенство двух частей.",
        "items": [],
        "local": [
          {
            "id": "m7f-equation-root",
            "title": "Корень уравнения: проверь подстановкой",
            "url": "/school/index.html?course=makarychev7-start#lesson/m7f-equation-root"
          },
          {
            "id": "m7f-equation-balance",
            "title": "Равносильные шаги: одинаковое действие с двух сторон",
            "url": "/school/index.html?course=makarychev7-start#lesson/m7f-equation-balance"
          }
        ],
        "videos": [
          "equation-roots",
          "linear-equation"
        ]
      },
      {
        "id": "algebra-equations",
        "title": "Линейные уравнения",
        "lead": "От простого корня к знакам, скобкам и дробным коэффициентам.",
        "items": [
          "path:grade7-a-equation-two-brackets",
          "path:grade7-a-equation-denominators",
          "path:grade7-a-equation-decimals"
        ],
        "local": [
          {
            "id": "m7f-equation-transfer",
            "title": "Буквы слева, числа справа",
            "url": "/school/index.html?course=makarychev7-start#lesson/m7f-equation-transfer"
          },
          {
            "id": "m7f-equation-brackets",
            "title": "Уравнения со скобками",
            "url": "/school/index.html?course=makarychev7-start#lesson/m7f-equation-brackets"
          },
          {
            "id": "m7f-equation-fractions",
            "title": "Уравнения с дробями и десятичными числами",
            "url": "/school/index.html?course=makarychev7-start#lesson/m7f-equation-fractions"
          },
          {
            "id": "m7f-equation-cases",
            "title": "Один корень, ни одного или любое число",
            "url": "/school/index.html?course=makarychev7-start#lesson/m7f-equation-cases"
          }
        ],
        "videos": [
          "brackets",
          "linear-cases"
        ]
      },
      {
        "id": "algebra-word",
        "title": "Текстовые задачи уравнением",
        "lead": "Выбери неизвестное, составь связь и проверь смысл ответа.",
        "items": [
          "path:grade7-a-equation-word-perimeter"
        ],
        "local": [
          {
            "id": "m7f-word-parts",
            "title": "Текстовая задача: части и изменения количества",
            "url": "/school/index.html?course=makarychev7-start#lesson/m7f-word-parts"
          },
          {
            "id": "m7f-word-motion",
            "title": "Текстовая задача: скорость, время, расстояние",
            "url": "/school/index.html?course=makarychev7-start#lesson/m7f-word-motion"
          }
        ],
        "videos": [
          "equation-word-problems"
        ]
      }
    ]
  },
  {
    "id": "geometry",
    "title": "Геометрия · Атанасян",
    "lead": "Начальные сведения, треугольники и равнобедренный треугольник. Сначала читаем чертёж, затем объясняем каждую связь.",
    "stages": [
      {
        "id": "geometry-drawing",
        "title": "Точки, прямые, лучи и отрезки",
        "lead": "Узнай объекты на рисунке; найди целое, части и середину.",
        "items": [
          "path:grade7-g-core-point-line-ray",
          "path:grade7-g-segment-order",
          "path:grade7-g-midpoint-chain",
          "path:grade7-g-practice-segment-equation"
        ],
        "local": [
          {
            "id": "segments",
            "title": "Прямая: что задают две точки",
            "url": "/geometry-course/atlas/segments.html"
          },
          {
            "id": "equality",
            "title": "Совместить, сравнить, объяснить",
            "url": "/geometry-course/atlas/equality.html"
          },
          {
            "id": "length",
            "title": "Части отрезка и единая мера",
            "url": "/geometry-course/atlas/length.html"
          }
        ],
        "videos": []
      },
      {
        "id": "geometry-angles",
        "title": "Углы, измерение и перпендикулярность",
        "lead": "Прочитай угол, измерь его и разберись со смежными, вертикальными и прямыми углами.",
        "items": [
          "path:grade7-g-angle-naming",
          "path:grade7-g-core-angle-measure",
          "path:grade7-g-angle-addition",
          "path:grade7-g-angle-bisector",
          "path:grade7-g-adjacent-equation",
          "path:grade7-g-vertical-chain",
          "path:grade7-g-core-perpendicular",
          "path:grade7-g-practice-angle-parts",
          "path:grade7-g-practice-vertical-proof"
        ],
        "local": [
          {
            "id": "angles",
            "title": "Читаем угол и выбираем его вершину",
            "url": "/geometry-course/atlas/angles.html"
          },
          {
            "id": "measure-angle",
            "title": "Измеряем и складываем углы",
            "url": "/geometry-course/atlas/measure-angle.html"
          },
          {
            "id": "perpendicular",
            "title": "Смежные, вертикальные, прямые",
            "url": "/geometry-course/atlas/perpendicular.html"
          }
        ],
        "videos": [
          "adjacent-angles"
        ]
      },
      {
        "id": "geometry-triangle-elements",
        "title": "Элементы и периметр треугольника",
        "lead": "Назови вершины, стороны и углы; найди длину границы.",
        "items": [
          "path:grade7-g-core-triangle-elements",
          "path:grade7-g-core-triangle-perimeter"
        ],
        "local": [],
        "videos": []
      },
      {
        "id": "geometry-congruence",
        "title": "Равенство и первый признак",
        "lead": "Сопоставь вершины. Две стороны и угол между ними — данные первого признака.",
        "items": [
          "path:grade7-g-triangle-correspondence",
          "path:grade7-g-core-sas",
          "path:grade7-g-practice-sas-common-side",
          "path:grade7-g-practice-sas-vertical"
        ],
        "local": [
          {
            "id": "triangle-sas",
            "title": "Первый признак равенства",
            "url": "/geometry-course/atlas/triangle-sas.html"
          }
        ],
        "videos": []
      },
      {
        "id": "geometry-cevians",
        "title": "Медиана, биссектриса и высота",
        "lead": "Различи три определения и построй нужную линию.",
        "items": [
          "path:grade7-g-core-median",
          "path:grade7-g-core-bisector",
          "path:grade7-g-core-altitude",
          "path:grade7-g-practice-cevian-reason"
        ],
        "local": [
          {
            "id": "cevians",
            "title": "Три линии из вершины: не путать роли",
            "url": "/geometry-course/atlas/cevians.html"
          }
        ],
        "videos": []
      },
      {
        "id": "geometry-isosceles",
        "title": "Равнобедренный треугольник",
        "lead": "Равные стороны, углы при основании и линия из вершины.",
        "items": [
          "path:grade7-g-core-isosceles-elements",
          "path:grade7-g-core-isosceles-base-angles",
          "path:grade7-g-core-isosceles-vertex-line",
          "path:grade7-g-practice-isosceles-perimeter",
          "path:grade7-g-practice-isosceles-proof"
        ],
        "local": [],
        "videos": []
      }
    ],
    "more": [
      {
        "id": "triangle-signs",
        "title": "Признаки и соответствие вершин",
        "url": "/geometry-course/atlas/triangle-signs.html"
      },
      {
        "id": "compass",
        "title": "Циркуль и линейка",
        "url": "/geometry-course/atlas/compass.html"
      },
      {
        "id": "parallels",
        "title": "Свойство и признак параллельности",
        "url": "/geometry-course/atlas/parallels.html"
      },
      {
        "id": "parallel-angles",
        "title": "Углы при секущей",
        "url": "/geometry-course/atlas/parallel-angles.html"
      },
      {
        "id": "triangle-angles",
        "title": "Сумма углов треугольника",
        "url": "/geometry-course/atlas/triangle-angles.html"
      },
      {
        "id": "right-triangle",
        "title": "Прямоугольный треугольник",
        "url": "/geometry-course/atlas/right-triangle.html"
      },
      {
        "id": "distance",
        "title": "Расстояние и построения",
        "url": "/geometry-course/atlas/distance.html"
      }
    ]
  },
  {
    "id": "foundation",
    "title": "Если нужна основа",
    "lead": "Необязательная ветка. Выбери один мешающий навык и вернись к своей задаче; проходить весь блок подряд не нужно.",
    "stages": [
      {
        "id": "foundation-numbers",
        "title": "Числа и действия до 7 класса",
        "lead": "Разряды, сравнение, нули, сложение и вычитание.",
        "items": [
          "path:pre7-place-value",
          "path:pre7-natural-compare",
          "path:pre7-add-carry",
          "path:pre7-subtract-borrow",
          "path:pre7-smart-calculation",
          "path:pre7-inverse-components"
        ],
        "local": [],
        "videos": []
      },
      {
        "id": "foundation-fractions",
        "title": "Смысл и сравнение дробей",
        "lead": "Одинаковое целое, равные доли и разные записи числа.",
        "items": [
          "path:pre7-fraction-line",
          "path:pre7-equivalent-fractions",
          "path:pre7-fraction-compare",
          "path:pre7-fraction-part-whole",
          "path:pre7-decimal-compare"
        ],
        "local": [],
        "videos": [
          "fractions"
        ]
      },
      {
        "id": "foundation-measurement",
        "title": "Задачи, величины и измерения",
        "lead": "Делимость, шкалы, простые задачи, длина, периметр и площадь.",
        "items": [
          "path:pre7-divisibility",
          "path:pre7-scale-reading",
          "path:pre7-comparison-stories",
          "path:pre7-mass-capacity",
          "path:pre7-ruler-length",
          "path:pre7-perimeter",
          "path:pre7-grid-area"
        ],
        "local": [],
        "videos": []
      },
      {
        "id": "foundation-bridge",
        "title": "Основа для текущей темы 7 класса",
        "lead": "Действия с дробями, знаки, десятичное деление и проценты через пропорцию.",
        "items": [
          "path:grade7-b-mixed-borrow",
          "path:grade7-b-fraction-product-cancel",
          "path:grade7-b-fraction-division-meaning",
          "path:grade7-b-decimal-place-align",
          "path:grade7-b-decimal-divisor-scale",
          "path:grade7-b-signed-fraction-sum",
          "path:grade7-b-ratio-units",
          "path:grade7-b-percent-proportion"
        ],
        "local": [],
        "videos": [
          "negative-numbers",
          "proportions",
          "percentages"
        ]
      }
    ]
  }
];
 for(const course of courses){for(const stage of course.stages){stage.items=Object.freeze(stage.items);stage.local=Object.freeze(stage.local.map(Object.freeze));stage.videos=Object.freeze(stage.videos);Object.freeze(stage);}Object.freeze(course.stages);if(course.more)Object.freeze(course.more);Object.freeze(course);}
 const stages=courses.flatMap(course=>course.stages);
 function stageFor(itemId){return stages.find(stage=>stage.items.includes(itemId))||null;}
 function videoIds(stage,guides){return [...new Set([...stage.videos,...stage.items.map(id=>guides?.forItem(id)?.id).filter(Boolean)])];}
 const E=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function render({catalog,guides,mode='public',attempts=[],labels={},learnerId}){
  const saved=attempts.filter(a=>a.learnerId===learnerId&&!a.archivedAt);
  const latest=item=>saved.filter(a=>a.trainerId===item.trainerId&&a.contentId===item.contentId).sort((a,b)=>String(b.updatedAt||b.createdAt).localeCompare(String(a.updatedAt||a.createdAt)))[0];
  const videoPair=id=>{const guide=guides?.get(id);if(!guide)return '';const url='https://mathexam.space/video-lessons/cheatsheets.html';return `<div class="study-videos"><a href="${url}#${E(id)}" target="_blank" rel="noopener">▶ Разбор примера</a><a href="${url}?type=trainer#${E(id)}" target="_blank" rel="noopener">Как пользоваться тренажёром</a></div>`;};
  const task=item=>{if(!item)return '';const guide=guides?.forItem(item.id),attempt=latest(item);const status=attempt?(labels[attempt.outcome]||'Начато')+(attempt.outcome==='started'&&(attempt.assistance?.hints||attempt.assistance?.teacher)?' · с помощью':''):'Ещё не начинали';const practice=mode==='cabinet'?`<button type="button" class="button study-open" data-study-item="${E(item.id)}">${attempt?'Продолжить работу':'Открыть задание'} →</button>`:`<a class="button study-open" href="https://mathexam-board-ladynata.amvera.io/learning/#practice=${encodeURIComponent(item.id)}">Открыть в кабинете →</a><a class="study-preview" href="https://mathexam.space/ege-baza/path/index.html?practice=1#lesson=${E(item.contentId)}">Попробовать без входа</a>`;return `<article class="study-task" data-study-content="${E(item.id)}"><h5>${E(item.title)}</h5><p class="study-status">${mode==='cabinet'?E(status):'Сохраняется через кабинет'}</p>${practice}${guide?videoPair(guide.id):'<p class="study-note">В тренажёре: модель, шаги и подсказки.</p>'}</article>`;};
  const modes=course=>{
   if(!['algebra','geometry'].includes(course.id))return '';
   const helped=course.stages.flatMap(stage=>stage.items).map(id=>catalog.get(id)).filter(item=>{const attempt=latest(item);return attempt&&['started','hinted','together','practiced'].includes(attempt.outcome);}).slice(0,6);
   return `<div class="study-modes" role="group" aria-label="Как идти: ${E(course.title)}"><button type="button" data-study-mode="ordered" aria-pressed="true">Иду по порядку</button><button type="button" data-study-mode="targeted" aria-pressed="false">Разбираю трудную тему</button><button type="button" data-study-mode="check" aria-pressed="false">Проверяю себя</button></div><p class="study-mode-note" data-study-mode-note>Открывай остановки по порядку или сразу переходи к нужной. Все темы доступны.</p><div class="study-topic-picker" data-study-picker hidden><label>Что хочется разобрать?<select data-study-select aria-label="Трудная тема: ${E(course.title)}">${course.stages.map(stage=>`<option value="${stage.id}">${E(stage.title)}</option>`).join('')}</select></label>${helped.length?`<p class="study-note">Твои начатые работы и темы, где была помощь:</p><div class="study-weak-links">${helped.map(item=>`<button type="button" data-study-focus="${E(stageFor(item.id).id)}">${E(item.title)}</button>`).join('')}</div>`:'<p class="study-note">Выбери тему сама или по совету Натальи Михайловны. Сохранённые начатые работы появятся здесь.</p>'}<p class="study-note">Внутри своей работы можно открыть «Нужна основа?» и затем вернуться к тому же заданию.</p></div>`;
  };
  return `<div class="study-track-tabs" role="group" aria-label="Направление маршрута">${courses.map((course,i)=>`<button type="button" data-study-track="${course.id}" aria-pressed="${i===0}">${E(course.title)}</button>`).join('')}</div><p class="study-cycle-line">Видео по желанию → модель и шаги при затруднении → новый пример самостоятельно → сдать в кабинете.</p><p class="study-note">Любую тему можно открыть сразу. Правильный ответ в одной задаче не означает, что освоена вся тема.</p>${courses.map((course,courseIndex)=>`<section class="study-course" data-study-course="${course.id}" data-study-view="ordered" data-study-private="${mode==='cabinet'}" ${courseIndex?'hidden':''}><h3>${E(course.title)}</h3><p>${E(course.lead)}</p>${modes(course)}${course.stages.map((stage,index)=>`<details class="study-stage" id="study-stage-${stage.id}" ${index===0?'open':''}><summary><span class="study-number">${index+1}</span><span>${E(stage.title)}</span><small>${stage.items.length?'Практика в кабинете':'Мастерская'}</small></summary><div class="study-stage-body"><p>${E(stage.lead)}</p>${stage.videos.length?`<div class="study-topic-videos"><span class="study-note">Видео по теме; инструкция показывает тренажёр из ролика.</span>${stage.videos.map(id=>`<div><b>${E(guides?.get(id)?.title||id)}</b>${videoPair(id)}</div>`).join('')}</div>`:''}${stage.items.length?`<div class="study-task-grid">${stage.items.map(id=>task(catalog.get(id))).join('')}</div>`:''}${stage.local.length?`<details class="study-local" ${!stage.items.length?'open':''}><summary>Занятия мастерской (${stage.local.length}) · в этом браузере</summary><p class="study-note">Эти занятия сохраняют работу только в текущем браузере. Она не переносится в кабинет; фото письменного решения отправляешь в MAX сама.</p><ul>${stage.local.map(lesson=>`<li><a href="https://mathexam.space${E(lesson.url)}" target="_blank" rel="noopener">${E(lesson.title)} ↗</a></li>`).join('')}</ul></details>`:''}</div></details>`).join('')}${course.more?.length?`<details class="study-local"><summary>На будущее: следующие темы геометрии</summary><p class="study-note">Необязательные отдельные материалы после основного маршрута. Работа в этих мастерских остаётся в текущем браузере.</p><ul>${course.more.map(lesson=>`<li><a href="https://mathexam.space${E(lesson.url)}" target="_blank" rel="noopener">${E(lesson.title)} ↗</a></li>`).join('')}</ul></details>`:''}${course.id==='geometry'?'<p class="study-note">Темы по Атанасяну; их расположение может отличаться в разных изданиях. <a href="https://mathexam.space/geometry-course/" target="_blank" rel="noopener">Другие геометрические модели и тренажёры ↗</a></p>':''}</section>`).join('')}`;
 }
 function bind(host){
  const select=id=>{if(!courses.some(course=>course.id===id))return;host.querySelectorAll('[data-study-course]').forEach(el=>el.hidden=el.dataset.studyCourse!==id);host.querySelectorAll('[data-study-track]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.studyTrack===id)));};
  host.querySelectorAll('[data-study-track]').forEach(button=>button.onclick=()=>select(button.dataset.studyTrack));
  for(const section of host.querySelectorAll('[data-study-course]')){
   const course=courses.find(course=>course.id===section.dataset.studyCourse),picker=section.querySelector('[data-study-picker]'),selectTopic=section.querySelector('[data-study-select]');
   if(!picker||!selectTopic)continue;
   const stageElements=[...section.querySelectorAll('.study-stage')];
   const showMode=mode=>{
    if(!['ordered','targeted','check'].includes(mode))return;
    section.dataset.studyView=mode;
    section.querySelectorAll('[data-study-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.studyMode===mode)));
    picker.hidden=mode!=='targeted';
    section.querySelector('[data-study-mode-note]').textContent=mode==='ordered'?'Открывай остановки по порядку или сразу переходи к нужной. Все темы доступны.':mode==='targeted'?'Выбери один трудный шаг. Подсказки и более ранние темы помогут разобраться; остальные работы сохранятся.':section.dataset.studyPrivate==='true'?'Нажми на задание, чтобы начать новый самостоятельный пример. Подсказки можно открыть в работе, если понадобятся. Прежние результаты останутся в истории.':'Выбери задание и открой его карточку в кабинете. Там можно продолжить работу или взять новый самостоятельный пример. Выбор этого режима сам по себе не начинает попытку.';
    for(const el of stageElements){const stage=course.stages.find(stage=>el.id==='study-stage-'+stage.id);el.hidden=mode==='targeted'?stage.id!==selectTopic.value:mode==='check'?!stage.items.length:false;if(!el.hidden&&mode!=='ordered')el.open=true;}
    section.querySelectorAll('[data-study-item]').forEach(button=>{if(!button.dataset.studyOriginal)button.dataset.studyOriginal=button.textContent;button.textContent=mode==='check'?'Новый пример самостоятельно →':button.dataset.studyOriginal;});
   };
   section.querySelectorAll('[data-study-mode]').forEach(button=>button.onclick=()=>showMode(button.dataset.studyMode));
   selectTopic.onchange=()=>showMode('targeted');
   section.querySelectorAll('[data-study-focus]').forEach(button=>button.onclick=()=>{selectTopic.value=button.dataset.studyFocus;showMode('targeted');});
  }
  return {select};
 }

 return Object.freeze({courses:Object.freeze(courses),stages:Object.freeze(stages),stageFor,videoIds,render,bind});
});
