/* Keep independently released textbook units available when a new unit cannot load. */
(function (root) {
  'use strict';
  const catalogKeys = ['id', 'revision', 'kind', 'title', 'status', 'source'];

  function append(base, addition) {
    if (addition.bookId !== base.catalog.book.id || !Array.isArray(addition.lessons)) {
      throw new Error('Дополнение относится к другой книге.');
    }
    const known = new Set(base.catalog.entries.map(entry => entry.id));
    const entries = addition.lessons.map(lesson => {
      if (known.has(lesson.id)) throw new Error('Номер задачи уже есть в каталоге.');
      known.add(lesson.id);
      return Object.fromEntries(catalogKeys.map(key => [key, lesson[key]]));
    });
    return {
      ...base,
      catalog: { ...base.catalog, entries: base.catalog.entries.concat(entries) },
      lessons: base.lessons.concat(addition.lessons)
    };
  }

  async function fetchUnit(supplementUrl, fetchFile) {
    const response = await fetchFile(supplementUrl, {cache:'no-cache'});
    if (!response.ok) throw new Error('Не удалось загрузить дополнение задачника.');
    return response.json();
  }

  async function load(base, supplementUrl, fetchFile = root.fetch.bind(root)) {
    return append(base, await fetchUnit(supplementUrl, fetchFile));
  }

  const units = [
      ['/geometry-course/textbook/data/area-lessons.json', '№842–853'],
      ['/geometry-course/textbook/data/area-similarity-lessons.json', '№854–871'],
      ['/geometry-course/textbook/data/midpoint-lessons.json', '№872–899'],
      ['/geometry-course/textbook/data/circle-lessons.json', '№900–925'],
      ['/geometry-course/textbook/data/grade9-vectors.json', '№926–936, теория 84–86'],
      ['/geometry-course/textbook/data/vector-conclusions.json', '№937–940'],
      ['/geometry-course/textbook/data/vector-sums.json', '№941–946, теория 87–90'],
      ['/geometry-course/textbook/data/vector-sum-problems.json', '№947–952'],
      ['/geometry-course/textbook/data/vector-identities.json', '№953–962'],
      ['/geometry-course/textbook/data/vector-scaling.json', 'пункты 91–92 и №963–966'],
      ['/geometry-course/textbook/data/scalar-problems.json', '№967–971'],
      ['/geometry-course/textbook/data/vector-midpoint-proofs.json', '№972–975'],
      ['/geometry-course/textbook/data/vector-applications.json', '№976–980'],
      ['/geometry-course/textbook/data/vector-length-problems.json', '№981–987'],
      ['/geometry-course/textbook/data/vector-extra-problems.json', '№988–997'],
      ['/geometry-course/textbook/data/vector-chapter-review.json', 'вопросы 1–20 к главе «Векторы»'],
      ['/geometry-course/textbook/data/coordinate-coefficients.json', 'пункты 93–94, №998–999'],
      ['/geometry-course/textbook/data/coordinate-relations.json', '№1000–1003'],
      ['/geometry-course/textbook/data/coordinate-grid.json', '№1004–1008'],
      ['/geometry-course/textbook/data/coordinate-actions.json', '№1009–1015'],
      ['/geometry-course/textbook/data/coordinate-positions.json', 'пункты 95–96 и №1016–1020'],
      ['/geometry-course/textbook/data/coordinate-tables.json', '№1021–1023'],
      ['/geometry-course/textbook/data/coordinate-distances.json', '№1024–1029'],
      ['/geometry-course/textbook/data/coordinate-figures.json', '№1030–1035'],
      ['/geometry-course/textbook/data/coordinate-couriers.json', '№1036–1037'],
      ['/geometry-course/textbook/data/coordinate-proof-method.json', '№1038–1044'],
      ['/geometry-course/textbook/data/coordinate-curves.json', 'пункты 97–99, №1045–1046'],
      ['/geometry-course/textbook/data/circle-intersections.json', '№1047–1050'],
      ['/geometry-course/textbook/data/circle-equations.json', '№1051–1057'],
      ['/geometry-course/textbook/data/coordinate-lines.json', '№1058–1064'],
      ['/geometry-course/textbook/data/circle-line-positions.json', '№1065–1068'],
      ['/geometry-course/textbook/data/coordinate-loci.json', '№1069–1075'],
      ['/geometry-course/textbook/data/coordinate-chapter-review.json', 'вопросы 1–24 к главе «Метод координат»'],
      ['/geometry-course/textbook/data/coordinate-additional-vectors.json', '№1076–1078'],
      ['/geometry-course/textbook/data/coordinate-additional-figures.json', '№1079–1086'],
      ['/geometry-course/textbook/data/coordinate-additional-curves.json', '№1087–1092'],
      ['/geometry-course/textbook/data/coordinate-additional-applications.json', '№1093–1097'],
      ['/geometry-course/textbook/data/upper-semicircle.json', 'пп. 100–103 и №1098–1099'],
      ['/geometry-course/textbook/data/trigonometric-signs.json', '№1100–1103'],
      ['/geometry-course/textbook/data/trigonometric-rays.json', '№1104–1106'],
      ['/geometry-course/textbook/data/slope-and-reflection.json', '№1107–1108'],
      ['/geometry-course/textbook/data/triangle-sine-area.json', 'п. 104 и №1109–1113'],
      ['/geometry-course/textbook/data/triangle-relations.json', 'пп. 105–108'],
      ['/geometry-course/textbook/data/solve-triangle.json', '№1114, а–и'],
      ['/geometry-course/textbook/data/oblique-triangle-cases.json', '№1115–1117'],
      ['/geometry-course/textbook/data/triangle-section-applications.json', '№1118–1122'],
      ['/geometry-course/textbook/data/field-trigonometry.json', '№1123–1127'],
      ['/geometry-course/textbook/data/scalar-product.json', 'пп. 109–112 и №1128–1132'],
      ['/geometry-course/textbook/data/scalar-coordinates.json', '№1133–1138'],
      ['/geometry-course/textbook/data/scalar-geometry.json', '№1139–1145'],
      ['/geometry-course/textbook/data/trigonometry-review.json', 'вопросы 1–7 главы XII'],
      ['/geometry-course/textbook/data/triangle-review.json', 'вопросы 8–13 главы XII'],
      ['/geometry-course/textbook/data/vector-product-review.json', 'вопросы 14–22 главы XII'],
      ['/geometry-course/textbook/data/additional-triangle-area.json', '№1146–1148'],
      ['/geometry-course/textbook/data/additional-solve-triangles.json', '№1149–1153'],
      ['/geometry-course/textbook/data/additional-scalar-vectors.json', '№1154–1158'],
      ['/geometry-course/textbook/data/chapter-twelve-finale.json', '№1159–1166'],
      ['/geometry-course/textbook/data/regular-polygon-definition.json', 'п. 113 и №1167–1169'],
      ['/geometry-course/textbook/data/regular-polygon-angles.json', 'п. 114 и №1170–1173'],
      ['/geometry-course/textbook/data/regular-polygon-centers.json', 'п. 115 и №1174–1175'],
      ['/geometry-course/textbook/data/regular-polygon-tables.json', 'п. 116 и №1176–1177'],
      ['/geometry-course/textbook/data/polygon-circle-applications.json', 'п. 117 и №1178–1182'],
      ['/geometry-course/textbook/data/regular-polygon-areas.json', '№1183–1187'],
      ['/geometry-course/textbook/data/regular-polygon-constructions.json', '№1188–1189'],
      ['/geometry-course/textbook/data/circumference-lengths.json', 'п. 118 и №1190–1192'],
      ['/geometry-course/textbook/data/inscribed-circle-lengths.json', '№1193–1194'],
      ['/geometry-course/textbook/data/circle-length-applications.json', '№1195–1199'],
      ['/geometry-course/textbook/data/measured-arc-devices.json', '№1200–1202'],
      ['/geometry-course/textbook/data/radian-table.json', 'п. 119 и №1203'],
      ['/geometry-course/textbook/data/radian-constructions.json', '№1204'],
      ['/geometry-course/textbook/data/disk-area-table.json', 'п. 120 и №1205–1206'],
      ['/geometry-course/textbook/data/areas-of-inscribed-disks.json', '№1207–1208']
  ];

  async function forCourse(base) {
    const results = await Promise.allSettled(units.map(([url]) => fetchUnit(url, root.fetch.bind(root))));
    let combined = base;
    for (const [i, result] of results.entries()) {
      if (result.status === 'fulfilled') {
        combined = append(combined, result.value);
      } else {
        const note = root.document.createElement('p');
        note.setAttribute('role', 'status');
        note.textContent = 'Задачи ' + units[i][1] + ' сейчас не загрузились. Обнови страницу, чтобы попробовать ещё раз.';
        root.document.getElementById('textbook-app').before(note);
      }
    }
    return combined;
  }

  root.GeometryAdditionalLessons = { append, load, forCourse };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {append, load, unitFiles: units.map(([url]) => url)};
  }
})(typeof window === 'undefined' ? globalThis : window);
