(() => {
  "use strict";

  const workshop = document.querySelector("#profile-clock");
  if (!workshop) return;

  const route = [...document.querySelectorAll("#profile-2027 .first-three-link[data-exam-number]")];
  if (route.length !== 20 || route.some((link, index) => Number(link.dataset.examNumber) !== index + 1)) return;

  const stage = workshop.querySelector(".profile-clock-case");
  const canvas = stage.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const tau = Math.PI * 2;
  const toothPitch = 5.4;
  const angularSpeed = tau / 68;
  const compact = matchMedia("(max-width: 680px)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const metals = {
    brass: ["#ffe6b0", "#be8348", "#775039", "#e4b373", "#855032"],
    copper: ["#f4bd89", "#a45636", "#593b34", "#ca8658", "#71452e"],
    steel: ["#d3c3a1", "#6d8786", "#32494d", "#9baba2", "#465c5a"]
  };

  function gear(x, y, teeth, metal) {
    return { x, y, teeth, metal, radius: teeth * toothPitch, phase: 0, speed: 1 };
  }

  function meshedGear(driver, degrees, teeth, metal) {
    const direction = degrees * Math.PI / 180;
    const distance = driver.radius + teeth * toothPitch;
    const wheel = gear(
      driver.x + distance * Math.cos(direction),
      driver.y + distance * Math.sin(direction),
      teeth,
      metal
    );
    wheel.speed = -driver.speed * driver.teeth / teeth;
    // A tooth on one pitch circle meets a gap on the other.
    wheel.phase = direction + Math.PI + ((direction - driver.phase) * driver.teeth - Math.PI) / teeth;
    return wheel;
  }

  function makeScene(isCompact) {
    if (isCompact) {
      const main = gear(180, 177, 30, "brass");
      const second = meshedGear(main, 90, 20, "steel");
      return {
        width: 360, height: 616,
        dials: [{ wheel: main, ring: 145 }, { wheel: second, ring: 83 }],
        wheels: [meshedGear(main, 157, 10, "copper"), meshedGear(second, 24, 9, "brass"),
          meshedGear(second, 148, 8, "copper"), main, second],
        pivot: [180, 526], rod: 66,
        walks: [
          [[18, 83], [68, 83], [90, 61], [117, 61]],
          [[16, 366], [70, 366], [96, 345], [129, 345]],
          [[100, 575], [163, 575], [187, 560], [260, 560], [284, 576], [341, 576]]
        ],
        figures: [43, 44, 46]
      };
    }

    const main = gear(326, 307, 40, "brass");
    const second = meshedGear(main, -8.4, 30, "steel");
    return {
      width: 1000, height: 620,
      dials: [{ wheel: main, ring: 156 }, { wheel: second, ring: 118 }],
      wheels: [meshedGear(main, -149, 11, "copper"), meshedGear(main, 111, 10, "steel"),
        meshedGear(second, 51, 11, "copper"), meshedGear(second, 99, 15, "brass"),
        main, second],
      pivot: [326, 482], rod: 100,
      walks: [
        [[97, 521], [156, 521], [183, 546], [347, 546], [373, 526], [433, 526]],
        [[580, 108], [637, 108], [665, 79], [773, 79], [797, 100], [856, 100]],
        [[508, 537], [566, 537], [595, 510], [655, 510], [680, 485], [783, 485], [808, 511], [897, 511]]
      ],
      figures: [64, 61, 67]
    };
  }

  function disc(paint, radius, fill, edge, line = 1) {
    paint.beginPath();
    paint.arc(0, 0, radius, 0, tau);
    if (fill) {
      paint.fillStyle = fill;
      paint.fill();
    }
    if (edge) {
      paint.lineWidth = line;
      paint.strokeStyle = edge;
      paint.stroke();
    }
  }

  function pin(paint, x, y, size) {
    paint.save();
    paint.translate(x, y);
    disc(paint, size, "#241c1a", "#edbf83", 1);
    paint.rotate(-Math.PI / 5);
    paint.fillStyle = "#a57955";
    paint.fillRect(-size * .62, -.5, size * 1.24, 1);
    paint.restore();
  }

  function alloy(paint, radius, colors) {
    const finish = paint.createLinearGradient(-radius * .62, -radius, radius * .7, radius);
    [0, .22, .47, .71, 1].forEach((stop, index) => finish.addColorStop(stop, colors[index]));
    return finish;
  }

  function surface(width, height, scale) {
    const layer = document.createElement("canvas");
    layer.width = Math.ceil(width * scale);
    layer.height = Math.ceil(height * scale);
    const paint = layer.getContext("2d");
    paint.scale(scale, scale);
    return { layer, paint };
  }

  function castWheel(wheel, scale) {
    const r = wheel.radius;
    const edge = Math.ceil(r + toothPitch * 2 + 7);
    const { layer, paint } = surface(edge * 2, edge * 2, scale);
    const colors = metals[wheel.metal];
    const finish = alloy(paint, r, colors);
    const rim = new Path2D();
    const tooth = [[-.50, -1.2], [-.29, -1.2], [-.22, .1], [-.15, 1],
      [.15, 1], [.22, .1], [.29, -1.2], [.50, -1.2]];
    const ringWidth = Math.min(33, r * .38);
    const inner = r - ringWidth;
    for (let i = 0; i < wheel.teeth; i += 1) {
      tooth.forEach(([offset, depth]) => {
        const angle = (i + offset) * tau / wheel.teeth;
        const point = r + depth * toothPitch;
        rim.lineTo(point * Math.cos(angle), point * Math.sin(angle));
      });
    }
    rim.closePath();
    rim.moveTo(inner, 0);
    rim.arc(0, 0, inner, 0, tau);
    paint.translate(edge, edge);
    paint.save();
    paint.translate(2, 5);
    paint.strokeStyle = "#1c1411";
    paint.lineWidth = 5;
    paint.stroke(rim);
    paint.fillStyle = "#35251d";
    paint.fill(rim, "evenodd");
    paint.restore();
    paint.fillStyle = finish;
    paint.fill(rim, "evenodd");
    paint.strokeStyle = colors[0];
    paint.lineWidth = 1.2;
    paint.stroke(rim);

    const spokes = wheel.teeth > 20 ? 8 : 5;
    for (let i = 0; i < spokes; i += 1) {
      paint.save();
      paint.rotate(i * tau / spokes);
      paint.beginPath();
      paint.moveTo(r * .12, -r * .11);
      paint.quadraticCurveTo(r * .42, -r * .055, inner + 3, -r * .12);
      paint.lineTo(inner + 3, r * .12);
      paint.quadraticCurveTo(r * .46, r * .036, r * .12, r * .11);
      paint.closePath();
      paint.fillStyle = finish;
      paint.fill();
      paint.strokeStyle = colors[0] + "a0";
      paint.stroke();
      paint.restore();
    }
    disc(paint, r - toothPitch * 1.72, null, "#251b18a8", 2.8);
    disc(paint, r - toothPitch * 2.25, null, colors[0] + "a0");
    disc(paint, r * .22, finish, colors[0], 1.4);
    disc(paint, r * .14, colors[2], colors[3], 1.2);
    pin(paint, 0, 0, r * .068);
    for (let i = 0; i < spokes * 2; i += 1) {
      const angle = i * tau / (spokes * 2);
      const boltRadius = (inner + r - toothPitch * 2.6) / 2;
      pin(paint, boltRadius * Math.cos(angle), boltRadius * Math.sin(angle), Math.min(3, r * .045));
    }
    return { layer, size: edge * 2 };
  }

  function drawDial(paint, dial) {
    const { wheel, ring } = dial;
    const radius = Math.min(ring + 19, wheel.radius - 16);
    paint.save();
    paint.translate(wheel.x, wheel.y);
    const glass = paint.createRadialGradient(-radius * .28, -radius * .36, 1, 0, 0, radius);
    glass.addColorStop(0, "#356065b8");
    glass.addColorStop(.66, "#173238e6");
    glass.addColorStop(1, "#111c22fa");
    disc(paint, radius, glass, "#332820", 7);
    disc(paint, radius, null, "#dcb479", 2.2);
    disc(paint, radius - 5, null, "#947b56");
    disc(paint, ring - 17, null, "#cdac7266");
    disc(paint, ring - 29, null, "#c3a36e50");
    disc(paint, ring * .49, null, "#d5b67b33");
    const marks = wheel.speed === 1 ? 60 : 30;
    for (let i = 0; i < marks; i += 1) {
      const major = i % 5 === 0;
      paint.save();
      paint.rotate(i * tau / marks);
      paint.fillStyle = major ? "#e9c68b" : "#a68e67b0";
      paint.fillRect(-.75, 18 - ring, 1.5, major ? 9 : 4);
      paint.restore();
    }
    for (let i = 0; i < 4; i += 1) {
      const angle = (i + .5) * Math.PI / 2;
      pin(paint, (radius - 5) * Math.cos(angle), (radius - 5) * Math.sin(angle), 2.5);
    }
    paint.restore();
  }

  function walkway(paint, points) {
    for (let i = 0; i < points.length - 1; i += 1) {
      const [x, y] = points[i];
      const [endX, endY] = points[i + 1];
      const length = Math.hypot(endX - x, endY - y);
      paint.save();
      paint.translate(x, y);
      paint.rotate(Math.atan2(endY - y, endX - x));
      paint.fillStyle = "#291c16";
      paint.fillRect(-2, 1, length + 4, 10);
      paint.fillStyle = "#8e5936";
      paint.fillRect(-1, 2, length + 2, 4);
      paint.fillStyle = "#deb47b";
      paint.fillRect(-1, 0, length + 2, 2);
      paint.fillStyle = "#bc98658c";
      paint.fillRect(0, -14, length, 1.5);
      paint.fillRect(0, -8, length, 1);
      const posts = Math.ceil(length / 24);
      for (let j = 0; j <= posts; j += 1) {
        paint.fillRect(j * length / posts, -14, 1.7, 15);
      }
      paint.restore();
    }
  }

  function hand(paint, angle, length, width, color) {
    paint.save();
    paint.rotate(angle - Math.PI / 2);
    paint.beginPath();
    paint.moveTo(-12, -width * .56);
    paint.lineTo(length * .78, -width * .64);
    paint.lineTo(length, 0);
    paint.lineTo(length * .78, width * .64);
    paint.lineTo(-12, width * .56);
    paint.closePath();
    paint.lineWidth = 1.5;
    paint.strokeStyle = "#251b19";
    paint.stroke();
    paint.fillStyle = color;
    paint.fill();
    paint.restore();
  }

  function clockHands(dial, date, secondsOnly) {
    const seconds = date.getSeconds() + date.getMilliseconds() / 1000;
    const minutes = date.getMinutes() + seconds / 60;
    const hours = date.getHours() + minutes / 60;
    ctx.save();
    ctx.translate(dial.wheel.x, dial.wheel.y);
    if (!secondsOnly) {
      hand(ctx, hours / 12 * tau, dial.ring * .49, 9, "#c98b56");
      hand(ctx, minutes / 60 * tau, dial.ring * .69, 6, "#f0c98b");
    }
    hand(ctx, seconds / 60 * tau, dial.ring * .73, 2.4, secondsOnly ? "#e1bd80" : "#d9784a");
    disc(ctx, 8, "#cf9f68", "#53382a", 2);
    pin(ctx, 0, 0, 3.5);
    ctx.restore();
  }

  function pendulum(pivot, rod, elapsed) {
    ctx.save();
    ctx.translate(...pivot);
    ctx.rotate(.28 * Math.sin(elapsed * tau / 3.4));
    ctx.fillStyle = "#432d23";
    ctx.fillRect(-3.5, 0, 7, rod);
    ctx.fillStyle = "#dcad72";
    ctx.fillRect(-1.5, 0, 2, rod);
    ctx.translate(0, rod);
    const r = rod * .18;
    disc(ctx, r, alloy(ctx, r, metals.brass), "#533527", 2.5);
    disc(ctx, r - 4, null, "#ffdfa0b0");
    pin(ctx, 0, 0, 4);
    ctx.restore();
  }

  function walkingRoute(points) {
    let length = 0;
    const legs = points.slice(1).map(([x, y], index) => {
      const [fromX, fromY] = points[index];
      const start = length;
      length += Math.hypot(x - fromX, y - fromY);
      return { fromX, fromY, x, y, start, end: length };
    });
    return { legs, length };
  }

  const sheet = new Image();
  function gnome(walk, index, height, elapsed) {
    const pace = [23, 20, 26][index];
    const phase = (elapsed * pace + walk.length * [.27, 1.3, .54][index]) % (walk.length * 2);
    const reverse = phase > walk.length;
    const distance = reverse ? walk.length * 2 - phase : phase;
    const leg = walk.legs.find((section) => distance <= section.end);
    const progress = (distance - leg.start) / (leg.end - leg.start);
    const x = leg.fromX + (leg.x - leg.fromX) * progress;
    const y = leg.fromY + (leg.y - leg.fromY) * progress;
    const step = Math.sin(elapsed * 12 + index * 2);
    const width = height * 88 / 136;

    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#0007";
    ctx.beginPath();
    ctx.ellipse(0, 1.5, width * .36, 3, 0, 0, tau);
    ctx.fill();
    ctx.translate(0, -Math.abs(step) * 2);
    ctx.rotate(step * .035);
    ctx.scale(reverse ? -1 : 1, 1);
    ctx.drawImage(sheet, index * 88, 0, 88, 136, -width / 2, -height, width, height);
    ctx.restore();
  }

  const nav = stage.querySelector(".profile-clock-dials");
  const toggle = workshop.querySelector(".profile-clock-toggle");
  const topic = workshop.querySelector(".profile-clock-topic");
  const parts = ["Первая часть", "Вторая часть"].map((name, index) => {
    const group = document.createElement("div");
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", name);
    const label = document.createElement("span");
    label.className = "profile-clock-part";
    label.textContent = index === 0 ? "Часть I" : "Часть II";
    label.setAttribute("aria-hidden", "true");
    group.append(label);
    nav.append(group);
    return { group, label, links: [] };
  });

  for (const link of route) {
    const number = Number(link.dataset.examNumber);
    const part = parts[number <= 13 ? 0 : 1];
    const label = "№" + number + " · " + link.querySelector("strong").textContent.trim().replace(/^\d+\.\s*/, "");
    const entry = document.createElement("a");
    entry.className = "profile-clock-number";
    if (number > 13) entry.classList.add("profile-clock-number--written");
    entry.href = link.getAttribute("href");
    entry.textContent = number;
    entry.setAttribute("aria-label", label);
    entry.addEventListener("pointerenter", () => { topic.textContent = label; });
    entry.addEventListener("focus", () => { topic.textContent = label; });
    part.group.append(entry);
    part.links.push(entry);
  }

  let scene = makeScene(compact.matches);
  let artwork;
  let elapsed = 0;
  let clockTime = new Date();
  let frame = 0;
  let previous;
  let userPaused;
  let visible = !("IntersectionObserver" in window);

  function render() {
    if (!artwork) return;
    ctx.setTransform(canvas.width / scene.width, 0, 0, canvas.height / scene.height, 0, 0);
    ctx.clearRect(0, 0, scene.width, scene.height);
    pendulum(scene.pivot, scene.rod, elapsed);
    for (const [index, wheel] of scene.wheels.entries()) {
      const { layer, size } = artwork.wheels[index];
      ctx.save();
      ctx.translate(wheel.x, wheel.y);
      ctx.rotate(wheel.phase + elapsed * angularSpeed * wheel.speed);
      ctx.drawImage(layer, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
    ctx.drawImage(artwork.faces, 0, 0, scene.width, scene.height);
    scene.dials.forEach((dial, index) => clockHands(dial, clockTime, index === 1));
    ctx.drawImage(artwork.bridges, 0, 0, scene.width, scene.height);
    if (sheet.naturalWidth) {
      artwork.routes.forEach((walk, index) => gnome(walk, index, scene.figures[index], elapsed));
    }
  }

  function locate(element, x, y) {
    element.style.setProperty("--clock-x", x / scene.width * 100 + "%");
    element.style.setProperty("--clock-y", y / scene.height * 100 + "%");
  }

  function arrange() {
    const density = Math.min(devicePixelRatio || 1, 2);
    const width = Math.round(canvas.clientWidth * density);
    const height = Math.round(canvas.clientHeight * density);
    if (!width || !height) return;
    if (artwork?.scene === scene && canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    const scale = width / scene.width;
    const faces = surface(scene.width, scene.height, scale);
    const bridges = surface(scene.width, scene.height, scale);
    scene.dials.forEach((dial, index) => {
      drawDial(faces.paint, dial);
      const { x, y } = dial.wheel;
      const part = parts[index];
      locate(part.label, x, y + dial.ring * .39);
      part.links.forEach((entry, slot) => {
        const angle = -Math.PI / 2 + slot * tau / part.links.length;
        locate(entry, x + dial.ring * Math.cos(angle), y + dial.ring * Math.sin(angle));
      });
    });
    scene.walks.forEach((walk) => walkway(bridges.paint, walk));
    artwork = {
      scene, faces: faces.layer, bridges: bridges.layer,
      wheels: scene.wheels.map((wheel) => castWheel(wheel, scale)),
      routes: scene.walks.map(walkingRoute)
    };
    render();
  }

  function animate(now) {
    frame = 0;
    if (previous !== undefined) elapsed += Math.min((now - previous) / 1000, .1);
    previous = now;
    clockTime = new Date();
    render();
    syncMotion();
  }

  function syncMotion() {
    const paused = userPaused ?? reducedMotion.matches;
    if (!paused && visible && !document.hidden) {
      if (!frame) frame = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = undefined;
    }
  }

  function updateToggle() {
    const paused = userPaused ?? reducedMotion.matches;
    toggle.toggleAttribute("data-paused", paused);
    toggle.textContent = paused ? "Запустить" : "Пауза";
    toggle.setAttribute("aria-label", paused ? "Запустить анимацию" : "Пауза анимации");
    syncMotion();
  }

  toggle.addEventListener("click", () => {
    userPaused = !(userPaused ?? reducedMotion.matches);
    updateToggle();
  });
  compact.addEventListener("change", () => {
    scene = makeScene(compact.matches);
    arrange();
  });
  reducedMotion.addEventListener("change", updateToggle);
  document.addEventListener("visibilitychange", syncMotion);
  sheet.addEventListener("load", render);
  sheet.src = new URL("clockwork-gnomes.webp", document.currentScript.src).href;
  workshop.hidden = false;
  arrange();
  new ResizeObserver(arrange).observe(stage);
  if ("IntersectionObserver" in window) {
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncMotion();
    });
    visibility.observe(stage);
  }
  updateToggle();
})();
