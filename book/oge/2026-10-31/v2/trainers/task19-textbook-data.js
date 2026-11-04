/* Verified references to specific textbook editions.
 * Explanations are original mathematical notes, not textbook quotations.
 * Page numbers are edition-specific; external archives are labelled. */
(function(root){
'use strict';
const data = {
  "version": 1,
  "checkedAt": "2026-10-21",
  "label": "Для ценителей строгости и точности",
  "books": {
    "atanasyan2010": {
      "title": "Геометрия. 7–9 классы",
      "authors": "Л. С. Атанасян, В. Ф. Бутузов, С. Б. Кадомцев, Э. Г. Позняк, И. И. Юдина",
      "edition": "20-е издание. Москва: Просвещение, 2010",
      "year": 2010,
      "isbn": "978-5-09-023915-8",
      "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf",
      "hostNote": "Скан издания на образовательном сайте ege-ok.ru. Это внешний архив, не сайт издательства."
    },
    "merzlyak7_2015": {
      "title": "Геометрия. 7 класс",
      "authors": "А. Г. Мерзляк, В. Б. Полонский, М. С. Якир",
      "fullAuthors": "Аркадий Григорьевич Мерзляк; Виталий Борисович Полонский; Михаил Семёнович Якир",
      "edition": "Москва: Вентана-Граф, 2015. 192 с.",
      "year": 2015,
      "isbn": "978-5-360-05508-2",
      "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf",
      "catalogUrl": "https://my-uchebnik.ru/book/geometry/5/geometry-00000035.htm",
      "hostNote": "Скан российского издания во внешнем образовательном архиве «Мой учебник». Это не сайт издательства."
    },
    "merzlyak8_2013": {
      "title": "Геометрия. 8 класс",
      "authors": "А. Г. Мерзляк, В. Б. Полонский, М. С. Якир",
      "fullAuthors": "Аркадий Григорьевич Мерзляк; Виталий Борисович Полонский; Михаил Семёнович Якир",
      "edition": "Москва: Вентана-Граф, 2013. 208 с.",
      "year": 2013,
      "isbn": "978-5-360-04382-9",
      "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf",
      "catalogUrl": "https://my-uchebnik.ru/book/geometry/5/geometry-00000030.htm",
      "hostNote": "Скан российского издания во внешнем образовательном архиве «Мой учебник». Это не сайт издательства."
    },
    "merzlyak9_2022": {
      "title": "Геометрия. 9 класс",
      "authors": "А. Г. Мерзляк, В. Б. Полонский, М. С. Якир; под редакцией В. Е. Подольского",
      "fullAuthors": "Аркадий Григорьевич Мерзляк; Виталий Борисович Полонский; Михаил Семёнович Якир",
      "edition": "7-е издание, стереотипное. Москва: Просвещение, 2022. 256 с. Электронное издание в PDF.",
      "year": 2022,
      "isbn": "978-5-09-101280-4",
      "printIsbn": "978-5-09-087860-9",
      "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000051.pdf",
      "catalogUrl": "https://my-uchebnik.ru/book/geometry/1/geometry-00000051.htm",
      "hostNote": "PDF российского издания во внешнем образовательном архиве «Мой учебник». Это не сайт издательства."
    }
  },
  "topics": {
    "points_lines": {
      "title": "Точки и прямые",
      "explanation": "Две различные точки задают прямую однозначно. Для одной точки направление прямой можно выбирать.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 1",
          "printedPage": "5",
          "pdfPage": 7,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=7"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 1, основное свойство прямой",
          "printedPage": "9",
          "pdfPage": 10,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=10"
        }
      ]
    },
    "angle_bisector": {
      "title": "Биссектриса угла",
      "explanation": "Биссектриса выходит из вершины и разделяет угол на равные части.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 6",
          "printedPage": "12",
          "pdfPage": 14,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=14"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 3, определение биссектрисы угла",
          "printedPage": "22",
          "pdfPage": 23,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=23"
        }
      ]
    },
    "adjacent_vertical": {
      "title": "Углы при пересечении прямых",
      "explanation": "Смежная пара образует развёрнутый угол. Вертикальная пара состоит из противоположных углов.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 11",
          "printedPage": "22",
          "pdfPage": 24,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=24"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 4, определение смежных углов и свойство вертикальных углов",
          "printedPage": "29–30",
          "pdfPage": 30,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=30"
        }
      ]
    },
    "perpendicular": {
      "title": "Перпендикулярные прямые",
      "explanation": "Перпендикулярность означает пересечение под прямым углом. Две различные прямые, перпендикулярные одной прямой на плоскости, параллельны.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 12",
          "printedPage": "22–23",
          "pdfPage": 24,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=24"
        },
        {
          "bookId": "atanasyan2010",
          "section": "п. 24",
          "printedPage": "54",
          "pdfPage": 56,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=56"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 5, определение перпендикулярных прямых",
          "printedPage": "34",
          "pdfPage": 35,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=35"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 13, теорема 13.1",
          "printedPage": "84",
          "pdfPage": 85,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=85"
        }
      ]
    },
    "perpendicular_point": {
      "title": "Перпендикуляр из точки",
      "explanation": "Из внешней точки к прямой существует единственный перпендикуляр.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 16",
          "printedPage": "32–33",
          "pdfPage": 34,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=34"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 7, теорема 7.1",
          "printedPage": "48",
          "pdfPage": 49,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=49"
        }
      ]
    },
    "parallel_alternate": {
      "title": "Признак параллельности: накрест лежащие углы",
      "explanation": "Равенство накрест лежащих углов позволяет установить параллельность прямых.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 25, первый признак",
          "printedPage": "55–56",
          "pdfPage": 57,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=57"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 14, теорема 14.1",
          "printedPage": "88",
          "pdfPage": 89,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=89"
        }
      ]
    },
    "parallel_same_side": {
      "title": "Признак параллельности: односторонние углы",
      "explanation": "Если внутренние односторонние углы составляют 180°, прямые параллельны.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 25, третий признак",
          "printedPage": "57",
          "pdfPage": 59,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=59"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 14, теорема 14.2",
          "printedPage": "89",
          "pdfPage": 90,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=90"
        }
      ]
    },
    "parallel_angles": {
      "title": "Углы у параллельных прямых",
      "explanation": "При секущей накрест лежащие и соответственные углы попарно равны; внутренние односторонние дополняют друг друга до 180°.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 29",
          "printedPage": "63–65",
          "pdfPage": 65,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=65"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 15, теоремы 15.1–15.3",
          "printedPage": "96–97",
          "pdfPage": 97,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=97"
        }
      ]
    },
    "parallel_point": {
      "title": "Параллельная прямая через точку",
      "explanation": "Через внешнюю точку проходит ровно одна прямая, параллельная данной.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 28",
          "printedPage": "60–62",
          "pdfPage": 62,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=62"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 13, аксиома параллельности прямых",
          "printedPage": "85",
          "pdfPage": 86,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=86"
        }
      ]
    },
    "parallel_third": {
      "title": "Две прямые, параллельные третьей",
      "explanation": "У двух различных прямых, параллельных одной прямой, одинаковое направление; они не пересекаются.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 28, следствие 2°",
          "printedPage": "62",
          "pdfPage": 64,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=64",
          "excerpt": {
            "file": "/book/oge/2026-10-31/v2/trainers/task19-textbook/atanasyan-parallel-third.png",
            "alt": "Если две прямые параллельны третьей прямой, то они параллельны.",
            "width": 460,
            "height": 60
          }
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 13, теорема 13.2",
          "printedPage": "85",
          "pdfPage": 86,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=86",
          "excerpt": {
            "file": "/book/oge/2026-10-31/v2/trainers/task19-textbook/merzlyak-parallel-third.png",
            "alt": "Если две прямые параллельны третьей прямой, то они параллельны.",
            "width": 610,
            "height": 56
          }
        }
      ]
    },
    "triangle_parts": {
      "title": "Медиана, высота и биссектриса",
      "explanation": "Медиана находит середину стороны, биссектриса делит угол, высота перпендикулярна прямой стороны. Совпадение этих отрезков требует дополнительных условий.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 17",
          "printedPage": "33–34",
          "pdfPage": 35,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=35"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 7, определения высоты, медианы и биссектрисы",
          "printedPage": "49",
          "pdfPage": 50,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=50"
        }
      ]
    },
    "isosceles": {
      "title": "Равнобедренный треугольник",
      "explanation": "Равные боковые стороны дают равные углы при основании. Высота, медиана и биссектриса совпадают именно при проведении к основанию.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 18",
          "printedPage": "35–36",
          "pdfPage": 37,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=37"
        },
        {
          "bookId": "atanasyan2010",
          "section": "п. 32, следствие 2",
          "printedPage": "73–74",
          "pdfPage": 75,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=75"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 9, определение и теорема 9.1; § 10, признаки",
          "printedPage": "61–62",
          "pdfPage": 62,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=62"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 10, теоремы 10.1 и 10.2",
          "printedPage": "67",
          "pdfPage": 68,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=68"
        }
      ]
    },
    "triangle_congruence": {
      "title": "Равенство треугольников",
      "explanation": "Две стороны определяют треугольник вместе с углом между ними. Подмена этого угла другим нарушает условие признака.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 15",
          "printedPage": "30",
          "pdfPage": 32,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=32"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 8, первый признак равенства",
          "printedPage": "53",
          "pdfPage": 54,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=54"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 11, третий признак равенства",
          "printedPage": "72",
          "pdfPage": 73,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=73"
        }
      ]
    },
    "equal_figures": {
      "title": "Равенство фигур",
      "explanation": "Равные фигуры можно совместить целиком. Одного совпадения площадей, периметров или нескольких длин для этого недостаточно.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 5",
          "printedPage": "11",
          "pdfPage": 13,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=13"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 7, определение равенства фигур",
          "printedPage": "49",
          "pdfPage": 50,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=50"
        }
      ]
    },
    "triangle_angles": {
      "title": "Углы треугольника",
      "explanation": "Три внутренних угла вместе дают 180°. Поэтому два угла треугольника всегда острые, а хотя бы один не больше 60°.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "пп. 30–31",
          "printedPage": "70–71",
          "pdfPage": 72,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=72"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 16, теорема 16.1",
          "printedPage": "103",
          "pdfPage": 104,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=104"
        }
      ]
    },
    "triangle_exterior": {
      "title": "Внешний угол треугольника",
      "explanation": "Внешний угол получается продолжением стороны. Его величину можно получить сложением двух внутренних углов, не смежных с ним.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 30, вывод о внешнем угле",
          "printedPage": "70–71",
          "pdfPage": 72,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=72"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 16, теорема 16.2 и следствие",
          "printedPage": "103–104",
          "pdfPage": 104,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=104"
        }
      ]
    },
    "triangle_types": {
      "title": "Виды треугольников по углам",
      "explanation": "Название определяется всеми тремя углами: остроугольный имеет три острых угла; прямоугольный — один прямой; тупоугольный — один тупой.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 31",
          "printedPage": "71",
          "pdfPage": 73,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=73"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 7, определения остроугольного, прямоугольного и тупоугольного треугольников",
          "printedPage": "47",
          "pdfPage": 48,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=48"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 16, следствие о двух острых углах",
          "printedPage": "103",
          "pdfPage": 104,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=104"
        }
      ]
    },
    "triangle_sides_angles": {
      "title": "Сравнение сторон и углов",
      "explanation": "Большая сторона и больший противоположный угол соответствуют друг другу. В прямоугольном треугольнике наибольшая сторона — гипотенуза.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 32",
          "printedPage": "72–74",
          "pdfPage": 74,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=74"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 16, теорема 16.4",
          "printedPage": "105",
          "pdfPage": 106,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=106"
        }
      ]
    },
    "triangle_inequality": {
      "title": "Существование треугольника",
      "explanation": "Самая длинная сторона должна быть строго короче суммы двух остальных. Равенство даёт отрезок, а не треугольник.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 33",
          "printedPage": "74",
          "pdfPage": 76,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=76"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 16, теорема 16.3",
          "printedPage": "104",
          "pdfPage": 105,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=105"
        }
      ]
    },
    "right_triangle": {
      "title": "Прямоугольный треугольник",
      "explanation": "После прямого угла на два остальных остаётся 90°. Гипотенуза лежит напротив прямого угла.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 31",
          "printedPage": "71",
          "pdfPage": 73,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=73"
        },
        {
          "bookId": "atanasyan2010",
          "section": "п. 34, свойство 1°",
          "printedPage": "76",
          "pdfPage": 78,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=78"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 17, признаки равенства прямоугольных треугольников",
          "printedPage": "111",
          "pdfPage": 112,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=112"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 18, теорема 18.1 и задача о катете напротив 30°",
          "printedPage": "117",
          "pdfPage": 118,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=118"
        }
      ]
    },
    "median_hypotenuse": {
      "title": "Медиана к гипотенузе",
      "explanation": "Середина гипотенузы равноудалена от трёх вершин. Обратное утверждение проверяется через окружность: угол, опирающийся на диаметр, прямой.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 75, описанная окружность треугольника",
          "printedPage": "184",
          "pdfPage": 186,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=186"
        },
        {
          "bookId": "atanasyan2010",
          "section": "задача 231 к пп. 30–31",
          "printedPage": "72",
          "pdfPage": 74,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=74"
        },
        {
          "bookId": "atanasyan2010",
          "section": "п. 71, следствие 2",
          "printedPage": "172",
          "pdfPage": 174,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=174"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 9, следствие 2: вписанный угол, опирающийся на диаметр — основа вывода",
          "printedPage": "54",
          "pdfPage": 55,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=55"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 19, радиус и диаметр окружности — основа вывода",
          "printedPage": "126",
          "pdfPage": 127,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=127"
        }
      ]
    },
    "triangle_similarity": {
      "title": "Подобие треугольников",
      "explanation": "Совпадение углов задаёт форму, но не размер. В подобных треугольниках соответствующие стороны имеют общий коэффициент, площади — квадрат этого коэффициента.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "пп. 56–58",
          "printedPage": "138–140",
          "pdfPage": 140,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=140"
        },
        {
          "bookId": "atanasyan2010",
          "section": "п. 59",
          "printedPage": "142",
          "pdfPage": 144,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=144"
        },
        {
          "bookId": "atanasyan2010",
          "section": "п. 61",
          "printedPage": "143–144",
          "pdfPage": 145,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=145"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 12, определение; §§ 13–14, признаки подобия",
          "printedPage": "84",
          "pdfPage": 85,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=85"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 13, теорема 13.1",
          "printedPage": "89",
          "pdfPage": 90,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=90"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 14, теоремы 14.1 и 14.2",
          "printedPage": "100–101",
          "pdfPage": 101,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=101"
        }
      ]
    },
    "triangle_midline": {
      "title": "Средняя линия треугольника",
      "explanation": "Отрезок между серединами двух сторон имеет направление третьей стороны и вдвое меньшую длину.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 62",
          "printedPage": "146",
          "pdfPage": 148,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=148"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 7, теорема 7.1",
          "printedPage": "40",
          "pdfPage": 41,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=41"
        }
      ]
    },
    "polygon_angles": {
      "title": "Углы многоугольника",
      "explanation": "Выпуклый многоугольник можно разбить диагоналями из одной вершины на n−2 треугольника. Отсюда сумма углов 180°·(n−2).",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 40",
          "printedPage": "99",
          "pdfPage": 101,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=101"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 19, теорема 19.1",
          "printedPage": "139",
          "pdfPage": 140,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=140"
        }
      ]
    },
    "parallelogram": {
      "title": "Параллелограмм",
      "explanation": "У параллелограмма противоположные стороны параллельны и равны, противоположные углы равны, диагонали делятся пополам. Равенство диагоналей и прямые углы — дополнительные условия.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 42",
          "printedPage": "101–102",
          "pdfPage": 103,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=103"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 2, определение и теоремы 2.1–2.3",
          "printedPage": "13–14",
          "pdfPage": 14,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=14"
        }
      ]
    },
    "parallelogram_tests": {
      "title": "Признаки параллелограмма",
      "explanation": "Деление обеих диагоналей пополам устанавливает параллелограмм. Для прямоугольника или ромба нужно проверить ещё одно условие.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 43",
          "printedPage": "102–103",
          "pdfPage": 104,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=104"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 3, теоремы 3.1–3.3",
          "printedPage": "21–22",
          "pdfPage": 22,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=22"
        }
      ]
    },
    "rectangle": {
      "title": "Прямоугольник",
      "explanation": "Прямоугольник сохраняет свойства параллелограмма и имеет четыре прямых угла. Его диагонали одинаковой длины; их перпендикулярность бывает у квадрата.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 45",
          "printedPage": "108–109",
          "pdfPage": 110,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=110"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 4, определение и теоремы 4.1–4.3",
          "printedPage": "29–30",
          "pdfPage": 30,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=30"
        }
      ]
    },
    "rhombus": {
      "title": "Ромб",
      "explanation": "Ромб — параллелограмм с одинаковыми сторонами. Его диагонали пересекаются под прямым углом и делят углы при вершинах пополам.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 46",
          "printedPage": "109–110",
          "pdfPage": 111,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=111"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 5, определение и теоремы 5.1–5.3",
          "printedPage": "33–34",
          "pdfPage": 34,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=34"
        }
      ]
    },
    "square": {
      "title": "Квадрат",
      "explanation": "Квадрат одновременно является прямоугольником и ромбом. Поэтому у него сохраняются свойства обоих видов фигур.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 46",
          "printedPage": "110",
          "pdfPage": 112,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=112"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 6, определение и связь с ромбом и прямоугольником",
          "printedPage": "36",
          "pdfPage": 37,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=37"
        }
      ]
    },
    "trapezoid": {
      "title": "Трапеция",
      "explanation": "В школьном определении у трапеции параллельна только одна пара противоположных сторон — основания. Равными могут быть боковые стороны; такая трапеция называется равнобедренной.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 44",
          "printedPage": "103",
          "pdfPage": 105,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=105"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 8, определение трапеции",
          "printedPage": "43–44",
          "pdfPage": 44,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=44"
        }
      ]
    },
    "isosceles_trapezoid": {
      "title": "Равнобедренная трапеция",
      "explanation": "Одинаковые боковые стороны связаны с равными углами при каждом основании и равными диагоналями. Для произвольной трапеции этого нет.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 44 и задачи 388–389",
          "printedPage": "103, 106",
          "pdfPage": 108,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=108"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 8, задача с доказательством свойств равнобокой трапеции",
          "printedPage": "45–46",
          "pdfPage": 46,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=46"
        }
      ]
    },
    "trapezoid_midline": {
      "title": "Средняя линия трапеции",
      "explanation": "Отрезок между серединами боковых сторон параллелен основаниям. Его длина — среднее арифметическое длин оснований.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 85",
          "printedPage": "210",
          "pdfPage": 212,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=212"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 8, теорема 8.1",
          "printedPage": "44",
          "pdfPage": 45,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=45"
        }
      ]
    },
    "circle_definition": {
      "title": "Радиус, хорда и диаметр",
      "explanation": "Все точки окружности удалены от её единственного центра на один радиус. Диаметр проходит через центр и состоит из двух радиусов; произвольная хорда может быть короче.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 21",
          "printedPage": "43",
          "pdfPage": 45,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=45"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 19, определения окружности, радиуса, хорды и диаметра",
          "printedPage": "126",
          "pdfPage": 127,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=127"
        }
      ]
    },
    "circle_line": {
      "title": "Прямая и окружность",
      "explanation": "Число общих точек зависит от расстояния до центра: две у секущей, одна у касательной, ни одной у внешней прямой.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 68",
          "printedPage": "164–165",
          "pdfPage": 166,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=166"
        },
        {
          "bookId": "atanasyan2010",
          "section": "п. 69, определение касательной",
          "printedPage": "166",
          "pdfPage": 168,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=168"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 20, взаимное расположение прямой и окружности",
          "printedPage": "131–132",
          "pdfPage": 132,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=132"
        }
      ]
    },
    "tangent": {
      "title": "Касательная",
      "explanation": "Радиус в точку касания образует с касательной прямой угол. Из одной внешней точки длины отрезков двух касательных до точек касания совпадают.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 69",
          "printedPage": "166–167",
          "pdfPage": 168,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=168"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 20, теоремы 20.3 и 20.4, задача об отрезках касательных",
          "printedPage": "132–133",
          "pdfPage": 133,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=133"
        }
      ]
    },
    "inscribed_angles": {
      "title": "Вписанные и центральные углы",
      "explanation": "Вписанный угол измеряется половиной своей дуги; центральный — всей дугой. Полуокружности соответствует вписанный угол 90°.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "пп. 70–71",
          "printedPage": "169–173",
          "pdfPage": 173,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=173"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 9, теорема 9.1 и следствия 1, 2",
          "printedPage": "53–54",
          "pdfPage": 54,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=54"
        }
      ]
    },
    "angle_bisector_locus": {
      "title": "Расстояния от биссектрисы",
      "explanation": "Расстояние до стороны угла измеряют перпендикуляром к её прямой. На биссектрисе эти два расстояния совпадают.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 72",
          "printedPage": "176–177",
          "pdfPage": 178,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=178"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 19, теорема 19.2",
          "printedPage": "125",
          "pdfPage": 126,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=126"
        }
      ]
    },
    "perpendicular_bisector": {
      "title": "Серединный перпендикуляр",
      "explanation": "Прямая через середину отрезка под прямым углом к нему состоит из точек, одинаково удалённых от концов отрезка.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 72",
          "printedPage": "177–178",
          "pdfPage": 179,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=179"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 8, теорема 8.2",
          "printedPage": "54",
          "pdfPage": 55,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=55"
        }
      ]
    },
    "incircle": {
      "title": "Вписанная окружность",
      "explanation": "В треугольнике центр вписанной окружности находится на биссектрисах. Для четырёхугольника возможность касания всех сторон требует дополнительных условий.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 74",
          "printedPage": "181–183",
          "pdfPage": 183,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=183"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 21, вписанная окружность; следствия о центре и биссектрисах",
          "printedPage": "138–139",
          "pdfPage": 139,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=139"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 10, теорема 10.3 об описанном четырёхугольнике",
          "printedPage": "63",
          "pdfPage": 64,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=64"
        }
      ]
    },
    "circumcircle": {
      "title": "Описанная окружность",
      "explanation": "Центр окружности через вершины треугольника находят по серединным перпендикулярам. У четырёхугольника на окружности противоположные углы дают 180°.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 75",
          "printedPage": "183–185",
          "pdfPage": 185,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=185"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 21, теорема 21.1 и следствия",
          "printedPage": "137–138",
          "pdfPage": 138,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=138"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 10, теоремы 10.1 и 10.2 о вписанном четырёхугольнике",
          "printedPage": "61–62",
          "pdfPage": 62,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=62"
        }
      ]
    },
    "equal_area": {
      "title": "Равенство площадей",
      "explanation": "Совмещение фигур сохраняет площадь. Обратный вывод неверен: равная площадь не задаёт форму фигуры.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 48, свойство 1°",
          "printedPage": "119",
          "pdfPage": 121,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=121"
        },
        {
          "bookId": "atanasyan2010",
          "section": "п. 52",
          "printedPage": "125",
          "pdfPage": 127,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=127"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 20, определение равновеликих фигур",
          "printedPage": "144",
          "pdfPage": 145,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=145"
        }
      ]
    },
    "rectangle_area": {
      "title": "Площади прямоугольника и квадрата",
      "explanation": "Площадь прямоугольника вычисляют как a·b; для квадрата получается a². Это не периметр и не произведение всех четырёх сторон.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "пп. 49–50",
          "printedPage": "120–122",
          "pdfPage": 122,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=122"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 20, теорема 20.1",
          "printedPage": "144",
          "pdfPage": 145,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=145"
        }
      ]
    },
    "parallelogram_area": {
      "title": "Площадь параллелограмма",
      "explanation": "Для площади нужны сторона и высота к ней: S=a·h. Длина соседней наклонной стороны не заменяет высоту.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 51",
          "printedPage": "124–125",
          "pdfPage": 126,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=126"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 21, теорема 21.1",
          "printedPage": "148",
          "pdfPage": 149,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=149"
        }
      ]
    },
    "triangle_area": {
      "title": "Площадь треугольника",
      "explanation": "Произведение основания и перпендикулярной ему высоты даёт удвоенную площадь. При общей высоте площади относятся как основания; медиана поэтому делит площадь пополам.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 52",
          "printedPage": "125",
          "pdfPage": 127,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=127"
        },
        {
          "bookId": "atanasyan2010",
          "section": "задача 474 к п. 52",
          "printedPage": "128",
          "pdfPage": 130,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=130"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 22, теорема 22.1 и следствие",
          "printedPage": "152–153",
          "pdfPage": 153,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=153"
        }
      ]
    },
    "triangle_sine_area": {
      "title": "Площадь и две стороны",
      "explanation": "Для двух сторон и угла между ними удвоенная площадь равна a·b·sin(γ). Так как sin(γ)≤1, площадь треугольника меньше произведения этих сторон.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 96",
          "printedPage": "256",
          "pdfPage": 258,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=258"
        },
        {
          "bookId": "merzlyak9_2022",
          "section": "§ 5, теорема 5.1",
          "printedPage": "33",
          "pdfPage": 34,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000051.pdf#page=34"
        }
      ]
    },
    "rhombus_area": {
      "title": "Площадь ромба",
      "explanation": "При умножении диагоналей ромба получаем удвоенную площадь. Это следует из разбиения ромба на четыре прямоугольных треугольника. Через сторону и высоту используется S=a·h.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 46",
          "printedPage": "109–110",
          "pdfPage": 111,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=111"
        },
        {
          "bookId": "atanasyan2010",
          "section": "пп. 51–52",
          "printedPage": "124–125",
          "pdfPage": 126,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=126"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 22, задача о площади ромба",
          "printedPage": "153",
          "pdfPage": 154,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=154"
        }
      ]
    },
    "trapezoid_area": {
      "title": "Площадь трапеции",
      "explanation": "Площадь равна произведению высоты и среднего арифметического оснований. Сначала сложи основания и возьми половину суммы; затем умножь на высоту.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 53",
          "printedPage": "126–127",
          "pdfPage": 129,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=129"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 23, теорема 23.1",
          "printedPage": "158",
          "pdfPage": 159,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=159"
        }
      ]
    },
    "similarity_area": {
      "title": "Масштаб и площадь",
      "explanation": "При увеличении всех длин в k раз площадь меняется в k² раз. Периметр меняется в k раз.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "пп. 57–58",
          "printedPage": "138–140",
          "pdfPage": 140,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=140"
        },
        {
          "bookId": "merzlyak9_2022",
          "section": "§ 20, теорема 20.2",
          "printedPage": "180",
          "pdfPage": 181,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000051.pdf#page=181"
        }
      ]
    },
    "pythagoras": {
      "title": "Теорема Пифагора",
      "explanation": "Для прямоугольного треугольника c²=a²+b², где c — гипотенуза. Если это равенство выполнено для трёх сторон треугольника, угол напротив c прямой.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "пп. 54–55",
          "printedPage": "129–131",
          "pdfPage": 131,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=131"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 16, теорема 16.1",
          "printedPage": "114–115",
          "pdfPage": 115,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=115"
        },
        {
          "bookId": "merzlyak9_2022",
          "section": "§ 2, теорема 2.2: обратная теорема Пифагора",
          "printedPage": "13",
          "pdfPage": 14,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000051.pdf#page=14"
        }
      ]
    },
    "coordinates": {
      "title": "Координаты и расстояния",
      "explanation": "Для середины отрезка усредняют координаты концов по каждой оси. На одной оси расстояние равно модулю разности координат.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 89",
          "printedPage": "236–237",
          "pdfPage": 238,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=238"
        },
        {
          "bookId": "merzlyak9_2022",
          "section": "§ 8, расстояние между точками и середина отрезка",
          "printedPage": "74–75",
          "pdfPage": 75,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000051.pdf#page=75"
        }
      ]
    },
    "trigonometry": {
      "title": "Синус, косинус и тангенс",
      "explanation": "В прямоугольном треугольнике косинус — прилежащий катет, делённый на гипотенузу; тангенс — противоположный катет, делённый на прилежащий. Тангенс может быть больше единицы.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "пп. 66–67",
          "printedPage": "156–158",
          "pdfPage": 158,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=158"
        },
        {
          "bookId": "merzlyak8_2013",
          "section": "§ 17, определения синуса, косинуса и тангенса острого угла",
          "printedPage": "120–121",
          "pdfPage": 121,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000030.pdf#page=121"
        }
      ]
    },
    "circle_length_area": {
      "title": "Длина окружности и площадь круга",
      "explanation": "У длины и площади разные формулы: C=2πr, S=πr². Радиус в формуле площади возводится в квадрат.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 110",
          "printedPage": "283–285",
          "pdfPage": 287,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=287"
        },
        {
          "bookId": "atanasyan2010",
          "section": "п. 111",
          "printedPage": "285–286",
          "pdfPage": 288,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=288"
        },
        {
          "bookId": "merzlyak9_2022",
          "section": "§ 7, формулы длины окружности и площади круга",
          "printedPage": "60–61",
          "pdfPage": 61,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000051.pdf#page=61"
        }
      ]
    },
    "regular_polygon": {
      "title": "Правильный многоугольник",
      "explanation": "У правильного многоугольника равны и стороны, и углы. Само количество сторон ещё не делает фигуру правильной.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 105",
          "printedPage": "275–276",
          "pdfPage": 277,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=277"
        },
        {
          "bookId": "merzlyak9_2022",
          "section": "§ 6, определение и теоремы 6.1, 6.2",
          "printedPage": "48–49",
          "pdfPage": 49,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000051.pdf#page=49"
        }
      ]
    },
    "equal_chords": {
      "title": "Хорды и расстояния от центра",
      "explanation": "Перпендикуляр из центра к хорде делит её пополам. Равные хорды дают равные прямоугольные треугольники, поэтому их расстояния до центра одинаковы.",
      "passages": [
        {
          "bookId": "atanasyan2010",
          "section": "п. 18, равнобедренный треугольник — основа вывода",
          "printedPage": "35–36",
          "pdfPage": 37,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=37"
        },
        {
          "bookId": "atanasyan2010",
          "section": "п. 21, окружность — основа вывода",
          "printedPage": "43",
          "pdfPage": 45,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=45"
        },
        {
          "bookId": "atanasyan2010",
          "section": "п. 54, теорема Пифагора — основа вывода",
          "printedPage": "129",
          "pdfPage": 131,
          "url": "https://ege-ok.ru/wp-content/uploads/2014/01/59_2-Geometriya.-7-9-kl.-Uchebnik_Atanasyan-L.S.-i-dr_2010-384s.pdf#page=131"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 20, упражнения 512–513 о равных хордах и расстояниях до центра",
          "printedPage": "134",
          "pdfPage": 135,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=135"
        },
        {
          "bookId": "merzlyak7_2015",
          "section": "§ 20, теорема 20.1 о перпендикуляре из центра к хорде — основа вывода",
          "printedPage": "131",
          "pdfPage": 132,
          "url": "https://pdf3.my-uchebnik.com/pdf/geometry/00000035.pdf#page=132"
        }
      ]
    }
  },
  "cards": {
    "prev-000": [
      "adjacent_vertical"
    ],
    "prev-001": [
      "adjacent_vertical"
    ],
    "prev-002": [
      "parallel_same_side"
    ],
    "prev-003": [
      "parallel_alternate"
    ],
    "prev-004": [
      "parallel_angles"
    ],
    "prev-005": [
      "perpendicular"
    ],
    "prev-006": [
      "points_lines"
    ],
    "prev-007": [
      "parallel_point"
    ],
    "prev-008": [
      "angle_bisector"
    ],
    "prev-009": [
      "adjacent_vertical"
    ],
    "prev-010": [
      "adjacent_vertical"
    ],
    "prev-011": [
      "triangle_angles"
    ],
    "prev-012": [
      "triangle_sides_angles"
    ],
    "prev-013": [
      "isosceles"
    ],
    "prev-014": [
      "isosceles"
    ],
    "prev-015": [
      "isosceles",
      "triangle_angles"
    ],
    "prev-016": [
      "triangle_types"
    ],
    "prev-017": [
      "triangle_sides_angles"
    ],
    "prev-018": [
      "median_hypotenuse"
    ],
    "prev-019": [
      "median_hypotenuse"
    ],
    "prev-020": [
      "triangle_parts",
      "equal_figures"
    ],
    "prev-021": [
      "triangle_area",
      "triangle_parts"
    ],
    "prev-022": [
      "triangle_parts"
    ],
    "prev-023": [
      "isosceles"
    ],
    "prev-024": [
      "isosceles",
      "triangle_parts"
    ],
    "prev-025": [
      "triangle_congruence"
    ],
    "prev-026": [
      "triangle_congruence"
    ],
    "prev-027": [
      "triangle_similarity"
    ],
    "prev-028": [
      "triangle_similarity",
      "equal_figures"
    ],
    "prev-029": [
      "triangle_similarity"
    ],
    "prev-030": [
      "equal_area"
    ],
    "prev-031": [
      "equal_area"
    ],
    "prev-032": [
      "triangle_types"
    ],
    "prev-033": [
      "triangle_exterior"
    ],
    "prev-034": [
      "triangle_angles"
    ],
    "prev-035": [
      "triangle_angles"
    ],
    "prev-036": [
      "triangle_angles"
    ],
    "prev-037": [
      "pythagoras"
    ],
    "prev-038": [
      "triangle_inequality"
    ],
    "prev-039": [
      "triangle_inequality"
    ],
    "prev-040": [
      "isosceles",
      "triangle_sides_angles"
    ],
    "prev-041": [
      "isosceles"
    ],
    "prev-042": [
      "triangle_midline"
    ],
    "prev-043": [
      "polygon_angles"
    ],
    "prev-044": [
      "parallelogram"
    ],
    "prev-045": [
      "parallelogram_tests"
    ],
    "prev-046": [
      "parallelogram"
    ],
    "prev-047": [
      "parallelogram",
      "rectangle"
    ],
    "prev-048": [
      "rectangle"
    ],
    "prev-049": [
      "rhombus",
      "parallelogram"
    ],
    "prev-050": [
      "rhombus"
    ],
    "prev-051": [
      "square"
    ],
    "prev-052": [
      "rhombus",
      "square"
    ],
    "prev-053": [
      "rectangle"
    ],
    "prev-054": [
      "parallelogram",
      "rectangle"
    ],
    "prev-055": [
      "rectangle"
    ],
    "prev-056": [
      "rhombus",
      "rectangle"
    ],
    "prev-057": [
      "rhombus"
    ],
    "prev-058": [
      "rhombus"
    ],
    "prev-059": [
      "trapezoid"
    ],
    "prev-060": [
      "trapezoid"
    ],
    "prev-061": [
      "trapezoid_midline"
    ],
    "prev-062": [
      "trapezoid_midline"
    ],
    "prev-063": [
      "trapezoid",
      "isosceles_trapezoid"
    ],
    "prev-064": [
      "isosceles_trapezoid"
    ],
    "prev-065": [
      "isosceles_trapezoid"
    ],
    "prev-066": [
      "equal_figures"
    ],
    "prev-067": [
      "parallelogram",
      "rectangle"
    ],
    "prev-068": [
      "rhombus",
      "square"
    ],
    "prev-069": [
      "rectangle"
    ],
    "prev-070": [
      "parallelogram",
      "rectangle"
    ],
    "prev-071": [
      "square",
      "parallelogram_tests"
    ],
    "prev-072": [
      "parallelogram_tests",
      "rectangle"
    ],
    "prev-073": [
      "circle_definition"
    ],
    "prev-074": [
      "circle_definition"
    ],
    "prev-075": [
      "circle_definition"
    ],
    "prev-076": [
      "circle_definition"
    ],
    "prev-077": [
      "circle_definition",
      "triangle_inequality"
    ],
    "prev-078": [
      "circle_definition"
    ],
    "prev-079": [
      "tangent"
    ],
    "prev-080": [
      "tangent"
    ],
    "prev-081": [
      "inscribed_angles"
    ],
    "prev-082": [
      "inscribed_angles"
    ],
    "prev-083": [
      "inscribed_angles"
    ],
    "prev-084": [
      "inscribed_angles"
    ],
    "prev-085": [
      "circumcircle"
    ],
    "prev-086": [
      "incircle"
    ],
    "prev-087": [
      "circumcircle"
    ],
    "prev-088": [
      "circumcircle",
      "median_hypotenuse"
    ],
    "prev-089": [
      "circle_line"
    ],
    "prev-090": [
      "circle_line"
    ],
    "prev-091": [
      "parallelogram_area"
    ],
    "prev-092": [
      "triangle_area"
    ],
    "prev-093": [
      "triangle_area"
    ],
    "prev-094": [
      "equal_area"
    ],
    "prev-095": [
      "similarity_area"
    ],
    "prev-096": [
      "triangle_similarity",
      "similarity_area"
    ],
    "prev-097": [
      "similarity_area"
    ],
    "prev-098": [
      "rectangle_area"
    ],
    "prev-099": [
      "pythagoras",
      "square"
    ],
    "prev-100": [
      "rhombus_area"
    ],
    "prev-101": [
      "trapezoid_area"
    ],
    "prev-102": [
      "coordinates"
    ],
    "prev-103": [
      "coordinates"
    ],
    "prev-104": [
      "rectangle_area",
      "equal_figures"
    ],
    "perpendicular_bisector_point_equidistant_endpoints": [
      "perpendicular_bisector"
    ],
    "point_on_angle_bisector_equidistant_sides": [
      "angle_bisector_locus"
    ],
    "circle_intersection_point_equidistant_centers": [
      "circle_definition"
    ],
    "circles_intersect_if_radius_bigger": [
      "circle_definition"
    ],
    "all_diameters_equal": [
      "circle_definition"
    ],
    "tangent_parallel_radius": [
      "tangent"
    ],
    "point_on_circle_distance_radius": [
      "circle_definition"
    ],
    "inscribed_angle_over_diameter_right": [
      "inscribed_angles"
    ],
    "inscribed_equals_central": [
      "inscribed_angles"
    ],
    "all_chords_equal": [
      "circle_definition"
    ],
    "triangle_area_less_than_product_two_sides": [
      "triangle_sine_area"
    ],
    "similar_triangles_area_ratio_equals_k": [
      "similarity_area"
    ],
    "adjacent_angles_one_acute_one_obtuse_always": [
      "adjacent_vertical"
    ],
    "angle_acute_adjacent_acute": [
      "adjacent_vertical"
    ],
    "parallel_through_point_exists": [
      "parallel_point"
    ],
    "perp_through_point_exists": [
      "perpendicular_point"
    ],
    "three_lines_through_one_point_exist": [
      "points_lines"
    ],
    "two_parallel_to_third_parallel": [
      "parallel_third"
    ],
    "two_parallel_to_third_perpendicular": [
      "parallel_third",
      "perpendicular"
    ],
    "two_perp_to_third_perp": [
      "perpendicular"
    ],
    "isosceles_trapezoid_bases_equal": [
      "trapezoid"
    ],
    "trap_bases_trapezoid_parallel": [
      "trapezoid"
    ],
    "trapezoid_area_base_times_height": [
      "trapezoid_area"
    ],
    "trapezoid_diagonal_makes_equal_triangles": [
      "trapezoid",
      "triangle_area"
    ],
    "trapezoid_diagonals_bisect": [
      "trapezoid",
      "parallelogram_tests"
    ],
    "trapezoid_midline_equals_sum_bases": [
      "trapezoid_midline"
    ],
    "obtuse_triangle_all_obtuse": [
      "triangle_types",
      "triangle_angles"
    ],
    "right_triangle_angles_sum_90": [
      "triangle_angles",
      "right_triangle"
    ],
    "triangle_angles_sum_180": [
      "triangle_angles"
    ],
    "triangle_angles_sum_360": [
      "triangle_angles"
    ],
    "triangle_has_angle_le_60": [
      "triangle_angles"
    ],
    "bisector_bisects_opposite_side": [
      "triangle_parts",
      "isosceles"
    ],
    "median_bisects_angle": [
      "triangle_parts",
      "isosceles"
    ],
    "circumcenter_always_inside": [
      "circumcircle"
    ],
    "hypotenuse_equals_sum_legs": [
      "triangle_inequality"
    ],
    "hypotenuse_less_than_sum_legs": [
      "triangle_inequality"
    ],
    "right_triangle_acute_sum_90": [
      "right_triangle"
    ],
    "right_triangle_area_equals_product_legs": [
      "triangle_area"
    ],
    "tri_aa_similarity": [
      "triangle_similarity"
    ],
    "tri_aaa_congruent": [
      "triangle_similarity",
      "equal_figures"
    ],
    "tri_aaa_similarity": [
      "triangle_similarity"
    ],
    "tri_two_sides_congruent": [
      "triangle_congruence"
    ],
    "isosceles_all_bisectors_are_altitudes": [
      "isosceles",
      "triangle_parts"
    ],
    "isosceles_all_bisectors_are_medians": [
      "isosceles",
      "triangle_parts"
    ],
    "equilateral_altitudes_equal": [
      "isosceles",
      "triangle_congruence"
    ],
    "tri_1_2_4_exists": [
      "triangle_inequality"
    ],
    "tri_2_4_6_not_exist": [
      "triangle_inequality"
    ],
    "tan_acute_less_than_1": [
      "trigonometry"
    ],
    "parallelogram_cyclic": [
      "circumcircle",
      "parallelogram"
    ],
    "square_area_adjacent_sides_product": [
      "rectangle_area"
    ],
    "equidiagonal_orthogonal_quadrilateral_square": [
      "square",
      "parallelogram_tests"
    ],
    "quadrilaterals_equal_if_corresponding_sides_equal": [
      "equal_figures"
    ],
    "parallelogram_adjacent_sides_equal_rhombus": [
      "rhombus",
      "parallelogram"
    ],
    "parallelogram_equal_diagonals_rhombus": [
      "rectangle",
      "rhombus"
    ],
    "parallelogram_has_two_equal_angles": [
      "parallelogram"
    ],
    "rect_perp_diagonals_exists": [
      "square",
      "rectangle"
    ],
    "rect_diagonals_bisect": [
      "rectangle"
    ],
    "rhombus_all_angles_equal": [
      "rhombus",
      "square"
    ],
    "rhombus_area_ab_sin": [
      "triangle_sine_area",
      "parallelogram_area"
    ],
    "rhombus_area_side_times_height": [
      "parallelogram_area"
    ],
    "rhombus_diagonals_bisect": [
      "rhombus",
      "parallelogram"
    ],
    "rhombus_diagonals_equal": [
      "rhombus",
      "rectangle"
    ],
    "rhombus_right_angle_square": [
      "rhombus",
      "square"
    ],
    "summer-008": [
      "rectangle",
      "square"
    ],
    "summer-009": [
      "parallelogram",
      "rectangle"
    ],
    "summer-014": [
      "rhombus",
      "parallelogram_tests"
    ],
    "summer-019": [
      "parallelogram",
      "rectangle"
    ],
    "summer-021": [
      "rectangle",
      "parallelogram_tests"
    ],
    "summer-024": [
      "circle_length_area"
    ],
    "summer-025": [
      "circle_length_area"
    ],
    "summer-026": [
      "circle_definition"
    ],
    "summer-028": [
      "square"
    ],
    "summer-029": [
      "parallelogram",
      "rhombus"
    ],
    "summer-034": [
      "square"
    ],
    "summer-035": [
      "square"
    ],
    "summer-036": [
      "rectangle",
      "rhombus"
    ],
    "summer-037": [
      "circle_line"
    ],
    "summer-038": [
      "triangle_inequality"
    ],
    "summer-039": [
      "triangle_angles"
    ],
    "summer-041": [
      "rhombus",
      "parallelogram"
    ],
    "summer-043": [
      "rectangle_area"
    ],
    "summer-044": [
      "polygon_angles"
    ],
    "summer-045": [
      "circle_definition",
      "perpendicular_bisector"
    ],
    "summer-046": [
      "perpendicular_bisector"
    ],
    "summer-048": [
      "rectangle"
    ],
    "summer-050": [
      "trapezoid",
      "parallelogram"
    ],
    "summer-051": [
      "triangle_parts"
    ],
    "summer-052": [
      "triangle_parts",
      "triangle_types"
    ],
    "summer-057": [
      "inscribed_angles"
    ],
    "summer-058": [
      "pythagoras"
    ],
    "summer-059": [
      "pythagoras"
    ],
    "summer-060": [
      "pythagoras"
    ],
    "summer-061": [
      "rhombus_area"
    ],
    "summer-063": [
      "equal_chords"
    ],
    "summer-064": [
      "equal_chords"
    ],
    "summer-068": [
      "polygon_angles"
    ],
    "summer-069": [
      "regular_polygon"
    ],
    "summer-070": [
      "regular_polygon"
    ],
    "summer-072": [
      "circle_definition"
    ],
    "reference-005": [
      "points_lines"
    ],
    "reference-014": [
      "triangle_sides_angles"
    ],
    "reference-015": [
      "triangle_types"
    ],
    "reference-016": [
      "triangle_types"
    ],
    "reference-018": [
      "triangle_types",
      "triangle_angles"
    ],
    "reference-019": [
      "isosceles",
      "triangle_types"
    ],
    "reference-024": [
      "triangle_angles"
    ],
    "reference-026": [
      "triangle_inequality"
    ],
    "reference-029": [
      "pythagoras"
    ],
    "reference-030": [
      "trigonometry"
    ],
    "reference-036": [
      "incircle"
    ],
    "reference-037": [
      "circumcircle"
    ],
    "reference-039": [
      "incircle",
      "circumcircle",
      "isosceles"
    ],
    "reference-043": [
      "triangle_similarity",
      "isosceles"
    ],
    "reference-044": [
      "triangle_similarity",
      "isosceles"
    ],
    "reference-047": [
      "triangle_congruence"
    ],
    "reference-054": [
      "parallelogram"
    ],
    "reference-055": [
      "parallelogram_area"
    ],
    "reference-056": [
      "parallelogram_area",
      "rhombus_area"
    ],
    "reference-068": [
      "rectangle",
      "equal_figures"
    ],
    "reference-073": [
      "rectangle_area"
    ],
    "reference-074": [
      "square"
    ],
    "reference-075": [
      "square"
    ],
    "reference-079": [
      "rectangle_area"
    ],
    "reference-080": [
      "rhombus_area",
      "square"
    ],
    "reference-082": [
      "trapezoid",
      "parallel_angles"
    ],
    "reference-096": [
      "circle_definition"
    ],
    "reference-097": [
      "circumcircle",
      "rectangle"
    ],
    "reference-105": [
      "incircle",
      "rhombus"
    ],
    "reference-106": [
      "tangent"
    ]
  }
};
root.Task19TextbookData = data;
if (typeof module !== 'undefined' && module.exports) module.exports = data;
})(typeof window !== 'undefined' ? window : globalThis);
