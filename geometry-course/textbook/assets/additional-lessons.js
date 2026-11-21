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
      ['/geometry-course/textbook/data/coordinate-figures.json', '№1030–1035']
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
