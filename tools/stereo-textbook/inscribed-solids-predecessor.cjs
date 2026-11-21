'use strict';

const {makeReviewedIncrement} = require('./reviewed-increment.cjs');
const volumes = makeReviewedIncrement(require('./box-volumes.json'));
const latest = makeReviewedIncrement(require('./round-bodies.json'), volumes);
const later = makeReviewedIncrement(require('./circumspheres.json'), latest);
module.exports = makeReviewedIncrement(require('./inscribed-solids.json'), later);
