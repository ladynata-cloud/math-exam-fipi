(function () {
  'use strict';

  if (typeof Path2D !== 'function') return;

  const turn = Math.PI * 2;
  const cycle = value => value - Math.floor(value);

  function ease(from, to, value) {
    const part = Math.max(0, Math.min(1, (value - from) / (to - from)));
    return part * part * (3 - 2 * part);
  }

  function buffer(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return { canvas, context: canvas.getContext('2d') };
  }

  function glow(ctx, x, y, radius, rgb, opacity) {
    const light = ctx.createRadialGradient(x, y, 0, x, y, radius);
    light.addColorStop(0, 'rgba(' + rgb + ',' + opacity + ')');
    light.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = light;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function dot(ctx, x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, turn);
    ctx.fill();
  }

  function mask(layer, fade) {
    const ctx = layer.context;
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(fade, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }

  // Warp only the surface and the center of the whirlpool in the original panorama.
  // The soft masks blend the two moving patches into the rest of the illustration.
  function waterTextures(image, width, height) {
    const surfaceY = 16;
    const surfaceHeight = 64;
    const stripHeight = 4;
    const swell = buffer(width, surfaceHeight);
    const surfaceFade = buffer(width, surfaceHeight);
    const vertical = surfaceFade.context.createLinearGradient(0, 0, 0, surfaceHeight);
    vertical.addColorStop(0, '#0000');
    vertical.addColorStop(.22, '#000');
    vertical.addColorStop(.70, '#000');
    vertical.addColorStop(1, '#0000');
    surfaceFade.context.fillStyle = vertical;
    surfaceFade.context.fillRect(0, 0, width, surfaceHeight);
    surfaceFade.context.globalCompositeOperation = 'destination-in';
    const horizontal = surfaceFade.context.createLinearGradient(0, 0, width, 0);
    horizontal.addColorStop(0, '#0000');
    horizontal.addColorStop(.016, '#000');
    horizontal.addColorStop(.984, '#000');
    horizontal.addColorStop(1, '#0000');
    surfaceFade.context.fillStyle = horizontal;
    surfaceFade.context.fillRect(0, 0, width, surfaceHeight);

    const centerX = 499;
    const centerY = 91;
    const rx = 124;
    const ry = 42;
    const vortex = buffer(rx * 2, ry * 2);
    const vortexFade = buffer(rx * 2, ry * 2);
    const fade = vortexFade.context;
    fade.translate(rx, ry);
    fade.scale(rx, ry);
    const circular = fade.createRadialGradient(0, 0, .22, 0, 0, 1);
    circular.addColorStop(0, '#000');
    circular.addColorStop(.60, '#000e');
    circular.addColorStop(1, '#0000');
    fade.fillStyle = circular;
    fade.fillRect(-1, -1, 2, 2);

    return function drawTextures(world, time) {
      if (!image.complete || !image.naturalWidth) return;
      const pixelsPerY = image.naturalHeight / height;
      const waves = swell.context;
      waves.clearRect(0, 0, width, surfaceHeight);
      for (let row = 0; row < surfaceHeight; row += stripHeight) {
        const drift = 3.1 * Math.sin(row * .145 + time * 1.65) + 1.8 * Math.sin(row * .068 - time * 1.24);
        waves.drawImage(image, 0, (surfaceY + row) * pixelsPerY, image.naturalWidth, stripHeight * pixelsPerY,
          drift, row, width, stripHeight);
      }
      mask(swell, surfaceFade.canvas);
      world.drawImage(swell.canvas, 0, surfaceY);

      const swirl = vortex.context;
      swirl.clearRect(0, 0, rx * 2, ry * 2);
      swirl.save();
      swirl.translate(rx, ry);
      swirl.scale(1, ry / rx);
      swirl.rotate(time * .34);
      swirl.scale(1, rx / ry);
      swirl.drawImage(image, -centerX, -centerY, width, height);
      swirl.restore();
      mask(vortex, vortexFade.canvas);
      world.drawImage(vortex.canvas, centerX - rx, centerY - ry);
    };
  }

  const surfaceCrests = [[35, 138, 30], [276, 164, 39], [567, 173, 36], [819, 177, 27]];
  function surfaceLight(ctx, time) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.7;
    for (const [start, length, level] of surfaceCrests) {
      const center = start + length * (.48 + .28 * Math.sin(time * .65 + start));
      const fade = ctx.createLinearGradient(center - 49, 0, center + 49, 0);
      fade.addColorStop(0, '#a9f4ff00');
      fade.addColorStop(.5, '#c9f7ff96');
      fade.addColorStop(1, '#a9f4ff00');
      ctx.strokeStyle = fade;
      ctx.beginPath();
      for (let x = start; x <= start + length; x += 5) {
        const y = level + 2.7 * Math.sin(x * .083 - time * 2) + 1.5 * Math.sin(x * .13 - time * 1.2);
        if (x === start) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    for (let index = 0; index < 5; index++) {
      const radius = 48 + index * 17;
      const angle = time * .52 + index * 1.7;
      ctx.beginPath();
      ctx.ellipse(499, 91, radius, radius * .30, -.09, angle, angle + .52);
      ctx.strokeStyle = index % 2 ? '#b9f9f68c' : '#74dfef8c';
      ctx.stroke();
    }
    ctx.restore();
  }

  const schools = [
    { x: 32, y: 121, distance: 255, direction: 1, period: 13, phase: .35, color: '#dcf4cf', size: .63 },
    { x: 414, y: 223, distance: 247, direction: -1, period: 17, phase: .42, color: '#a3dce8', size: .55 },
    { x: 501, y: 269, distance: 231, direction: 1, period: 21, phase: .24, color: '#9ae6e4', size: .45 }
  ];
  function schoolsOfFish(ctx, time) {
    for (const school of schools) {
      const progress = cycle(time / school.period + school.phase);
      const head = school.x + progress * school.distance * school.direction;
      const fade = Math.min(1, progress * 8, (1 - progress) * 8);
      for (let index = 0; index < 13; index++) {
        const tail = Math.sin(time * 7.7 + index * 1.4);
        const x = head - (index * 31 % 70) * school.direction;
        const y = school.y + (index * 13 % 27) + 6 * Math.sin(time * 1.15 + index * .4);
        const size = school.size * (.71 + index % 4 * .12);
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(size * school.direction, size);
        ctx.globalAlpha = fade * (.62 + index % 3 * .11);
        ctx.fillStyle = school.color;
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.quadraticCurveTo(2, -4, -5, -.7);
        ctx.lineTo(-9, -3 + tail);
        ctx.lineTo(-8, 0);
        ctx.lineTo(-9, 3 + tail);
        ctx.lineTo(-5, .7);
        ctx.quadraticCurveTo(2, 3.2, 8, 0);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  function glidingRay(ctx, time) {
    const progress = cycle(time / 23 + .26);
    const x = 109 + progress * 455;
    const y = 169 + 23 * Math.sin(progress * turn) + 4 * Math.sin(time * 1.8);
    const wing = Math.sin(time * 3.1) * 5.4;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(.13 * Math.cos(progress * turn));
    ctx.globalAlpha = Math.min(.88, progress * 8, (1 - progress) * 8);
    ctx.strokeStyle = '#75b6c3';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.quadraticCurveTo(-23, 4 + wing * .24, -37, -3 - wing * .35);
    ctx.stroke();
    const body = ctx.createLinearGradient(0, -23, 2, 18);
    body.addColorStop(0, '#a7d8db');
    body.addColorStop(.45, '#35788b');
    body.addColorStop(1, '#164b61');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.bezierCurveTo(10, -5, 1, -9, -12, -22 - wing);
    ctx.bezierCurveTo(-9, -9, -17, -4, -16, 0);
    ctx.bezierCurveTo(-17, 5, -9, 10, -10, 18 + wing);
    ctx.bezierCurveTo(0, 9, 12, 7, 18, 0);
    ctx.fill();
    ctx.strokeStyle = '#8fd5d7';
    ctx.lineWidth = .7;
    ctx.stroke();
    ctx.restore();
  }

  const blades = [[52, 326, 44], [65, 336, 52], [91, 357, 42], [117, 397, 45], [244, 443, 34], [262, 447, 47], [273, 447, 32]];
  function wreck(ctx, time) {
    ctx.save();
    for (const [x, y, length] of blades) {
      const sway = 13 * Math.sin(time * 1.35 + x * .18);
      const seaweed = ctx.createLinearGradient(x, y, x, y - length);
      seaweed.addColorStop(0, '#39634cbb');
      seaweed.addColorStop(.65, '#8fac659c');
      seaweed.addColorStop(1, '#d4ce7d55');
      ctx.fillStyle = seaweed;
      ctx.beginPath();
      ctx.moveTo(x - 2, y);
      ctx.quadraticCurveTo(x + 12, y - length * .45, x + sway, y - length);
      ctx.quadraticCurveTo(x + 17, y - length * .40, x + 2, y);
      ctx.fill();
    }
    glow(ctx, 160, 379, 26, '255,202,108', .22 + .10 * Math.sin(time * 2));
    const x = 192 + 7 * Math.sin(time * .8);
    glow(ctx, x, 323, 24, '255,220,143', .23 + .06 * Math.cos(time * 1.6));
    ctx.restore();
  }

  function atlantis(ctx, time) {
    glow(ctx, 717, 209, 44, '88,243,224', .24 + .09 * Math.sin(time * 1.75));
    glow(ctx, 711, 225, 27, '138,255,209', .21 + .09 * Math.cos(time * 1.7));
    ctx.save();
    for (let index = 0; index < 12; index++) {
      const flow = cycle(time * .19 + index * .183);
      ctx.globalAlpha = Math.sin(flow * Math.PI) * .72;
      const x = 711 + (index * 13 % 38) - 19 + 4 * Math.sin(time + index);
      dot(ctx, x, 250 - 86 * flow, 1 + index % 3 * .43, '#b8fff0');
    }
    ctx.restore();
  }

  const jellies = [[915, 126, .85], [984, 175, 1.20], [957, 236, .65], [1006, 119, .69]];
  function cave(ctx, time) {
    glow(ctx, 871, 109, 14, '109,236,243', .21 + .11 * Math.sin(time * 1.3));
    for (const [x, y, size] of jellies) {
      const beat = time * 2.35 + x;
      const pulse = Math.sin(beat);
      ctx.save();
      ctx.translate(x + 13 * Math.sin(time * .34 + y), y + 17 * Math.sin(time * .49 + x) + pulse * 2);
      ctx.scale(size * (1 - pulse * .13), size * (1 + pulse * .13));
      glow(ctx, 0, -3, 18, '190,124,248', .44);
      ctx.strokeStyle = '#d1a3f0ab';
      ctx.lineWidth = .9;
      for (let index = -2; index <= 2; index++) {
        const sway = 4.4 * Math.sin(beat + index);
        ctx.beginPath();
        ctx.moveTo(index * 3, -1);
        ctx.bezierCurveTo(index * 4 - sway, 6, index * 3 + sway, 14, index * 4 - sway, 23 + index % 2 * 3);
        ctx.stroke();
      }
      const bell = ctx.createLinearGradient(0, -12, 0, 3);
      bell.addColorStop(0, '#edb6ffcb');
      bell.addColorStop(.62, '#b27beed0');
      bell.addColorStop(1, '#8e65db75');
      ctx.fillStyle = bell;
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.bezierCurveTo(-10, -13, 9, -14, 12, 0);
      ctx.quadraticCurveTo(0, 5, -12, 0);
      ctx.fill();
      ctx.strokeStyle = '#f2cfff91';
      ctx.stroke();
      ctx.restore();
    }
  }

  const serpentCrown = new Path2D('M 33 11 Q 21 22 4 14 L -16 9 Q -34 10 -51 8 L -65 8 Q -74 5 -69 -1 L -49 -10 L -29 -16 Q -16 -25 1 -20 L 23 -31 L 18 -19 L 47 -26 L 31 -11 L 48 -13 Q 40 -6 30 0 Z');
  const serpentJaw = new Path2D('M 6 5 Q -12 14 -34 11 L -64 7 L -62 13 Q -45 23 -18 22 Q 0 26 13 14 Z');
  const serpentTeeth = new Path2D('M -64 6 l 3 6 4 -6 M -55 7 l 4 10 5 -10 M -43 7 l 4 8 5 -8 M -31 8 l 4 6 4 -6 M -20 8 l 4 5 4 -5');
  const serpentLowerTeeth = new Path2D('M -57 10 l 4 -6 4 8 M -44 13 l 4 -7 4 8 M -31 14 l 4 -5 4 6');

  function serpentHead(ctx, x, y, mouth, time) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(.075 * Math.sin(time * 2.6) + mouth * .13);
    const skin = ctx.createLinearGradient(0, -29, -5, 25);
    skin.addColorStop(0, '#759bc0');
    skin.addColorStop(.32, '#36788e');
    skin.addColorStop(.66, '#193b54');
    skin.addColorStop(1, '#0b2237');

    // The lower jaw swings about its hinge, revealing the throat between the lips.
    const angle = -.64 * mouth;
    const throat = ctx.createLinearGradient(0, 4, -30, 41);
    throat.addColorStop(0, '#101528');
    throat.addColorStop(1, '#673848');
    ctx.fillStyle = throat;
    ctx.beginPath();
    ctx.moveTo(5, 7);
    ctx.quadraticCurveTo(-32, 2, -65, 7);
    ctx.lineTo(-64 * Math.cos(angle), 7 - 64 * Math.sin(angle));
    ctx.quadraticCurveTo(-21, 28 * mouth + 13, 5, 14);
    ctx.fill();

    ctx.save();
    ctx.translate(0, 6);
    ctx.rotate(angle);
    ctx.translate(0, -6);
    ctx.fillStyle = '#d5ddd0';
    ctx.fill(serpentLowerTeeth);
    ctx.fillStyle = skin;
    ctx.fill(serpentJaw);
    ctx.strokeStyle = '#6895a980';
    ctx.lineWidth = 1.05;
    ctx.stroke(serpentJaw);
    ctx.restore();

    ctx.fillStyle = '#e1e7d2';
    ctx.fill(serpentTeeth);
    ctx.fillStyle = skin;
    ctx.fill(serpentCrown);
    ctx.save();
    ctx.clip(serpentCrown);
    glow(ctx, -33, -19, 39, '119,193,198', .46);
    glow(ctx, 5, -21, 28, '107,122,186', .42);
    for (let row = 0; row < 4; row++) {
      for (let column = 0; column < 12; column++) {
        const scaleX = -63 + column * 7.7 + row % 2 * 4;
        const scaleY = -17 + row * 7 + 1.5 * Math.sin(column * 1.4 + row);
        ctx.beginPath();
        ctx.moveTo(scaleX - 3, scaleY + 2);
        ctx.quadraticCurveTo(scaleX + 2, scaleY - 2.4, scaleX + 4, scaleY + 2.1);
        ctx.strokeStyle = row % 2 ? '#98ccd459' : '#061a3785';
        ctx.lineWidth = .72;
        ctx.stroke();
      }
    }
    ctx.restore();
    ctx.strokeStyle = '#83aabe97';
    ctx.lineWidth = 1.15;
    ctx.stroke(serpentCrown);
    ctx.strokeStyle = '#7ca9c28c';
    ctx.beginPath();
    ctx.moveTo(-61, 0);
    ctx.quadraticCurveTo(-47, -3, -33, -12);
    ctx.quadraticCurveTo(-20, -24, -3, -16);
    ctx.moveTo(-7, -4);
    ctx.quadraticCurveTo(14, -9, 23, -22);
    ctx.moveTo(4, 3);
    ctx.quadraticCurveTo(28, 1, 38, -20);
    ctx.stroke();
    for (let index = 0; index < 11; index++) {
      const dx = -8 + index % 4 * 8;
      const dy = -12 + Math.floor(index / 4) * 6 - index % 2;
      dot(ctx, dx, dy, 1.1, '#7fb8bc88');
    }
    dot(ctx, -57, -1, 1.7, '#0c2132');
    glow(ctx, -26, -9, 13, '236,191,93', .38);
    ctx.save();
    ctx.translate(-26, -8.5);
    ctx.rotate(-.21);
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 2.9, 0, 0, turn);
    ctx.fillStyle = '#ebc775';
    ctx.fill();
    ctx.fillStyle = '#121820';
    ctx.fillRect(-1, -2.7, 1.4, 5.3);
    ctx.restore();
    ctx.strokeStyle = '#254e67';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-32, -9);
    ctx.quadraticCurveTo(-26, -9.6, -18, -13);
    ctx.stroke();
    ctx.restore();
  }

  function serpentBody(ctx, x, y, reach, time) {
    const spine = [];
    for (let index = 0; index <= 28; index++) {
      const part = index / 28;
      const wave = Math.sin(part * 8.8 - time * 2.7) * Math.sin(part * Math.PI);
      const bx = x + 19 + (978 - x - 19) * part;
      const by = y + (183 - y) * part + wave * (19 + 30 * reach);
      const girth = (14 + 8 * Math.sin(part * Math.PI)) * (1 - .9 * part ** 2);
      spine.push([bx, by, girth]);
    }

    ctx.beginPath();
    for (const [bx, by, girth] of spine) ctx.lineTo(bx, by - girth);
    for (let index = spine.length - 1; index >= 0; index--) {
      const [bx, by, girth] = spine[index];
      ctx.lineTo(bx, by + girth);
    }
    ctx.closePath();
    const shade = ctx.createLinearGradient(x, 0, 978, 0);
    shade.addColorStop(0, '#24556f');
    shade.addColorStop(.6, '#15354f');
    shade.addColorStop(1, '#0a1f39');
    ctx.fillStyle = shade;
    ctx.fill();
    // Longitudinal bands follow the curves of the body and taper into the den.
    for (const [top, bottom, color] of [
      [-.98, -.64, '#76adc144'], [-.64, -.29, '#7fc9cd23'],
      [.27, .67, '#06152d40'], [.67, .98, '#050f2870']
    ]) {
      ctx.beginPath();
      for (const [bx, by, girth] of spine) ctx.lineTo(bx, by + top * girth);
      for (let index = spine.length - 1; index >= 0; index--) {
        const [bx, by, girth] = spine[index];
        ctx.lineTo(bx, by + bottom * girth);
      }
      ctx.fillStyle = color;
      ctx.fill();
    }

    for (let index = 1; index < spine.length - 3; index++) {
      const [bx, by, girth] = spine[index];
      const [nextX, nextY, nextGirth] = spine[index + 1];
      if (index % 2 === 0) {
        ctx.beginPath();
        ctx.moveTo(bx, by - girth + 2);
        ctx.quadraticCurveTo(bx + 4, by - girth - 5, nextX + girth * .65, nextY - girth * 1.85);
        ctx.quadraticCurveTo(nextX + girth * .3, nextY - girth * 1.14, nextX, nextY - nextGirth + 1);
        ctx.fillStyle = '#537a9c';
        ctx.fill();
      }
      ctx.beginPath();
      for (let row = -2; row <= 2; row++) {
        const seam = by + row * girth * .35;
        const offset = row % 2 * (nextX - bx) * .35;
        ctx.moveTo(bx + offset, seam - girth * .19);
        ctx.quadraticCurveTo(bx + offset - 4, seam, bx + offset, seam + girth * .19);
      }
      ctx.strokeStyle = index % 3 ? '#83b9be59' : '#8bc5ca93';
      ctx.lineWidth = .85;
      ctx.stroke();
      dot(ctx, bx - 3, by - girth * .45, 1.15, '#7cc7c09a');
    }
  }

  const denShadows = [[877, 111, 35], [902, 91, 40], [924, 94, 40], [949, 107, 40],
    [967, 133, 39], [965, 157, 38], [945, 171, 37], [918, 180, 37], [895, 195, 34], [878, 211, 27]];
  function seaSerpent(ctx, time) {
    const visit = (time + 24.5) % 29;
    if (visit >= 10.8) return;
    const opacity = ease(0, 1.2, visit) * (1 - ease(9.6, 10.8, visit));
    const reach = ease(0, 4.4, visit) * (1 - ease(6.7, 10.8, visit));
    const mouth = ease(3.5, 4.5, visit) * (1 - ease(6.1, 7.15, visit));
    const x = 921 - 245 * reach - 22 * mouth;
    const y = 119 + 40 * reach + 9 * Math.sin(time * 1.8) * reach;
    ctx.save();
    ctx.globalAlpha = opacity;
    // The original painting shows the resting serpent. Its den falls into shadow as it swims out.
    for (const [dx, dy, radius] of denShadows) glow(ctx, dx, dy, radius, '5,23,51', .95);
    serpentBody(ctx, x, y, reach, time);
    serpentHead(ctx, x, y, mouth, time);
    for (let index = 0; index < 7; index++) {
      const drift = cycle(visit * .66 + index / 7);
      ctx.globalAlpha = opacity * mouth * Math.sin(drift * Math.PI) * .55;
      ctx.strokeStyle = '#a5d9e7';
      ctx.lineWidth = .9;
      ctx.beginPath();
      ctx.arc(x - 64 - drift * (15 + index * 3), y + 13 - drift * (15 + index * 2), 1.1 + drift * 2.5, 0, turn);
      ctx.stroke();
    }
    ctx.restore();
  }

  const vents = [[854, 453, 66], [879, 464, 73], [901, 457, 49]];
  function trench(ctx, time) {
    ctx.save();
    for (const [x, y, plume] of vents) {
      for (let index = 0; index < 7; index++) {
        const rise = cycle(time * .19 + index / 7 + x * .07);
        const drift = 14 * rise * Math.sin(time * .7 + index);
        glow(ctx, x + drift, y - rise * plume, 6 + rise * 15, '84,240,179', Math.sin(rise * Math.PI) * .34);
        ctx.globalAlpha = Math.sin(rise * Math.PI) * .78;
        dot(ctx, x + drift * .6 - 3, y - rise * plume, 1.1 + index % 3 * .38, '#92f9cc');
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }

  function create(image, width, height) {
    const world = buffer(width, height);
    if (!world.context) return null;
    const textures = waterTextures(image, width, height);
    const particles = Array.from({ length: 44 }, (_, index) => ({
      x: (index * 229 + 17) % width,
      y: 52 + (index * 97) % (height - 52),
      radius: .65 + index % 5 * .24
    }));
    return function frame(time) {
      const ctx = world.context;
      ctx.clearRect(0, 0, width, height);
      textures(ctx, time);
      surfaceLight(ctx, time);
      schoolsOfFish(ctx, time);
      glidingRay(ctx, time);
      wreck(ctx, time);
      atlantis(ctx, time);
      seaSerpent(ctx, time);
      cave(ctx, time);
      trench(ctx, time);
      for (const particle of particles) {
        const x = particle.x + 10 * Math.sin(time * .45 + particle.y);
        const y = particle.y - 7 * Math.sin(time * .35 + particle.x);
        dot(ctx, x, y, particle.radius, '#d1fff06b');
      }
      return world.canvas;
    };
  }

  globalThis.EgeBazaOceanMotion = Object.freeze({ create });
})();
