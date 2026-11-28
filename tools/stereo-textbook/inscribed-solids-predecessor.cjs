'use strict';

const {makeReviewedIncrement} = require('./reviewed-increment.cjs');
const oblique = makeReviewedIncrement(require('./oblique-prisms.json'));
const sections = makeReviewedIncrement(require('./cross-sections.json'), oblique);
const prismVolumes = makeReviewedIncrement(require('./prism-volumes.json'), sections);
const volumes = makeReviewedIncrement(require('./box-volumes.json'), prismVolumes);
const latest = makeReviewedIncrement(require('./round-bodies.json'), volumes);
const later = makeReviewedIncrement(require('./circumspheres.json'), latest);
module.exports = makeReviewedIncrement(require('./inscribed-solids.json'), later);
