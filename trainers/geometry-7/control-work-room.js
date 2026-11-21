(() => {
  'use strict';

  const encoder = new TextEncoder();
  const writtenLimit = 40 * 1024;

  function embedded() {
    try {
      return window.parent !== window && window.parent.location.origin === location.origin &&
        window.parent.location.pathname === '/trainers/trainer-board.html';
    } catch {
      return false;
    }
  }

  // Keep comparisons like a<b>c intact across the bridge's plain-text contract.
  function pack(value) {
    return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  }

  function mount({ getModes, getWritten, apply }) {
    const handle = window.MathExamBoard.register({
      id: 'geometry7-control-work',
      version: '1.0.0',
      stateSchemaVersion: 1,
      parentOrigin: location.origin,
      getState: () => ({ modes: pack(getModes()), written: pack(getWritten()) }),
      applyState: wire => {
        if (typeof wire.modes !== 'string' || typeof wire.written !== 'string' ||
            encoder.encode(JSON.stringify(wire.written)).length > writtenLimit) {
          throw new TypeError('Invalid control-work room state');
        }
        apply(JSON.parse(wire.modes), JSON.parse(wire.written));
      }
    });

    return {
      changed() { handle.notifyStateChanged(); },
      writtenChanged() {
        const written = pack(getWritten());
        if (encoder.encode(JSON.stringify(written)).length > writtenLimit) return false;
        handle.notifyStateChanged();
        return true;
      }
    };
  }

  window.GeometryControlRoom = { embedded, mount };
})();
