/* One original atlas, one object per DOM token. Emoji remain the load-error fallback. */
(() => {
  'use strict';
  const symbols = [
    '🍎','🥪','☕','🍊','🍓','🥄',
    '🖍️','🔺','⭕','⚽','⭐','🪣',
    '✏️','🖼️','📗','📄','🧲','🃏',
    '🔵','🛞','🌟','🎀','🕯️','🚩',
    '🥞','🥔','🍪','🍐','🍞','🌻',
    '🌼','🌷','🍑','🥕','🌱','🎫',
    '🔘','🪑','🌹','🧸','🎈','🔦',
    '🔋','🏞️','🥫','🗺️','📦','fox'
  ];
  const normalize = text => String(text).replace(/\uFE0F/g,'');
  const positions = new Map(symbols.map((symbol,index) => [normalize(symbol),index]));
  // That generated atlas cell contains a pair; never represent it as one peach.
  positions.delete('🍑');
  const aliases = {'💌':'🏞️','✉':'📄','🏅':'🌟','●':'🔵'};
  let peachRequested = false;
  function decorate(node,symbol) {
    const normalized = normalize(symbol);
    if (normalized === '🍑') {
      node.classList.add('adv-peach-token');
      if (!peachRequested) {
        peachRequested = true;
        const peach = new Image();
        peach.onload = () => document.documentElement.classList.add('arz-peach-ready');
        peach.src = new URL('arzhenikov-peach.png',base).href;
      }
      return node;
    }
    const index = positions.get(normalize(aliases[normalized] || normalized));
    if (index === undefined) return node;
    node.classList.add('adv-token');
    node.dataset.token = normalized;
    node.style.setProperty('--token-x', (index % 6) * 20 + '%');
    node.style.setProperty('--token-y', Math.floor(index / 6) * 100 / 7 + '%');
    return node;
  }
  window.ArzhenikovArt = {decorate};
  const base = document.currentScript?.src || location.href;
  for (const [file,className] of [['arzhenikov-object-atlas.png','arz-art-ready'],['arzhenikov-world-atlas.png','arz-world-ready']]) {
    const asset = new Image();
    asset.onload = () => document.documentElement.classList.add(className);
    asset.src = new URL(file,base).href;
  }
  const mascot = document.getElementById('adventure-mascot');
  if (mascot) decorate(mascot,'fox');
})();
