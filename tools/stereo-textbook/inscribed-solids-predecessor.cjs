'use strict';

const {makeReviewedIncrement} = require('./reviewed-increment.cjs');
const later = makeReviewedIncrement(require('./circumspheres.json'));
module.exports = makeReviewedIncrement(require('./inscribed-solids.json'), later);
