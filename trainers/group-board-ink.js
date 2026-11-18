/* Local ink previews only. Server snapshots, permissions and journal stay authoritative. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GroupBoardInk = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const TYPES = new Set(['stroke', 'erase', 'undo']);
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object || {}, key);

  function matches(action, preview, context) {
    return TYPES.has(action?.type) && action.target === context.target
      && action.assignmentId === context.assignmentId && !!context.actor
      && (context.actor === 'teacher' || context.target === context.actor)
      && preview?.actor === context.actor;
  }

  function project(strokes, actions, previews, context) {
    let result = Array.isArray(strokes) ? strokes.slice() : [];
    for (const action of actions || []) {
      const preview = own(previews, action?.opId) ? previews[action.opId] : null;
      if (!matches(action, preview, context)) continue;
      const payload = action.payload || {};
      if (action.type === 'stroke') {
        if (typeof payload.id !== 'string' || !Array.isArray(payload.points)
          || result.some(stroke => stroke.id === payload.id)) continue;
        // Writer identity comes from the current authenticated session, never the payload.
        result.push({...payload, author:context.actor});
      } else {
        // An undo preview keeps its original target even if its acknowledgement was lost.
        const strokeId = action.type === 'erase' ? payload.strokeId : preview.strokeId;
        result = result.filter(stroke => stroke.id !== strokeId || stroke.author !== context.actor);
      }
    }
    return result;
  }

  function preview(type, strokes, actor) {
    if (!TYPES.has(type) || !actor) return null;
    const value = {actor};
    if (type === 'undo') value.strokeId = [...strokes].reverse().find(stroke => stroke.author === actor)?.id || null;
    return value;
  }

  return Object.freeze({project, preview});
});
