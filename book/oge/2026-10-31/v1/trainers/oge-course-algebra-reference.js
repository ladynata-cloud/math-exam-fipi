/* Exact FIPI algebra crops. Pixel provenance: oge-course-reference/source.json. */
(function(root){
'use strict';
const crops = {
  "quadratic-roots": {
    "file": "/book/oge/2026-10-31/v1/trainers/oge-course-reference/quadratic-roots.png",
    "title": "Формула корней квадратного уравнения",
    "alt": "x = (−b ± √D)/(2a), где D = b² − 4ac.",
    "printedPage": 3,
    "width": 440,
    "height": 77
  },
  "parabola-vertex": {
    "file": "/book/oge/2026-10-31/v1/trainers/oge-course-reference/parabola-vertex.png",
    "title": "Абсцисса вершины параболы",
    "alt": "x₀ = −b/(2a).",
    "printedPage": 3,
    "width": 168,
    "height": 70
  },
  "identities": {
    "file": "/book/oge/2026-10-31/v1/trainers/oge-course-reference/identities.png",
    "title": "Формулы сокращённого умножения",
    "alt": "Квадрат суммы, квадрат разности и разность квадратов.",
    "printedPage": 3,
    "width": 340,
    "height": 158
  }
};
root.OgeCourseAlgebraReference={crops};
if(typeof module==='object'&&module.exports)module.exports={crops};
})(typeof window==='object'?window:globalThis);
