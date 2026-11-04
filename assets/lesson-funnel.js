/* Public lesson funnel. No pupil pages, answer data, URL queries or replay. */
(function () {
  'use strict';
  var w = window, d = document, counter = 113810914;
  var page = w.location.pathname.replace(/index\.html$/, '');
  var pages = ['/', '/lessons/', '/courses/', '/foundations/', '/trainers/oge-course/',
    '/topics/', '/topics/delenie-ugolkom/', '/topics/obyknovennye-drobi/',
    '/topics/procenty/', '/topics/lineynye-uravneniya/', '/topics/oge-geometriya/'];
  if (w.location.hostname !== 'mathexam.space' || pages.indexOf(page) === -1 ||
      w.self !== w.top || w.navigator.doNotTrack === '1' || w.doNotTrack === '1' ||
      w.navigator.globalPrivacyControl === true || w.__mathExamLessonFunnel) return;
  w.__mathExamLessonFunnel = true;

  function send() {
    try { w.ym.apply(w, arguments); } catch (_) { /* Links must keep working. */ }
  }
  w.ym = w.ym || function () { (w.ym.a = w.ym.a || []).push(arguments); };
  w.ym.l = w.ym.l || +new Date();
  var tag = d.createElement('script');
  tag.async = true;
  tag.src = 'https://mc.yandex.ru/metrika/tag.js?id=' + counter;
  d.head.appendChild(tag);
  send(counter, 'init', {defer: true, webvisor: false, clickmap: false,
    trackLinks: false, trackHash: false, ecommerce: false, disableYtm: true});
  var referrer = '';
  try { referrer = new URL(d.referrer).origin; } catch (_) {}
  send(counter, 'hit', 'https://mathexam.space' + page,
    {title: 'MathExam', referer: referrer});

  function goal(name, placement, destination) {
    send(counter, 'reachGoal', name, {page: page, placement: placement, destination: destination});
  }
  if (page === '/lessons/') goal('lesson_page_view', 'page', 'lessons');

  var destinations = {
    'https://t.me/ladynata3000': ['lesson_contact_click', 'telegram'],
    'https://vk.ru/ladynata3000': ['lesson_contact_click', 'vk'],
    'https://t.me/mathexamspace': ['channel_click', 'telegram'],
    'https://max.ru/join/KKMgzGoEUezcYD_sJGMdvP1hcy90-3sTiZvkRk1_I3c': ['channel_click', 'max'],
    'https://vk.com/mathexamspace': ['channel_click', 'vk'],
    'https://dzen.ru/mathexamspace': ['channel_click', 'dzen']
  };
  function placement(a) {
    if (a.closest('header')) return 'header';
    if (a.closest('footer')) return 'footer';
    if (a.closest('.me-contacts')) return 'invitation';
    if (a.closest('.hero, .me-lesson-intro')) return 'hero';
    return 'content';
  }
  function click(event) {
    if (event.defaultPrevented || (event.type === 'auxclick' && event.button !== 1)) return;
    var a = event.target.closest && event.target.closest('a[href]');
    if (!a) return;
    var url;
    try { url = new URL(a.href, w.location.href); } catch (_) { return; }
    var target = destinations[url.href];
    if (target) goal(target[0], placement(a), target[1]);
    else if (url.origin === w.location.origin &&
        url.pathname.replace(/index\.html$/, '') === '/lessons/' &&
        (page !== '/lessons/' || url.hash === '#contact')) {
      goal('lesson_details_click', placement(a), url.hash === '#contact' ? 'contact_section' : 'lessons');
    }
  }
  d.addEventListener('click', click);
  d.addEventListener('auxclick', click);

  // Count a card once only after at least 25% is visible in an active tab.
  if (w.IntersectionObserver) {
    var seen = new Set(), visible = new Set();
    function views() {
      if (d.visibilityState !== 'visible') return;
      visible.forEach(function (card) {
        var kind = card.classList.contains('me-contact-channel') ? 'channel' : 'lesson';
        if (seen.has(kind)) return;
        seen.add(kind);
        goal(kind + '_invitation_view', 'invitation', kind);
      });
    }
    var observer = new w.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.25) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      views();
    }, {threshold: [0, 0.25]});
    d.querySelectorAll('.me-contact-card').forEach(function (card) { observer.observe(card); });
    d.addEventListener('visibilitychange', views);
  }
}());
