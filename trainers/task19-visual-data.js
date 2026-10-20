/* Existing statement banks, with on-demand visual hints.
 * Original source identities and truth labels are retained.
 * A picture suggests what to inspect; the explanation is separate. */
(function(root){
'use strict';
const data = {
  "version": 1,
  "cards": [
    {
      "id": "prev-000",
      "aliases": [
        "prev-000"
      ],
      "theme": "Прямые и углы",
      "text": "Вертикальные углы равны.",
      "truth": true,
      "explanation": "При пересечении двух прямых противоположные углы равны. Это базовая теорема про вертикальные углы.",
      "hint": {
        "prompt": "Посмотри на углы α и β: как они расположены относительно точки пересечения?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Две пересекающиеся прямые; отмечены противоположные углы α и β\"><title>Две пересекающиеся прямые; отмечены противоположные углы α и β</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><line x1=\"45\" y1=\"190\" x2=\"315\" y2=\"50\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"45\" y1=\"50\" x2=\"315\" y2=\"190\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"180\" y=\"77\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">α</text><text x=\"180\" y=\"174\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">β</text><circle cx=\"180\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"200\" y=\"110\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">O</text></g></svg>"
      }
    },
    {
      "id": "prev-001",
      "aliases": [
        "prev-001",
        "adjacent_angles_always_equal"
      ],
      "theme": "Прямые и углы",
      "text": "Смежные углы всегда равны.",
      "truth": false,
      "explanation": "Смежные углы не обязаны быть равными; их сумма равна 180°. Например, 40° и 140°.",
      "hint": {
        "prompt": "Измени один угол. Сравни величины двух углов и их сумму.",
        "model": "adjacentAngles",
        "params": {
          "angle": 55
        }
      }
    },
    {
      "id": "prev-002",
      "aliases": [
        "prev-002"
      ],
      "theme": "Прямые и углы",
      "text": "Если внутренние односторонние углы при секущей в сумме дают 180°, то прямые параллельны.",
      "truth": true,
      "explanation": "Это признак параллельности прямых.",
      "hint": {
        "prompt": "Посчитай сумму отмеченных углов. Что можно сказать о прямых a и b?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Две прямые и секущая; внутренние односторонние углы 120° и 60°\"><title>Две прямые и секущая; внутренние односторонние углы 120° и 60°</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><line x1=\"25\" y1=\"60\" x2=\"335\" y2=\"60\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"25\" y1=\"160\" x2=\"335\" y2=\"160\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"80\" y1=\"210\" x2=\"195.47\" y2=\"10\" stroke=\"#ab6719\" stroke-width=\"3\"/><text x=\"205\" y=\"90\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">120°</text><text x=\"153\" y=\"145\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">60°</text><text x=\"325\" y=\"45\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">a</text><text x=\"325\" y=\"145\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">b</text></g></svg>"
      }
    },
    {
      "id": "prev-003",
      "aliases": [
        "prev-003"
      ],
      "theme": "Прямые и углы",
      "text": "Если при пересечении двух прямых секущей накрест лежащие углы равны, то прямые параллельны.",
      "truth": true,
      "explanation": "Равенство накрест лежащих углов — признак параллельности прямых.",
      "hint": {
        "prompt": "Найди отмеченные углы по разные стороны секущей. Вспомни признак параллельности.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Внутренние накрест лежащие углы при секущей\"><title>Внутренние накрест лежащие углы при секущей</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><line x1=\"25\" y1=\"60\" x2=\"335\" y2=\"60\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"25\" y1=\"160\" x2=\"335\" y2=\"160\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"80\" y1=\"210\" x2=\"195.47\" y2=\"10\" stroke=\"#ab6719\" stroke-width=\"3\"/><text x=\"205\" y=\"90\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">120°</text><text x=\"62\" y=\"145\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">120°</text><text x=\"325\" y=\"45\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">a</text><text x=\"325\" y=\"145\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">b</text></g></svg>"
      }
    },
    {
      "id": "prev-004",
      "aliases": [
        "prev-004"
      ],
      "theme": "Прямые и углы",
      "text": "При пересечении параллельных прямых секущей соответственные углы равны.",
      "truth": true,
      "explanation": "Это свойство параллельных прямых.",
      "hint": {
        "prompt": "Сравни положение углов α и β относительно секущей и параллельных прямых.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Параллельные прямые и секущая; отмечены соответственные углы\"><title>Параллельные прямые и секущая; отмечены соответственные углы</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><line x1=\"25\" y1=\"60\" x2=\"335\" y2=\"60\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"25\" y1=\"160\" x2=\"335\" y2=\"160\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"80\" y1=\"210\" x2=\"195.47\" y2=\"10\" stroke=\"#ab6719\" stroke-width=\"3\"/><text x=\"203\" y=\"43\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">α</text><text x=\"146\" y=\"143\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">β</text><text x=\"325\" y=\"45\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">a</text><text x=\"325\" y=\"145\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">b</text></g></svg>"
      }
    },
    {
      "id": "prev-005",
      "aliases": [
        "prev-005"
      ],
      "theme": "Прямые и углы",
      "text": "Если две прямые перпендикулярны одной и той же третьей прямой, то они параллельны.",
      "truth": true,
      "explanation": "На плоскости две прямые, перпендикулярные одной прямой, параллельны друг другу.",
      "hint": {
        "prompt": "Обе прямые образуют прямой угол с c. Как они расположены друг относительно друга?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Две прямые образуют прямые углы с одной третьей прямой\"><title>Две прямые образуют прямые углы с одной третьей прямой</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><line x1=\"45\" y1=\"70\" x2=\"320\" y2=\"70\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"45\" y1=\"165\" x2=\"320\" y2=\"165\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"100\" y1=\"25\" x2=\"100\" y2=\"215\" stroke=\"#ab6719\" stroke-width=\"3\"/><line x1=\"114\" y1=\"70\" x2=\"114\" y2=\"84\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"114\" y1=\"84\" x2=\"100\" y2=\"84\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"114\" y1=\"165\" x2=\"114\" y2=\"179\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"114\" y1=\"179\" x2=\"100\" y2=\"179\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"320\" y=\"55\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">a</text><text x=\"320\" y=\"150\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">b</text><text x=\"82\" y=\"30\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">c</text></g></svg>"
      }
    },
    {
      "id": "prev-006",
      "aliases": [
        "prev-006"
      ],
      "theme": "Прямые и углы",
      "text": "Через две различные точки можно провести ровно одну прямую.",
      "truth": true,
      "explanation": "Это одно из базовых свойств прямой.",
      "hint": {
        "prompt": "Попробуй мысленно провести через A и B ещё одну прямую, отличную от показанной.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Прямая проходит через две отмеченные точки A и B\"><title>Прямая проходит через две отмеченные точки A и B</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><line x1=\"25\" y1=\"195\" x2=\"335\" y2=\"45\" stroke=\"#246b8e\" stroke-width=\"3\"/><circle cx=\"105\" cy=\"156\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"105\" y=\"144\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">A</text><circle cx=\"245\" cy=\"88\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"245\" y=\"76\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">B</text></g></svg>"
      }
    },
    {
      "id": "prev-007",
      "aliases": [
        "prev-007"
      ],
      "theme": "Прямые и углы",
      "text": "Через точку вне прямой можно провести две разные прямые, параллельные данной.",
      "truth": false,
      "explanation": "Через точку, не лежащую на прямой, проходит ровно одна прямая, параллельная данной.",
      "hint": {
        "prompt": "Представь вторую линию через P. Сохранит ли она направление прямой a?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Прямая a и точка P вне неё; линия через P\"><title>Прямая a и точка P вне неё; линия через P</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><line x1=\"35\" y1=\"180\" x2=\"325\" y2=\"180\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"35\" y1=\"75\" x2=\"325\" y2=\"75\" stroke=\"#ab6719\" stroke-width=\"3\"/><circle cx=\"185\" cy=\"75\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"185\" y=\"63\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">P</text><text x=\"325\" y=\"165\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">a</text></g></svg>"
      }
    },
    {
      "id": "prev-008",
      "aliases": [
        "prev-008"
      ],
      "theme": "Прямые и углы",
      "text": "Биссектриса угла делит этот угол на два равных угла.",
      "truth": true,
      "explanation": "Это определение биссектрисы угла.",
      "hint": {
        "prompt": "Вспомни, что означает слово «биссектриса». Какие две части угла нужно сравнить?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Угол с биссектрисой из вершины; отмечены два полученных угла\"><title>Угол с биссектрисой из вершины; отмечены два полученных угла</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><line x1=\"55\" y1=\"195\" x2=\"325\" y2=\"195\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"55\" y1=\"195\" x2=\"190\" y2=\"20\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"55\" y1=\"195\" x2=\"252.4371889838945\" y2=\"97.95075267608755\" stroke=\"#ab6719\" stroke-width=\"3\"/><text x=\"120\" y=\"180\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">α</text><text x=\"114\" y=\"139\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">β</text><circle cx=\"55\" cy=\"195\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"37\" y=\"199\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">O</text></g></svg>"
      }
    },
    {
      "id": "prev-009",
      "aliases": [
        "prev-009"
      ],
      "theme": "Прямые и углы",
      "text": "Сумма смежных углов равна 180°.",
      "truth": true,
      "explanation": "Смежные углы образуют развёрнутый угол, поэтому их сумма 180°.",
      "hint": {
        "prompt": "Измени один угол. Сравни величины двух углов и их сумму.",
        "model": "adjacentAngles",
        "params": {
          "angle": 55
        }
      }
    },
    {
      "id": "prev-010",
      "aliases": [
        "prev-010"
      ],
      "theme": "Прямые и углы",
      "text": "Если сумма двух углов равна 180°, то эти углы обязательно смежные.",
      "truth": false,
      "explanation": "Углы могут иметь сумму 180°, но не иметь общей стороны и общей вершины. Для смежных нужны ещё геометрические условия.",
      "hint": {
        "prompt": "Сложи величины углов. Есть ли у этих углов общая вершина и общая сторона?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Два отдельно расположенных угла 60° и 120°\"><title>Два отдельно расположенных угла 60° и 120°</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><line x1=\"30\" y1=\"150\" x2=\"145\" y2=\"150\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"30\" y1=\"150\" x2=\"87.5\" y2=\"50.4\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"72\" y=\"130\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">60°</text><line x1=\"225\" y1=\"150\" x2=\"335\" y2=\"150\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"225\" y1=\"150\" x2=\"170\" y2=\"54.7\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"258\" y=\"112\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">120°</text></g></svg>"
      }
    },
    {
      "id": "prev-011",
      "aliases": [
        "prev-011"
      ],
      "theme": "Треугольники",
      "text": "Сумма внутренних углов любого треугольника равна 180°.",
      "truth": true,
      "explanation": "Это базовая теорема планиметрии о сумме углов треугольника.",
      "hint": {
        "prompt": "Меняй углы треугольника. Следи за третьим углом и суммой всех трёх.",
        "model": "triangleAngles",
        "params": {
          "a": 100,
          "b": 40
        }
      }
    },
    {
      "id": "prev-012",
      "aliases": [
        "prev-012"
      ],
      "theme": "Треугольники",
      "text": "В треугольнике против большей стороны лежит больший угол.",
      "truth": true,
      "explanation": "Большей стороне треугольника соответствует больший противолежащий угол.",
      "hint": {
        "prompt": "Сравни стороны 3,4,5 и углы, лежащие напротив них.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Прямоугольный треугольник с катетами 3 и 4 и гипотенузой 5\"><title>Прямоугольный треугольник с катетами 3 и 4 и гипотенузой 5</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"95,190 95,70 255,190\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"108\" y1=\"190\" x2=\"108\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"108\" y1=\"177\" x2=\"95\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"79\" y=\"133\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text><text x=\"180\" y=\"215\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">4</text><text x=\"186\" y=\"120\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text></g></svg>"
      }
    },
    {
      "id": "prev-013",
      "aliases": [
        "prev-013"
      ],
      "theme": "Треугольники",
      "text": "Если в треугольнике две стороны равны, то он обязательно равносторонний.",
      "truth": false,
      "explanation": "Две равные стороны дают равнобедренный треугольник. Равносторонний — когда равны все три стороны.",
      "hint": {
        "prompt": "У треугольника две стороны по 5 и основание 6. Сравни его стороны и углы.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Равнобедренный треугольник со сторонами 5,5,6; отмечены углы при основании\"><title>Равнобедренный треугольник со сторонами 5,5,6; отмечены углы при основании</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"90,190 270,190 180,70\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"180\" y=\"216\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">6</text><text x=\"119\" y=\"122\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text><text x=\"242\" y=\"122\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text><text x=\"123\" y=\"178\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">α</text><text x=\"237\" y=\"178\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">β</text></g></svg>"
      }
    },
    {
      "id": "prev-014",
      "aliases": [
        "prev-014"
      ],
      "theme": "Треугольники",
      "text": "В равнобедренном треугольнике углы при основании равны.",
      "truth": true,
      "explanation": "Это основное свойство равнобедренного треугольника.",
      "hint": {
        "prompt": "У треугольника две стороны по 5 и основание 6. Сравни его стороны и углы.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Равнобедренный треугольник со сторонами 5,5,6; отмечены углы при основании\"><title>Равнобедренный треугольник со сторонами 5,5,6; отмечены углы при основании</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"90,190 270,190 180,70\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"180\" y=\"216\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">6</text><text x=\"119\" y=\"122\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text><text x=\"242\" y=\"122\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text><text x=\"123\" y=\"178\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">α</text><text x=\"237\" y=\"178\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">β</text></g></svg>"
      }
    },
    {
      "id": "prev-015",
      "aliases": [
        "prev-015"
      ],
      "theme": "Треугольники",
      "text": "В равностороннем треугольнике каждый угол равен 60°.",
      "truth": true,
      "explanation": "Все углы равностороннего треугольника равны, а их сумма 180°, значит каждый по 60°.",
      "hint": {
        "prompt": "Все три стороны равны. Вспомни сумму углов и сравни три угла.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Треугольник с тремя равными сторонами; отмечены три угла\"><title>Треугольник с тремя равными сторонами; отмечены три угла</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"80,195 280,195 180,21.8\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"180\" y=\"218\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">a</text><text x=\"111\" y=\"100\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">a</text><text x=\"250\" y=\"100\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">a</text><text x=\"113\" y=\"178\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">α</text><text x=\"248\" y=\"178\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">β</text><text x=\"180\" y=\"57\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">γ</text></g></svg>"
      }
    },
    {
      "id": "prev-016",
      "aliases": [
        "prev-016"
      ],
      "theme": "Треугольники",
      "text": "Треугольник с одним прямым углом называется прямоугольным.",
      "truth": true,
      "explanation": "Это определение прямоугольного треугольника.",
      "hint": {
        "prompt": "Найди прямой угол и сторону напротив него. Сравни длины сторон.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Прямоугольный треугольник с катетами 3 и 4 и гипотенузой 5\"><title>Прямоугольный треугольник с катетами 3 и 4 и гипотенузой 5</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"95,190 95,70 255,190\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"108\" y1=\"190\" x2=\"108\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"108\" y1=\"177\" x2=\"95\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"79\" y=\"133\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text><text x=\"180\" y=\"215\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">4</text><text x=\"186\" y=\"120\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text></g></svg>"
      }
    },
    {
      "id": "prev-017",
      "aliases": [
        "prev-017"
      ],
      "theme": "Треугольники",
      "text": "В прямоугольном треугольнике гипотенуза является самой длинной стороной.",
      "truth": true,
      "explanation": "Гипотенуза лежит напротив прямого угла, а прямой угол — самый большой угол треугольника.",
      "hint": {
        "prompt": "Найди прямой угол и сторону напротив него. Сравни длины сторон.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Прямоугольный треугольник с катетами 3 и 4 и гипотенузой 5\"><title>Прямоугольный треугольник с катетами 3 и 4 и гипотенузой 5</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"95,190 95,70 255,190\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"108\" y1=\"190\" x2=\"108\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"108\" y1=\"177\" x2=\"95\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"79\" y=\"133\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text><text x=\"180\" y=\"215\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">4</text><text x=\"186\" y=\"120\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text></g></svg>"
      }
    },
    {
      "id": "prev-018",
      "aliases": [
        "prev-018"
      ],
      "theme": "Треугольники",
      "text": "Медиана, проведённая к гипотенузе прямоугольного треугольника, равна половине гипотенузы.",
      "truth": true,
      "explanation": "Центр описанной окружности прямоугольного треугольника лежит на середине гипотенузы.",
      "hint": {
        "prompt": "Точка M — середина гипотенузы. Сравни CM с половиной гипотенузы.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Прямоугольный треугольник ACB; CM проведена к середине гипотенузы AB\"><title>Прямоугольный треугольник ACB; CM проведена к середине гипотенузы AB</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"95,190 95,70 255,190\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"108\" y1=\"190\" x2=\"108\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"108\" y1=\"177\" x2=\"95\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"79\" y=\"133\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text><text x=\"180\" y=\"215\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">4</text><line x1=\"95\" y1=\"190\" x2=\"175\" y2=\"130\" stroke=\"#ab6719\" stroke-width=\"3\"/><circle cx=\"175\" cy=\"130\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"185\" y=\"118\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">M</text><text x=\"121\" y=\"154\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">m</text><text x=\"143\" y=\"94\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">2,5</text><text x=\"231\" y=\"155\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">2,5</text><text x=\"77\" y=\"206\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">C</text><text x=\"79\" y=\"62\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">A</text><text x=\"273\" y=\"207\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">B</text></g></svg>"
      }
    },
    {
      "id": "prev-019",
      "aliases": [
        "prev-019"
      ],
      "theme": "Треугольники",
      "text": "Если медиана треугольника равна половине стороны, к которой она проведена, то треугольник прямоугольный.",
      "truth": true,
      "explanation": "Это обратный факт к свойству медианы, проведённой к гипотенузе.",
      "hint": {
        "prompt": "MA, MB и MC равны. На какой окружности лежат A, B и C? Как расположен AB?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Три отрезка MA, MB, MC равны; A и B лежат на одной прямой с M\"><title>Три отрезка MA, MB, MC равны; A и B лежат на одной прямой с M</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><circle cx=\"180\" cy=\"130\" r=\"85\" fill=\"none\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><polygon points=\"95,130 265,130 180,45\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"180\" y1=\"45\" x2=\"180\" y2=\"130\" stroke=\"#ab6719\" stroke-width=\"3\"/><circle cx=\"180\" cy=\"130\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"180\" y=\"153\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">M</text><text x=\"135\" y=\"151\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">r</text><text x=\"226\" y=\"151\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">r</text><text x=\"196\" y=\"91\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">r</text><text x=\"180\" y=\"29\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">C</text><text x=\"80\" y=\"135\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">A</text><text x=\"280\" y=\"135\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">B</text></g></svg>"
      }
    },
    {
      "id": "prev-020",
      "aliases": [
        "prev-020"
      ],
      "theme": "Треугольники",
      "text": "Любая медиана треугольника делит его на два равных треугольника.",
      "truth": false,
      "explanation": "Медиана делит треугольник на две равновеликие части, но сами треугольники не всегда равны.",
      "hint": {
        "prompt": "Передвинь верхнюю вершину. Сравни стороны двух получившихся треугольников.",
        "model": "triangleMedian",
        "params": {
          "x": 1.2,
          "height": 3,
          "focus": "sides"
        }
      }
    },
    {
      "id": "prev-021",
      "aliases": [
        "prev-021"
      ],
      "theme": "Треугольники",
      "text": "Любая медиана треугольника делит его на два треугольника равной площади.",
      "truth": true,
      "explanation": "У двух полученных треугольников равные основания и общая высота.",
      "hint": {
        "prompt": "Передвинь верхнюю вершину. Сравни основания, высоты и площади двух частей.",
        "model": "triangleMedian",
        "params": {
          "x": 1.2,
          "height": 3,
          "focus": "area"
        }
      }
    },
    {
      "id": "prev-022",
      "aliases": [
        "prev-022"
      ],
      "theme": "Треугольники",
      "text": "В любом треугольнике высота, проведённая к стороне, совпадает с медианой.",
      "truth": false,
      "explanation": "Так бывает не всегда. Например, в неравнобедренном треугольнике высота и медиана обычно разные.",
      "hint": {
        "prompt": "Передвинь верхнюю вершину. Сравни точки, в которые приходят медиана и высота.",
        "model": "triangleMedian",
        "params": {
          "x": 1.2,
          "height": 3,
          "focus": "sides"
        }
      }
    },
    {
      "id": "prev-023",
      "aliases": [
        "prev-023"
      ],
      "theme": "Треугольники",
      "text": "В равнобедренном треугольнике высота, проведённая к основанию, является и медианой, и биссектрисой.",
      "truth": true,
      "explanation": "Это важное свойство равнобедренного треугольника.",
      "hint": {
        "prompt": "Высота проведена к основанию 6. Сравни две полученные части треугольника.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"В треугольнике 5,5,6 проведена высота к основанию 6\"><title>В треугольнике 5,5,6 проведена высота к основанию 6</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"90,190 270,190 180,70\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"180\" y=\"216\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">6</text><text x=\"119\" y=\"122\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text><text x=\"242\" y=\"122\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text><line x1=\"180\" y1=\"70\" x2=\"180\" y2=\"190\" stroke=\"#ab6719\" stroke-width=\"3\"/><line x1=\"193\" y1=\"190\" x2=\"193\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"193\" y1=\"177\" x2=\"180\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"180\" y=\"236\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">H</text><text x=\"137\" y=\"211\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text><text x=\"225\" y=\"211\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text></g></svg>"
      }
    },
    {
      "id": "prev-024",
      "aliases": [
        "prev-024"
      ],
      "theme": "Треугольники",
      "text": "Любая биссектриса равнобедренного треугольника является его медианой.",
      "truth": false,
      "explanation": "В равнобедренном треугольнике, который не является равносторонним, биссектриса к основанию совпадает с медианой. Биссектриса из вершины при основании обычно делит противоположную сторону на неравные части.",
      "hint": {
        "prompt": "Биссектриса проведена из вершины при основании. Должны ли отрезки BD и DC быть одинаковыми?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Равнобедренный треугольник AC=BC=5, AB=6; биссектриса AD проведена из вершины A при основании\"><title>Равнобедренный треугольник AC=BC=5, AB=6; биссектриса AD проведена из вершины A при основании</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"65,190 275,190 170,50\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"65\" y1=\"190\" x2=\"217.72727272727272\" y2=\"113.63636363636364\" stroke=\"#ab6719\" stroke-width=\"3\"/><circle cx=\"217.72727272727272\" cy=\"113.63636363636364\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"246.72727272727272\" y=\"127.63636363636364\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">D</text><text x=\"45\" y=\"200\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">A</text><text x=\"294\" y=\"200\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">B</text><text x=\"170\" y=\"33\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">C</text><text x=\"170\" y=\"218\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">AB = 6</text><text x=\"95\" y=\"110\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text><text x=\"215\" y=\"85\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text><text x=\"113\" y=\"176\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">α</text><text x=\"107\" y=\"147\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">α</text></g></svg>"
      }
    },
    {
      "id": "prev-025",
      "aliases": [
        "prev-025"
      ],
      "theme": "Треугольники",
      "text": "Если две стороны и угол между ними равны соответствующим элементам другого треугольника, то треугольники равны.",
      "truth": true,
      "explanation": "Это первый признак равенства треугольников: две стороны и угол между ними.",
      "hint": {
        "prompt": "Найди две соответствующие стороны и угол между ними. Можно ли совместить треугольники?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Два треугольника: отмечены две стороны и угол между ними\"><title>Два треугольника: отмечены две стороны и угол между ними</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"25,190 25,70 145,190\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><polygon points=\"210,190 210,70 330,190\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"38\" y1=\"190\" x2=\"38\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"38\" y1=\"177\" x2=\"25\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"223\" y1=\"190\" x2=\"223\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"223\" y1=\"177\" x2=\"210\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"12\" y=\"135\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text><text x=\"197\" y=\"135\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text><text x=\"85\" y=\"214\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text><text x=\"270\" y=\"214\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text></g></svg>"
      }
    },
    {
      "id": "prev-026",
      "aliases": [
        "prev-026"
      ],
      "theme": "Треугольники",
      "text": "Если две стороны и не заключённый между ними угол равны, то треугольники всегда равны.",
      "truth": false,
      "explanation": "Это не является надёжным признаком равенства: возможны разные треугольники.",
      "hint": {
        "prompt": "В обоих треугольниках отмечены стороны 10 и 6 и угол 30°. Сравни третьи стороны.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Два треугольника с углом 30° и одинаковыми сторонами 10 и 6; сторона 6 лежит напротив угла 30°\"><title>Два треугольника с углом 30° и одинаковыми сторонами 10 и 6; сторона 6 лежит напротив угла 30°</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"25,190 94.46718021735681,190 137.583302491977,125\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"49\" y=\"179\" text-anchor=\"middle\" font-size=\"14\" fill=\"#243b53\">30°</text><text x=\"73.2916512459885\" y=\"145.5\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">10</text><text x=\"121.02524135466692\" y=\"157.5\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">6</text><polygon points=\"195,190 314.76878828199784,190 281.60254037844385,140\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"219\" y=\"179\" text-anchor=\"middle\" font-size=\"14\" fill=\"#243b53\">30°</text><text x=\"230.30127018922192\" y=\"153.0\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">10</text><text x=\"303.18566433022085\" y=\"165.0\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">6</text></g></svg>"
      }
    },
    {
      "id": "prev-027",
      "aliases": [
        "prev-027"
      ],
      "theme": "Треугольники",
      "text": "Если два угла одного треугольника равны двум углам другого, то такие треугольники подобны.",
      "truth": true,
      "explanation": "Это признак подобия треугольников по двум углам.",
      "hint": {
        "prompt": "Меняй размер второго треугольника. Сравни соответствующие углы и стороны.",
        "model": "similarity",
        "params": {
          "scale": 2
        }
      }
    },
    {
      "id": "prev-028",
      "aliases": [
        "prev-028"
      ],
      "theme": "Треугольники",
      "text": "Если все углы одного треугольника равны соответствующим углам другого, то треугольники обязательно равны.",
      "truth": false,
      "explanation": "Равенство углов даёт подобие, но размеры могут быть разными.",
      "hint": {
        "prompt": "Меняй размер второго треугольника. Сравни соответствующие углы и стороны.",
        "model": "similarity",
        "params": {
          "scale": 2
        }
      }
    },
    {
      "id": "prev-029",
      "aliases": [
        "prev-029"
      ],
      "theme": "Треугольники",
      "text": "Если три стороны одного треугольника пропорциональны трём сторонам другого, то треугольники подобны.",
      "truth": true,
      "explanation": "Это признак подобия по трём сторонам.",
      "hint": {
        "prompt": "Меняй размер второго треугольника. Сравни соответствующие углы и стороны.",
        "model": "similarity",
        "params": {
          "scale": 2
        }
      }
    },
    {
      "id": "prev-030",
      "aliases": [
        "prev-030"
      ],
      "theme": "Треугольники",
      "text": "Равные треугольники имеют равные площади.",
      "truth": true,
      "explanation": "У равных фигур все соответствующие элементы совпадают, поэтому площади равны.",
      "hint": {
        "prompt": "Представь наложение одного треугольника на другой. Сравни занимаемую ими площадь.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Два одинаковых прямоугольных треугольника с катетами 5 и 6\"><title>Два одинаковых прямоугольных треугольника с катетами 5 и 6</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"35,190 35,90 155,190\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><polygon points=\"205,190 205,90 325,190\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"100\" y=\"214\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">6</text><text x=\"268\" y=\"214\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">6</text><text x=\"22\" y=\"145\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text><text x=\"192\" y=\"145\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text></g></svg>"
      }
    },
    {
      "id": "prev-031",
      "aliases": [
        "prev-031"
      ],
      "theme": "Треугольники",
      "text": "Треугольники с равными площадями обязательно равны.",
      "truth": false,
      "explanation": "Равная площадь не гарантирует равенство треугольников. Например, прямоугольные треугольники с катетами 3 и 4, а также 2 и 6 имеют площадь 6, но их стороны различаются.",
      "hint": {
        "prompt": "Посчитай площади по катетам. Затем сравни сами треугольники и длины их сторон.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Два прямоугольных треугольника с катетами 3 и 4, а также 2 и 6\"><title>Два прямоугольных треугольника с катетами 3 и 4, а также 2 и 6</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"35,190 35,130 115,190\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><polygon points=\"185,190 185,150 305,190\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"20\" y=\"164\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text><text x=\"78\" y=\"214\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">4</text><text x=\"170\" y=\"176\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">2</text><text x=\"246\" y=\"214\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">6</text><line x1=\"48\" y1=\"190\" x2=\"48\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"48\" y1=\"177\" x2=\"35\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"198\" y1=\"190\" x2=\"198\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"198\" y1=\"177\" x2=\"185\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/></g></svg>"
      }
    },
    {
      "id": "prev-032",
      "aliases": [
        "prev-032"
      ],
      "theme": "Треугольники",
      "text": "В любом треугольнике каждый угол меньше 90°.",
      "truth": false,
      "explanation": "Существуют прямоугольные и тупоугольные треугольники.",
      "hint": {
        "prompt": "Меняй углы треугольника. Следи за третьим углом и суммой всех трёх.",
        "model": "triangleAngles",
        "params": {
          "a": 100,
          "b": 40
        }
      }
    },
    {
      "id": "prev-033",
      "aliases": [
        "prev-033"
      ],
      "theme": "Треугольники",
      "text": "Внешний угол треугольника равен сумме двух внутренних углов, не смежных с ним.",
      "truth": true,
      "explanation": "Это теорема о внешнем угле треугольника.",
      "hint": {
        "prompt": "Найди третий внутренний угол. Как он связан с внешним углом β?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Треугольник с внутренними углами 50° и 70°; у третьей вершины отмечен внешний угол β\"><title>Треугольник с внутренними углами 50° и 70°; у третьей вершины отмечен внешний угол β</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"55,190 260,190 176.44123441766976,45.27197259366645\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"260\" y1=\"190\" x2=\"335\" y2=\"190\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"89\" y=\"177\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">50°</text><text x=\"176.44123441766976\" y=\"79.27197259366645\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">70°</text><text x=\"292\" y=\"169\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">β</text></g></svg>"
      }
    },
    {
      "id": "prev-034",
      "aliases": [
        "prev-034"
      ],
      "theme": "Треугольники",
      "text": "Хотя бы один угол любого треугольника не превышает 60°.",
      "truth": true,
      "explanation": "Если бы все три угла были больше 60°, их сумма была бы больше 180°, что невозможно.",
      "hint": {
        "prompt": "Меняй углы треугольника. Следи за третьим углом и суммой всех трёх.",
        "model": "triangleAngles",
        "params": {
          "a": 100,
          "b": 40
        }
      }
    },
    {
      "id": "prev-035",
      "aliases": [
        "prev-035"
      ],
      "theme": "Треугольники",
      "text": "В треугольнике могут быть два тупых угла.",
      "truth": false,
      "explanation": "Два тупых угла дали бы сумму больше 180°.",
      "hint": {
        "prompt": "Меняй углы треугольника. Следи за третьим углом и суммой всех трёх.",
        "model": "triangleAngles",
        "params": {
          "a": 100,
          "b": 40
        }
      }
    },
    {
      "id": "prev-036",
      "aliases": [
        "prev-036"
      ],
      "theme": "Треугольники",
      "text": "В треугольнике не может быть двух прямых углов.",
      "truth": true,
      "explanation": "Два прямых угла уже дают 180°, а третий угол должен быть положительным.",
      "hint": {
        "prompt": "Меняй углы треугольника. Следи за третьим углом и суммой всех трёх.",
        "model": "triangleAngles",
        "params": {
          "a": 100,
          "b": 40
        }
      }
    },
    {
      "id": "prev-037",
      "aliases": [
        "prev-037"
      ],
      "theme": "Треугольники",
      "text": "Треугольник со сторонами 3, 4 и 5 является прямоугольным.",
      "truth": true,
      "explanation": "3² + 4² = 5², значит по обратной теореме Пифагора треугольник прямоугольный.",
      "hint": {
        "prompt": "Найди прямой угол и сторону напротив него. Сравни длины сторон.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Прямоугольный треугольник с катетами 3 и 4 и гипотенузой 5\"><title>Прямоугольный треугольник с катетами 3 и 4 и гипотенузой 5</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"95,190 95,70 255,190\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"108\" y1=\"190\" x2=\"108\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"108\" y1=\"177\" x2=\"95\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"79\" y=\"133\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text><text x=\"180\" y=\"215\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">4</text><text x=\"186\" y=\"120\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text></g></svg>"
      }
    },
    {
      "id": "prev-038",
      "aliases": [
        "prev-038"
      ],
      "theme": "Треугольники",
      "text": "Существуют треугольники со сторонами 2, 3 и 5.",
      "truth": false,
      "explanation": "Для треугольника сумма любых двух сторон должна быть больше третьей. Здесь 2 + 3 = 5, поэтому треугольник не существует.",
      "hint": {
        "prompt": "Попробуй соединить отрезки 2,3 и 5. Что происходит при таком наборе длин?",
        "model": "triangleSides",
        "params": {
          "a": 2,
          "b": 3,
          "c": 5,
          "locked": [
            "a",
            "b",
            "c"
          ]
        }
      }
    },
    {
      "id": "prev-039",
      "aliases": [
        "prev-039"
      ],
      "theme": "Треугольники",
      "text": "Любые три положительные длины могут быть сторонами треугольника.",
      "truth": false,
      "explanation": "Нужно выполнять неравенство треугольника: сумма двух сторон больше третьей.",
      "hint": {
        "prompt": "Меняй длины трёх отрезков. Всегда ли концы соединяются в треугольник?",
        "model": "triangleSides",
        "params": {
          "a": 1,
          "b": 2,
          "c": 4
        }
      }
    },
    {
      "id": "prev-040",
      "aliases": [
        "prev-040"
      ],
      "theme": "Треугольники",
      "text": "Если в треугольнике два угла равны, то он равнобедренный.",
      "truth": true,
      "explanation": "Напротив равных углов лежат равные стороны.",
      "hint": {
        "prompt": "Углы α и β при основании одинаковы. Сравни лежащие напротив них стороны.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Равнобедренный треугольник со сторонами 5,5,6; отмечены углы при основании\"><title>Равнобедренный треугольник со сторонами 5,5,6; отмечены углы при основании</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"90,190 270,190 180,70\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"180\" y=\"216\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">6</text><text x=\"119\" y=\"122\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text><text x=\"242\" y=\"122\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text><text x=\"123\" y=\"178\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">α</text><text x=\"237\" y=\"178\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">β</text></g></svg>"
      }
    },
    {
      "id": "prev-041",
      "aliases": [
        "prev-041"
      ],
      "theme": "Треугольники",
      "text": "Если треугольник равнобедренный, то все его углы равны.",
      "truth": false,
      "explanation": "В равнобедренном треугольнике обязательно равны углы при основании. Третий угол может отличаться: например, у треугольника со сторонами 5,5,6. Все три угла равны в частном случае равностороннего треугольника.",
      "hint": {
        "prompt": "У треугольника две стороны по 5 и основание 6. Сравни его стороны и углы.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Равнобедренный треугольник со сторонами 5,5,6; отмечены углы при основании\"><title>Равнобедренный треугольник со сторонами 5,5,6; отмечены углы при основании</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"90,190 270,190 180,70\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"180\" y=\"216\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">6</text><text x=\"119\" y=\"122\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text><text x=\"242\" y=\"122\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text><text x=\"123\" y=\"178\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">α</text><text x=\"237\" y=\"178\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">β</text></g></svg>"
      }
    },
    {
      "id": "prev-042",
      "aliases": [
        "prev-042"
      ],
      "theme": "Треугольники",
      "text": "Средняя линия треугольника параллельна третьей стороне и равна половине этой стороны.",
      "truth": true,
      "explanation": "Это свойство средней линии треугольника.",
      "hint": {
        "prompt": "M и N — середины сторон. Сравни MN с третьей стороной треугольника.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"В треугольнике соединены середины двух сторон; третья сторона имеет длину 10\"><title>В треугольнике соединены середины двух сторон; третья сторона имеет длину 10</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"55,195 305,195 145,35\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"100\" y1=\"115\" x2=\"225\" y2=\"115\" stroke=\"#ab6719\" stroke-width=\"3\"/><circle cx=\"100\" cy=\"115\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"82\" y=\"115\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">M</text><circle cx=\"225\" cy=\"115\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"242\" y=\"115\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">N</text><text x=\"179\" y=\"219\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">10</text><text x=\"162\" y=\"104\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">MN</text><text x=\"83\" y=\"163\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">a</text><text x=\"120\" y=\"76\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">a</text><text x=\"194\" y=\"76\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">b</text><text x=\"270\" y=\"163\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">b</text></g></svg>"
      }
    },
    {
      "id": "prev-043",
      "aliases": [
        "prev-043"
      ],
      "theme": "Четырёхугольники",
      "text": "Сумма внутренних углов выпуклого четырёхугольника равна 360°.",
      "truth": true,
      "explanation": "Любой выпуклый четырёхугольник можно разбить диагональю на два треугольника.",
      "hint": {
        "prompt": "Диагональ разбила четырёхугольник на два треугольника. Сложи их суммы углов.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Выпуклый четырёхугольник разделён диагональю на два треугольника\"><title>Выпуклый четырёхугольник разделён диагональю на два треугольника</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"60,190 295,190 260,60 120,35\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"60\" y1=\"190\" x2=\"260\" y2=\"60\" stroke=\"#ab6719\" stroke-width=\"3\" stroke-dasharray=\"6 5\"/><text x=\"92\" y=\"170\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">α</text><text x=\"265\" y=\"169\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">β</text><text x=\"244\" y=\"88\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">γ</text><text x=\"129\" y=\"63\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">δ</text></g></svg>"
      }
    },
    {
      "id": "prev-044",
      "aliases": [
        "prev-044"
      ],
      "theme": "Четырёхугольники",
      "text": "Диагонали параллелограмма делятся точкой пересечения пополам.",
      "truth": true,
      "explanation": "Это основное свойство диагоналей параллелограмма.",
      "hint": {
        "prompt": "Меняй угол и стороны. Сравни диагонали и отрезки от их пересечения до вершин.",
        "model": "parallelogram",
        "params": {
          "base": 6,
          "side": 4,
          "angle": 65,
          "focus": "diagonals"
        }
      }
    },
    {
      "id": "prev-045",
      "aliases": [
        "prev-045"
      ],
      "theme": "Четырёхугольники",
      "text": "Если диагонали четырёхугольника делятся точкой пересечения пополам, то этот четырёхугольник — параллелограмм.",
      "truth": true,
      "explanation": "Это признак параллелограмма.",
      "hint": {
        "prompt": "Меняй угол и стороны. Сравни диагонали и отрезки от их пересечения до вершин.",
        "model": "parallelogram",
        "params": {
          "base": 6,
          "side": 4,
          "angle": 65,
          "focus": "diagonals"
        }
      }
    },
    {
      "id": "prev-046",
      "aliases": [
        "prev-046"
      ],
      "theme": "Четырёхугольники",
      "text": "Противоположные стороны параллелограмма равны.",
      "truth": true,
      "explanation": "Это свойство параллелограмма.",
      "hint": {
        "prompt": "Меняй стороны и угол. Сравни длины противоположных и соседних сторон.",
        "model": "parallelogram",
        "params": {
          "base": 6,
          "side": 4,
          "angle": 65,
          "focus": "sides"
        }
      }
    },
    {
      "id": "prev-047",
      "aliases": [
        "prev-047"
      ],
      "theme": "Четырёхугольники",
      "text": "В любом параллелограмме диагонали равны.",
      "truth": false,
      "explanation": "Диагонали равны не у любого параллелограмма, а у прямоугольника и квадрата.",
      "hint": {
        "prompt": "Меняй угол и стороны. Сравни диагонали и отрезки от их пересечения до вершин.",
        "model": "parallelogram",
        "params": {
          "base": 6,
          "side": 4,
          "angle": 65,
          "focus": "diagonals"
        }
      }
    },
    {
      "id": "prev-048",
      "aliases": [
        "prev-048"
      ],
      "theme": "Четырёхугольники",
      "text": "Если диагонали параллелограмма равны, то этот параллелограмм является прямоугольником.",
      "truth": true,
      "explanation": "Равенство диагоналей — признак прямоугольника среди параллелограммов.",
      "hint": {
        "prompt": "Измени ширину и высоту. Сравни диагонали и проверь углы фигуры.",
        "model": "rectangle",
        "params": {
          "width": 6,
          "height": 3,
          "focus": "diagonals"
        }
      }
    },
    {
      "id": "prev-049",
      "aliases": [
        "prev-049"
      ],
      "theme": "Четырёхугольники",
      "text": "Если диагонали параллелограмма перпендикулярны, то этот параллелограмм является ромбом.",
      "truth": true,
      "explanation": "Перпендикулярность диагоналей в параллелограмме даёт равенство всех сторон.",
      "hint": {
        "prompt": "Меняй угол ромба. Наблюдай за его диагоналями и углами.",
        "model": "rhombus",
        "params": {
          "side": 4,
          "angle": 65,
          "focus": "diagonals"
        }
      }
    },
    {
      "id": "prev-050",
      "aliases": [
        "prev-050"
      ],
      "theme": "Четырёхугольники",
      "text": "Если все стороны параллелограмма равны, то это ромб.",
      "truth": true,
      "explanation": "Ромб — это параллелограмм, у которого все стороны равны.",
      "hint": {
        "prompt": "Все четыре стороны одинаковы. Меняй угол и вспомни определение ромба.",
        "model": "rhombus",
        "params": {
          "side": 4,
          "angle": 65,
          "focus": "sides"
        }
      }
    },
    {
      "id": "prev-051",
      "aliases": [
        "prev-051"
      ],
      "theme": "Четырёхугольники",
      "text": "Каждый квадрат является ромбом.",
      "truth": true,
      "explanation": "У квадрата все стороны равны, значит он подходит под определение ромба.",
      "hint": {
        "prompt": "Установлены одинаковые длины сторон. Какие признаки ромба есть у этой фигуры?",
        "model": "rectangle",
        "params": {
          "width": 4,
          "height": 4,
          "locked": [
            "width",
            "height"
          ],
          "focus": "sides"
        }
      }
    },
    {
      "id": "prev-052",
      "aliases": [
        "prev-052"
      ],
      "theme": "Четырёхугольники",
      "text": "Каждый ромб является квадратом.",
      "truth": false,
      "explanation": "У ромба все стороны равны, но углы не обязаны быть прямыми.",
      "hint": {
        "prompt": "Меняй угол ромба. Когда у него появляются прямые углы?",
        "model": "rhombus",
        "params": {
          "side": 4,
          "angle": 65,
          "focus": "angles"
        }
      }
    },
    {
      "id": "prev-053",
      "aliases": [
        "prev-053"
      ],
      "theme": "Четырёхугольники",
      "text": "Каждый прямоугольник является параллелограммом.",
      "truth": true,
      "explanation": "У прямоугольника противоположные стороны параллельны, значит это параллелограмм.",
      "hint": {
        "prompt": "Меняй ширину и высоту. Сравни направления сторон и длины диагоналей.",
        "model": "rectangle",
        "params": {
          "width": 6,
          "height": 3,
          "focus": "diagonals"
        }
      }
    },
    {
      "id": "prev-054",
      "aliases": [
        "prev-054"
      ],
      "theme": "Четырёхугольники",
      "text": "Каждый параллелограмм является прямоугольником.",
      "truth": false,
      "explanation": "У параллелограмма углы не обязаны быть прямыми.",
      "hint": {
        "prompt": "Меняй угол. При каких значениях все углы фигуры становятся одинаковыми?",
        "model": "parallelogram",
        "params": {
          "base": 6,
          "side": 4,
          "angle": 65,
          "focus": "angles"
        }
      }
    },
    {
      "id": "prev-055",
      "aliases": [
        "prev-055"
      ],
      "theme": "Четырёхугольники",
      "text": "В любом прямоугольнике диагонали равны.",
      "truth": true,
      "explanation": "Это основное свойство прямоугольника.",
      "hint": {
        "prompt": "Меняй ширину и высоту. Сравни направления сторон и длины диагоналей.",
        "model": "rectangle",
        "params": {
          "width": 6,
          "height": 3,
          "focus": "diagonals"
        }
      }
    },
    {
      "id": "prev-056",
      "aliases": [
        "prev-056"
      ],
      "theme": "Четырёхугольники",
      "text": "В любом ромбе диагонали равны.",
      "truth": false,
      "explanation": "У ромба диагонали обычно не равны. Равны они у квадрата.",
      "hint": {
        "prompt": "Меняй угол ромба. Наблюдай за его диагоналями и углами.",
        "model": "rhombus",
        "params": {
          "side": 4,
          "angle": 65,
          "focus": "diagonals"
        }
      }
    },
    {
      "id": "prev-057",
      "aliases": [
        "prev-057"
      ],
      "theme": "Четырёхугольники",
      "text": "В любом ромбе диагонали перпендикулярны.",
      "truth": true,
      "explanation": "Это свойство ромба.",
      "hint": {
        "prompt": "Меняй угол ромба. Наблюдай за его диагоналями и углами.",
        "model": "rhombus",
        "params": {
          "side": 4,
          "angle": 65,
          "focus": "diagonals"
        }
      }
    },
    {
      "id": "prev-058",
      "aliases": [
        "prev-058"
      ],
      "theme": "Четырёхугольники",
      "text": "Диагонали ромба делят его углы пополам.",
      "truth": true,
      "explanation": "В ромбе каждая диагональ является биссектрисой углов, которые она соединяет.",
      "hint": {
        "prompt": "Сравни пары углов, на которые диагональ делит угол при каждой вершине.",
        "model": "rhombus",
        "params": {
          "side": 4,
          "angle": 65,
          "focus": "bisectors"
        }
      }
    },
    {
      "id": "prev-059",
      "aliases": [
        "prev-059"
      ],
      "theme": "Четырёхугольники",
      "text": "В любой трапеции боковые стороны равны.",
      "truth": false,
      "explanation": "Боковые стороны равны только у равнобедренной трапеции.",
      "hint": {
        "prompt": "Сдвигай верхнее основание. Сравни длины двух боковых сторон.",
        "model": "trapezoid",
        "params": {
          "bottom": 7,
          "top": 3,
          "height": 3,
          "offset": 1,
          "focus": "sides"
        }
      }
    },
    {
      "id": "prev-060",
      "aliases": [
        "prev-060"
      ],
      "theme": "Четырёхугольники",
      "text": "Основания трапеции параллельны.",
      "truth": true,
      "explanation": "Основания — это параллельные стороны трапеции.",
      "hint": {
        "prompt": "Меняй длины оснований. Сравни их направление, среднюю линию и её длину.",
        "model": "trapezoid",
        "params": {
          "bottom": 7,
          "top": 3,
          "height": 3,
          "offset": 0,
          "focus": "midline"
        }
      }
    },
    {
      "id": "prev-061",
      "aliases": [
        "prev-061"
      ],
      "theme": "Четырёхугольники",
      "text": "Средняя линия трапеции параллельна основаниям.",
      "truth": true,
      "explanation": "Это свойство средней линии трапеции.",
      "hint": {
        "prompt": "Меняй длины оснований. Сравни их направление, среднюю линию и её длину.",
        "model": "trapezoid",
        "params": {
          "bottom": 7,
          "top": 3,
          "height": 3,
          "offset": 0,
          "focus": "midline"
        }
      }
    },
    {
      "id": "prev-062",
      "aliases": [
        "prev-062"
      ],
      "theme": "Четырёхугольники",
      "text": "Средняя линия трапеции равна полусумме оснований.",
      "truth": true,
      "explanation": "Средняя линия трапеции равна половине суммы оснований: нужно сложить длины оснований и разделить результат на два.",
      "hint": {
        "prompt": "Меняй длины оснований. Сравни их направление, среднюю линию и её длину.",
        "model": "trapezoid",
        "params": {
          "bottom": 7,
          "top": 3,
          "height": 3,
          "offset": 0,
          "focus": "midline"
        }
      }
    },
    {
      "id": "prev-063",
      "aliases": [
        "prev-063"
      ],
      "theme": "Четырёхугольники",
      "text": "Диагонали любой трапеции равны.",
      "truth": false,
      "explanation": "Диагонали равны у равнобедренной трапеции, но не у любой.",
      "hint": {
        "prompt": "Сдвигай верхнее основание. Сравни длины диагоналей.",
        "model": "trapezoid",
        "params": {
          "bottom": 7,
          "top": 3,
          "height": 3,
          "offset": 1,
          "focus": "diagonals"
        }
      }
    },
    {
      "id": "prev-064",
      "aliases": [
        "prev-064"
      ],
      "theme": "Четырёхугольники",
      "text": "В равнобедренной трапеции диагонали равны.",
      "truth": true,
      "explanation": "Это свойство равнобедренной трапеции.",
      "hint": {
        "prompt": "Верхнее основание расположено по центру. Меняй его длину и сравни две диагонали.",
        "model": "trapezoid",
        "params": {
          "bottom": 7,
          "top": 3,
          "height": 3,
          "offset": 0,
          "locked": [
            "offset"
          ],
          "focus": "diagonals"
        }
      }
    },
    {
      "id": "prev-065",
      "aliases": [
        "prev-065"
      ],
      "theme": "Четырёхугольники",
      "text": "В равнобедренной трапеции углы при каждом основании равны.",
      "truth": true,
      "explanation": "Это свойство равнобедренной трапеции.",
      "hint": {
        "prompt": "Боковые стороны равны. Меняй основания и сравни два угла при одном основании.",
        "model": "trapezoid",
        "params": {
          "bottom": 7,
          "top": 3,
          "height": 3,
          "offset": 0,
          "locked": [
            "offset"
          ],
          "focus": "angles"
        }
      }
    },
    {
      "id": "prev-066",
      "aliases": [
        "prev-066"
      ],
      "theme": "Четырёхугольники",
      "text": "Если стороны двух четырёхугольников попарно равны, то четырёхугольники обязательно равны.",
      "truth": false,
      "explanation": "Контрпример: два ромба с одинаковыми сторонами, но разными углами.",
      "hint": {
        "prompt": "У обеих фигур все стороны по 4. Сравни их углы и форму.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Квадрат и ромб со стороной 4; у ромба отмечен угол 60°\"><title>Квадрат и ромб со стороной 4; у ромба отмечен угол 60°</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"25,175 125,175 125,75 25,75\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><polygon points=\"195,175 295,175 345,88.4 245,88.4\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"75\" y=\"201\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">4</text><text x=\"12\" y=\"130\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">4</text><text x=\"245\" y=\"201\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">4</text><text x=\"202\" y=\"128\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">4</text><text x=\"227\" y=\"161\" text-anchor=\"middle\" font-size=\"15\" fill=\"#243b53\">60°</text><line x1=\"38\" y1=\"175\" x2=\"38\" y2=\"162\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"38\" y1=\"162\" x2=\"25\" y2=\"162\" stroke=\"#657e8c\" stroke-width=\"3\"/></g></svg>"
      }
    },
    {
      "id": "prev-067",
      "aliases": [
        "prev-067"
      ],
      "theme": "Четырёхугольники",
      "text": "Если один угол параллелограмма прямой, то этот параллелограмм является прямоугольником.",
      "truth": true,
      "explanation": "В параллелограмме соседние углы в сумме 180°. Если один угол 90°, то все углы прямые.",
      "hint": {
        "prompt": "Один угол равен 90°. Сравни противоположные и соседние углы.",
        "model": "parallelogram",
        "params": {
          "base": 6,
          "side": 4,
          "angle": 90,
          "locked": [
            "angle"
          ],
          "focus": "angles"
        }
      }
    },
    {
      "id": "prev-068",
      "aliases": [
        "prev-068"
      ],
      "theme": "Четырёхугольники",
      "text": "Если один угол ромба прямой, то этот ромб является квадратом.",
      "truth": true,
      "explanation": "Ромб с прямым углом становится прямоугольником, а прямоугольный ромб — квадрат.",
      "hint": {
        "prompt": "Один угол равен 90°. Сравни стороны и остальные углы.",
        "model": "rhombus",
        "params": {
          "side": 4,
          "angle": 90,
          "locked": [
            "angle"
          ],
          "focus": "angles"
        }
      }
    },
    {
      "id": "prev-069",
      "aliases": [
        "prev-069"
      ],
      "theme": "Четырёхугольники",
      "text": "Если один угол четырёхугольника прямой, то этот четырёхугольник является прямоугольником.",
      "truth": false,
      "explanation": "Один прямой угол не заставляет остальные три угла быть прямыми. Например, у прямоугольной трапеции есть прямые углы, но она не является прямоугольником.",
      "hint": {
        "prompt": "Один угол отмечен прямым. Обязательно ли остальные три угла такие же?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Четырёхугольник с одним прямым углом; остальные углы не отмечены прямыми\"><title>Четырёхугольник с одним прямым углом; остальные углы не отмечены прямыми</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"65,190 295,190 250,70 65,35\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"78\" y1=\"190\" x2=\"78\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"78\" y1=\"177\" x2=\"65\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"48\" y=\"215\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">A</text><text x=\"310\" y=\"215\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">B</text><text x=\"265\" y=\"61\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">C</text><text x=\"50\" y=\"29\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">D</text></g></svg>"
      }
    },
    {
      "id": "prev-070",
      "aliases": [
        "prev-070"
      ],
      "theme": "Четырёхугольники",
      "text": "Если все углы параллелограмма равны, то он является прямоугольником.",
      "truth": true,
      "explanation": "Сумма углов параллелограмма 360°, значит четыре равных угла по 90°.",
      "hint": {
        "prompt": "Один угол равен 90°. Сравни противоположные и соседние углы.",
        "model": "parallelogram",
        "params": {
          "base": 6,
          "side": 4,
          "angle": 90,
          "locked": [
            "angle"
          ],
          "focus": "angles"
        }
      }
    },
    {
      "id": "prev-071",
      "aliases": [
        "prev-071"
      ],
      "theme": "Четырёхугольники",
      "text": "Если диагонали четырёхугольника равны и перпендикулярны, то это обязательно квадрат.",
      "truth": false,
      "explanation": "Для квадрата нужно больше условий. Равные и перпендикулярные диагонали сами по себе не гарантируют квадрат.",
      "hint": {
        "prompt": "Сложи части каждой диагонали. Затем сравни стороны и углы четырёхугольника.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Выпуклый четырёхугольник: диагонали взаимно перпендикулярны, каждая длиной 4; части одной 1 и 3, другой 2 и 2\"><title>Выпуклый четырёхугольник: диагонали взаимно перпендикулярны, каждая длиной 4; части одной 1 и 3, другой 2 и 2</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"180,70 260,110 180,230 100,110\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"180\" y1=\"70\" x2=\"180\" y2=\"230\" stroke=\"#ab6719\" stroke-width=\"3\"/><line x1=\"100\" y1=\"110\" x2=\"260\" y2=\"110\" stroke=\"#ab6719\" stroke-width=\"3\"/><line x1=\"193\" y1=\"110\" x2=\"193\" y2=\"123\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"193\" y1=\"123\" x2=\"180\" y2=\"123\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"197\" y=\"96\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">1</text><text x=\"197\" y=\"179\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text><text x=\"136\" y=\"132\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">2</text><text x=\"223\" y=\"132\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">2</text></g></svg>"
      }
    },
    {
      "id": "prev-072",
      "aliases": [
        "prev-072"
      ],
      "theme": "Четырёхугольники",
      "text": "Если диагонали четырёхугольника равны и делятся точкой пересечения пополам, то это прямоугольник.",
      "truth": true,
      "explanation": "Диагонали делятся пополам — это параллелограмм; равные диагонали в параллелограмме дают прямоугольник.",
      "hint": {
        "prompt": "У прямоугольника можно сравнить диагонали и их половины. Как работают эти признаки вместе?",
        "model": "rectangle",
        "params": {
          "width": 6,
          "height": 3,
          "focus": "diagonals"
        }
      }
    },
    {
      "id": "prev-073",
      "aliases": [
        "prev-073"
      ],
      "theme": "Окружность",
      "text": "Все радиусы одной окружности равны.",
      "truth": true,
      "explanation": "Радиус — расстояние от центра до точки окружности, оно постоянно.",
      "hint": {
        "prompt": "Сравни отрезки от центра O до разных точек окружности. Что у них общего?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Из центра O проведены радиусы к трём точкам окружности\"><title>Из центра O проведены радиусы к трём точкам окружности</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><circle cx=\"180\" cy=\"120\" r=\"82\" fill=\"none\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><circle cx=\"180\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"168\" y=\"141\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">O</text><line x1=\"180\" y1=\"120\" x2=\"262\" y2=\"120\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"180\" y1=\"120\" x2=\"139\" y2=\"48.99\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"180\" y1=\"120\" x2=\"122.02\" y2=\"177.98\" stroke=\"#246b8e\" stroke-width=\"3\"/><circle cx=\"262\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"277\" y=\"120\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">A</text><circle cx=\"139\" cy=\"48.99\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"139\" y=\"36.99\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">B</text><circle cx=\"122.02\" cy=\"177.98\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"110.02\" y=\"195.98\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">C</text></g></svg>"
      }
    },
    {
      "id": "prev-074",
      "aliases": [
        "prev-074"
      ],
      "theme": "Окружность",
      "text": "Диаметр окружности в два раза больше её радиуса.",
      "truth": true,
      "explanation": "Диаметр состоит из двух радиусов: d = 2r.",
      "hint": {
        "prompt": "Найди центр O. Из каких двух отрезков состоит AB?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Диаметр AB проходит через центр окружности O\"><title>Диаметр AB проходит через центр окружности O</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><circle cx=\"180\" cy=\"120\" r=\"82\" fill=\"none\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><circle cx=\"180\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"168\" y=\"141\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">O</text><line x1=\"98\" y1=\"120\" x2=\"262\" y2=\"120\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"132\" y=\"109\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">r</text><text x=\"227\" y=\"109\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">r</text><circle cx=\"98\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"83\" y=\"120\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">A</text><circle cx=\"262\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"277\" y=\"120\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">B</text></g></svg>"
      }
    },
    {
      "id": "prev-075",
      "aliases": [
        "prev-075"
      ],
      "theme": "Окружность",
      "text": "Расстояние от центра окружности до любой точки этой окружности равно радиусу.",
      "truth": true,
      "explanation": "Это определение окружности.",
      "hint": {
        "prompt": "Сравни отрезки от центра O до разных точек окружности. Что у них общего?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Из центра O проведены радиусы к трём точкам окружности\"><title>Из центра O проведены радиусы к трём точкам окружности</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><circle cx=\"180\" cy=\"120\" r=\"82\" fill=\"none\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><circle cx=\"180\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"168\" y=\"141\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">O</text><line x1=\"180\" y1=\"120\" x2=\"262\" y2=\"120\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"180\" y1=\"120\" x2=\"139\" y2=\"48.99\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"180\" y1=\"120\" x2=\"122.02\" y2=\"177.98\" stroke=\"#246b8e\" stroke-width=\"3\"/><circle cx=\"262\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"277\" y=\"120\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">A</text><circle cx=\"139\" cy=\"48.99\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"139\" y=\"36.99\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">B</text><circle cx=\"122.02\" cy=\"177.98\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"110.02\" y=\"195.98\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">C</text></g></svg>"
      }
    },
    {
      "id": "prev-076",
      "aliases": [
        "prev-076"
      ],
      "theme": "Окружность",
      "text": "Хорда, проходящая через центр окружности, является диаметром.",
      "truth": true,
      "explanation": "Диаметр — это хорда, проходящая через центр окружности.",
      "hint": {
        "prompt": "Найди центр O. Из каких двух отрезков состоит AB?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Диаметр AB проходит через центр окружности O\"><title>Диаметр AB проходит через центр окружности O</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><circle cx=\"180\" cy=\"120\" r=\"82\" fill=\"none\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><circle cx=\"180\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"168\" y=\"141\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">O</text><line x1=\"98\" y1=\"120\" x2=\"262\" y2=\"120\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"132\" y=\"109\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">r</text><text x=\"227\" y=\"109\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">r</text><circle cx=\"98\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"83\" y=\"120\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">A</text><circle cx=\"262\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"277\" y=\"120\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">B</text></g></svg>"
      }
    },
    {
      "id": "prev-077",
      "aliases": [
        "prev-077"
      ],
      "theme": "Окружность",
      "text": "Диаметр является самой длинной хордой окружности.",
      "truth": true,
      "explanation": "Хорда не может быть длиннее диаметра.",
      "hint": {
        "prompt": "Передвигай хорду ближе к центру и дальше от него. Сравни её длину с диаметром.",
        "model": "circleChord",
        "params": {
          "radius": 5,
          "offset": 2
        }
      }
    },
    {
      "id": "prev-078",
      "aliases": [
        "prev-078"
      ],
      "theme": "Окружность",
      "text": "Любая хорда окружности является диаметром.",
      "truth": false,
      "explanation": "Диаметром является только хорда, проходящая через центр.",
      "hint": {
        "prompt": "Передвигай хорду ближе к центру и дальше от него. Сравни её длину с диаметром.",
        "model": "circleChord",
        "params": {
          "radius": 5,
          "offset": 2
        }
      }
    },
    {
      "id": "prev-079",
      "aliases": [
        "prev-079"
      ],
      "theme": "Окружность",
      "text": "Касательная к окружности перпендикулярна радиусу, проведённому в точку касания.",
      "truth": true,
      "explanation": "Это основное свойство касательной.",
      "hint": {
        "prompt": "Сколько общих точек у прямой и окружности? Как расположен радиус в точке касания?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Прямая касается окружности в T; проведён радиус OT\"><title>Прямая касается окружности в T; проведён радиус OT</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><circle cx=\"140\" cy=\"120\" r=\"78\" fill=\"none\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><line x1=\"140\" y1=\"120\" x2=\"218\" y2=\"120\" stroke=\"#ab6719\" stroke-width=\"3\"/><line x1=\"218\" y1=\"20\" x2=\"218\" y2=\"220\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"204\" y1=\"120\" x2=\"204\" y2=\"106\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"204\" y1=\"106\" x2=\"218\" y2=\"106\" stroke=\"#657e8c\" stroke-width=\"3\"/><circle cx=\"140\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"125\" y=\"124\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">O</text><circle cx=\"218\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"238\" y=\"125\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">T</text></g></svg>"
      }
    },
    {
      "id": "prev-080",
      "aliases": [
        "prev-080"
      ],
      "theme": "Окружность",
      "text": "Отрезки касательных, проведённых из одной точки к окружности, равны.",
      "truth": true,
      "explanation": "Если из одной точки провести две касательные к окружности, их отрезки до точек касания равны.",
      "hint": {
        "prompt": "PA и PB проведены из одной точки к одной окружности. Сравни треугольники с радиусами.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Из внешней точки P проведены две касательные PA и PB к одной окружности\"><title>Из внешней точки P проведены две касательные PA и PB к одной окружности</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><circle cx=\"120\" cy=\"120\" r=\"70\" fill=\"none\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><line x1=\"300\" y1=\"120\" x2=\"147.222\" y2=\"55.518\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"300\" y1=\"120\" x2=\"147.222\" y2=\"184.482\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"120\" y1=\"120\" x2=\"147.222\" y2=\"55.518\" stroke=\"#ab6719\" stroke-width=\"3\"/><line x1=\"120\" y1=\"120\" x2=\"147.222\" y2=\"184.482\" stroke=\"#ab6719\" stroke-width=\"3\"/><circle cx=\"300\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"318\" y=\"120\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">P</text><circle cx=\"147.222\" cy=\"55.518\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"147.222\" y=\"43.518\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">A</text><circle cx=\"147.222\" cy=\"184.482\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"147.222\" y=\"208.482\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">B</text><circle cx=\"120\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"105\" y=\"125\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">O</text></g></svg>"
      }
    },
    {
      "id": "prev-081",
      "aliases": [
        "prev-081"
      ],
      "theme": "Окружность",
      "text": "Вписанный угол, опирающийся на диаметр, является прямым.",
      "truth": true,
      "explanation": "Вписанный угол, опирающийся на полуокружность, равен 90°.",
      "hint": {
        "prompt": "Передвигай вершину вписанного угла. Его стороны проходят через концы диаметра.",
        "model": "circleAngle",
        "params": {
          "diameter": true,
          "point": 230
        }
      }
    },
    {
      "id": "prev-082",
      "aliases": [
        "prev-082"
      ],
      "theme": "Окружность",
      "text": "Вписанные углы, опирающиеся на одну и ту же дугу, равны.",
      "truth": true,
      "explanation": "Вписанные углы измеряются половиной дуги, на которую опираются.",
      "hint": {
        "prompt": "Две вершины находятся на одной дуге. Сравни два угла, опирающихся на одну другую дугу.",
        "model": "circleAngle",
        "params": {
          "central": 120,
          "point": 230,
          "compare": true
        }
      }
    },
    {
      "id": "prev-083",
      "aliases": [
        "prev-083"
      ],
      "theme": "Окружность",
      "text": "Центральный угол в два раза больше вписанного угла, опирающегося на ту же дугу.",
      "truth": true,
      "explanation": "Центральный угол равен градусной мере дуги, а вписанный — половине этой меры.",
      "hint": {
        "prompt": "Меняй дугу и положение вершины. Сравни центральный и вписанный углы.",
        "model": "circleAngle",
        "params": {
          "central": 120,
          "point": 230
        }
      }
    },
    {
      "id": "prev-084",
      "aliases": [
        "prev-084"
      ],
      "theme": "Окружность",
      "text": "Если вписанный угол опирается на диаметр, то он всегда острый.",
      "truth": false,
      "explanation": "Такой угол прямой, то есть равен 90°.",
      "hint": {
        "prompt": "Передвигай вершину вписанного угла. Его стороны проходят через концы диаметра.",
        "model": "circleAngle",
        "params": {
          "diameter": true,
          "point": 230
        }
      }
    },
    {
      "id": "prev-085",
      "aliases": [
        "prev-085"
      ],
      "theme": "Окружность",
      "text": "Около любого треугольника можно описать окружность.",
      "truth": true,
      "explanation": "У любого треугольника есть описанная окружность.",
      "hint": {
        "prompt": "Вершины лежат на окружности. Какие расстояния от O должны совпадать?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Треугольник с вершинами на окружности; от центра проведены три радиуса\"><title>Треугольник с вершинами на окружности; от центра проведены три радиуса</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><circle cx=\"180\" cy=\"120\" r=\"88\" fill=\"none\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><polygon points=\"110.65505368260847,174.17820982865794 256.21023553303064,164.0 195.28103963468985,33.33691773492569\" fill=\"none\" stroke=\"#246b8e\" stroke-width=\"3\"/><circle cx=\"180\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"180\" y=\"143\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">O</text><line x1=\"180\" y1=\"120\" x2=\"110.65505368260847\" y2=\"174.17820982865794\" stroke=\"#ab6719\" stroke-width=\"3\" stroke-dasharray=\"6 5\"/><line x1=\"180\" y1=\"120\" x2=\"256.21023553303064\" y2=\"164.0\" stroke=\"#ab6719\" stroke-width=\"3\" stroke-dasharray=\"6 5\"/><line x1=\"180\" y1=\"120\" x2=\"195.28103963468985\" y2=\"33.33691773492569\" stroke=\"#ab6719\" stroke-width=\"3\" stroke-dasharray=\"6 5\"/></g></svg>"
      }
    },
    {
      "id": "prev-086",
      "aliases": [
        "prev-086"
      ],
      "theme": "Окружность",
      "text": "В любой четырёхугольник можно вписать окружность.",
      "truth": false,
      "explanation": "Вписанная окружность существует не у любого четырёхугольника. Нужны специальные условия.",
      "hint": {
        "prompt": "Окружность касается двух длинных сторон. Что мешает ей коснуться ещё и двух коротких?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Прямоугольник 6 на 3 и окружность, касающаяся его двух длинных сторон\"><title>Прямоугольник 6 на 3 и окружность, касающаяся его двух длинных сторон</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><rect x=\"60\" y=\"60\" width=\"240\" height=\"120\" fill=\"#edf4f7\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><circle cx=\"180\" cy=\"120\" r=\"60\" fill=\"none\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><text x=\"180\" y=\"207\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">6</text><text x=\"43\" y=\"128\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text><circle cx=\"180\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"180\" y=\"143\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">O</text></g></svg>"
      }
    },
    {
      "id": "prev-087",
      "aliases": [
        "prev-087"
      ],
      "theme": "Окружность",
      "text": "Около любого четырёхугольника можно описать окружность.",
      "truth": false,
      "explanation": "Описанная окружность существует не у любого четырёхугольника. Например, не всякий параллелограмм можно вписать в окружность.",
      "hint": {
        "prompt": "Вспомни условие для противоположных углов четырёхугольника, вписанного в окружность. Проверь ромб.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Ромб с углами 60° у двух противоположных вершин\"><title>Ромб с углами 60° у двух противоположных вершин</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"60,190 220,190 300,51.44 140,51.44\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"95\" y=\"178\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">60°</text><text x=\"255\" y=\"81\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">60°</text><text x=\"180\" y=\"217\" text-anchor=\"middle\" font-size=\"16\" fill=\"#243b53\">Все стороны равны</text></g></svg>"
      }
    },
    {
      "id": "prev-088",
      "aliases": [
        "prev-088"
      ],
      "theme": "Окружность",
      "text": "Центр окружности, описанной около прямоугольного треугольника, лежит на середине гипотенузы.",
      "truth": true,
      "explanation": "У прямоугольного треугольника гипотенуза является диаметром описанной окружности.",
      "hint": {
        "prompt": "M — середина гипотенузы. Сравни расстояния от M до трёх вершин.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Прямоугольный треугольник ACB; CM проведена к середине гипотенузы AB\"><title>Прямоугольный треугольник ACB; CM проведена к середине гипотенузы AB</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"95,190 95,70 255,190\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"108\" y1=\"190\" x2=\"108\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"108\" y1=\"177\" x2=\"95\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"79\" y=\"133\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text><text x=\"180\" y=\"215\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">4</text><line x1=\"95\" y1=\"190\" x2=\"175\" y2=\"130\" stroke=\"#ab6719\" stroke-width=\"3\"/><circle cx=\"175\" cy=\"130\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"185\" y=\"118\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">M</text><text x=\"121\" y=\"154\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">m</text><text x=\"143\" y=\"94\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">2,5</text><text x=\"231\" y=\"155\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">2,5</text><text x=\"77\" y=\"206\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">C</text><text x=\"79\" y=\"62\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">A</text><text x=\"273\" y=\"207\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">B</text></g></svg>"
      }
    },
    {
      "id": "prev-089",
      "aliases": [
        "prev-089"
      ],
      "theme": "Окружность",
      "text": "Касательная имеет с окружностью две общие точки.",
      "truth": false,
      "explanation": "Касательная касается окружности в одной точке.",
      "hint": {
        "prompt": "Сколько общих точек у прямой и окружности? Как расположен радиус в точке касания?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Прямая касается окружности в T; проведён радиус OT\"><title>Прямая касается окружности в T; проведён радиус OT</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><circle cx=\"140\" cy=\"120\" r=\"78\" fill=\"none\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><line x1=\"140\" y1=\"120\" x2=\"218\" y2=\"120\" stroke=\"#ab6719\" stroke-width=\"3\"/><line x1=\"218\" y1=\"20\" x2=\"218\" y2=\"220\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"204\" y1=\"120\" x2=\"204\" y2=\"106\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"204\" y1=\"106\" x2=\"218\" y2=\"106\" stroke=\"#657e8c\" stroke-width=\"3\"/><circle cx=\"140\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"125\" y=\"124\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">O</text><circle cx=\"218\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"238\" y=\"125\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">T</text></g></svg>"
      }
    },
    {
      "id": "prev-090",
      "aliases": [
        "prev-090"
      ],
      "theme": "Окружность",
      "text": "Секущая имеет с окружностью две общие точки.",
      "truth": true,
      "explanation": "Секущая пересекает окружность в двух точках.",
      "hint": {
        "prompt": "Посмотри, в скольких точках прямая пересекает окружность.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Прямая проходит через окружность, отмечены две точки пересечения\"><title>Прямая проходит через окружность, отмечены две точки пересечения</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><circle cx=\"180\" cy=\"120\" r=\"78\" fill=\"none\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><line x1=\"30\" y1=\"155\" x2=\"330\" y2=\"155\" stroke=\"#246b8e\" stroke-width=\"3\"/><circle cx=\"110.28\" cy=\"155\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"110.28\" y=\"180\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">A</text><circle cx=\"249.72\" cy=\"155\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"249.72\" y=\"180\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">B</text></g></svg>"
      }
    },
    {
      "id": "prev-091",
      "aliases": [
        "prev-091"
      ],
      "theme": "Площади и подобие",
      "text": "Площадь параллелограмма равна произведению стороны на высоту, проведённую к этой стороне.",
      "truth": true,
      "explanation": "Формула площади параллелограмма: S = a · h.",
      "hint": {
        "prompt": "Меняй угол, сохраняя стороны. Следи за высотой и площадью.",
        "model": "parallelogram",
        "params": {
          "base": 6,
          "side": 4,
          "angle": 65,
          "focus": "area"
        }
      }
    },
    {
      "id": "prev-092",
      "aliases": [
        "prev-092"
      ],
      "theme": "Площади и подобие",
      "text": "Площадь треугольника равна половине произведения стороны на высоту, проведённую к этой стороне.",
      "truth": true,
      "explanation": "Площадь треугольника равна половине произведения стороны на высоту, проведённую к этой стороне.",
      "hint": {
        "prompt": "Меняй основание и высоту. Сравни их произведение с площадью треугольника.",
        "model": "areaTriangle",
        "params": {
          "base": 6,
          "height": 3,
          "x": 1
        }
      }
    },
    {
      "id": "prev-093",
      "aliases": [
        "prev-093"
      ],
      "theme": "Площади и подобие",
      "text": "Если у двух треугольников равны основания и высоты, проведённые к ним, то площади этих треугольников равны.",
      "truth": true,
      "explanation": "Площадь треугольника равна половине произведения основания на соответствующую высоту. Если основания и высоты одинаковы, площади тоже одинаковы.",
      "hint": {
        "prompt": "Передвигай вершину при неизменных основании и высоте. Что происходит с площадью?",
        "model": "areaTriangle",
        "params": {
          "base": 6,
          "height": 3,
          "x": 1,
          "locked": [
            "base",
            "height"
          ]
        }
      }
    },
    {
      "id": "prev-094",
      "aliases": [
        "prev-094"
      ],
      "theme": "Площади и подобие",
      "text": "Если площади двух треугольников равны, то треугольники обязательно равны.",
      "truth": false,
      "explanation": "Например, прямоугольные треугольники с катетами 3 и 4, а также 2 и 6 имеют одинаковую площадь 6, но не равны: соответствующие стороны у них различны.",
      "hint": {
        "prompt": "Посчитай площади по катетам. Затем сравни сами треугольники и длины их сторон.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Два прямоугольных треугольника с катетами 3 и 4, а также 2 и 6\"><title>Два прямоугольных треугольника с катетами 3 и 4, а также 2 и 6</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"35,190 35,130 115,190\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><polygon points=\"185,190 185,150 305,190\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"20\" y=\"164\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text><text x=\"78\" y=\"214\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">4</text><text x=\"170\" y=\"176\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">2</text><text x=\"246\" y=\"214\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">6</text><line x1=\"48\" y1=\"190\" x2=\"48\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"48\" y1=\"177\" x2=\"35\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"198\" y1=\"190\" x2=\"198\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"198\" y1=\"177\" x2=\"185\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/></g></svg>"
      }
    },
    {
      "id": "prev-095",
      "aliases": [
        "prev-095"
      ],
      "theme": "Площади и подобие",
      "text": "Площади подобных фигур относятся как квадраты коэффициента подобия.",
      "truth": true,
      "explanation": "Если стороны увеличились в k раз, площади увеличились в k² раз.",
      "hint": {
        "prompt": "Меняй коэффициент увеличения. Сравни, во сколько раз меняются стороны, периметр и площадь.",
        "model": "similarity",
        "params": {
          "scale": 2
        }
      }
    },
    {
      "id": "prev-096",
      "aliases": [
        "prev-096"
      ],
      "theme": "Площади и подобие",
      "text": "Периметры подобных треугольников относятся как коэффициент подобия.",
      "truth": true,
      "explanation": "Все линейные элементы подобных фигур меняются в k раз.",
      "hint": {
        "prompt": "Меняй коэффициент увеличения. Сравни, во сколько раз меняются стороны, периметр и площадь.",
        "model": "similarity",
        "params": {
          "scale": 2
        }
      }
    },
    {
      "id": "prev-097",
      "aliases": [
        "prev-097"
      ],
      "theme": "Площади и подобие",
      "text": "Если коэффициент подобия равен 2, то площадь подобной фигуры увеличивается в 2 раза.",
      "truth": false,
      "explanation": "Площадь увеличивается в квадрат коэффициента: 2² = 4 раза.",
      "hint": {
        "prompt": "Стороны увеличены в 2 раза. Сравни, во сколько раз изменились периметр и площадь.",
        "model": "similarity",
        "params": {
          "scale": 2,
          "locked": [
            "scale"
          ]
        }
      }
    },
    {
      "id": "prev-098",
      "aliases": [
        "prev-098"
      ],
      "theme": "Площади и подобие",
      "text": "Площадь квадрата со стороной a равна 4a.",
      "truth": false,
      "explanation": "4a — это периметр квадрата. Площадь равна a².",
      "hint": {
        "prompt": "Посчитай единичные клетки. Отдельно посчитай длину границы квадрата.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Квадрат со стороной 3 разбит на единичные клетки\"><title>Квадрат со стороной 3 разбит на единичные клетки</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><rect x=\"90\" y=\"35\" width=\"180\" height=\"180\" fill=\"#edf4f7\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><line x1=\"150\" y1=\"35\" x2=\"150\" y2=\"215\" stroke=\"#b4c7ce\" stroke-width=\"3\"/><line x1=\"90\" y1=\"95\" x2=\"270\" y2=\"95\" stroke=\"#b4c7ce\" stroke-width=\"3\"/><line x1=\"210\" y1=\"35\" x2=\"210\" y2=\"215\" stroke=\"#b4c7ce\" stroke-width=\"3\"/><line x1=\"90\" y1=\"155\" x2=\"270\" y2=\"155\" stroke=\"#b4c7ce\" stroke-width=\"3\"/><text x=\"180\" y=\"232\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text><text x=\"74\" y=\"128\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text></g></svg>"
      }
    },
    {
      "id": "prev-099",
      "aliases": [
        "prev-099"
      ],
      "theme": "Площади и подобие",
      "text": "Диагональ квадрата со стороной a равна a√2.",
      "truth": true,
      "explanation": "По теореме Пифагора d² = a² + a² = 2a², значит d = a√2.",
      "hint": {
        "prompt": "Диагональ делит квадрат на два прямоугольных треугольника. Какие стороны известны?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Квадрат со стороной a и диагональю d\"><title>Квадрат со стороной a и диагональю d</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><rect x=\"90\" y=\"35\" width=\"180\" height=\"180\" fill=\"#edf4f7\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><line x1=\"90\" y1=\"215\" x2=\"270\" y2=\"35\" stroke=\"#ab6719\" stroke-width=\"3\"/><text x=\"180\" y=\"235\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">a</text><text x=\"73\" y=\"128\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">a</text><text x=\"166\" y=\"118\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">d</text></g></svg>"
      }
    },
    {
      "id": "prev-100",
      "aliases": [
        "prev-100"
      ],
      "theme": "Площади и подобие",
      "text": "Площадь ромба равна половине произведения его диагоналей.",
      "truth": true,
      "explanation": "Площадь ромба равна половине произведения его диагоналей. Диагонали делят ромб на четыре прямоугольных треугольника.",
      "hint": {
        "prompt": "Рассмотри четыре треугольника. Найди площадь одного из них через половины диагоналей.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Ромб разделён диагоналями на четыре прямоугольных треугольника; подписаны половины диагоналей\"><title>Ромб разделён диагоналями на четыре прямоугольных треугольника; подписаны половины диагоналей</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"180,35 315,125 180,215 45,125\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"180\" y1=\"35\" x2=\"180\" y2=\"215\" stroke=\"#ab6719\" stroke-width=\"3\"/><line x1=\"45\" y1=\"125\" x2=\"315\" y2=\"125\" stroke=\"#ab6719\" stroke-width=\"3\"/><line x1=\"193\" y1=\"125\" x2=\"193\" y2=\"112\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"193\" y1=\"112\" x2=\"180\" y2=\"112\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"205\" y=\"68\" text-anchor=\"middle\" font-size=\"15\" fill=\"#243b53\">d₁</text><line x1=\"191\" y1=\"76\" x2=\"219\" y2=\"76\" stroke=\"#243b53\" stroke-width=\"3\"/><text x=\"205\" y=\"95\" text-anchor=\"middle\" font-size=\"15\" fill=\"#243b53\">2</text><text x=\"245\" y=\"93\" text-anchor=\"middle\" font-size=\"15\" fill=\"#243b53\">d₂</text><line x1=\"231\" y1=\"101\" x2=\"259\" y2=\"101\" stroke=\"#243b53\" stroke-width=\"3\"/><text x=\"245\" y=\"120\" text-anchor=\"middle\" font-size=\"15\" fill=\"#243b53\">2</text></g></svg>"
      }
    },
    {
      "id": "prev-101",
      "aliases": [
        "prev-101"
      ],
      "theme": "Площади и подобие",
      "text": "Площадь трапеции равна произведению полусуммы оснований на высоту.",
      "truth": true,
      "explanation": "Площадь трапеции равна произведению полусуммы оснований на высоту. Полусумма оснований — это длина средней линии.",
      "hint": {
        "prompt": "Найди полусумму оснований. Сравни её произведение на высоту с площадью.",
        "model": "trapezoid",
        "params": {
          "bottom": 7,
          "top": 3,
          "height": 3,
          "offset": 0,
          "focus": "area"
        }
      }
    },
    {
      "id": "prev-102",
      "aliases": [
        "prev-102"
      ],
      "theme": "Площади и подобие",
      "text": "Расстояние между точками на координатной прямой равно модулю разности их координат.",
      "truth": true,
      "explanation": "На прямой расстояние между x₁ и x₂ равно |x₁ − x₂|.",
      "hint": {
        "prompt": "Посчитай единичные промежутки от A до B. Сравни с разностью координат в обоих порядках.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Координатная прямая; A имеет координату−3, B имеет координату 4\"><title>Координатная прямая; A имеет координату−3, B имеет координату 4</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><line x1=\"25\" y1=\"125\" x2=\"335\" y2=\"125\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"45\" y1=\"119\" x2=\"45\" y2=\"131\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"45\" y=\"156\" text-anchor=\"middle\" font-size=\"15\" fill=\"#243b53\">-4</text><line x1=\"75\" y1=\"119\" x2=\"75\" y2=\"131\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"75\" y=\"156\" text-anchor=\"middle\" font-size=\"15\" fill=\"#243b53\">-3</text><line x1=\"105\" y1=\"119\" x2=\"105\" y2=\"131\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"105\" y=\"156\" text-anchor=\"middle\" font-size=\"15\" fill=\"#243b53\">-2</text><line x1=\"135\" y1=\"119\" x2=\"135\" y2=\"131\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"135\" y=\"156\" text-anchor=\"middle\" font-size=\"15\" fill=\"#243b53\">-1</text><line x1=\"165\" y1=\"119\" x2=\"165\" y2=\"131\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"165\" y=\"156\" text-anchor=\"middle\" font-size=\"15\" fill=\"#243b53\">0</text><line x1=\"195\" y1=\"119\" x2=\"195\" y2=\"131\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"195\" y=\"156\" text-anchor=\"middle\" font-size=\"15\" fill=\"#243b53\">1</text><line x1=\"225\" y1=\"119\" x2=\"225\" y2=\"131\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"225\" y=\"156\" text-anchor=\"middle\" font-size=\"15\" fill=\"#243b53\">2</text><line x1=\"255\" y1=\"119\" x2=\"255\" y2=\"131\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"255\" y=\"156\" text-anchor=\"middle\" font-size=\"15\" fill=\"#243b53\">3</text><line x1=\"285\" y1=\"119\" x2=\"285\" y2=\"131\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"285\" y=\"156\" text-anchor=\"middle\" font-size=\"15\" fill=\"#243b53\">4</text><line x1=\"315\" y1=\"119\" x2=\"315\" y2=\"131\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"315\" y=\"156\" text-anchor=\"middle\" font-size=\"15\" fill=\"#243b53\">5</text><circle cx=\"75\" cy=\"125\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"75\" y=\"107\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">A</text><circle cx=\"285\" cy=\"125\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"285\" y=\"107\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">B</text></g></svg>"
      }
    },
    {
      "id": "prev-103",
      "aliases": [
        "prev-103"
      ],
      "theme": "Площади и подобие",
      "text": "Координаты середины отрезка равны средним арифметическим соответствующих координат его концов.",
      "truth": true,
      "explanation": "Первая координата середины — половина суммы первых координат концов, вторая — половина суммы вторых координат.",
      "hint": {
        "prompt": "Точка M делит отрезок пополам. Найди числа посередине между координатами его концов.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Отрезок с концами A(1;1), B(5;4), отмечена его середина M\"><title>Отрезок с концами A(1;1), B(5;4), отмечена его середина M</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><line x1=\"35\" y1=\"205\" x2=\"335\" y2=\"205\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"70\" y1=\"225\" x2=\"70\" y2=\"20\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"110\" y1=\"165\" x2=\"270\" y2=\"45\" stroke=\"#ab6719\" stroke-width=\"3\"/><circle cx=\"110\" cy=\"165\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"98\" y=\"151\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">A(1;1)</text><circle cx=\"270\" cy=\"45\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"270\" y=\"30\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">B(5;4)</text><circle cx=\"190\" cy=\"105\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"205\" y=\"108\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">M</text><line x1=\"110\" y1=\"165\" x2=\"110\" y2=\"205\" stroke=\"#b4c7ce\" stroke-width=\"3\" stroke-dasharray=\"6 5\"/><line x1=\"270\" y1=\"45\" x2=\"270\" y2=\"205\" stroke=\"#b4c7ce\" stroke-width=\"3\" stroke-dasharray=\"6 5\"/><text x=\"70\" y=\"230\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">0</text></g></svg>"
      }
    },
    {
      "id": "prev-104",
      "aliases": [
        "prev-104"
      ],
      "theme": "Площади и подобие",
      "text": "Если периметры двух фигур равны, то их площади тоже равны.",
      "truth": false,
      "explanation": "Фигуры с одним и тем же периметром могут иметь разные площади.",
      "hint": {
        "prompt": "Посчитай периметр и площадь каждой фигуры. Сравни результаты.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Квадрат 4 на 4 и прямоугольник 6 на 2 изображены в одинаковом масштабе\"><title>Квадрат 4 на 4 и прямоугольник 6 на 2 изображены в одинаковом масштабе</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><rect x=\"30\" y=\"70\" width=\"100\" height=\"100\" fill=\"#edf4f7\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><rect x=\"180\" y=\"95\" width=\"150\" height=\"50\" fill=\"#edf4f7\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><text x=\"80\" y=\"200\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">4 × 4</text><text x=\"255\" y=\"176\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">6 × 2</text></g></svg>"
      }
    },
    {
      "id": "perpendicular_bisector_point_equidistant_endpoints",
      "aliases": [
        "perpendicular_bisector_point_equidistant_endpoints"
      ],
      "theme": "Прямые и углы",
      "text": "Точка на серединном перпендикуляре к отрезку равноудалена от его концов.",
      "truth": true,
      "explanation": "Серединный перпендикуляр — множество точек, равноудалённых от концов отрезка.",
      "hint": {
        "prompt": "P лежит на перпендикуляре через середину AB. Сравни треугольники по обе стороны этой линии.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"P лежит на серединном перпендикуляре к AB; проведены PA и PB\"><title>P лежит на серединном перпендикуляре к AB; проведены PA и PB</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><line x1=\"65\" y1=\"185\" x2=\"295\" y2=\"185\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"180\" y1=\"35\" x2=\"180\" y2=\"220\" stroke=\"#ab6719\" stroke-width=\"3\"/><circle cx=\"65\" cy=\"185\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"65\" y=\"210\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">A</text><circle cx=\"295\" cy=\"185\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"295\" y=\"210\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">B</text><circle cx=\"180\" cy=\"65\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"198\" y=\"60\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">P</text><line x1=\"180\" y1=\"65\" x2=\"65\" y2=\"185\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"180\" y1=\"65\" x2=\"295\" y2=\"185\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"193\" y1=\"185\" x2=\"193\" y2=\"172\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"193\" y1=\"172\" x2=\"180\" y2=\"172\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"122\" y=\"204\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">a</text><text x=\"238\" y=\"204\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">a</text></g></svg>"
      }
    },
    {
      "id": "point_on_angle_bisector_equidistant_sides",
      "aliases": [
        "point_on_angle_bisector_equidistant_sides"
      ],
      "theme": "Прямые и углы",
      "text": "Если точка лежит на биссектрисе угла, то она равноудалена от сторон угла.",
      "truth": true,
      "explanation": "Любая точка на биссектрисе угла равноудалена от его сторон.",
      "hint": {
        "prompt": "Расстояния до сторон измеряются по перпендикулярам. Сравни d₁ и d₂.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"P лежит на биссектрисе угла; к обеим сторонам проведены перпендикуляры d₁,d₂\"><title>P лежит на биссектрисе угла; к обеим сторонам проведены перпендикуляры d₁,d₂</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><line x1=\"40\" y1=\"200\" x2=\"330\" y2=\"200\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"40\" y1=\"200\" x2=\"155\" y2=\"0\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"40\" y1=\"200\" x2=\"265\" y2=\"70\" stroke=\"#ab6719\" stroke-width=\"3\" stroke-dasharray=\"6 5\"/><circle cx=\"195.88\" cy=\"110\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"211.88\" y=\"104\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">P</text><line x1=\"195.88\" y1=\"110\" x2=\"195.88\" y2=\"200\" stroke=\"#ab6719\" stroke-width=\"3\"/><line x1=\"195.88\" y1=\"110\" x2=\"117.94\" y2=\"65\" stroke=\"#ab6719\" stroke-width=\"3\"/><line x1=\"208.88\" y1=\"200\" x2=\"208.88\" y2=\"187\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"208.88\" y1=\"187\" x2=\"195.88\" y2=\"187\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"212\" y=\"163\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">d₁</text><text x=\"151\" y=\"75\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">d₂</text></g></svg>"
      }
    },
    {
      "id": "circle_intersection_point_equidistant_centers",
      "aliases": [
        "circle_intersection_point_equidistant_centers"
      ],
      "theme": "Окружность",
      "text": "Точка пересечения двух окружностей всегда равноудалена от их центров.",
      "truth": false,
      "explanation": "Точка пересечения окружностей равноудалена от центров только при равных радиусах.",
      "hint": {
        "prompt": "P принадлежит обеим окружностям. Какие длины имеют отрезки PO₁ и PO₂?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Две окружности разных радиусов 9 и 6,5 пересекаются в P; проведены радиусы к P\"><title>Две окружности разных радиусов 9 и 6,5 пересекаются в P; проведены радиусы к P</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><circle cx=\"110\" cy=\"130\" r=\"90\" fill=\"none\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><circle cx=\"215\" cy=\"130\" r=\"65\" fill=\"none\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><line x1=\"110\" y1=\"130\" x2=\"180.95238095238096\" y2=\"74.6306977000052\" stroke=\"#ab6719\" stroke-width=\"3\"/><line x1=\"215\" y1=\"130\" x2=\"180.95238095238096\" y2=\"74.6306977000052\" stroke=\"#ab6719\" stroke-width=\"3\"/><circle cx=\"110\" cy=\"130\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"110\" y=\"153\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">O₁</text><circle cx=\"215\" cy=\"130\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"215\" y=\"153\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">O₂</text><circle cx=\"180.95238095238096\" cy=\"74.6306977000052\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"180.95238095238096\" y=\"62.6306977000052\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">P</text><text x=\"135\" y=\"85\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">9</text><text x=\"202\" y=\"82\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">6,5</text></g></svg>"
      }
    },
    {
      "id": "circles_intersect_if_radius_bigger",
      "aliases": [
        "circles_intersect_if_radius_bigger"
      ],
      "theme": "Окружность",
      "text": "Если радиус одной окружности больше радиуса другой, то окружности обязательно пересекаются.",
      "truth": false,
      "explanation": "Пересечение зависит от расстояния между центрами, а не только от радиусов.",
      "hint": {
        "prompt": "Сравни радиусы. Достаточно ли знать только их, чтобы определить пересечение окружностей?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Две непересекающиеся окружности разных радиусов\"><title>Две непересекающиеся окружности разных радиусов</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><circle cx=\"100\" cy=\"120\" r=\"65\" fill=\"none\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><circle cx=\"270\" cy=\"120\" r=\"35\" fill=\"none\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><circle cx=\"100\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"100\" y=\"142\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">O₁</text><circle cx=\"270\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"270\" y=\"142\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">O₂</text><line x1=\"100\" y1=\"120\" x2=\"165\" y2=\"120\" stroke=\"#ab6719\" stroke-width=\"3\"/><line x1=\"270\" y1=\"120\" x2=\"305\" y2=\"120\" stroke=\"#ab6719\" stroke-width=\"3\"/><text x=\"133\" y=\"109\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">R</text><text x=\"287\" y=\"108\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">r</text></g></svg>"
      }
    },
    {
      "id": "all_diameters_equal",
      "aliases": [
        "all_diameters_equal"
      ],
      "theme": "Окружность",
      "text": "Все диаметры одной и той же окружности равны.",
      "truth": true,
      "explanation": "Диаметр каждой окружности равен 2R, поэтому все диаметры равны.",
      "hint": {
        "prompt": "Каждый отрезок проходит через O. Сравни, из каких частей состоят оба диаметра.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Два диаметра одной окружности\"><title>Два диаметра одной окружности</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><circle cx=\"180\" cy=\"120\" r=\"82\" fill=\"none\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><circle cx=\"180\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"168\" y=\"141\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">O</text><line x1=\"98\" y1=\"120\" x2=\"262\" y2=\"120\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"139\" y1=\"48.99\" x2=\"221\" y2=\"191.01\" stroke=\"#ab6719\" stroke-width=\"3\"/><text x=\"278\" y=\"124\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">d₁</text><text x=\"233\" y=\"210\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">d₂</text></g></svg>"
      }
    },
    {
      "id": "tangent_parallel_radius",
      "aliases": [
        "tangent_parallel_radius"
      ],
      "theme": "Окружность",
      "text": "Касательная к окружности параллельна радиусу, проведённому в точку касания.",
      "truth": false,
      "explanation": "Касательная перпендикулярна радиусу в точке касания, а не параллельна.",
      "hint": {
        "prompt": "Найди точку касания. Сравни направление касательной с направлением радиуса.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Прямая касается окружности в T; проведён радиус OT\"><title>Прямая касается окружности в T; проведён радиус OT</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><circle cx=\"140\" cy=\"120\" r=\"78\" fill=\"none\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><line x1=\"140\" y1=\"120\" x2=\"218\" y2=\"120\" stroke=\"#ab6719\" stroke-width=\"3\"/><line x1=\"218\" y1=\"20\" x2=\"218\" y2=\"220\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"204\" y1=\"120\" x2=\"204\" y2=\"106\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"204\" y1=\"106\" x2=\"218\" y2=\"106\" stroke=\"#657e8c\" stroke-width=\"3\"/><circle cx=\"140\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"125\" y=\"124\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">O</text><circle cx=\"218\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"238\" y=\"125\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">T</text></g></svg>"
      }
    },
    {
      "id": "point_on_circle_distance_radius",
      "aliases": [
        "point_on_circle_distance_radius"
      ],
      "theme": "Окружность",
      "text": "Расстояние от точки на окружности до её центра равно радиусу.",
      "truth": true,
      "explanation": "По определению окружности расстояние до центра равно радиусу.",
      "hint": {
        "prompt": "Найди отрезок от центра до точки окружности. Как называется этот отрезок?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Из центра O проведены радиусы к трём точкам окружности\"><title>Из центра O проведены радиусы к трём точкам окружности</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><circle cx=\"180\" cy=\"120\" r=\"82\" fill=\"none\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><circle cx=\"180\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"168\" y=\"141\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">O</text><line x1=\"180\" y1=\"120\" x2=\"262\" y2=\"120\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"180\" y1=\"120\" x2=\"139\" y2=\"48.99\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"180\" y1=\"120\" x2=\"122.02\" y2=\"177.98\" stroke=\"#246b8e\" stroke-width=\"3\"/><circle cx=\"262\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"277\" y=\"120\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">A</text><circle cx=\"139\" cy=\"48.99\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"139\" y=\"36.99\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">B</text><circle cx=\"122.02\" cy=\"177.98\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"110.02\" y=\"195.98\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">C</text></g></svg>"
      }
    },
    {
      "id": "inscribed_angle_over_diameter_right",
      "aliases": [
        "inscribed_angle_over_diameter_right"
      ],
      "theme": "Окружность",
      "text": "Вписанный угол, опирающийся на диаметр, равен 90°.",
      "truth": true,
      "explanation": "Вписанный угол, опирающийся на диаметр, является прямым.",
      "hint": {
        "prompt": "Передвигай вершину угла. Его стороны проходят через концы диаметра.",
        "model": "circleAngle",
        "params": {
          "diameter": true,
          "point": 230
        }
      }
    },
    {
      "id": "inscribed_equals_central",
      "aliases": [
        "inscribed_equals_central"
      ],
      "theme": "Окружность",
      "text": "Вписанный угол, опирающийся на дугу, равен соответствующему центральному углу (на ту же дугу).",
      "truth": false,
      "explanation": "Вписанный угол равен половине соответствующего центрального угла.",
      "hint": {
        "prompt": "Сравни угол с вершиной в центре и угол с вершиной на окружности, опирающиеся на одну дугу.",
        "model": "circleAngle",
        "params": {
          "central": 120,
          "point": 230
        }
      }
    },
    {
      "id": "all_chords_equal",
      "aliases": [
        "all_chords_equal"
      ],
      "theme": "Окружность",
      "text": "Все хорды одной окружности равны между собой.",
      "truth": false,
      "explanation": "Хорды равны лишь при равных дугах или одинаковом расстоянии от центра.",
      "hint": {
        "prompt": "Передвигай хорду по окружности. Как меняется её длина?",
        "model": "circleChord",
        "params": {
          "radius": 5,
          "offset": 2
        }
      }
    },
    {
      "id": "triangle_area_less_than_product_two_sides",
      "aliases": [
        "triangle_area_less_than_product_two_sides"
      ],
      "theme": "Площади и подобие",
      "text": "Площадь треугольника меньше произведения двух его сторон.",
      "truth": true,
      "explanation": "Площадь равна половине произведения двух сторон и синуса угла между ними. Синус этого угла не больше единицы, поэтому площадь не больше половины произведения сторон и строго меньше самого произведения.",
      "hint": {
        "prompt": "Сравни высоту h со стороной b. Как выразить площадь через a и h?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Треугольник с основанием a, боковой стороной b и высотой h к основанию a\"><title>Треугольник с основанием a, боковой стороной b и высотой h к основанию a</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"50,200 310,200 180,50\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"180\" y1=\"50\" x2=\"180\" y2=\"200\" stroke=\"#ab6719\" stroke-width=\"3\" stroke-dasharray=\"6 5\"/><line x1=\"193\" y1=\"200\" x2=\"193\" y2=\"187\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"193\" y1=\"187\" x2=\"180\" y2=\"187\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"180\" y=\"226\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">a</text><text x=\"95\" y=\"118\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">b</text><text x=\"199\" y=\"137\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">h</text></g></svg>"
      }
    },
    {
      "id": "similar_triangles_area_ratio_equals_k",
      "aliases": [
        "similar_triangles_area_ratio_equals_k"
      ],
      "theme": "Площади и подобие",
      "text": "Отношение площадей подобных треугольников равно коэффициенту подобия.",
      "truth": false,
      "explanation": "Площади подобных треугольников относятся как k^2, а не как k.",
      "hint": {
        "prompt": "Увеличь стороны в 2 раза. Сравни отношение площадей с отношением сторон.",
        "model": "similarity",
        "params": {
          "scale": 2
        }
      }
    },
    {
      "id": "adjacent_angles_one_acute_one_obtuse_always",
      "aliases": [
        "adjacent_angles_one_acute_one_obtuse_always"
      ],
      "theme": "Прямые и углы",
      "text": "У любых двух смежных углов один острый, а другой тупой.",
      "truth": false,
      "explanation": "Если один смежный угол 90°, то второй тоже 90°, не острый и не тупой.",
      "hint": {
        "prompt": "Поставь первый угол 90°. Посмотри на второй угол. Затем попробуй другие значения.",
        "model": "adjacentAngles",
        "params": {
          "angle": 90
        }
      }
    },
    {
      "id": "angle_acute_adjacent_acute",
      "aliases": [
        "angle_acute_adjacent_acute"
      ],
      "theme": "Прямые и углы",
      "text": "Если угол острый, то смежный с ним угол тоже острый.",
      "truth": false,
      "explanation": "Смежный к острому углу обязательно тупой (180° − α).",
      "hint": {
        "prompt": "Первый угол острый. Сравни второй угол с 90°.",
        "model": "adjacentAngles",
        "params": {
          "angle": 55,
          "locked": [
            "angle"
          ]
        }
      }
    },
    {
      "id": "parallel_through_point_exists",
      "aliases": [
        "parallel_through_point_exists"
      ],
      "theme": "Прямые и углы",
      "text": "Через точку вне прямой можно провести прямую, параллельную данной прямой.",
      "truth": true,
      "explanation": "Через точку вне прямой можно провести единственную параллельную прямую.",
      "hint": {
        "prompt": "Через P показана прямая. Сравни её направление с направлением a.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Прямая a и точка P вне неё; линия через P\"><title>Прямая a и точка P вне неё; линия через P</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><line x1=\"35\" y1=\"180\" x2=\"325\" y2=\"180\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"35\" y1=\"75\" x2=\"325\" y2=\"75\" stroke=\"#ab6719\" stroke-width=\"3\"/><circle cx=\"185\" cy=\"75\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"185\" y=\"63\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">P</text><text x=\"325\" y=\"165\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">a</text></g></svg>"
      }
    },
    {
      "id": "perp_through_point_exists",
      "aliases": [
        "perp_through_point_exists"
      ],
      "theme": "Прямые и углы",
      "text": "Через точку вне прямой можно провести прямую, перпендикулярную данной прямой.",
      "truth": true,
      "explanation": "Через точку вне прямой можно провести перпендикуляр к этой прямой.",
      "hint": {
        "prompt": "Найди точку P и прямой угол с a. Как проходит показанная прямая?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Прямая a и перпендикуляр через точку P вне неё\"><title>Прямая a и перпендикуляр через точку P вне неё</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><line x1=\"35\" y1=\"180\" x2=\"325\" y2=\"180\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"185\" y1=\"35\" x2=\"185\" y2=\"205\" stroke=\"#ab6719\" stroke-width=\"3\"/><circle cx=\"185\" cy=\"75\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"205\" y=\"75\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">P</text><line x1=\"198\" y1=\"180\" x2=\"198\" y2=\"167\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"198\" y1=\"167\" x2=\"185\" y2=\"167\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"325\" y=\"165\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">a</text></g></svg>"
      }
    },
    {
      "id": "three_lines_through_one_point_exist",
      "aliases": [
        "three_lines_through_one_point_exist"
      ],
      "theme": "Прямые и углы",
      "text": "Существуют три разные прямые, проходящие через одну точку.",
      "truth": true,
      "explanation": "Через одну точку можно провести бесконечно много различных прямых.",
      "hint": {
        "prompt": "Посчитай разные прямые, проходящие через точку P.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Три разные прямые проходят через отмеченную точку P\"><title>Три разные прямые проходят через отмеченную точку P</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><line x1=\"30\" y1=\"120\" x2=\"330\" y2=\"120\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"50\" y1=\"35\" x2=\"310\" y2=\"205\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"75\" y1=\"220\" x2=\"285\" y2=\"20\" stroke=\"#246b8e\" stroke-width=\"3\"/><circle cx=\"180\" cy=\"120\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"180\" y=\"105\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">P</text></g></svg>"
      }
    },
    {
      "id": "two_parallel_to_third_parallel",
      "aliases": [
        "two_parallel_to_third_parallel"
      ],
      "theme": "Прямые и углы",
      "text": "Если две прямые параллельны третьей, то они параллельны друг другу.",
      "truth": true,
      "explanation": "Две прямые, параллельные третьей, параллельны друг другу.",
      "hint": {
        "prompt": "a и b имеют то же направление, что c. Как расположены a и b между собой?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Три горизонтальные прямые a, b, c\"><title>Три горизонтальные прямые a, b, c</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><line x1=\"30\" y1=\"60\" x2=\"330\" y2=\"60\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"30\" y1=\"120\" x2=\"330\" y2=\"120\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"30\" y1=\"180\" x2=\"330\" y2=\"180\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"325\" y=\"46\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">a</text><text x=\"325\" y=\"106\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">b</text><text x=\"325\" y=\"166\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">c</text></g></svg>"
      }
    },
    {
      "id": "two_parallel_to_third_perpendicular",
      "aliases": [
        "two_parallel_to_third_perpendicular"
      ],
      "theme": "Прямые и углы",
      "text": "Если две прямые параллельны третьей, то они перпендикулярны.",
      "truth": false,
      "explanation": "Параллельные одной прямой прямые не обязаны быть перпендикулярны.",
      "hint": {
        "prompt": "a и b имеют то же направление, что c. Как расположены a и b между собой?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Три горизонтальные прямые a, b, c\"><title>Три горизонтальные прямые a, b, c</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><line x1=\"30\" y1=\"60\" x2=\"330\" y2=\"60\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"30\" y1=\"120\" x2=\"330\" y2=\"120\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"30\" y1=\"180\" x2=\"330\" y2=\"180\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"325\" y=\"46\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">a</text><text x=\"325\" y=\"106\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">b</text><text x=\"325\" y=\"166\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">c</text></g></svg>"
      }
    },
    {
      "id": "two_perp_to_third_perp",
      "aliases": [
        "two_perp_to_third_perp"
      ],
      "theme": "Прямые и углы",
      "text": "Две прямые, перпендикулярные одной и той же прямой, всегда перпендикулярны между собой.",
      "truth": false,
      "explanation": "Две прямые, перпендикулярные одной и той же, параллельны между собой.",
      "hint": {
        "prompt": "a и b образуют прямой угол с c. Сравни направления a и b.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Две прямые образуют прямые углы с одной третьей прямой\"><title>Две прямые образуют прямые углы с одной третьей прямой</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><line x1=\"45\" y1=\"70\" x2=\"320\" y2=\"70\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"45\" y1=\"165\" x2=\"320\" y2=\"165\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"100\" y1=\"25\" x2=\"100\" y2=\"215\" stroke=\"#ab6719\" stroke-width=\"3\"/><line x1=\"114\" y1=\"70\" x2=\"114\" y2=\"84\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"114\" y1=\"84\" x2=\"100\" y2=\"84\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"114\" y1=\"165\" x2=\"114\" y2=\"179\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"114\" y1=\"179\" x2=\"100\" y2=\"179\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"320\" y=\"55\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">a</text><text x=\"320\" y=\"150\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">b</text><text x=\"82\" y=\"30\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">c</text></g></svg>"
      }
    },
    {
      "id": "isosceles_trapezoid_bases_equal",
      "aliases": [
        "isosceles_trapezoid_bases_equal"
      ],
      "theme": "Четырёхугольники",
      "text": "У равнобедренной трапеции основания равны.",
      "truth": false,
      "explanation": "В равнобедренной трапеции равны боковые стороны, а основания могут быть разными.",
      "hint": {
        "prompt": "Боковые стороны одинаковы. Сравни длины двух оснований.",
        "model": "trapezoid",
        "params": {
          "bottom": 7,
          "top": 3,
          "height": 3,
          "offset": 0,
          "locked": [
            "offset"
          ],
          "focus": "sides"
        }
      }
    },
    {
      "id": "trap_bases_trapezoid_parallel",
      "aliases": [
        "trap_bases_trapezoid_parallel"
      ],
      "theme": "Четырёхугольники",
      "text": "У любой трапеции два основания параллельны.",
      "truth": true,
      "explanation": "Определение трапеции: у неё есть пара параллельных сторон.",
      "hint": {
        "prompt": "Найди два основания. Сравни их направления, изменяя длины.",
        "model": "trapezoid",
        "params": {
          "bottom": 7,
          "top": 3,
          "height": 3,
          "offset": 0,
          "focus": "midline"
        }
      }
    },
    {
      "id": "trapezoid_area_base_times_height",
      "aliases": [
        "trapezoid_area_base_times_height"
      ],
      "theme": "Четырёхугольники",
      "text": "Площадь трапеции равна произведению одного её основания на высоту.",
      "truth": false,
      "explanation": "Для площади трапеции нужно умножить высоту на полусумму двух оснований. Произведение только одного основания на высоту даёт другой результат.",
      "hint": {
        "prompt": "Найди произведение каждого основания на высоту. Сравни результаты с площадью.",
        "model": "trapezoid",
        "params": {
          "bottom": 7,
          "top": 3,
          "height": 3,
          "offset": 0,
          "focus": "area"
        }
      }
    },
    {
      "id": "trapezoid_diagonal_makes_equal_triangles",
      "aliases": [
        "trapezoid_diagonal_makes_equal_triangles"
      ],
      "theme": "Четырёхугольники",
      "text": "Диагональ трапеции всегда делит её на два равных треугольника.",
      "truth": false,
      "explanation": "Диагональ трапеции не обязательно делит её на равные треугольники.",
      "hint": {
        "prompt": "Диагональ соединяет противоположные вершины. Сравни стороны двух полученных треугольников.",
        "model": "trapezoid",
        "params": {
          "bottom": 7,
          "top": 3,
          "height": 3,
          "offset": 1,
          "focus": "diagonals"
        }
      }
    },
    {
      "id": "trapezoid_diagonals_bisect",
      "aliases": [
        "trapezoid_diagonals_bisect"
      ],
      "theme": "Четырёхугольники",
      "text": "В трапеции диагонали пересекаются и делятся точкой пересечения пополам.",
      "truth": false,
      "explanation": "Диагонали трапеции не делятся пополам; это свойство параллелограмма.",
      "hint": {
        "prompt": "Сравни четыре части диагоналей, полученные при пересечении.",
        "model": "trapezoid",
        "params": {
          "bottom": 7,
          "top": 3,
          "height": 3,
          "offset": 0,
          "focus": "diagonals"
        }
      }
    },
    {
      "id": "trapezoid_midline_equals_sum_bases",
      "aliases": [
        "trapezoid_midline_equals_sum_bases"
      ],
      "theme": "Четырёхугольники",
      "text": "Средняя линия трапеции равна сумме её оснований.",
      "truth": false,
      "explanation": "Средняя линия равна полусумме оснований, а не их сумме.",
      "hint": {
        "prompt": "Сложи длины оснований. Сравни результат с длиной средней линии.",
        "model": "trapezoid",
        "params": {
          "bottom": 7,
          "top": 3,
          "height": 3,
          "offset": 0,
          "focus": "midline"
        }
      }
    },
    {
      "id": "obtuse_triangle_all_obtuse",
      "aliases": [
        "obtuse_triangle_all_obtuse"
      ],
      "theme": "Треугольники",
      "text": "В тупоугольном треугольнике все углы тупые.",
      "truth": false,
      "explanation": "В треугольнике может быть только один тупой угол.",
      "hint": {
        "prompt": "Один угол больше 90°. Сравни два остальных угла с 90°.",
        "model": "triangleAngles",
        "params": {
          "a": 110,
          "b": 40,
          "locked": [
            "a",
            "b"
          ]
        }
      }
    },
    {
      "id": "right_triangle_angles_sum_90",
      "aliases": [
        "right_triangle_angles_sum_90"
      ],
      "theme": "Треугольники",
      "text": "Сумма углов прямоугольного треугольника равна 90°.",
      "truth": false,
      "explanation": "Сумма углов любого треугольника равна 180°, не 90°.",
      "hint": {
        "prompt": "Найди прямой угол. Сравни стороны и вспомни сумму трёх углов треугольника.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Прямоугольный треугольник с катетами 3 и 4 и гипотенузой 5\"><title>Прямоугольный треугольник с катетами 3 и 4 и гипотенузой 5</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"95,190 95,70 255,190\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"108\" y1=\"190\" x2=\"108\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"108\" y1=\"177\" x2=\"95\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"79\" y=\"133\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text><text x=\"180\" y=\"215\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">4</text><text x=\"186\" y=\"120\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text></g></svg>"
      }
    },
    {
      "id": "triangle_angles_sum_180",
      "aliases": [
        "triangle_angles_sum_180"
      ],
      "theme": "Треугольники",
      "text": "Сумма углов любого треугольника равна 180°.",
      "truth": true,
      "explanation": "Сумма углов треугольника всегда равна 180°.",
      "hint": {
        "prompt": "Меняй форму треугольника. Наблюдай за тремя углами и их суммой.",
        "model": "triangleAngles",
        "params": {
          "a": 100,
          "b": 40
        }
      }
    },
    {
      "id": "triangle_angles_sum_360",
      "aliases": [
        "triangle_angles_sum_360"
      ],
      "theme": "Треугольники",
      "text": "Сумма углов любого треугольника равна 360°.",
      "truth": false,
      "explanation": "Сумма углов треугольника равна 180°, а не 360°.",
      "hint": {
        "prompt": "Меняй форму треугольника. Наблюдай за тремя углами и их суммой.",
        "model": "triangleAngles",
        "params": {
          "a": 100,
          "b": 40
        }
      }
    },
    {
      "id": "triangle_has_angle_le_60",
      "aliases": [
        "triangle_has_angle_le_60"
      ],
      "theme": "Треугольники",
      "text": "В любом треугольнике найдётся угол, который не больше 60°.",
      "truth": true,
      "explanation": "Если бы все углы были больше 60°, сумма превысила бы 180°.",
      "hint": {
        "prompt": "Меняй форму треугольника. Наблюдай за тремя углами и их суммой.",
        "model": "triangleAngles",
        "params": {
          "a": 100,
          "b": 40
        }
      }
    },
    {
      "id": "bisector_bisects_opposite_side",
      "aliases": [
        "bisector_bisects_opposite_side"
      ],
      "theme": "Треугольники",
      "text": "Биссектриса треугольника всегда делит противоположную сторону пополам.",
      "truth": false,
      "explanation": "Биссектриса делит сторону пропорционально прилежащим сторонам, не пополам.",
      "hint": {
        "prompt": "CD делит угол C пополам. Сравни стороны CA, CB и соответствующие части AD, DB.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Разносторонний треугольник; CD — биссектриса угла C, D лежит на AB\"><title>Разносторонний треугольник; CD — биссектриса угла C, D лежит на AB</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"50,200 310,200 120,50\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"120\" y1=\"50\" x2=\"155.5869831761264\" y2=\"200\" stroke=\"#ab6719\" stroke-width=\"3\"/><circle cx=\"155.5869831761264\" cy=\"200\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"155.5869831761264\" y=\"225\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">D</text><text x=\"50\" y=\"224\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">A</text><text x=\"313\" y=\"224\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">B</text><text x=\"120\" y=\"32\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">C</text><text x=\"77\" y=\"120\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">CA</text><text x=\"231\" y=\"120\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">CB</text></g></svg>"
      }
    },
    {
      "id": "median_bisects_angle",
      "aliases": [
        "median_bisects_angle"
      ],
      "theme": "Треугольники",
      "text": "Любая медиана треугольника делит пополам угол, из вершины которого она проведена.",
      "truth": false,
      "explanation": "Медиана делит сторону пополам, а угол пополам лишь в равнобедренном.",
      "hint": {
        "prompt": "Медиана идёт в середину стороны. Передвинь вершину и сравни полученные треугольники.",
        "model": "triangleMedian",
        "params": {
          "x": 1.2,
          "height": 3,
          "focus": "sides"
        }
      }
    },
    {
      "id": "circumcenter_always_inside",
      "aliases": [
        "circumcenter_always_inside"
      ],
      "theme": "Окружность",
      "text": "Центр описанной окружности треугольника всегда лежит внутри треугольника.",
      "truth": false,
      "explanation": "В тупоугольном треугольнике центр описанной окружности вне, в прямоугольном — на середине гипотенузы.",
      "hint": {
        "prompt": "Найди центр O и границу треугольника. Где расположен O относительно треугольника?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Тупоугольный треугольник с вершинами на окружности и отмеченным центром O\"><title>Тупоугольный треугольник с вершинами на окружности и отмеченным центром O</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><circle cx=\"180\" cy=\"130\" r=\"88\" fill=\"none\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><polygon points=\"97.30704937084006,99.90222738734116 262.69295062915995,99.90222738734116 180,42\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><circle cx=\"180\" cy=\"130\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"180\" y=\"154\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">O</text><line x1=\"180\" y1=\"130\" x2=\"180\" y2=\"42\" stroke=\"#ab6719\" stroke-width=\"3\" stroke-dasharray=\"6 5\"/></g></svg>"
      }
    },
    {
      "id": "hypotenuse_equals_sum_legs",
      "aliases": [
        "hypotenuse_equals_sum_legs"
      ],
      "theme": "Треугольники",
      "text": "В прямоугольном треугольнике гипотенуза равна сумме катетов.",
      "truth": false,
      "explanation": "Гипотенуза меньше суммы катетов, но не равна ей.",
      "hint": {
        "prompt": "Найди прямой угол. Сравни стороны и вспомни сумму трёх углов треугольника.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Прямоугольный треугольник с катетами 3 и 4 и гипотенузой 5\"><title>Прямоугольный треугольник с катетами 3 и 4 и гипотенузой 5</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"95,190 95,70 255,190\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"108\" y1=\"190\" x2=\"108\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"108\" y1=\"177\" x2=\"95\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"79\" y=\"133\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text><text x=\"180\" y=\"215\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">4</text><text x=\"186\" y=\"120\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text></g></svg>"
      }
    },
    {
      "id": "hypotenuse_less_than_sum_legs",
      "aliases": [
        "hypotenuse_less_than_sum_legs"
      ],
      "theme": "Треугольники",
      "text": "Гипотенуза прямоугольного треугольника меньше суммы его катетов.",
      "truth": true,
      "explanation": "Следствие неравенства треугольника: гипотенуза меньше суммы катетов.",
      "hint": {
        "prompt": "Найди прямой угол. Сравни стороны и вспомни сумму трёх углов треугольника.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Прямоугольный треугольник с катетами 3 и 4 и гипотенузой 5\"><title>Прямоугольный треугольник с катетами 3 и 4 и гипотенузой 5</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"95,190 95,70 255,190\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"108\" y1=\"190\" x2=\"108\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"108\" y1=\"177\" x2=\"95\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"79\" y=\"133\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text><text x=\"180\" y=\"215\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">4</text><text x=\"186\" y=\"120\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text></g></svg>"
      }
    },
    {
      "id": "right_triangle_acute_sum_90",
      "aliases": [
        "right_triangle_acute_sum_90"
      ],
      "theme": "Треугольники",
      "text": "В прямоугольном треугольнике сумма двух острых углов равна 90°.",
      "truth": true,
      "explanation": "В прямоугольном треугольнике два острых угла дополняют до 90°.",
      "hint": {
        "prompt": "Найди прямой угол. Сравни стороны и вспомни сумму трёх углов треугольника.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Прямоугольный треугольник с катетами 3 и 4 и гипотенузой 5\"><title>Прямоугольный треугольник с катетами 3 и 4 и гипотенузой 5</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"95,190 95,70 255,190\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"108\" y1=\"190\" x2=\"108\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"108\" y1=\"177\" x2=\"95\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"79\" y=\"133\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text><text x=\"180\" y=\"215\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">4</text><text x=\"186\" y=\"120\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text></g></svg>"
      }
    },
    {
      "id": "right_triangle_area_equals_product_legs",
      "aliases": [
        "right_triangle_area_equals_product_legs"
      ],
      "theme": "Площади и подобие",
      "text": "Площадь прямоугольного треугольника равна произведению его катетов.",
      "truth": false,
      "explanation": "Площадь прямоугольного треугольника равна половине произведения катетов. Такой треугольник занимает половину прямоугольника с теми же сторонами.",
      "hint": {
        "prompt": "Дострой треугольник до прямоугольника со сторонами 3 и 4. Какую часть прямоугольника он занимает?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Прямоугольный треугольник с катетами 3 и 4 и гипотенузой 5\"><title>Прямоугольный треугольник с катетами 3 и 4 и гипотенузой 5</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"95,190 95,70 255,190\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"108\" y1=\"190\" x2=\"108\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"108\" y1=\"177\" x2=\"95\" y2=\"177\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"79\" y=\"133\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text><text x=\"180\" y=\"215\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">4</text><text x=\"186\" y=\"120\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text></g></svg>"
      }
    },
    {
      "id": "tri_aa_similarity",
      "aliases": [
        "tri_aa_similarity"
      ],
      "theme": "Треугольники",
      "text": "Если два угла одного треугольника равны двум углам другого, то треугольники подобны.",
      "truth": true,
      "explanation": "По двум равным углам треугольники подобны.",
      "hint": {
        "prompt": "Меняй размер второго треугольника. Сравни его углы и длины сторон с первым.",
        "model": "similarity",
        "params": {
          "scale": 2
        }
      }
    },
    {
      "id": "tri_aaa_congruent",
      "aliases": [
        "tri_aaa_congruent"
      ],
      "theme": "Треугольники",
      "text": "Если у двух треугольников совпадают все три угла, то эти треугольники обязательно равны (конгруэнтны).",
      "truth": false,
      "explanation": "Равенство трёх углов даёт подобие, но не равенство треугольников.",
      "hint": {
        "prompt": "Меняй размер второго треугольника. Сравни его углы и длины сторон с первым.",
        "model": "similarity",
        "params": {
          "scale": 2
        }
      }
    },
    {
      "id": "tri_two_sides_congruent",
      "aliases": [
        "tri_two_sides_congruent"
      ],
      "theme": "Треугольники",
      "text": "Равенства двух сторон у двух треугольников достаточно, чтобы заключить их равенство.",
      "truth": false,
      "explanation": "Двух сторон недостаточно: нужен угол между ними или третья сторона.",
      "hint": {
        "prompt": "В обоих треугольниках есть стороны 10 и 6. Сравни третьи стороны и форму треугольников.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Два треугольника с углом 30° и одинаковыми сторонами 10 и 6; сторона 6 лежит напротив угла 30°\"><title>Два треугольника с углом 30° и одинаковыми сторонами 10 и 6; сторона 6 лежит напротив угла 30°</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"25,190 94.46718021735681,190 137.583302491977,125\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"49\" y=\"179\" text-anchor=\"middle\" font-size=\"14\" fill=\"#243b53\">30°</text><text x=\"73.2916512459885\" y=\"145.5\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">10</text><text x=\"121.02524135466692\" y=\"157.5\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">6</text><polygon points=\"195,190 314.76878828199784,190 281.60254037844385,140\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"219\" y=\"179\" text-anchor=\"middle\" font-size=\"14\" fill=\"#243b53\">30°</text><text x=\"230.30127018922192\" y=\"153.0\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">10</text><text x=\"303.18566433022085\" y=\"165.0\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">6</text></g></svg>"
      }
    },
    {
      "id": "isosceles_all_bisectors_are_altitudes",
      "aliases": [
        "isosceles_all_bisectors_are_altitudes"
      ],
      "theme": "Треугольники",
      "text": "Любая биссектриса равнобедренного треугольника обязательно является высотой.",
      "truth": false,
      "explanation": "В равнобедренном треугольнике, который не является равносторонним, биссектриса к основанию совпадает с высотой. Биссектрисы из вершин при основании не являются высотами. У равностороннего треугольника совпадают все три.",
      "hint": {
        "prompt": "Биссектриса проведена из вершины при основании. Сравни BD и DC и посмотри на угол между AD и BC.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Равнобедренный треугольник AC=BC=5, AB=6; биссектриса AD проведена из вершины A при основании\"><title>Равнобедренный треугольник AC=BC=5, AB=6; биссектриса AD проведена из вершины A при основании</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"65,190 275,190 170,50\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"65\" y1=\"190\" x2=\"217.72727272727272\" y2=\"113.63636363636364\" stroke=\"#ab6719\" stroke-width=\"3\"/><circle cx=\"217.72727272727272\" cy=\"113.63636363636364\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"246.72727272727272\" y=\"127.63636363636364\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">D</text><text x=\"45\" y=\"200\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">A</text><text x=\"294\" y=\"200\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">B</text><text x=\"170\" y=\"33\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">C</text><text x=\"170\" y=\"218\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">AB = 6</text><text x=\"95\" y=\"110\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text><text x=\"215\" y=\"85\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text><text x=\"113\" y=\"176\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">α</text><text x=\"107\" y=\"147\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">α</text></g></svg>"
      }
    },
    {
      "id": "isosceles_all_bisectors_are_medians",
      "aliases": [
        "isosceles_all_bisectors_are_medians"
      ],
      "theme": "Треугольники",
      "text": "Любая биссектриса равнобедренного треугольника обязательно является медианой.",
      "truth": false,
      "explanation": "В равнобедренном треугольнике, который не является равносторонним, биссектриса к основанию совпадает с медианой. Биссектрисы из вершин при основании не являются медианами. У равностороннего треугольника совпадают все три.",
      "hint": {
        "prompt": "Биссектриса проведена из вершины при основании. Сравни BD и DC и посмотри на угол между AD и BC.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Равнобедренный треугольник AC=BC=5, AB=6; биссектриса AD проведена из вершины A при основании\"><title>Равнобедренный треугольник AC=BC=5, AB=6; биссектриса AD проведена из вершины A при основании</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"65,190 275,190 170,50\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"65\" y1=\"190\" x2=\"217.72727272727272\" y2=\"113.63636363636364\" stroke=\"#ab6719\" stroke-width=\"3\"/><circle cx=\"217.72727272727272\" cy=\"113.63636363636364\" r=\"3\" fill=\"#243b53\" stroke=\"#243b53\" stroke-width=\"2.5\"/><text x=\"246.72727272727272\" y=\"127.63636363636364\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">D</text><text x=\"45\" y=\"200\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">A</text><text x=\"294\" y=\"200\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">B</text><text x=\"170\" y=\"33\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">C</text><text x=\"170\" y=\"218\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">AB = 6</text><text x=\"95\" y=\"110\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text><text x=\"215\" y=\"85\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text><text x=\"113\" y=\"176\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">α</text><text x=\"107\" y=\"147\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">α</text></g></svg>"
      }
    },
    {
      "id": "equilateral_altitudes_equal",
      "aliases": [
        "equilateral_altitudes_equal"
      ],
      "theme": "Треугольники",
      "text": "У равностороннего треугольника все высоты равны.",
      "truth": true,
      "explanation": "В равностороннем треугольнике все стороны и углы равны, поэтому высоты одинаковы.",
      "hint": {
        "prompt": "Все стороны треугольника равны. Сравни три высоты, мысленно поворачивая фигуру.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"В равностороннем треугольнике проведены три высоты\"><title>В равностороннем треугольнике проведены три высоты</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"80,195 280,195 180,21.8\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"180\" y1=\"21.8\" x2=\"180\" y2=\"195\" stroke=\"#ab6719\" stroke-width=\"3\"/><line x1=\"80\" y1=\"195\" x2=\"230\" y2=\"108.4\" stroke=\"#ab6719\" stroke-width=\"3\"/><line x1=\"280\" y1=\"195\" x2=\"130\" y2=\"108.4\" stroke=\"#ab6719\" stroke-width=\"3\"/><text x=\"180\" y=\"221\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">a</text><text x=\"111\" y=\"100\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">a</text><text x=\"250\" y=\"100\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">a</text></g></svg>"
      }
    },
    {
      "id": "tri_1_2_4_exists",
      "aliases": [
        "tri_1_2_4_exists"
      ],
      "theme": "Треугольники",
      "text": "Треугольник со сторонами 1, 2 и 4 может существовать.",
      "truth": false,
      "explanation": "Не выполняется неравенство треугольника: 1 + 2 ≤ 4.",
      "hint": {
        "prompt": "Попробуй соединить отрезки 1,2 и 4 в треугольник.",
        "model": "triangleSides",
        "params": {
          "a": 1,
          "b": 2,
          "c": 4,
          "locked": [
            "a",
            "b",
            "c"
          ]
        }
      }
    },
    {
      "id": "tri_2_4_6_not_exist",
      "aliases": [
        "tri_2_4_6_not_exist"
      ],
      "theme": "Треугольники",
      "text": "Треугольника со сторонами 2, 4 и 6 не существует.",
      "truth": true,
      "explanation": "Сумма двух сторон равна третьей (2 + 4 = 6), треугольник не существует.",
      "hint": {
        "prompt": "Попробуй соединить отрезки 2,4 и 6. Сравни самую длинную сторону с суммой двух других.",
        "model": "triangleSides",
        "params": {
          "a": 2,
          "b": 4,
          "c": 6,
          "locked": [
            "a",
            "b",
            "c"
          ]
        }
      }
    },
    {
      "id": "tan_acute_less_than_1",
      "aliases": [
        "tan_acute_less_than_1"
      ],
      "theme": "Треугольники",
      "text": "Тангенс любого острого угла меньше 1.",
      "truth": false,
      "explanation": "Например, tan 60° = √3 > 1.",
      "hint": {
        "prompt": "Угол α острый. Сравни длину противолежащего катета с длиной прилежащего.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"В прямоугольном треугольнике противолежащий катет для угла α равен 8, прилежащий 5; показано отношение катетов\"><title>В прямоугольном треугольнике противолежащий катет для угла α равен 8, прилежащий 5; показано отношение катетов</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"65,200 65,40 165,200\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"78\" y1=\"200\" x2=\"78\" y2=\"187\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"78\" y1=\"187\" x2=\"65\" y2=\"187\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"112\" y=\"185\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">α</text><text x=\"49\" y=\"125\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">8</text><text x=\"113\" y=\"224\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">5</text><text x=\"264\" y=\"109\" text-anchor=\"middle\" font-size=\"18\" fill=\"#243b53\">tg α =</text><text x=\"305\" y=\"96\" text-anchor=\"middle\" font-size=\"18\" fill=\"#243b53\">8</text><line x1=\"291\" y1=\"106\" x2=\"322\" y2=\"106\" stroke=\"#243b53\" stroke-width=\"3\"/><text x=\"305\" y=\"130\" text-anchor=\"middle\" font-size=\"18\" fill=\"#243b53\">5</text></g></svg>"
      }
    },
    {
      "id": "parallelogram_cyclic",
      "aliases": [
        "parallelogram_cyclic"
      ],
      "theme": "Четырёхугольники",
      "text": "Любой параллелограмм можно вписать в окружность.",
      "truth": false,
      "explanation": "В окружность вписывается параллелограмм только при прямых углах (прямоугольник).",
      "hint": {
        "prompt": "Ромб тоже является параллелограммом. Проверь сумму его противоположных углов.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Ромб с углами 60° у двух противоположных вершин\"><title>Ромб с углами 60° у двух противоположных вершин</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"60,190 220,190 300,51.44 140,51.44\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"95\" y=\"178\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">60°</text><text x=\"255\" y=\"81\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">60°</text><text x=\"180\" y=\"217\" text-anchor=\"middle\" font-size=\"16\" fill=\"#243b53\">Все стороны равны</text></g></svg>"
      }
    },
    {
      "id": "square_area_adjacent_sides_product",
      "aliases": [
        "square_area_adjacent_sides_product"
      ],
      "theme": "Площади и подобие",
      "text": "Площадь квадрата равна произведению длин двух его смежных сторон.",
      "truth": true,
      "explanation": "Площадь квадрата равна a², то есть произведению двух смежных сторон.",
      "hint": {
        "prompt": "Посчитай количество единичных клеток. Сравни с произведением двух соседних сторон.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Квадрат со стороной 3 разбит на единичные клетки\"><title>Квадрат со стороной 3 разбит на единичные клетки</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><rect x=\"90\" y=\"35\" width=\"180\" height=\"180\" fill=\"#edf4f7\" stroke=\"#246b8e\" stroke-width=\"2.5\"/><line x1=\"150\" y1=\"35\" x2=\"150\" y2=\"215\" stroke=\"#b4c7ce\" stroke-width=\"3\"/><line x1=\"90\" y1=\"95\" x2=\"270\" y2=\"95\" stroke=\"#b4c7ce\" stroke-width=\"3\"/><line x1=\"210\" y1=\"35\" x2=\"210\" y2=\"215\" stroke=\"#b4c7ce\" stroke-width=\"3\"/><line x1=\"90\" y1=\"155\" x2=\"270\" y2=\"155\" stroke=\"#b4c7ce\" stroke-width=\"3\"/><text x=\"180\" y=\"232\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text><text x=\"74\" y=\"128\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text></g></svg>"
      }
    },
    {
      "id": "equidiagonal_orthogonal_quadrilateral_square",
      "aliases": [
        "equidiagonal_orthogonal_quadrilateral_square"
      ],
      "theme": "Четырёхугольники",
      "text": "Любой выпуклый четырёхугольник с равными и перпендикулярными диагоналями — квадрат.",
      "truth": false,
      "explanation": "Равные и перпендикулярные диагонали не гарантируют квадрат (например, воздушный змей).",
      "hint": {
        "prompt": "Проверь длины диагоналей и угол их пересечения. Затем сравни стороны фигуры.",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Выпуклый четырёхугольник: диагонали взаимно перпендикулярны, каждая длиной 4; части одной 1 и 3, другой 2 и 2\"><title>Выпуклый четырёхугольник: диагонали взаимно перпендикулярны, каждая длиной 4; части одной 1 и 3, другой 2 и 2</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"180,70 260,110 180,230 100,110\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><line x1=\"180\" y1=\"70\" x2=\"180\" y2=\"230\" stroke=\"#ab6719\" stroke-width=\"3\"/><line x1=\"100\" y1=\"110\" x2=\"260\" y2=\"110\" stroke=\"#ab6719\" stroke-width=\"3\"/><line x1=\"193\" y1=\"110\" x2=\"193\" y2=\"123\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"193\" y1=\"123\" x2=\"180\" y2=\"123\" stroke=\"#657e8c\" stroke-width=\"3\"/><text x=\"197\" y=\"96\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">1</text><text x=\"197\" y=\"179\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">3</text><text x=\"136\" y=\"132\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">2</text><text x=\"223\" y=\"132\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">2</text></g></svg>"
      }
    },
    {
      "id": "quadrilaterals_equal_if_corresponding_sides_equal",
      "aliases": [
        "quadrilaterals_equal_if_corresponding_sides_equal"
      ],
      "theme": "Четырёхугольники",
      "text": "Если четыре стороны одного четырёхугольника по парам равны сторонам другого, то четырёхугольники обязательно равны.",
      "truth": false,
      "explanation": "Равенство всех сторон не фиксирует углы, формы могут различаться.",
      "hint": {
        "prompt": "У каждой фигуры все стороны по 4. Можно ли совместить фигуры без изменения углов?",
        "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 360 240\" role=\"img\" aria-label=\"Квадрат и ромб со стороной 4; у ромба отмечен угол 60°\"><title>Квадрат и ромб со стороной 4; у ромба отмечен угол 60°</title><g font-family=\"system-ui, sans-serif\" stroke-linejoin=\"round\" stroke-linecap=\"round\"><polygon points=\"25,175 125,175 125,75 25,75\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><polygon points=\"195,175 295,175 345,88.4 245,88.4\" fill=\"#eaf3f8\" stroke=\"#246b8e\" stroke-width=\"3\"/><text x=\"75\" y=\"201\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">4</text><text x=\"12\" y=\"130\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">4</text><text x=\"245\" y=\"201\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">4</text><text x=\"202\" y=\"128\" text-anchor=\"middle\" font-size=\"17\" fill=\"#243b53\">4</text><text x=\"227\" y=\"161\" text-anchor=\"middle\" font-size=\"15\" fill=\"#243b53\">60°</text><line x1=\"38\" y1=\"175\" x2=\"38\" y2=\"162\" stroke=\"#657e8c\" stroke-width=\"3\"/><line x1=\"38\" y1=\"162\" x2=\"25\" y2=\"162\" stroke=\"#657e8c\" stroke-width=\"3\"/></g></svg>"
      }
    },
    {
      "id": "parallelogram_adjacent_sides_equal_rhombus",
      "aliases": [
        "parallelogram_adjacent_sides_equal_rhombus"
      ],
      "theme": "Четырёхугольники",
      "text": "Если у параллелограмма равны две соседние стороны, то это ромб.",
      "truth": true,
      "explanation": "Параллелограмм с равными соседними сторонами является ромбом.",
      "hint": {
        "prompt": "Соседние стороны одинаковы. Меняй угол и сравни все четыре стороны.",
        "model": "rhombus",
        "params": {
          "side": 4,
          "angle": 65,
          "focus": "sides"
        }
      }
    },
    {
      "id": "parallelogram_equal_diagonals_rhombus",
      "aliases": [
        "parallelogram_equal_diagonals_rhombus",
        "prev-048-reverse"
      ],
      "theme": "Четырёхугольники",
      "text": "Если у параллелограмма диагонали равны, то он обязательно ромб.",
      "truth": false,
      "explanation": "Равные диагонали характерны для прямоугольника, но он не обязательно ромб.",
      "hint": {
        "prompt": "Сравни диагонали прямоугольника 6 на 3. Затем сравни его соседние стороны.",
        "model": "rectangle",
        "params": {
          "width": 6,
          "height": 3,
          "focus": "diagonals"
        }
      }
    },
    {
      "id": "parallelogram_has_two_equal_angles",
      "aliases": [
        "parallelogram_has_two_equal_angles"
      ],
      "theme": "Четырёхугольники",
      "text": "У параллелограмма есть два равных угла.",
      "truth": true,
      "explanation": "В параллелограмме противоположные углы равны, значит есть два равных.",
      "hint": {
        "prompt": "Меняй один угол и сравни все четыре угла параллелограмма.",
        "model": "parallelogram",
        "params": {
          "base": 6,
          "side": 4,
          "angle": 65,
          "focus": "angles"
        }
      }
    },
    {
      "id": "rect_perp_diagonals_exists",
      "aliases": [
        "rect_perp_diagonals_exists"
      ],
      "theme": "Четырёхугольники",
      "text": "Существует прямоугольник, у которого диагонали пересекаются под прямым углом.",
      "truth": true,
      "explanation": "Квадрат — частный случай прямоугольника с перпендикулярными диагоналями.",
      "hint": {
        "prompt": "Поставь одинаковые ширину и высоту. Посмотри на угол между диагоналями.",
        "model": "rectangle",
        "params": {
          "width": 4,
          "height": 4,
          "focus": "diagonals"
        }
      }
    },
    {
      "id": "rect_diagonals_bisect",
      "aliases": [
        "rect_diagonals_bisect"
      ],
      "theme": "Четырёхугольники",
      "text": "В прямоугольнике диагонали пересекаются и делятся точкой пересечения пополам.",
      "truth": true,
      "explanation": "Прямоугольник — параллелограмм, его диагонали делятся пополам.",
      "hint": {
        "prompt": "Сравни отрезки от точки пересечения диагоналей до противоположных вершин.",
        "model": "rectangle",
        "params": {
          "width": 6,
          "height": 3,
          "focus": "diagonals"
        }
      }
    },
    {
      "id": "rhombus_all_angles_equal",
      "aliases": [
        "rhombus_all_angles_equal"
      ],
      "theme": "Четырёхугольники",
      "text": "В любом ромбе все четыре угла равны.",
      "truth": false,
      "explanation": "В ромбе равны лишь противоположные углы; все равны только у квадрата.",
      "hint": {
        "prompt": "Меняй угол ромба и сравни все четыре угла.",
        "model": "rhombus",
        "params": {
          "side": 4,
          "angle": 65,
          "focus": "angles"
        }
      }
    },
    {
      "id": "rhombus_area_ab_sin",
      "aliases": [
        "rhombus_area_ab_sin"
      ],
      "theme": "Четырёхугольники",
      "text": "Площадь ромба равна произведению двух смежных сторон на синус угла между ними.",
      "truth": true,
      "explanation": "Площадь ромба как параллелограмма: S = ab·sinα.",
      "hint": {
        "prompt": "Меняй угол ромба. Следи за высотой и площадью при одинаковых сторонах.",
        "model": "rhombus",
        "params": {
          "side": 4,
          "angle": 65,
          "focus": "area"
        }
      }
    },
    {
      "id": "rhombus_area_side_times_height",
      "aliases": [
        "rhombus_area_side_times_height"
      ],
      "theme": "Четырёхугольники",
      "text": "Площадь ромба равна произведению стороны на высоту, опущенную на эту сторону.",
      "truth": true,
      "explanation": "Площадь ромба равна произведению стороны на соответствующую высоту.",
      "hint": {
        "prompt": "Меняй угол ромба. Следи за высотой и площадью при одинаковых сторонах.",
        "model": "rhombus",
        "params": {
          "side": 4,
          "angle": 65,
          "focus": "area"
        }
      }
    },
    {
      "id": "rhombus_diagonals_bisect",
      "aliases": [
        "rhombus_diagonals_bisect"
      ],
      "theme": "Четырёхугольники",
      "text": "В ромбе диагонали делятся точкой пересечения пополам.",
      "truth": true,
      "explanation": "Диагонали ромба пересекаются и делятся точкой пересечения пополам.",
      "hint": {
        "prompt": "Меняй угол ромба. Сравни длины диагоналей и их половин.",
        "model": "rhombus",
        "params": {
          "side": 4,
          "angle": 65,
          "focus": "diagonals"
        }
      }
    },
    {
      "id": "rhombus_diagonals_equal",
      "aliases": [
        "rhombus_diagonals_equal"
      ],
      "theme": "Четырёхугольники",
      "text": "У ромба диагонали равны.",
      "truth": false,
      "explanation": "Равные диагонали бывают у квадрата, но не у любого ромба.",
      "hint": {
        "prompt": "Меняй угол ромба. Сравни длины диагоналей и их половин.",
        "model": "rhombus",
        "params": {
          "side": 4,
          "angle": 65,
          "focus": "diagonals"
        }
      }
    },
    {
      "id": "rhombus_right_angle_square",
      "aliases": [
        "rhombus_right_angle_square"
      ],
      "theme": "Четырёхугольники",
      "text": "Если в ромбе есть прямой угол, то этот ромб — квадрат.",
      "truth": true,
      "explanation": "Ромб с прямым углом является квадратом.",
      "hint": {
        "prompt": "Один угол равен 90°. Проверь длины сторон и остальные углы.",
        "model": "rhombus",
        "params": {
          "side": 4,
          "angle": 90,
          "locked": [
            "angle"
          ],
          "focus": "angles"
        }
      }
    }
  ],
  "aliases": {
    "prev-000": "prev-000",
    "prev-001": "prev-001",
    "prev-002": "prev-002",
    "prev-003": "prev-003",
    "prev-004": "prev-004",
    "prev-005": "prev-005",
    "prev-006": "prev-006",
    "prev-007": "prev-007",
    "prev-008": "prev-008",
    "prev-009": "prev-009",
    "prev-010": "prev-010",
    "prev-011": "prev-011",
    "prev-012": "prev-012",
    "prev-013": "prev-013",
    "prev-014": "prev-014",
    "prev-015": "prev-015",
    "prev-016": "prev-016",
    "prev-017": "prev-017",
    "prev-018": "prev-018",
    "prev-019": "prev-019",
    "prev-020": "prev-020",
    "prev-021": "prev-021",
    "prev-022": "prev-022",
    "prev-023": "prev-023",
    "prev-024": "prev-024",
    "prev-025": "prev-025",
    "prev-026": "prev-026",
    "prev-027": "prev-027",
    "prev-028": "prev-028",
    "prev-029": "prev-029",
    "prev-030": "prev-030",
    "prev-031": "prev-031",
    "prev-032": "prev-032",
    "prev-033": "prev-033",
    "prev-034": "prev-034",
    "prev-035": "prev-035",
    "prev-036": "prev-036",
    "prev-037": "prev-037",
    "prev-038": "prev-038",
    "prev-039": "prev-039",
    "prev-040": "prev-040",
    "prev-041": "prev-041",
    "prev-042": "prev-042",
    "prev-043": "prev-043",
    "prev-044": "prev-044",
    "prev-045": "prev-045",
    "prev-046": "prev-046",
    "prev-047": "prev-047",
    "prev-048": "prev-048",
    "prev-049": "prev-049",
    "prev-050": "prev-050",
    "prev-051": "prev-051",
    "prev-052": "prev-052",
    "prev-053": "prev-053",
    "prev-054": "prev-054",
    "prev-055": "prev-055",
    "prev-056": "prev-056",
    "prev-057": "prev-057",
    "prev-058": "prev-058",
    "prev-059": "prev-059",
    "prev-060": "prev-060",
    "prev-061": "prev-061",
    "prev-062": "prev-062",
    "prev-063": "prev-063",
    "prev-064": "prev-064",
    "prev-065": "prev-065",
    "prev-066": "prev-066",
    "prev-067": "prev-067",
    "prev-068": "prev-068",
    "prev-069": "prev-069",
    "prev-070": "prev-070",
    "prev-071": "prev-071",
    "prev-072": "prev-072",
    "prev-073": "prev-073",
    "prev-074": "prev-074",
    "prev-075": "prev-075",
    "prev-076": "prev-076",
    "prev-077": "prev-077",
    "prev-078": "prev-078",
    "prev-079": "prev-079",
    "prev-080": "prev-080",
    "prev-081": "prev-081",
    "prev-082": "prev-082",
    "prev-083": "prev-083",
    "prev-084": "prev-084",
    "prev-085": "prev-085",
    "prev-086": "prev-086",
    "prev-087": "prev-087",
    "prev-088": "prev-088",
    "prev-089": "prev-089",
    "prev-090": "prev-090",
    "prev-091": "prev-091",
    "prev-092": "prev-092",
    "prev-093": "prev-093",
    "prev-094": "prev-094",
    "prev-095": "prev-095",
    "prev-096": "prev-096",
    "prev-097": "prev-097",
    "prev-098": "prev-098",
    "prev-099": "prev-099",
    "prev-100": "prev-100",
    "prev-101": "prev-101",
    "prev-102": "prev-102",
    "prev-103": "prev-103",
    "prev-104": "prev-104",
    "perpendicular_bisector_point_equidistant_endpoints": "perpendicular_bisector_point_equidistant_endpoints",
    "point_on_angle_bisector_equidistant_sides": "point_on_angle_bisector_equidistant_sides",
    "circle_intersection_point_equidistant_centers": "circle_intersection_point_equidistant_centers",
    "circles_intersect_if_radius_bigger": "circles_intersect_if_radius_bigger",
    "all_diameters_equal": "all_diameters_equal",
    "tangent_parallel_radius": "tangent_parallel_radius",
    "point_on_circle_distance_radius": "point_on_circle_distance_radius",
    "inscribed_angle_over_diameter_right": "inscribed_angle_over_diameter_right",
    "inscribed_equals_central": "inscribed_equals_central",
    "all_chords_equal": "all_chords_equal",
    "triangle_area_less_than_product_two_sides": "triangle_area_less_than_product_two_sides",
    "similar_triangles_area_ratio_equals_k": "similar_triangles_area_ratio_equals_k",
    "adjacent_angles_always_equal": "prev-001",
    "adjacent_angles_one_acute_one_obtuse_always": "adjacent_angles_one_acute_one_obtuse_always",
    "angle_acute_adjacent_acute": "angle_acute_adjacent_acute",
    "parallel_through_point_exists": "parallel_through_point_exists",
    "perp_through_point_exists": "perp_through_point_exists",
    "three_lines_through_one_point_exist": "three_lines_through_one_point_exist",
    "two_parallel_to_third_parallel": "two_parallel_to_third_parallel",
    "two_parallel_to_third_perpendicular": "two_parallel_to_third_perpendicular",
    "two_perp_to_third_perp": "two_perp_to_third_perp",
    "isosceles_trapezoid_bases_equal": "isosceles_trapezoid_bases_equal",
    "trap_bases_trapezoid_parallel": "trap_bases_trapezoid_parallel",
    "trapezoid_area_base_times_height": "trapezoid_area_base_times_height",
    "trapezoid_diagonal_makes_equal_triangles": "trapezoid_diagonal_makes_equal_triangles",
    "trapezoid_diagonals_bisect": "trapezoid_diagonals_bisect",
    "trapezoid_midline_equals_sum_bases": "trapezoid_midline_equals_sum_bases",
    "obtuse_triangle_all_obtuse": "obtuse_triangle_all_obtuse",
    "right_triangle_angles_sum_90": "right_triangle_angles_sum_90",
    "triangle_angles_sum_180": "triangle_angles_sum_180",
    "triangle_angles_sum_360": "triangle_angles_sum_360",
    "triangle_has_angle_le_60": "triangle_has_angle_le_60",
    "bisector_bisects_opposite_side": "bisector_bisects_opposite_side",
    "median_bisects_angle": "median_bisects_angle",
    "circumcenter_always_inside": "circumcenter_always_inside",
    "hypotenuse_equals_sum_legs": "hypotenuse_equals_sum_legs",
    "hypotenuse_less_than_sum_legs": "hypotenuse_less_than_sum_legs",
    "right_triangle_acute_sum_90": "right_triangle_acute_sum_90",
    "right_triangle_area_equals_product_legs": "right_triangle_area_equals_product_legs",
    "tri_aa_similarity": "tri_aa_similarity",
    "tri_aaa_congruent": "tri_aaa_congruent",
    "tri_two_sides_congruent": "tri_two_sides_congruent",
    "isosceles_all_bisectors_are_altitudes": "isosceles_all_bisectors_are_altitudes",
    "isosceles_all_bisectors_are_medians": "isosceles_all_bisectors_are_medians",
    "equilateral_altitudes_equal": "equilateral_altitudes_equal",
    "tri_1_2_4_exists": "tri_1_2_4_exists",
    "tri_2_4_6_not_exist": "tri_2_4_6_not_exist",
    "tan_acute_less_than_1": "tan_acute_less_than_1",
    "parallelogram_cyclic": "parallelogram_cyclic",
    "square_area_adjacent_sides_product": "square_area_adjacent_sides_product",
    "equidiagonal_orthogonal_quadrilateral_square": "equidiagonal_orthogonal_quadrilateral_square",
    "quadrilaterals_equal_if_corresponding_sides_equal": "quadrilaterals_equal_if_corresponding_sides_equal",
    "parallelogram_adjacent_sides_equal_rhombus": "parallelogram_adjacent_sides_equal_rhombus",
    "parallelogram_equal_diagonals_rhombus": "parallelogram_equal_diagonals_rhombus",
    "parallelogram_has_two_equal_angles": "parallelogram_has_two_equal_angles",
    "rect_perp_diagonals_exists": "rect_perp_diagonals_exists",
    "rect_diagonals_bisect": "rect_diagonals_bisect",
    "rhombus_all_angles_equal": "rhombus_all_angles_equal",
    "rhombus_area_ab_sin": "rhombus_area_ab_sin",
    "rhombus_area_side_times_height": "rhombus_area_side_times_height",
    "rhombus_diagonals_bisect": "rhombus_diagonals_bisect",
    "rhombus_diagonals_equal": "rhombus_diagonals_equal",
    "rhombus_right_angle_square": "rhombus_right_angle_square",
    "prev-048-reverse": "parallelogram_equal_diagonals_rhombus"
  },
  "sourceCounts": {
    "expanded": 105,
    "basic": 63,
    "unique": 167
  }
};
if(typeof module==='object' && module.exports) module.exports=data;
if(root) root.Task19Data=data;
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:null);
