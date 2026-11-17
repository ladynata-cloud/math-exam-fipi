/* The board/cabinet owns navigation inside its embedded trainer. */
(function(){
  'use strict';
  const nav=document.querySelector('nav.oge-wayfinding');
  if(nav&&(window.self!==window.top||new URLSearchParams(location.search).get('board')==='1'))nav.hidden=true;
})();
