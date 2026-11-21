'use strict';

const {makeReviewedIncrement} = require('./reviewed-increment.cjs');
const sectors = makeReviewedIncrement(require('./cone-nets-and-frusta.json'));
const cones = makeReviewedIncrement(require('./cone-volumes.json'), sectors);
const frusta = makeReviewedIncrement(require('./pyramid-frusta.json'), cones);
const projections = makeReviewedIncrement(require('./pyramid-projections.json'), frusta);
const pyramids = makeReviewedIncrement(require('./pyramid-volumes.json'), projections);
const oblique = makeReviewedIncrement(require('./oblique-prisms.json'), pyramids);
const sections = makeReviewedIncrement(require('./cross-sections.json'), oblique);
const prismVolumes = makeReviewedIncrement(require('./prism-volumes.json'), sections);
const volumes = makeReviewedIncrement(require('./box-volumes.json'), prismVolumes);
const latest = makeReviewedIncrement(require('./round-bodies.json'), volumes);
const later = makeReviewedIncrement(require('./circumspheres.json'), latest);
module.exports = makeReviewedIncrement(require('./inscribed-solids.json'), later);
