(() => {
  "use strict";

  if (typeof Path2D !== "function") return;

  const tau = Math.PI * 2;
  const spriteUrl = new URL("clockwork-gnomes.webp", document.currentScript.src).href;
  const cellWidth = 88;
  const cellHeight = 136;
  const workingTime = 4.45;
  const meetingIndex = 2;
  const metalChips = ["#e2ba80", "#fff0bb", "#ac7e60"];
  const jobs = [
    ["chisel", "mine"], ["screwdriver", "wipe", "hammer"], [],
    ["hammer", "screwdriver", "wipe"], ["mine", "chisel"],
    ["wipe", "hammer", "screwdriver"], ["mine", "chisel"]
  ];
  const firstJob = [1.8, 2.6, 0, 3.5, 4.7, 1.2, 6.6];
  const colors = [
    ["#653b8b", "#b883d6", "#f0c5fb"],
    ["#267471", "#52ccad", "#c0ffe0"],
    ["#354e92", "#7898e7", "#d8e7ff"]
  ];

  // The working poses use the same hats, faces and clothes as the walking sprites.
  // Clip the baked-in forward hand (and lantern) so the painted arm can move.
  const poses = [
    new Path2D("M 0 0 H 88 V 65 H 64 L 62 72 L 68 86 L 71 95 H 88 V 136 H 0 Z"),
    new Path2D("M 0 0 H 88 V 56 H 64 L 61 71 L 61 92 L 70 100 H 88 V 136 H 0 Z"),
    new Path2D("M 0 0 H 88 V 66 H 66 L 62 72 L 69 85 L 73 93 H 88 V 136 H 0 Z")
  ];

  function ease(from, to, time) {
    const part = Math.max(0, Math.min(1, (time - from) / (to - from)));
    return part * part * (3 - 2 * part);
  }

  function mix(from, to, amount) {
    return from + (to - from) * amount;
  }

  function polygon(ctx, points, color) {
    ctx.beginPath();
    for (const [x, y] of points) ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function line(ctx, points, color, width) {
    ctx.beginPath();
    for (const [x, y] of points) ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function oval(ctx, x, y, width, height, color) {
    ctx.beginPath();
    ctx.ellipse(x, y, width, height, 0, 0, tau);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function gem(ctx, x, y, size, palette) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size, size);
    polygon(ctx, [[-1, -.24], [-.46, -.91], [.46, -.91], [1, -.25], [0, 1]], palette[0]);
    polygon(ctx, [[-1, -.24], [-.46, -.91], [.46, -.91], [.34, -.18], [-.33, -.12]], palette[1]);
    polygon(ctx, [[-.46, -.91], [.46, -.91], [.03, -.54], [-.33, -.12]], palette[2]);
    polygon(ctx, [[.34, -.18], [1, -.25], [0, 1]], palette[1]);
    ctx.restore();
  }

  function sparkle(ctx, x, y, size, color) {
    polygon(ctx, [[x - size, y], [x - 1, y - 1], [x, y - size], [x + 1, y - 1],
      [x + size, y], [x + 1, y + 1], [x, y + size], [x - 1, y + 1]], color);
  }

  function wall(ctx, palette) {
    const rock = ctx.createLinearGradient(-12, -27, 22, 25);
    rock.addColorStop(0, "#57656b");
    rock.addColorStop(.48, "#303d45");
    rock.addColorStop(1, "#111d28");
    polygon(ctx, [[-16, 21], [-20, 7], [-15, -14], [-6, -21], [0, -32],
      [14, -27], [21, -15], [19, 5], [25, 20], [13, 25], [-7, 25]], rock);
    polygon(ctx, [[-16, 21], [-12, 5], [-2, 0], [3, 11], [-3, 24]], "#45545b");
    polygon(ctx, [[0, -32], [1, -13], [-15, -14], [-6, -21]], "#6b7879");
    polygon(ctx, [[1, -13], [14, -27], [21, -15], [12, -4], [3, 11], [-2, 0]], "#2a353f");
    line(ctx, [[-14, 13], [-8, -3], [-3, -5], [4, -12], [10, -14], [15, -23]], palette[0], 2);
    line(ctx, [[-9, -10], [-4, -16], [0, -27]], "#8d9a9685", .9);
    line(ctx, [[11, -3], [9, 8], [16, 17]], "#7c909071", .9);
    gem(ctx, 8, -16, 3.4, palette);
    gem(ctx, -10, 8, 3, palette);
    gem(ctx, 6, 13, 2.1, palette);
  }

  function bench(ctx) {
    const brass = ctx.createLinearGradient(-13, -10, 13, 14);
    brass.addColorStop(0, "#e9c68e");
    brass.addColorStop(.44, "#99704a");
    brass.addColorStop(1, "#59381f");
    ctx.fillStyle = "#4b3425";
    ctx.fillRect(-4.5, 2, 9, 22);
    ctx.fillStyle = "#b68858";
    ctx.fillRect(-3.5, 3, 2.5, 20);
    oval(ctx, 0, 0, 13, 13, "#31241d");
    oval(ctx, 0, 0, 11.8, 11.8, brass);
    oval(ctx, 0, 0, 8.3, 8.3, "#384747");
    oval(ctx, 0, 0, 6.8, 6.8, "#74918a");
    oval(ctx, 0, 0, 3.3, 3.3, "#af865d");
    line(ctx, [[-2, 1], [2, -1]], "#403225", 1);
  }

  function patrol(points) {
    let length = 0;
    const legs = points.slice(1).map(([x, y], index) => {
      const [fromX, fromY] = points[index];
      const start = length;
      length += Math.hypot(x - fromX, y - fromY);
      return { fromX, fromY, x, y, start, end: length };
    });
    return {
      length,
      at(distance) {
        const leg = legs.find(({ end }) => distance <= end) ?? legs.at(-1);
        const part = (distance - leg.start) / (leg.end - leg.start);
        return [mix(leg.fromX, leg.x, part), mix(leg.fromY, leg.y, part)];
      }
    };
  }

  function figure(ctx, sheet, worker, [x, y], facing, step, lean, working) {
    const { index, size } = worker;
    oval(ctx, x, y + 1, size * 11, size * 2.5, "#090f14ae");
    ctx.save();
    ctx.translate(x, y - Math.abs(step) * 2 * size);
    ctx.rotate(lean * facing + step * .029);
    const scale = size * 48 / cellHeight;
    ctx.scale(facing * scale, scale);
    ctx.translate(-cellWidth / 2, -cellHeight);
    const sprite = index % poses.length;
    if (working) ctx.clip(poses[sprite]);
    ctx.drawImage(sheet, sprite * cellWidth, 0, cellWidth, cellHeight, 0, 0, cellWidth, cellHeight);
    ctx.restore();
  }

  function arm(ctx, handX, handY, elbowX = 9, elbowY = -20) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const sleeve = [[5, -24], [elbowX, elbowY], [handX, handY]];
    line(ctx, sleeve, "#533a2b", 6.6);
    line(ctx, sleeve, "#ae8c64", 4.7);
    line(ctx, [[5, -25], [elbowX, elbowY - .8], [handX, handY - .5]], "#dec39b", 1.35);
    oval(ctx, handX, handY, 2.8, 2.6, "#dab183");
    oval(ctx, handX + .5, handY - .7, 1.5, 1.1, "#f3d09e");
  }

  function tool(ctx, kind, x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.lineCap = "round";
    const steel = "#cad7cb";
    if (kind === "screwdriver") {
      line(ctx, [[-5, 0], [5, 0]], "#552a27", 5);
      line(ctx, [[-5, -1], [4, -1]], "#d46d47", 2.4);
      line(ctx, [[5, 0], [15, 0]], steel, 1.8);
    } else if (kind === "chisel") {
      line(ctx, [[-4, 0], [11, 0]], "#7d8b86", 3.1);
      line(ctx, [[-1, -.7], [13, -.7]], steel, 1.3);
      polygon(ctx, [[9, -1.2], [15, -2.4], [15, 1.8], [9, 1.1]], "#a7c7c7");
    } else {
      line(ctx, [[-4, 0], [14, 0]], "#50351f", 3.9);
      line(ctx, [[-3, -1], [14, -1]], "#b08050", 1.4);
      if (kind === "mine") {
        polygon(ctx, [[14, -10], [18, -5], [18, 4], [12, 10], [14, 4], [14, -3], [11, -8]], "#718b8c");
        line(ctx, [[14, -9], [17, -4], [16, 4], [13, 8]], steel, 1);
      } else {
        polygon(ctx, [[10, -6], [18, -6], [19, 2], [16, 5], [11, 5]], "#889793");
        line(ctx, [[11, -5], [17, -5], [18, 1]], steel, 1.35);
      }
    }
    ctx.restore();
  }

  function chips(ctx, time, palette) {
    ctx.save();
    ctx.globalAlpha = (1 - time) * .9;
    for (let index = 0; index < 5; index++) {
      const x = 27 - (6 + index * 3) * time;
      const y = -26 - (12 - index) * time + time ** 2 * (9 + index);
      polygon(ctx, [[x, y - 2], [x + 2.4, y], [x - 1, y + 1.3]], palette[index % palette.length]);
    }
    ctx.restore();
  }

  function work(ctx, kind, time, palette) {
    if (kind === "screwdriver") {
      const twist = Math.sin(time * 8) * .29;
      const gripX = 27 - 15 * Math.cos(twist);
      const gripY = -25 - 15 * Math.sin(twist);
      arm(ctx, gripX, gripY);
      tool(ctx, kind, gripX, gripY, twist);
      return;
    }
    if (kind === "wipe") {
      const sweep = Math.sin(time * 8.6);
      const x = 23 + 5.5 * sweep;
      const y = -24 + 6 * Math.cos(time * 8.6);
      arm(ctx, x, y);
      polygon(ctx, [[x - 4, y - 4], [x + 6, y - 5], [x + 4, y + 5],
        [x + 1, y + 6], [x - 6, y + 3]], "#e9c494");
      line(ctx, [[x - 3, y - 3], [x + 1, y + 2], [x + 4, y + 4]], "#9d765d", 1.2);
      const shine = ease(2.1, 2.45, time) * (1 - ease(2.5, 3.18, time));
      if (shine > 0) sparkle(ctx, 32, -31, shine * 6, "#fff1c5");
      return;
    }
    if (kind === "mine" && time >= 2.28) {
      const pickup = ease(2.28, 2.94, time);
      const stash = ease(3.06, 3.94, time);
      const handX = mix(mix(15, 26, pickup), 4, stash);
      const handY = mix(mix(-22, -25, pickup), -13, stash);
      arm(ctx, handX, handY, 11, -19);
      const size = 5.5 * (1 - ease(3.72, 4.05, time));
      if (size > 0) gem(ctx, mix(27, handX, pickup), mix(-25, handY - 1, pickup) - 7 * Math.sin(pickup * Math.PI), size, palette);
      return;
    }
    const beat = time % .76 / .76;
    const lift = ease(0, .66, beat) * (1 - ease(.66, .88, beat));
    const chisel = kind === "chisel";
    const handX = chisel ? 12 - 2 * lift : 13 - lift * 2;
    const handY = chisel ? -25 : -25 - 10 * lift;
    arm(ctx, handX, handY, 10, handY + 4);
    tool(ctx, kind, handX, handY, chisel ? .04 : -1.1 * lift);
    if (beat >= .87) chips(ctx, (beat - .87) / .13, palette);
  }

  function drawPatrol(ctx, sheet, worker, elapsed) {
    const { index, path, size, palette } = worker;
    const travel = path.length / (23 + index % 3 * 3);
    const duration = 2 * travel + workingTime;
    const offset = Math.max(0, elapsed + travel - firstJob[index]);
    const phase = offset % duration;
    const kind = jobs[index][Math.floor(offset / duration) % jobs[index].length];
    const working = phase >= travel && phase < travel + workingTime;
    const returning = phase >= travel + workingTime;
    const distance = path.length * Math.min(1, (returning ? duration - phase : phase) / travel);
    const [x, y] = path.at(distance);
    const moment = phase - travel;
    const step = working ? 0 : Math.sin(elapsed * 12 + index * 2);
    const lean = working ? (kind === "mine" ? .07 + .13 * ease(3.15, 3.85, moment) : .08) : 0;
    figure(ctx, sheet, worker, [x, y], returning ? -1 : 1, step, lean, working);
    if (!working && !palette) return;
    ctx.save();
    const [endX, endY] = path.at(path.length);
    ctx.translate(working ? x : endX, working ? y : endY);
    ctx.scale(size, size);
    if (palette && (kind !== "mine" || moment < 2.28)) gem(ctx, 27, -25, 5.5, palette);
    if (working) work(ctx, kind, moment, palette ?? metalChips);
    ctx.restore();
  }

  function drawMeeting(ctx, sheet, worker, elapsed) {
    const { path, size } = worker;
    const visit = elapsed % 23;
    const hug = Math.floor(elapsed / 23) % 2 === 1;
    const greeting = ease(6.2, 6.75, visit) * (1 - ease(8.75, 9.3, visit));
    const approach = ease(1.25, 6.2, visit) * (1 - ease(9.4, 14.1, visit));
    const gap = (17 - (hug ? 5 * greeting : 0)) * size;
    const distance = approach * (path.length / 2 - gap);
    const places = [path.at(distance), path.at(path.length - distance)];
    const step = approach > 0 && approach < 1 ? Math.sin(elapsed * 12) : 0;
    const leaving = visit > 9.4 && visit < 14.1;
    const pair = [worker, { ...worker, index: 7 }];
    for (let side = 0; side < pair.length; side++) {
      const face = (side ? -1 : 1) * (leaving ? -1 : 1);
      const lean = (hug ? .12 : .03) * greeting;
      figure(ctx, sheet, pair[side], places[side], face, side ? -step : step, lean, greeting > 0);
    }
    if (!greeting) return;
    for (let side = 0; side < pair.length; side++) {
      ctx.save();
      ctx.translate(...places[side]);
      ctx.scale(side ? -size : size, size);
      if (hug) {
        arm(ctx, mix(13, 27, greeting), mix(-22, side ? -20 : -25, greeting), 15, side ? -16 : -19);
      } else {
        const shake = 2.1 * greeting * Math.sin(visit * 13);
        arm(ctx, mix(13, 17, greeting), -22 + shake, 10, -20);
      }
      ctx.restore();
    }
  }

  function create(onReady) {
    const sheet = new Image();
    sheet.addEventListener("load", onReady);
    sheet.src = spriteUrl;

    return function arrange(scene, background) {
      const workers = scene.walks.map((points, index) => {
        const size = scene.figures[index] / 48;
        const path = patrol(points);
        const rock = jobs[index].includes("mine");
        const palette = rock ? colors[index % colors.length] : null;
        if (index !== meetingIndex) {
          const [x, y] = points.at(-1);
          background.save();
          background.translate(x + 27 * size, y - 25 * size);
          background.scale(size, size);
          if (rock) wall(background, palette);
          else bench(background);
          background.restore();
        }
        return { index, path, size, palette };
      });
      return (ctx, elapsed) => {
        if (!sheet.naturalWidth) return;
        for (const worker of workers) {
          if (worker.index === meetingIndex) drawMeeting(ctx, sheet, worker, elapsed);
          else drawPatrol(ctx, sheet, worker, elapsed);
        }
      };
    };
  }

  globalThis.EgeProfileGnomes = Object.freeze({ create });
})();
