/* =========================================================================
   РЕЖИМ ДОСКИ И ЗЕРКАЛО — для страниц курса.

   ?board=1   — сразу крупный шрифт (класс board на <html>);
   ?mirror=1  — зеркальное изображение (класс mirror на <html>);
   параметры комбинируются и не мешают ?mode=review.

   Зеркало — свойство проектора, а не человека, поэтому оно не сохраняется.
   Отражается body, а не сам <html>: клики и ввод при этом работают —
   браузер сам пересчитывает координаты событий внутри transform.

   В самих тренажёрах этот код повторён внутри файла: тренажёр обязан
   оставаться одним самодостаточным HTML без внешних зависимостей.
   ========================================================================= */
var BOARD = (function(){
  "use strict";

  function flag(name, search){
    return new RegExp("(^|[?&])" + name + "=1(&|$)").test(search || "");
  }
  function canFullscreen(root){
    return !!(root.requestFullscreen || root.webkitRequestFullscreen);
  }
  function toggleFullscreen(doc){
    var root = doc.documentElement;
    try{
      if (doc.fullscreenElement || doc.webkitFullscreenElement)
        (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc);
      else
        (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
    }catch(e){ /* на доске без поддержки просто ничего не происходит */ }
  }

  /* setBoard можно передать снаружи — например, из тренажёра, который
     ещё и сохраняет настройку. По умолчанию только переключает класс. */
  function init(doc, opts){
    opts = opts || {};
    var root = doc.documentElement;
    var boardBtn = doc.getElementById(opts.boardId || "boardBtn");
    var mirrorBtn = doc.getElementById(opts.mirrorId || "mirrorBtn");
    var fsBtn = doc.getElementById(opts.fsId || "fsBtn");

    var setBoard = opts.setBoard || function(on){
      root.classList.toggle("board", on);
      if (boardBtn){
        boardBtn.setAttribute("aria-pressed", String(on));
        boardBtn.textContent = on ? "Обычный вид" : "Режим доски";
      }
    };
    function setMirror(on){
      root.classList.toggle("mirror", on);
      if (mirrorBtn){
        mirrorBtn.setAttribute("aria-pressed", String(on));
        mirrorBtn.textContent = on ? "Убрать зеркало" : "Зеркало";
      }
    }

    if (boardBtn) boardBtn.addEventListener("click", function(){
      setBoard(!root.classList.contains("board"));
    });
    if (mirrorBtn) mirrorBtn.addEventListener("click", function(){
      setMirror(!root.classList.contains("mirror"));
    });
    if (fsBtn){
      if (!canFullscreen(root)) fsBtn.remove();
      else fsBtn.addEventListener("click", function(){ toggleFullscreen(doc); });
    }

    var win = doc.defaultView;
    var search = (win && win.location && win.location.search) || "";
    if (flag("board", search)) setBoard(true);
    if (flag("mirror", search)) setMirror(true);

    return { setBoard:setBoard, setMirror:setMirror };
  }

  return { init:init, flag:flag, canFullscreen:canFullscreen, toggleFullscreen:toggleFullscreen };
})();
if (typeof module !== "undefined") module.exports = BOARD;
