/* Reuse the established credential-free bridges, with one canonical model. */
(function (root) {
  'use strict';
  const app = root.SpaceMathApp;
  if (!app) return;
  if (root.MathExamLearning?.managed) {
    root.MathExamLearning.register({
      trainerId: 'spacemath', contentVersion: 1, getState: app.getState,
      applyState(envelope) {
        if (!envelope || !envelope.taskSpec || envelope.taskSpec.trainerId !== 'spacemath' || envelope.taskSpec.contentVersion !== 1) throw new Error('Неизвестная работа SpaceMath.');
        app.applyState(envelope.state); app.setReadOnly(envelope.readOnly === true);
      },
      setReadOnly: app.setReadOnly,
      subscribe(callback) { return app.subscribe(() => callback({ kind: 'model', details: {}, state: app.getState() })); }
    });
  } else if (root.MathExamBoard) {
    root.MathExamBoard.register({
      id: 'spacemath', version: '1.0.0', stateSchemaVersion: 1, parentOrigin: root.location.origin,
      getState: app.getState, applyState: app.applyState, subscribe: app.subscribe
    });
  }
})(window);
