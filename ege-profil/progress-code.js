/* =========================================================================
   КОД ПРОГРЕССА — перенос прогресса от ученика к учителю без сервера.

   Формат строки:  MEP1.<base64url>
   Внутри base64url: первый байт — способ упаковки (1 — deflate-raw,
   0 — как есть), дальше сам JSON объекта mathExamCourseProgress.v1
   в UTF-8. Байт-заголовок нужен, чтобы код, собранный в браузере без
   CompressionStream, читался там, где CompressionStream есть, и наоборот.

   Ключ localStorage, TID и формат прогресса не меняются: объект берётся
   и кладётся целиком, как есть.
   ========================================================================= */
var PROGRESS_CODE = (function(){
  "use strict";

  var KEY = "mathExamCourseProgress.v1";
  var BACKUP = KEY + ".backup";
  var PREFIX = "MEP1.";
  var RAW = 0, DEFLATED = 1;

  /* ---------- байты и base64url ---------- */
  function toUtf8(str){
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(str);
    var out = [], i, c;
    for (i = 0; i < str.length; i++){
      c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xC0 | (c >> 6), 0x80 | (c & 63));
      else out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return new Uint8Array(out);
  }
  function fromUtf8(bytes){
    if (typeof TextDecoder !== "undefined") return new TextDecoder("utf-8", { fatal:true }).decode(bytes);
    var s = "", i = 0, c, c2, c3;
    while (i < bytes.length){
      c = bytes[i++];
      if (c < 0x80) s += String.fromCharCode(c);
      else if (c < 0xE0){ c2 = bytes[i++]; s += String.fromCharCode(((c & 31) << 6) | (c2 & 63)); }
      else { c2 = bytes[i++]; c3 = bytes[i++]; s += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63)); }
    }
    return s;
  }
  function b64urlEncode(bytes){
    var bin = "", i, CHUNK = 0x8000;
    for (i = 0; i < bytes.length; i += CHUNK)
      bin += String.fromCharCode.apply(null, Array.prototype.slice.call(bytes, i, i + CHUNK));
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function b64urlDecode(str){
    var s = str.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    var bin = atob(s), out = new Uint8Array(bin.length), i;
    for (i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function concat(head, tail){
    var out = new Uint8Array(1 + tail.length);
    out[0] = head;
    out.set(tail, 1);
    return out;
  }

  /* ---------- сжатие ---------- */
  function hasCompression(){ return typeof CompressionStream !== "undefined"; }
  function hasDecompression(){ return typeof DecompressionStream !== "undefined"; }

  function pump(stream, bytes){
    var writer = stream.writable.getWriter();
    writer.write(bytes);
    writer.close();
    var reader = stream.readable.getReader(), chunks = [], total = 0;
    function step(){
      return reader.read().then(function(res){
        if (res.done){
          var out = new Uint8Array(total), off = 0, i;
          for (i = 0; i < chunks.length; i++){ out.set(chunks[i], off); off += chunks[i].length; }
          return out;
        }
        chunks.push(res.value); total += res.value.length;
        return step();
      });
    }
    return step();
  }
  function deflate(bytes){ return pump(new CompressionStream("deflate-raw"), bytes); }
  function inflate(bytes){ return pump(new DecompressionStream("deflate-raw"), bytes); }

  /* ---------- кодирование и разбор ---------- */
  function encode(obj){
    var json;
    try{ json = JSON.stringify(obj == null ? {} : obj); }
    catch(e){ return Promise.reject(new Error("Прогресс не сериализуется в JSON.")); }
    var bytes = toUtf8(json);
    if (!hasCompression()) return Promise.resolve(PREFIX + b64urlEncode(concat(RAW, bytes)));
    return deflate(bytes)
      .then(function(z){ return PREFIX + b64urlEncode(concat(DEFLATED, z)); })
      .catch(function(){ return PREFIX + b64urlEncode(concat(RAW, bytes)); });
  }

  function decode(code){
    var s = String(code == null ? "" : code).replace(/\s+/g, "");
    if (!s) return Promise.reject(new Error("Код пустой — вставьте строку, которая начинается с MEP1."));
    if (s.slice(0, PREFIX.length) !== PREFIX)
      return Promise.reject(new Error("Это не код прогресса: строка должна начинаться с MEP1."));
    var body = s.slice(PREFIX.length);
    if (!/^[A-Za-z0-9\-_]+$/.test(body))
      return Promise.reject(new Error("Код повреждён: в нём есть посторонние символы. Скопируйте строку целиком, без переносов."));

    var bytes;
    try{ bytes = b64urlDecode(body); }
    catch(e){ return Promise.reject(new Error("Код повреждён: не читается как base64.")); }
    if (!bytes.length) return Promise.reject(new Error("Код повреждён: пустая полезная часть."));

    var flag = bytes[0], rest = bytes.slice(1);
    var payload;
    if (flag === RAW) payload = Promise.resolve(rest);
    else if (flag === DEFLATED){
      if (!hasDecompression())
        return Promise.reject(new Error("Этот браузер не умеет распаковывать код (нет DecompressionStream). Откройте кабинет в свежем Chrome, Edge или Firefox."));
      payload = inflate(rest).catch(function(){ throw new Error("Код повреждён: не распаковывается."); });
    }
    else return Promise.reject(new Error("Неизвестная версия кода прогресса."));

    return payload.then(function(raw){
      var text;
      try{ text = fromUtf8(raw); }
      catch(e){ throw new Error("Код повреждён: внутри не текст UTF-8."); }
      var obj;
      try{ obj = JSON.parse(text); }
      catch(e){ throw new Error("Код повреждён: внутри не JSON."); }
      if (!obj || typeof obj !== "object" || Array.isArray(obj))
        throw new Error("Код прочитан, но это не объект прогресса.");
      return obj;
    });
  }

  /* ---------- localStorage ---------- */
  function readLive(){
    try{ var raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : {}; }
    catch(e){ return {}; }
  }
  /* Пишет прогресс в этот браузер, сохранив прежний под ключом .backup.
     Возвращает true, если резервная копия сделана. */
  function loadInto(obj){
    var cur;
    try{ cur = localStorage.getItem(KEY); }catch(e){ cur = null; }
    try{
      localStorage.setItem(BACKUP, cur === null ? "{}" : cur);
      localStorage.setItem(KEY, JSON.stringify(obj));
    }catch(e){ throw new Error("Браузер не дал записать прогресс (хранилище переполнено или запрещено)."); }
    return true;
  }
  function hasBackup(){
    try{ return localStorage.getItem(BACKUP) !== null; }catch(e){ return false; }
  }
  function restoreBackup(){
    var b;
    try{ b = localStorage.getItem(BACKUP); }catch(e){ b = null; }
    if (b === null) throw new Error("Резервной копии нет.");
    try{ localStorage.setItem(KEY, b); }
    catch(e){ throw new Error("Браузер не дал записать прогресс."); }
    return true;
  }

  /* ---------- интерфейс выдачи кода ---------- */
  /* host — узел, внутрь которого рисуется панель. compact:true — короткий
     вид для подвала главной. Ничего не пишет в localStorage. */
  function mount(host, opts){
    opts = opts || {};
    var d = host.ownerDocument;
    host.innerHTML = "";

    var openBtn = d.createElement("button");
    openBtn.type = "button";
    openBtn.className = opts.compact ? "linkbtn" : "btn";
    openBtn.id = opts.id || "codeBtn";
    openBtn.textContent = "Скопировать код прогресса";
    host.appendChild(openBtn);

    var panel = d.createElement("div");
    panel.className = "codepanel";
    panel.hidden = true;
    panel.innerHTML =
      '<p class="small muted">Строка ниже — весь прогресс этого браузера. Передайте её учителю: скопируйте текст или покажите QR-код.</p>' +
      '<textarea class="codebox" readonly rows="4" aria-label="Код прогресса"></textarea>' +
      '<p class="codeactions"><button type="button" class="btn ghost copy">Копировать</button>' +
      '<span class="codelen small muted"></span></p>' +
      '<div class="qr" aria-live="polite"></div>' +
      '<p class="status small" role="status" aria-live="polite"></p>';
    host.appendChild(panel);

    var box = panel.querySelector(".codebox");
    var status = panel.querySelector(".status");
    var qrBox = panel.querySelector(".qr");
    var lenEl = panel.querySelector(".codelen");

    function say(text, bad){
      status.textContent = text || "";
      status.className = "status small" + (bad ? " bad" : "");
    }
    function drawQr(code){
      qrBox.innerHTML = "";
      if (typeof QR === "undefined") return;
      var qr = null;
      try{ qr = QR.encode(code); }catch(e){ qr = null; }
      if (!qr){
        qrBox.innerHTML = '<p class="small muted">Прогресс уже слишком большой для QR-кода — передайте строку текстом.</p>';
        return;
      }
      var wrap = d.createElement("div");
      wrap.className = "qrframe";
      wrap.innerHTML = QR.svg(qr, { label:"QR-код с кодом прогресса" });
      qrBox.appendChild(wrap);
    }

    openBtn.addEventListener("click", function(){
      panel.hidden = false;
      openBtn.disabled = true;
      say("Собираю код…");
      encode(readLive()).then(function(code){
        box.value = code;
        lenEl.textContent = "длина: " + code.length + " симв.";
        drawQr(code);
        say("Код готов. Он не уходит в сеть — только в буфер обмена или на экран.");
        openBtn.disabled = false;
        try{ box.focus(); box.select(); }catch(e){}
      }).catch(function(err){
        say((err && err.message) || "Не получилось собрать код.", true);
        openBtn.disabled = false;
      });
    });

    panel.querySelector(".copy").addEventListener("click", function(){
      if (!box.value){ say("Сначала соберите код.", true); return; }
      try{ box.focus(); box.select(); }catch(e){}
      if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(box.value)
          .then(function(){ say("Скопировано в буфер обмена."); })
          .catch(function(){ say("Скопируйте выделенную строку вручную: Ctrl+C."); });
        return;
      }
      var done = false;
      try{ done = d.execCommand("copy"); }catch(e){ done = false; }
      say(done ? "Скопировано в буфер обмена." : "Скопируйте выделенную строку вручную: Ctrl+C.");
    });

    return { panel:panel, box:box, button:openBtn };
  }

  return { KEY:KEY, BACKUP:BACKUP, PREFIX:PREFIX,
           encode:encode, decode:decode, readLive:readLive,
           loadInto:loadInto, hasBackup:hasBackup, restoreBackup:restoreBackup,
           hasCompression:hasCompression, mount:mount };
})();
if (typeof module !== "undefined") module.exports = PROGRESS_CODE;
