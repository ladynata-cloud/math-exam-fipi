/* Общее для браузерных ворот (render-test.js, touch-test.js): доступ к сцене
   и камере тренажёра и проверка «чертёж целиком в кадре».

   Тренажёр наружу ничего не отдаёт, поэтому HOOK (для page.addInitScript)
   оборачивает THREE.WebGLRenderer, пока three.min.js только заполняет
   объект THREE: каждый render(scene, camera) запоминает их в window.__stereoCap.

   FRAME (для page.evaluate) — насколько видимое на холсте выходит за кадр:
   все вершины видимых сеток (тела, рёбра, окружности, поверхности) и углы
   спрайтов-подписей проецируются камерой в координаты экрана −1…1.
   Возвращает { ext, geo, lab, r }: ext — наибольшая |координата| (≤ 1 —
   всё в кадре), r — расстояние камеры. Сетка пола и свет не считаются. */
exports.HOOK = () => {
  let o;
  Object.defineProperty(window, "THREE", { configurable: true, get() { return o; }, set(v) {
    o = v;
    Object.defineProperty(v, "WebGLRenderer", { configurable: true, enumerable: true, set(R) {
      const Wr = function (...a) {
        const r = new R(...a), render = r.render;
        r.render = function (s, c) { window.__stereoCap = { s, c }; return render.call(this, s, c); };
        return r;
      };
      Wr.prototype = R.prototype;
      Object.defineProperty(v, "WebGLRenderer", { value: Wr, writable: true, enumerable: true, configurable: true });
    } });
  } });
};

exports.FRAME = () => {
  const cap = window.__stereoCap;
  if (!cap) return null;
  const { s, c } = cap, V = window.THREE.Vector3, v = new V();
  c.updateMatrixWorld();
  const tanH = Math.tan(c.fov * Math.PI / 360);
  const visible = o => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
  let geo = 0, lab = 0;
  s.traverse(o => {
    if (o.type === "GridHelper" || o.isLight || !visible(o)) return;
    if (o.isSprite) {
      o.getWorldPosition(v);
      const d = v.distanceTo(c.position);
      v.project(c);
      const hy = o.scale.y / 2 / (d * tanH), hx = o.scale.x / 2 / (d * tanH * c.aspect);
      lab = Math.max(lab, Math.abs(v.x) + hx, Math.abs(v.y) + hy);
      return;
    }
    const pos = o.isMesh && o.geometry && o.geometry.attributes && o.geometry.attributes.position;
    if (!pos) return;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).project(c);
      geo = Math.max(geo, Math.abs(v.x), Math.abs(v.y));
    }
  });
  return { ext: Math.max(geo, lab), geo, lab, r: c.position.length() };
};
