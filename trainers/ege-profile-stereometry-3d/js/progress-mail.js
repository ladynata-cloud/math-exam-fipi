(function () {
  "use strict";

  var TEACHER_EMAIL = "nata4os@bk.ru";
  var STORAGE_KEY = "stereo3.status";

  function readStatus() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function getProblems() {
    return typeof PROBLEMS !== "undefined" && Array.isArray(PROBLEMS) ? PROBLEMS : [];
  }

  function getTopics() {
    return typeof TOPICS !== "undefined" && Array.isArray(TOPICS) ? TOPICS : [];
  }

  function topicOf(p) {
    return p.topic || "Параллелепипед";
  }

  function makeReport() {
    var problems = getProblems();
    var topics = getTopics();
    var status = readStatus();
    var byTopic = {};
    var attempted = 0;
    var solved = 0;
    var revealed = 0;
    var wrong = 0;

    topics.forEach(function (t) {
      byTopic[t] = { total: 0, ok: 0, fail: 0, revealed: 0 };
    });

    problems.forEach(function (p) {
      var topic = topicOf(p);
      if (!byTopic[topic]) byTopic[topic] = { total: 0, ok: 0, fail: 0, revealed: 0 };
      byTopic[topic].total += 1;

      var item = status[p.id];
      if (!item) return;
      attempted += 1;
      if (item.st === "ok") {
        solved += 1;
        byTopic[topic].ok += 1;
      } else if (item.st === "fail") {
        wrong += 1;
        byTopic[topic].fail += 1;
      }
      if (item.revealed) {
        revealed += 1;
        byTopic[topic].revealed += 1;
      }
    });

    var lines = [
      "Прогресс ученика",
      "",
      "Тренажёр: Стереометрия, задание 3 ЕГЭ",
      "Сайт: " + location.href,
      "Дата: " + new Date().toLocaleString("ru-RU"),
      "Имя ученика: ",
      "",
      "Всего задач: " + problems.length,
      "Решено верно: " + solved,
      "Пробовали решить: " + attempted,
      "Ошибок/неверных попыток: " + wrong,
      "Открывали решение/подсказки: " + revealed,
      "",
      "По темам:"
    ];

    Object.keys(byTopic).forEach(function (topic) {
      var s = byTopic[topic];
      if (!s.total) return;
      lines.push("- " + topic + ": " + s.ok + " из " + s.total + " верно, " + s.fail + " с ошибкой");
    });

    lines.push("");
    lines.push("Комментарий ученика: ");
    return lines.join("\n");
  }

  function sendReport() {
    var subject = "Прогресс: стереометрия, задание 3 ЕГЭ";
    var body = makeReport();
    window.location.href =
      "mailto:" + TEACHER_EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
  }

  function mountButton() {
    if (document.getElementById("sendProgressMail")) return;

    var card = document.createElement("div");
    card.className = "progress-mail-card";
    card.innerHTML =
      '<div class="progress-mail-text">' +
      '<div class="progress-mail-title">Отчёт учителю</div>' +
      '<div>Прогресс сохранён в этом браузере. Письмо будет адресовано учителю автоматически.</div>' +
      '</div>' +
      '<button class="btn mail" id="sendProgressMail" type="button">Отправить прогресс</button>';

    var hubTarget = document.getElementById("hubTotal");
    var trainerTarget = document.querySelector(".subtitle");
    var target = hubTarget || trainerTarget || document.body.firstElementChild;

    if (hubTarget) {
      target.insertAdjacentElement("afterend", card);
    } else if (trainerTarget) {
      card.classList.add("compact");
      target.insertAdjacentElement("afterend", card);
    } else {
      document.body.insertBefore(card, document.body.firstChild);
    }

    document.getElementById("sendProgressMail").addEventListener("click", sendReport);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountButton);
  } else {
    mountButton();
  }
})();
