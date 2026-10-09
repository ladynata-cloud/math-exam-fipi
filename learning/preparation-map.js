/* Shared foundations route. Entries point to existing content; this map neither
 * creates attempts nor infers mastery. Public practice has no server result. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.LearningPreparation=api;})(typeof globalThis==='undefined'?this:globalThis,function(){
'use strict';
const groups=[
  {
    "id": "numbers",
    "title": "Числа и вычисления",
    "lead": "Разряды, сравнение и четыре действия. Начните здесь, если мешают ошибки в счёте.",
    "items": [
      {
        "id": "path:pre7-place-value",
        "managedId": "path:pre7-place-value",
        "title": "Разряды числа и важные нули",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Apre7-place-value",
        "publicUrl": "/ege-baza/path/index.html#lesson=pre7-place-value"
      },
      {
        "id": "path:pre7-natural-compare",
        "managedId": "path:pre7-natural-compare",
        "title": "Сравниваем натуральные числа",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Apre7-natural-compare",
        "publicUrl": "/ege-baza/path/index.html#lesson=pre7-natural-compare"
      },
      {
        "id": "path:pre7-add-carry",
        "managedId": "path:pre7-add-carry",
        "title": "Сложение с переносом разряда",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Apre7-add-carry",
        "publicUrl": "/ege-baza/path/index.html#lesson=pre7-add-carry"
      },
      {
        "id": "path:pre7-subtract-borrow",
        "managedId": "path:pre7-subtract-borrow",
        "title": "Вычитание с разменом через нули",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Apre7-subtract-borrow",
        "publicUrl": "/ege-baza/path/index.html#lesson=pre7-subtract-borrow"
      },
      {
        "id": "oge-basics:order-of-operations",
        "managedId": "oge-basics:order-of-operations",
        "title": "Порядок действий без путаницы",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=oge-basics%3Aorder-of-operations",
        "publicUrl": "/trainers/oge-basics/order-of-operations.html"
      },
      {
        "id": "path:pre7-smart-calculation",
        "managedId": "path:pre7-smart-calculation",
        "title": "Считаем удобным способом",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Apre7-smart-calculation",
        "publicUrl": "/ege-baza/path/index.html#lesson=pre7-smart-calculation"
      },
      {
        "id": "path:pre7-divisibility",
        "managedId": "path:pre7-divisibility",
        "title": "Признаки делимости: замечаем закономерность",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Apre7-divisibility",
        "publicUrl": "/ege-baza/path/index.html#lesson=pre7-divisibility"
      },
      {
        "id": "oge-basics:rounding",
        "managedId": "oge-basics:rounding",
        "title": "Округление: четыре шага и упаковки",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=oge-basics%3Arounding",
        "publicUrl": "/trainers/oge-basics/rounding.html"
      },
      {
        "id": "public:arithmetic",
        "managedId": null,
        "title": "Арифметика: выбрать свой уровень",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/oge-basics/arithmetic-route.html",
        "note": "43 уровня: от состава числа до дробей. Итоги сохраняются в этом браузере."
      },
      {
        "id": "public:addition-small",
        "managedId": null,
        "title": "Состав числа и счёт до 20",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/arifmetika.html?course=preoge&level=c1a"
      },
      {
        "id": "public:v6-gcd-list",
        "managedId": null,
        "title": "Общие делители и НОД",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin6#lesson/v6f-gcd-list",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      },
      {
        "id": "public:v6-lcm-find",
        "managedId": null,
        "title": "Общие кратные и НОК",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin6#lesson/v6f-lcm-find",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      },
      {
        "id": "public:v5-power-read",
        "managedId": null,
        "title": "Что означает степень",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin5#lesson/v5f-power-read",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      },
      {
        "id": "public:vilenkin5",
        "managedId": null,
        "title": "Все темы пятого класса",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html#course/vilenkin5",
        "note": "Полный тематический маршрут с авторскими задачами; это не решения каждого номера учебника."
      },
      {
        "id": "public:vilenkin6",
        "managedId": null,
        "title": "Все темы шестого класса",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html#course/vilenkin6",
        "note": "От дробей и отношений до уравнений и координат. Прогресс хранится в браузере."
      }
    ]
  },
  {
    "id": "multiplication",
    "title": "Таблица умножения",
    "lead": "Сначала равные группы, затем таблица и обратное действие. К этому блоку можно вернуться прямо из деления.",
    "items": [
      {
        "id": "oge-basics:multiplication-division/multiplication-meaning",
        "managedId": "oge-basics:multiplication-division/multiplication-meaning",
        "title": "Почему умножаем",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=oge-basics%3Amultiplication-division%2Fmultiplication-meaning",
        "publicUrl": "/trainers/oge-basics/multiplication-division/multiplication-meaning.html"
      },
      {
        "id": "oge-basics:multiplication-division/multiplication-ladder",
        "managedId": "oge-basics:multiplication-division/multiplication-ladder",
        "title": "Одна таблица за раз",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=oge-basics%3Amultiplication-division%2Fmultiplication-ladder",
        "publicUrl": "/trainers/oge-basics/multiplication-division/multiplication-ladder.html"
      },
      {
        "id": "oge-basics:multiplication-division/multiplication-mixed",
        "managedId": "oge-basics:multiplication-division/multiplication-mixed",
        "title": "Таблица вперемешку",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=oge-basics%3Amultiplication-division%2Fmultiplication-mixed",
        "publicUrl": "/trainers/oge-basics/multiplication-division/multiplication-mixed.html"
      },
      {
        "id": "oge-basics:multiplication-division/tabular-division",
        "managedId": "oge-basics:multiplication-division/tabular-division",
        "title": "Деление по таблице",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=oge-basics%3Amultiplication-division%2Ftabular-division",
        "publicUrl": "/trainers/oge-basics/multiplication-division/tabular-division.html"
      },
      {
        "id": "oge-basics:multiplication-division/multiplication-pythagoras-table",
        "managedId": "oge-basics:multiplication-division/multiplication-pythagoras-table",
        "title": "Таблица Пифагора: находим произведение по строке и столбцу",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=oge-basics%3Amultiplication-division%2Fmultiplication-pythagoras-table",
        "publicUrl": "/trainers/oge-basics/multiplication-division/multiplication-pythagoras-table.html"
      },
      {
        "id": "oge-basics:multiplication-division/multiplication-tricks",
        "managedId": "oge-basics:multiplication-division/multiplication-tricks",
        "title": "Таблица умножения: понятные приёмы вместо угадывания",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=oge-basics%3Amultiplication-division%2Fmultiplication-tricks",
        "publicUrl": "/trainers/oge-basics/multiplication-division/multiplication-tricks.html"
      },
      {
        "id": "oge-basics:multiplication-division",
        "managedId": "oge-basics:multiplication-division",
        "title": "Умножение и деление: одна семья действий",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=oge-basics%3Amultiplication-division",
        "publicUrl": "/trainers/oge-basics/multiplication-division.html"
      },
      {
        "id": "oge-basics:multiplication-division/column-multiplication-one-digit",
        "managedId": "oge-basics:multiplication-division/column-multiplication-one-digit",
        "title": "Умножение столбиком на одну цифру — по разрядам",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=oge-basics%3Amultiplication-division%2Fcolumn-multiplication-one-digit",
        "publicUrl": "/trainers/oge-basics/multiplication-division/column-multiplication-one-digit.html"
      },
      {
        "id": "oge-basics:multiplication-division/column-multiplication-two-digit",
        "managedId": "oge-basics:multiplication-division/column-multiplication-two-digit",
        "title": "Умножение столбиком на двузначное число — два произведения",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=oge-basics%3Amultiplication-division%2Fcolumn-multiplication-two-digit",
        "publicUrl": "/trainers/oge-basics/multiplication-division/column-multiplication-two-digit.html"
      },
      {
        "id": "public:table-visual",
        "managedId": null,
        "title": "Таблица умножения на рисунке",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/arifmetika.html?course=preoge&level=t2a"
      }
    ]
  },
  {
    "id": "division",
    "title": "Деление уголком",
    "lead": "Выберите неполное делимое, подберите цифру частного и сохраните все строки решения.",
    "items": [
      {
        "id": "oge-basics:multiplication-division/long-division-quotient-digit",
        "managedId": "oge-basics:multiplication-division/long-division-quotient-digit",
        "title": "Подбираем цифру частного",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=oge-basics%3Amultiplication-division%2Flong-division-quotient-digit",
        "publicUrl": "/trainers/oge-basics/multiplication-division/long-division-quotient-digit.html"
      },
      {
        "id": "oge-basics:multiplication-division/long-division-one-digit",
        "managedId": "oge-basics:multiplication-division/long-division-one-digit",
        "title": "Делим на одну цифру",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=oge-basics%3Amultiplication-division%2Flong-division-one-digit",
        "publicUrl": "/trainers/oge-basics/multiplication-division/long-division-one-digit.html"
      },
      {
        "id": "oge-basics:multiplication-division/long-division-zero-in-quotient",
        "managedId": "oge-basics:multiplication-division/long-division-zero-in-quotient",
        "title": "Не теряем ноль в частном",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=oge-basics%3Amultiplication-division%2Flong-division-zero-in-quotient",
        "publicUrl": "/trainers/oge-basics/multiplication-division/long-division-zero-in-quotient.html"
      },
      {
        "id": "oge-basics:multiplication-division/long-division-two-digit",
        "managedId": "oge-basics:multiplication-division/long-division-two-digit",
        "title": "Делим на двузначное число",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=oge-basics%3Amultiplication-division%2Flong-division-two-digit",
        "publicUrl": "/trainers/oge-basics/multiplication-division/long-division-two-digit.html"
      },
      {
        "id": "oge-basics:multiplication-division/division-with-remainder",
        "managedId": "oge-basics:multiplication-division/division-with-remainder",
        "title": "Деление с остатком: частное, остаток и проверка",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=oge-basics%3Amultiplication-division%2Fdivision-with-remainder",
        "publicUrl": "/trainers/oge-basics/multiplication-division/division-with-remainder.html"
      },
      {
        "id": "oge-basics:multiplication-division/long-division-with-remainder",
        "managedId": "oge-basics:multiplication-division/long-division-with-remainder",
        "title": "Деление уголком с остатком",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=oge-basics%3Amultiplication-division%2Flong-division-with-remainder",
        "publicUrl": "/trainers/oge-basics/multiplication-division/long-division-with-remainder.html"
      },
      {
        "id": "oge-basics:multiplication-division/long-division-from-simple-to-decimals",
        "managedId": "oge-basics:multiplication-division/long-division-from-simple-to-decimals",
        "title": "Деление уголком: от первого шага до десятичных дробей",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=oge-basics%3Amultiplication-division%2Flong-division-from-simple-to-decimals",
        "publicUrl": "/trainers/oge-basics/multiplication-division/long-division-from-simple-to-decimals.html"
      },
      {
        "id": "oge-basics:multiplication-division/division-lab",
        "managedId": "oge-basics:multiplication-division/division-lab",
        "title": "Лаборатория деления уголком",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=oge-basics%3Amultiplication-division%2Fdivision-lab",
        "publicUrl": "/trainers/oge-basics/multiplication-division/division-lab.html"
      },
      {
        "id": "oge-basics:multiplication-division/long-division-mixed-checkpoint",
        "managedId": "oge-basics:multiplication-division/long-division-mixed-checkpoint",
        "title": "Смешанная проверка: деление уголком",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=oge-basics%3Amultiplication-division%2Flong-division-mixed-checkpoint",
        "publicUrl": "/trainers/oge-basics/multiplication-division/long-division-mixed-checkpoint.html"
      },
      {
        "id": "public:division-slider",
        "managedId": null,
        "title": "Деление с выбором неполного делимого",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/arifmetika.html?course=preoge&level=n3e",
        "note": "Знакомый тренажёр с ползунком. Есть повторение таблицы умножения."
      },
      {
        "id": "public:division-notebook",
        "managedId": null,
        "title": "Подробное деление: один вопрос за раз",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/oge-basics/multiplication-division/long-division-from-simple-to-decimals.html?course=preoge",
        "note": "Свободная версия с тетрадной записью; сохранение в этом браузере."
      }
    ]
  },
  {
    "id": "decimals",
    "title": "Десятичные дроби",
    "lead": "Значение цифры зависит от места. Разберитесь с разрядами, затем переходите к действиям.",
    "items": [
      {
        "id": "path:pre7-decimal-compare",
        "managedId": "path:pre7-decimal-compare",
        "title": "Сравниваем десятичные дроби",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Apre7-decimal-compare",
        "publicUrl": "/ege-baza/path/index.html#lesson=pre7-decimal-compare"
      },
      {
        "id": "oge-basics:decimal-add-subtract",
        "managedId": "oge-basics:decimal-add-subtract",
        "title": "Десятичные дроби: сложение и вычитание",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=oge-basics%3Adecimal-add-subtract",
        "publicUrl": "/trainers/oge-basics/decimal-add-subtract.html"
      },
      {
        "id": "path:grade7-b-decimal-place-align",
        "managedId": "path:grade7-b-decimal-place-align",
        "title": "Десятичные дроби: разряд под разрядом",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Agrade7-b-decimal-place-align",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-b-decimal-place-align"
      },
      {
        "id": "oge-basics:multiplication-division/decimal-division-natural",
        "managedId": "oge-basics:multiplication-division/decimal-division-natural",
        "title": "Делим дробь на натуральное число",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=oge-basics%3Amultiplication-division%2Fdecimal-division-natural",
        "publicUrl": "/trainers/oge-basics/multiplication-division/decimal-division-natural.html"
      },
      {
        "id": "oge-basics:multiplication-division/division-append-zeros",
        "managedId": "oge-basics:multiplication-division/division-append-zeros",
        "title": "Продолжаем деление после запятой",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=oge-basics%3Amultiplication-division%2Fdivision-append-zeros",
        "publicUrl": "/trainers/oge-basics/multiplication-division/division-append-zeros.html"
      },
      {
        "id": "oge-basics:multiplication-division/decimal-divisor-shift",
        "managedId": "oge-basics:multiplication-division/decimal-divisor-shift",
        "title": "Делаем делитель натуральным",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=oge-basics%3Amultiplication-division%2Fdecimal-divisor-shift",
        "publicUrl": "/trainers/oge-basics/multiplication-division/decimal-divisor-shift.html"
      },
      {
        "id": "path:grade7-b-decimal-divisor-scale",
        "managedId": "path:grade7-b-decimal-divisor-scale",
        "title": "Деление десятичных: делитель без запятой",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Agrade7-b-decimal-divisor-scale",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-b-decimal-divisor-scale"
      },
      {
        "id": "public:decimal-linked",
        "managedId": null,
        "title": "Две запятые: передвигаем вместе",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/arifmetika.html?course=preoge&level=n5f",
        "note": "Возьмите любую запятую: обе сдвинутся на одинаковое число разрядов."
      },
      {
        "id": "public:decimal-cash",
        "managedId": null,
        "title": "Касса разрядов",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/decimal-cash-trainer.html"
      },
      {
        "id": "public:decimal-intro",
        "managedId": null,
        "title": "Десятичные дроби: первые шаги",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/desyatichnye-drobi-level-1.html"
      },
      {
        "id": "public:v5-decimal-multiply",
        "managedId": null,
        "title": "Умножение десятичных дробей",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin5#lesson/v5f-decimal-multiply",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      },
      {
        "id": "public:v5-decimal-zeros",
        "managedId": null,
        "title": "Почему можно дописать нули",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin5#lesson/v5f-decimal-zeros",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      }
    ]
  },
  {
    "id": "fractions",
    "title": "Обыкновенные дроби",
    "lead": "Часть и целое → равные дроби → общий знаменатель → действия.",
    "items": [
      {
        "id": "oge-basics:fraction-meaning",
        "managedId": "oge-basics:fraction-meaning",
        "title": "Дробь: часть, целое и равные записи",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=oge-basics%3Afraction-meaning",
        "publicUrl": "/trainers/oge-basics/fraction-meaning.html"
      },
      {
        "id": "path:pre7-equivalent-fractions",
        "managedId": "path:pre7-equivalent-fractions",
        "title": "Равные дроби и сокращение",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Apre7-equivalent-fractions",
        "publicUrl": "/ege-baza/path/index.html#lesson=pre7-equivalent-fractions"
      },
      {
        "id": "path:pre7-fraction-compare",
        "managedId": "path:pre7-fraction-compare",
        "title": "Сравниваем обыкновенные дроби",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Apre7-fraction-compare",
        "publicUrl": "/ege-baza/path/index.html#lesson=pre7-fraction-compare"
      },
      {
        "id": "oge-basics:fraction-common-denominator",
        "managedId": "oge-basics:fraction-common-denominator",
        "title": "Дроби: общий знаменатель и сложение",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=oge-basics%3Afraction-common-denominator",
        "publicUrl": "/trainers/oge-basics/fraction-common-denominator.html"
      },
      {
        "id": "path:grade7-b-fraction-product-cancel",
        "managedId": "path:grade7-b-fraction-product-cancel",
        "title": "Умножение дробей: сокращаем множители",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Agrade7-b-fraction-product-cancel",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-b-fraction-product-cancel"
      },
      {
        "id": "path:grade7-b-fraction-division-meaning",
        "managedId": "path:grade7-b-fraction-division-meaning",
        "title": "Деление дробей: что показывает частное",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Agrade7-b-fraction-division-meaning",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-b-fraction-division-meaning"
      },
      {
        "id": "path:pre7-fraction-line",
        "managedId": "path:pre7-fraction-line",
        "title": "Дроби на числовом луче",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Apre7-fraction-line",
        "publicUrl": "/ege-baza/path/index.html#lesson=pre7-fraction-line"
      },
      {
        "id": "path:pre7-fraction-part-whole",
        "managedId": "path:pre7-fraction-part-whole",
        "title": "Доля, часть и целое",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Apre7-fraction-part-whole",
        "publicUrl": "/ege-baza/path/index.html#lesson=pre7-fraction-part-whole"
      },
      {
        "id": "path:grade7-b-mixed-borrow",
        "managedId": "path:grade7-b-mixed-borrow",
        "title": "Смешанные числа: занимаем единицу",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Agrade7-b-mixed-borrow",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-b-mixed-borrow"
      },
      {
        "id": "public:fraction-part-whole",
        "managedId": null,
        "title": "Задачи: дробь, часть и целое",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/fractions-part-whole-assignment.html"
      },
      {
        "id": "public:fraction-practice",
        "managedId": null,
        "title": "Все действия с дробями",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/oge-task6-fractions.html"
      },
      {
        "id": "public:fraction-more",
        "managedId": null,
        "title": "Ещё практика дробей",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/drobi-oge-trainer.html"
      },
      {
        "id": "public:v6-mixed-add",
        "managedId": null,
        "title": "Сложение смешанных чисел",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin6#lesson/v6f-mixed-add",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      },
      {
        "id": "public:v6-mixed-divide",
        "managedId": null,
        "title": "Деление смешанных чисел",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin6#lesson/v6f-mixed-divide",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      },
      {
        "id": "public:v6-fraction-order",
        "managedId": null,
        "title": "Дроби и порядок действий",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin6#lesson/v6f-fraction-order",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      }
    ]
  },
  {
    "id": "signed",
    "title": "Отрицательные числа",
    "lead": "Сначала положение на прямой и смысл знака, потом вычисления.",
    "items": [
      {
        "id": "oge-basics:negative-number-line",
        "managedId": "oge-basics:negative-number-line",
        "title": "Отрицательные числа на прямой",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=oge-basics%3Anegative-number-line",
        "publicUrl": "/trainers/oge-basics/negative-number-line.html"
      },
      {
        "id": "oge-basics:negative-add-subtract",
        "managedId": "oge-basics:negative-add-subtract",
        "title": "Отрицательные числа: сложение и вычитание",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=oge-basics%3Anegative-add-subtract",
        "publicUrl": "/trainers/oge-basics/negative-add-subtract.html"
      },
      {
        "id": "path:grade7-b-signed-fraction-sum",
        "managedId": "path:grade7-b-signed-fraction-sum",
        "title": "Дроби со знаками: общие доли",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Agrade7-b-signed-fraction-sum",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-b-signed-fraction-sum"
      },
      {
        "id": "public:signed-multiply",
        "managedId": null,
        "title": "Умножение чисел со знаками",
        "kind": "public",
        "tier": "core",
        "url": "/school/index.html?course=vilenkin6#lesson/v6f-multiply-sign",
        "note": "Знак произведения и проверка на примерах. Работа в этом браузере."
      },
      {
        "id": "public:signed-divide",
        "managedId": null,
        "title": "Деление чисел со знаками",
        "kind": "public",
        "tier": "core",
        "url": "/school/index.html?course=vilenkin6#lesson/v6f-divide-sign",
        "note": "Знак частного и проверка умножением. Работа в этом браузере."
      },
      {
        "id": "public:negative-explore",
        "managedId": null,
        "title": "Числовая прямая: передвигайте точки",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/negative-numbers.html"
      },
      {
        "id": "public:negative-line",
        "managedId": null,
        "title": "Ещё одна модель числовой прямой",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/negative-numbers-line.html"
      },
      {
        "id": "public:negative-marker",
        "managedId": null,
        "title": "Отрицательные числа с маркером",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/negative-numbers-alternative.html"
      },
      {
        "id": "public:absolute-compare",
        "managedId": null,
        "title": "Кто сильнее по модулю?",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/who-is-stronger.html"
      },
      {
        "id": "public:v6-subtract-negative",
        "managedId": null,
        "title": "Вычитание отрицательного числа",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin6#lesson/v6f-subtract-negative",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      },
      {
        "id": "public:v6-properties-order",
        "managedId": null,
        "title": "Знаки, степени и порядок действий",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin6#lesson/v6f-properties-order",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      }
    ]
  },
  {
    "id": "percent",
    "title": "Проценты и пропорции",
    "lead": "Выясните, что принято за целое. Запишите связь величин и выберите нужное действие.",
    "items": [
      {
        "id": "oge-basics:percentages/percent-meaning",
        "managedId": "oge-basics:percentages/percent-meaning",
        "title": "100%, 1% и доля",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=oge-basics%3Apercentages%2Fpercent-meaning",
        "publicUrl": "/trainers/oge-basics/percentages/percent-meaning.html"
      },
      {
        "id": "oge-basics:percentages/percent-of-number-and-whole",
        "managedId": "oge-basics:percentages/percent-of-number-and-whole",
        "title": "Три вопроса о проценте",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=oge-basics%3Apercentages%2Fpercent-of-number-and-whole",
        "publicUrl": "/trainers/oge-basics/percentages/percent-of-number-and-whole.html"
      },
      {
        "id": "oge-basics:percentages/proportion",
        "managedId": "oge-basics:percentages/proportion",
        "title": "Пропорция",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=oge-basics%3Apercentages%2Fproportion",
        "publicUrl": "/trainers/oge-basics/percentages/proportion.html"
      },
      {
        "id": "oge-basics:percentages/percent-change",
        "managedId": "oge-basics:percentages/percent-change",
        "title": "Увеличение, уменьшение и изменение",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=oge-basics%3Apercentages%2Fpercent-change",
        "publicUrl": "/trainers/oge-basics/percentages/percent-change.html"
      },
      {
        "id": "oge-basics:percentages/percent-choose-question",
        "managedId": "oge-basics:percentages/percent-choose-question",
        "title": "Что спрашивают в задаче",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=oge-basics%3Apercentages%2Fpercent-choose-question",
        "publicUrl": "/trainers/oge-basics/percentages/percent-choose-question.html"
      },
      {
        "id": "oge-basics:percentages/percent-final-checkpoint",
        "managedId": "oge-basics:percentages/percent-final-checkpoint",
        "title": "Итоговая проверка по процентам",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=oge-basics%3Apercentages%2Fpercent-final-checkpoint",
        "publicUrl": "/trainers/oge-basics/percentages/percent-final-checkpoint.html"
      },
      {
        "id": "path:grade7-b-percent-proportion",
        "managedId": "path:grade7-b-percent-proportion",
        "title": "Проценты через пропорцию",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Agrade7-b-percent-proportion",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-b-percent-proportion"
      },
      {
        "id": "path:grade7-b-ratio-units",
        "managedId": "path:grade7-b-ratio-units",
        "title": "Отношения: сначала одинаковые единицы",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Agrade7-b-ratio-units",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-b-ratio-units"
      },
      {
        "id": "public:percent-model",
        "managedId": null,
        "title": "Часть и целое: наглядная модель процентов",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/percent-part-whole-trainer.html"
      },
      {
        "id": "public:percent-table",
        "managedId": null,
        "title": "Проценты в таблице",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/oge-1-5-trainers/percent-table-trainer.html"
      },
      {
        "id": "public:v6-ratio-split",
        "managedId": null,
        "title": "Делим целое в заданном отношении",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin6#lesson/v6f-ratio-split",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      },
      {
        "id": "public:v6-direct",
        "managedId": null,
        "title": "Прямая пропорциональность",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin6#lesson/v6f-direct",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      },
      {
        "id": "public:v6-inverse",
        "managedId": null,
        "title": "Обратная пропорциональность",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin6#lesson/v6f-inverse",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      },
      {
        "id": "public:v6-scale-real",
        "managedId": null,
        "title": "Масштаб: от карты к расстоянию",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin6#lesson/v6f-scale-real",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      }
    ]
  },
  {
    "id": "expressions",
    "title": "Выражения и скобки",
    "lead": "Подставляйте числа аккуратно. Отдельно отработайте минус перед скобками и подобные слагаемые.",
    "items": [
      {
        "id": "path:grade7-a-expression-structure",
        "managedId": "path:grade7-a-expression-structure",
        "title": "Как устроено выражение",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Agrade7-a-expression-structure",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-a-expression-structure"
      },
      {
        "id": "path:grade7-a-opposite-expression",
        "managedId": "path:grade7-a-opposite-expression",
        "title": "Минус перед выражением",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Agrade7-a-opposite-expression",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-a-opposite-expression"
      },
      {
        "id": "path:grade7-a-two-variable-collect",
        "managedId": "path:grade7-a-two-variable-collect",
        "title": "Подобные слагаемые с двумя буквами",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Agrade7-a-two-variable-collect",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-a-two-variable-collect"
      },
      {
        "id": "path:grade7-a-substitution-negative-fraction",
        "managedId": "path:grade7-a-substitution-negative-fraction",
        "title": "Подстановка отрицательной дроби",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Agrade7-a-substitution-negative-fraction",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-a-substitution-negative-fraction"
      },
      {
        "id": "public:like-lab",
        "managedId": null,
        "title": "Подобные слагаемые: исследование",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/like-terms-lab.html"
      },
      {
        "id": "public:like-factory",
        "managedId": null,
        "title": "Подобные слагаемые: собрать группы",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/like-terms-factory.html"
      },
      {
        "id": "public:like-practice",
        "managedId": null,
        "title": "Подобные слагаемые: практика",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/like-terms-trainer.html"
      },
      {
        "id": "public:v6-brackets-factor",
        "managedId": null,
        "title": "Число перед скобками",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin6#lesson/v6f-brackets-factor",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      },
      {
        "id": "public:v6-properties-factor",
        "managedId": null,
        "title": "Общий множитель",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin6#lesson/v6f-properties-factor",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      },
      {
        "id": "public:identities",
        "managedId": null,
        "title": "Формулы сокращённого умножения",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/formuly-sokrashchennogo-umnozheniya-trainer.html",
        "note": "Следующий уровень после освоения скобок."
      },
      {
        "id": "public:powers-roots",
        "managedId": null,
        "title": "Степени и квадратные корни",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/oge-task8-powers-roots.html",
        "note": "Следующий уровень для подготовки к ОГЭ."
      }
    ]
  },
  {
    "id": "equations",
    "title": "Уравнения и неравенства",
    "lead": "Начните с неизвестного компонента. Затем сохраняйте равенство при каждом преобразовании.",
    "items": [
      {
        "id": "path:pre7-inverse-components",
        "managedId": "path:pre7-inverse-components",
        "title": "Находим неизвестный компонент",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Apre7-inverse-components",
        "publicUrl": "/ege-baza/path/index.html#lesson=pre7-inverse-components"
      },
      {
        "id": "path:equations-linear",
        "managedId": "path:equations-linear",
        "title": "Простые линейные уравнения",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Aequations-linear",
        "publicUrl": "/ege-baza/path/index.html#lesson=equations-linear"
      },
      {
        "id": "path:equations-signs",
        "managedId": "path:equations-signs",
        "title": "Уравнения со знаками",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Aequations-signs",
        "publicUrl": "/ege-baza/path/index.html#lesson=equations-signs"
      },
      {
        "id": "path:equations-brackets",
        "managedId": "path:equations-brackets",
        "title": "Уравнения со скобками",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Aequations-brackets",
        "publicUrl": "/ege-baza/path/index.html#lesson=equations-brackets"
      },
      {
        "id": "path:equations-fractions",
        "managedId": "path:equations-fractions",
        "title": "Дробный ответ",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Aequations-fractions",
        "publicUrl": "/ege-baza/path/index.html#lesson=equations-fractions"
      },
      {
        "id": "path:grade7-a-equation-two-brackets",
        "managedId": "path:grade7-a-equation-two-brackets",
        "title": "Уравнение с двумя скобками",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Agrade7-a-equation-two-brackets",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-a-equation-two-brackets"
      },
      {
        "id": "path:grade7-a-equation-denominators",
        "managedId": "path:grade7-a-equation-denominators",
        "title": "Уравнение: убираем знаменатели",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Agrade7-a-equation-denominators",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-a-equation-denominators"
      },
      {
        "id": "path:grade7-a-equation-decimals",
        "managedId": "path:grade7-a-equation-decimals",
        "title": "Уравнение с десятичными дробями",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Agrade7-a-equation-decimals",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-a-equation-decimals"
      },
      {
        "id": "public:equation-simple",
        "managedId": null,
        "title": "Самые простые уравнения по шагам",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/simple-equations-stepwise.html"
      },
      {
        "id": "public:equation-builder",
        "managedId": null,
        "title": "Собираем решение уравнения",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/equations-builder.html"
      },
      {
        "id": "public:inequality-read",
        "managedId": null,
        "title": "Читаем условия на числовой прямой",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/inequalities-number-line-reader.html"
      },
      {
        "id": "public:inequality-model",
        "managedId": null,
        "title": "От условия к промежутку",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/inequalities-number-line.html"
      },
      {
        "id": "public:inequality-linear",
        "managedId": null,
        "title": "Линейные неравенства по шагам",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/linear-inequalities-stepwise.html"
      },
      {
        "id": "public:equation-exam",
        "managedId": null,
        "title": "Уравнения: применение в ОГЭ",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/oge-task9-equations.html"
      }
    ]
  },
  {
    "id": "word",
    "title": "Понимаем текст задачи",
    "lead": "Назовите известные величины, вопрос и связь между ними. Ответ обязательно сверьте с условием.",
    "items": [
      {
        "id": "path:pre7-comparison-stories",
        "managedId": "path:pre7-comparison-stories",
        "title": "Задачи: на сколько и во сколько",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Apre7-comparison-stories",
        "publicUrl": "/ege-baza/path/index.html#lesson=pre7-comparison-stories"
      },
      {
        "id": "path:practice-change",
        "managedId": "path:practice-change",
        "title": "Покупка и сдача",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Apractice-change",
        "publicUrl": "/ege-baza/path/index.html#lesson=practice-change"
      },
      {
        "id": "path:practice-afford",
        "managedId": "path:practice-afford",
        "title": "На сколько покупок хватит денег",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Apractice-afford",
        "publicUrl": "/ege-baza/path/index.html#lesson=practice-afford"
      },
      {
        "id": "path:grade7-a-equation-word-perimeter",
        "managedId": "path:grade7-a-equation-word-perimeter",
        "title": "Периметр: составляем уравнение",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Agrade7-a-equation-word-perimeter",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-a-equation-word-perimeter"
      },
      {
        "id": "path:practice-meeting",
        "managedId": "path:practice-meeting",
        "title": "Движение навстречу",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Apractice-meeting",
        "publicUrl": "/ege-baza/path/index.html#lesson=practice-meeting"
      },
      {
        "id": "path:practice-work",
        "managedId": "path:practice-work",
        "title": "Совместная работа",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Apractice-work",
        "publicUrl": "/ege-baza/path/index.html#lesson=practice-work"
      },
      {
        "id": "path:practice-river",
        "managedId": "path:practice-river",
        "title": "Движение по реке",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Apractice-river",
        "publicUrl": "/ege-baza/path/index.html#lesson=practice-river"
      },
      {
        "id": "path:practice-average-speed",
        "managedId": "path:practice-average-speed",
        "title": "Средняя скорость",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Apractice-average-speed",
        "publicUrl": "/ege-baza/path/index.html#lesson=practice-average-speed"
      },
      {
        "id": "public:v5-formula-distance",
        "managedId": null,
        "title": "Скорость, время и расстояние",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin5#lesson/v5f-formula-distance",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      },
      {
        "id": "public:v6-whole-from-remainder",
        "managedId": null,
        "title": "Восстанавливаем целое по остатку",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin6#lesson/v6f-whole-from-remainder",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      },
      {
        "id": "public:v6-motion-meeting",
        "managedId": null,
        "title": "Встреча и догонка на модели",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin6#lesson/v6f-motion-meeting",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      },
      {
        "id": "public:part-whole",
        "managedId": null,
        "title": "Часть, целое и доля: разные вопросы",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/part-whole-share-assignment.html"
      }
    ]
  },
  {
    "id": "data",
    "title": "Таблицы, графики и вероятность",
    "lead": "Прочитайте названия и шкалу. Сначала найдите нужные данные, затем вычисляйте.",
    "items": [
      {
        "id": "path:pre7-scale-reading",
        "managedId": "path:pre7-scale-reading",
        "title": "Шкала: деления и отметки",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Apre7-scale-reading",
        "publicUrl": "/ege-baza/path/index.html#lesson=pre7-scale-reading"
      },
      {
        "id": "path:data",
        "managedId": "path:data",
        "title": "Читаем таблицу и диаграмму",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Adata",
        "publicUrl": "/ege-baza/path/index.html#lesson=data"
      },
      {
        "id": "path:practice-chart",
        "managedId": "path:practice-chart",
        "title": "Максимум и минимум на диаграмме",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Apractice-chart",
        "publicUrl": "/ege-baza/path/index.html#lesson=practice-chart"
      },
      {
        "id": "path:probability",
        "managedId": "path:probability",
        "title": "Доля подходящих исходов",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Aprobability",
        "publicUrl": "/ege-baza/path/index.html#lesson=probability"
      },
      {
        "id": "path:practice-ranking",
        "managedId": "path:practice-ranking",
        "title": "Место в таблице",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Apractice-ranking",
        "publicUrl": "/ege-baza/path/index.html#lesson=practice-ranking"
      },
      {
        "id": "path:practice-interval-data",
        "managedId": "path:practice-interval-data",
        "title": "Данные за нужный промежуток",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Apractice-interval-data",
        "publicUrl": "/ege-baza/path/index.html#lesson=practice-interval-data"
      },
      {
        "id": "public:v6-coordinates-place",
        "managedId": null,
        "title": "Ставим точку по координатам",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin6#lesson/v6f-coordinates-place",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      },
      {
        "id": "public:v6-graph-read",
        "managedId": null,
        "title": "Читаем значение по графику",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin6#lesson/v6f-graph-read",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      },
      {
        "id": "public:v6-graph-build",
        "managedId": null,
        "title": "Строим график по таблице",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin6#lesson/v6f-graph-build",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      },
      {
        "id": "public:v6-mean-calculate",
        "managedId": null,
        "title": "Среднее арифметическое",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin6#lesson/v6f-mean-calculate",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      },
      {
        "id": "public:linear-function",
        "managedId": null,
        "title": "Прямая: как меняют график коэффициенты",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/linear-function-lab.html",
        "note": "Следующий уровень после координат."
      }
    ]
  },
  {
    "id": "geometry",
    "title": "Измерения и геометрия",
    "lead": "Длина, время, периметр и площадь. Затем отрезки и углы на понятных моделях.",
    "items": [
      {
        "id": "path:pre7-ruler-length",
        "managedId": "path:pre7-ruler-length",
        "title": "Измеряем длину по линейке",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Apre7-ruler-length",
        "publicUrl": "/ege-baza/path/index.html#lesson=pre7-ruler-length"
      },
      {
        "id": "oge-basics:units-length-time",
        "managedId": "oge-basics:units-length-time",
        "title": "Единицы длины и времени",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=oge-basics%3Aunits-length-time",
        "publicUrl": "/trainers/oge-basics/units-length-time.html"
      },
      {
        "id": "path:pre7-perimeter",
        "managedId": "path:pre7-perimeter",
        "title": "Периметр: обходим границу",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Apre7-perimeter",
        "publicUrl": "/ege-baza/path/index.html#lesson=pre7-perimeter"
      },
      {
        "id": "path:pre7-grid-area",
        "managedId": "path:pre7-grid-area",
        "title": "Площадь по клеткам",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Apre7-grid-area",
        "publicUrl": "/ege-baza/path/index.html#lesson=pre7-grid-area"
      },
      {
        "id": "oge-basics:units-area",
        "managedId": "oge-basics:units-area",
        "title": "Квадратные единицы без ловушек",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=oge-basics%3Aunits-area",
        "publicUrl": "/trainers/oge-basics/units-area.html"
      },
      {
        "id": "path:grade7-g-core-angle-measure",
        "managedId": "path:grade7-g-core-angle-measure",
        "title": "Измеряем угол транспортиром",
        "kind": "managed",
        "tier": "core",
        "url": "/learning/#practice=path%3Agrade7-g-core-angle-measure",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-g-core-angle-measure"
      },
      {
        "id": "path:pre7-mass-capacity",
        "managedId": "path:pre7-mass-capacity",
        "title": "Масса и вместимость",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Apre7-mass-capacity",
        "publicUrl": "/ege-baza/path/index.html#lesson=pre7-mass-capacity"
      },
      {
        "id": "path:grade7-g-segment-order",
        "managedId": "path:grade7-g-segment-order",
        "title": "Отрезки: целое и части",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Agrade7-g-segment-order",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-g-segment-order"
      },
      {
        "id": "path:grade7-g-midpoint-chain",
        "managedId": "path:grade7-g-midpoint-chain",
        "title": "Середина отрезка и половины",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Agrade7-g-midpoint-chain",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-g-midpoint-chain"
      },
      {
        "id": "path:grade7-g-angle-naming",
        "managedId": "path:grade7-g-angle-naming",
        "title": "Название угла и его вершина",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Agrade7-g-angle-naming",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-g-angle-naming"
      },
      {
        "id": "path:grade7-g-angle-addition",
        "managedId": "path:grade7-g-angle-addition",
        "title": "Сложение и вычитание углов",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Agrade7-g-angle-addition",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-g-angle-addition"
      },
      {
        "id": "path:grade7-g-angle-bisector",
        "managedId": "path:grade7-g-angle-bisector",
        "title": "Биссектриса: две равные части",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Agrade7-g-angle-bisector",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-g-angle-bisector"
      },
      {
        "id": "path:grade7-g-core-perpendicular",
        "managedId": "path:grade7-g-core-perpendicular",
        "title": "Перпендикулярные прямые",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Agrade7-g-core-perpendicular",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-g-core-perpendicular"
      },
      {
        "id": "path:grade7-g-core-triangle-perimeter",
        "managedId": "path:grade7-g-core-triangle-perimeter",
        "title": "Периметр треугольника",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Agrade7-g-core-triangle-perimeter",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-g-core-triangle-perimeter"
      },
      {
        "id": "path:grade7-g-core-sas",
        "managedId": "path:grade7-g-core-sas",
        "title": "Первый признак равенства: две стороны и угол",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Agrade7-g-core-sas",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-g-core-sas"
      },
      {
        "id": "path:grade7-g-practice-isosceles-proof",
        "managedId": "path:grade7-g-practice-isosceles-proof",
        "title": "Собери доказательство свойства равнобедренного треугольника",
        "kind": "managed",
        "tier": "extra",
        "url": "/learning/#practice=path%3Agrade7-g-practice-isosceles-proof",
        "publicUrl": "/ege-baza/path/index.html#lesson=grade7-g-practice-isosceles-proof"
      },
      {
        "id": "public:bisector",
        "managedId": null,
        "title": "Строим биссектрису угла",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/bisector-trainer-v2.html"
      },
      {
        "id": "public:midpoint",
        "managedId": null,
        "title": "Середина отрезка: подвижная модель",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/jsxgraph-midpoint.html"
      },
      {
        "id": "public:v5-volume-layers",
        "managedId": null,
        "title": "Объём: считаем слои кубиков",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin5#lesson/v5f-volume-layers",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      },
      {
        "id": "public:v6-symmetry-axis",
        "managedId": null,
        "title": "Симметрия на клетках",
        "kind": "public",
        "tier": "extra",
        "url": "/school/index.html?course=vilenkin6#lesson/v6f-symmetry-axis",
        "note": "Модель, разбор и самостоятельные задачи. Результаты остаются в этом браузере."
      },
      {
        "id": "public:geometry-course",
        "managedId": null,
        "title": "Геометрия: продолжить систематически",
        "kind": "public",
        "tier": "extra",
        "url": "/geometry-course/",
        "note": "Отдельный курс с моделями и тренажёрами."
      },
      {
        "id": "public:geometry-grid",
        "managedId": null,
        "title": "Фигуры на клетчатой бумаге",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/oge-task18-grid.html"
      }
    ]
  }
];
const goals={
  "pass": {
    "id": "pass",
    "title": "Уверенно сдать ОГЭ",
    "lead": "Укрепить вычисления, научиться узнавать основные типы задач и обязательно заниматься геометрией. Учитель выбирает следующий шаг по реальным решениям.",
    "managedIds": [
      "oge-basics:order-of-operations",
      "oge-basics:fraction-common-denominator",
      "oge-basics:decimal-add-subtract",
      "oge-basics:negative-add-subtract",
      "oge-basics:percentages/proportion",
      "path:equations-linear",
      "path:pre7-grid-area",
      "path:grade7-g-angle-addition"
    ],
    "publicItems": [
      {
        "id": "public:oge-start",
        "managedId": null,
        "title": "Курс ОГЭ: основные задания",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/oge-course/"
      },
      {
        "id": "public:oge-six",
        "managedId": null,
        "title": "Числовые вычисления",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/oge-task6-fractions.html"
      },
      {
        "id": "public:oge-nine",
        "managedId": null,
        "title": "Уравнения",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/oge-task9-equations.html"
      },
      {
        "id": "public:oge-ten",
        "managedId": null,
        "title": "Вероятность",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/oge-task10-probability.html"
      },
      {
        "id": "public:oge-grid",
        "managedId": null,
        "title": "Геометрия на клетках",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/oge-task18-grid.html"
      }
    ]
  },
  "grade5": {
    "id": "grade5",
    "title": "ОГЭ на 5",
    "lead": "После проверки основ — уверенная первая часть и развёрнутые решения. Доказывать, объяснять и проверять ответ так же важно, как находить его.",
    "managedIds": [
      "path:equations-brackets",
      "path:grade7-a-equation-denominators",
      "path:grade7-b-fraction-product-cancel",
      "path:practice-work",
      "path:practice-meeting",
      "path:grade7-g-core-sas",
      "path:grade7-g-practice-isosceles-proof"
    ],
    "publicItems": [
      {
        "id": "public:oge-all",
        "managedId": null,
        "title": "Все разделы ОГЭ",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/oge-course/"
      },
      {
        "id": "public:oge-twenty",
        "managedId": null,
        "title": "Алгебра: развёрнутое решение",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/oge-task20-equations.html"
      },
      {
        "id": "public:oge-word",
        "managedId": null,
        "title": "Текстовые задачи",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/oge-task21-word-problems.html"
      },
      {
        "id": "public:oge-graphs",
        "managedId": null,
        "title": "Графики функций",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/oge-task22-functions-graphs.html"
      },
      {
        "id": "public:oge-geometry",
        "managedId": null,
        "title": "Геометрия: вычисления",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/oge-task23-geometry-calculations.html"
      },
      {
        "id": "public:oge-proof",
        "managedId": null,
        "title": "Геометрия: доказательства",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/oge-task24-proofs.html"
      },
      {
        "id": "public:oge-hard",
        "managedId": null,
        "title": "Геометрия повышенной сложности",
        "kind": "public",
        "tier": "extra",
        "url": "/trainers/oge-task25-geometry.html"
      }
    ]
  }
};
const allItems=groups.flatMap(group=>group.items),byId=Object.create(null),managed=Object.create(null);
for(const group of groups){for(const item of group.items){if(byId[item.id])throw Error('Duplicate preparation item: '+item.id);byId[item.id]=item;if(item.managedId)managed[item.managedId]=item;Object.freeze(item);}Object.freeze(group.items);Object.freeze(group);}
for(const goal of Object.values(goals)){Object.freeze(goal.managedIds);goal.publicItems.forEach(Object.freeze);Object.freeze(goal.publicItems);Object.freeze(goal);}
function get(id){return byId[id]||managed[id]||null;}
function practiceUrl(id){const item=get(id);return item&&item.managedId?'/learning/#practice='+encodeURIComponent(item.managedId):'';}
return Object.freeze({version:1,groups:Object.freeze(groups),goals:Object.freeze(goals),allItems:Object.freeze(allItems),byId:Object.freeze(byId),get,groupFor:id=>groups.find(g=>g.items.some(i=>i.id===id||i.managedId===id))||null,practiceUrl});
});
