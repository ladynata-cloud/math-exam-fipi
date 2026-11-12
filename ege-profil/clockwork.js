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
  const compact = matchMedia("(max-width: 880px)");
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

  function pinions(wheel) {
    const hub = gear(wheel.x - 40, wheel.y, 9, "brass");
    hub.speed = wheel.speed * 2.6;
    hub.phase = wheel.phase * .5;
    return [hub, meshedGear(hub, -18, 7, "copper"), meshedGear(hub, 64, 6, "steel")];
  }

  function makeScene(isCompact) {
    const first = gear(isCompact ? 180 : 170, isCompact ? 158 : 161, 24, "copper");
    const teeth = isCompact ? 28 : 32;
    const algebra = meshedGear(first, isCompact ? 90 : 18, teeth, "brass");
    const stereo = meshedGear(algebra, isCompact ? 90 : -47, isCompact ? 10 : 12, "steel");
    const geometry = meshedGear(isCompact ? stereo : algebra, isCompact ? 90 : 32, teeth, "steel");
    const atanasyan = meshedGear(geometry, isCompact ? 90 : 45, isCompact ? 10 : 12, "brass");
    const reasoning = meshedGear(isCompact ? atanasyan : geometry, isCompact ? 90 : 142, teeth, "copper");
    const courseTeeth = isCompact ? 10 : 12;
    const courses = [
      meshedGear(algebra, isCompact ? 125 : 150, courseTeeth, "copper"), stereo,
      meshedGear(algebra, isCompact ? 55 : -13, courseTeeth, "brass"),
      meshedGear(geometry, isCompact ? 125 : -47, courseTeeth, "copper"), atanasyan,
      meshedGear(geometry, isCompact ? 55 : 90, courseTeeth, "steel"),
      meshedGear(reasoning, isCompact ? 90 : 139, courseTeeth, "brass")
    ];
    const written = [algebra, geometry, reasoning];
    for (const wheel of written) wheel.open = true;
    const walks = isCompact ? [
      [[22, 88], [52, 88], [74, 68], [106, 68]],
      [[17, 305], [47, 305], [68, 327], [102, 327]],
      [[219, 544], [248, 544], [267, 562], [306, 562]],
      [[20, 718], [54, 718], [72, 739], [105, 739]],
      [[221, 957], [249, 957], [269, 976], [312, 976]],
      [[17, 1131], [46, 1131], [64, 1151], [98, 1151]],
      [[220, 1499], [252, 1499], [274, 1478], [318, 1478]]
    ] : [
      [[20, 83], [57, 83], [83, 61], [122, 61]],
      [[49, 462], [116, 462], [143, 440], [233, 440], [258, 421], [309, 421]],
      [[671, 131], [720, 131], [741, 153], [800, 153], [826, 132], [884, 132]],
      [[840, 390], [881, 390], [906, 369], [968, 369]],
      [[273, 507], [331, 507], [354, 486], [422, 486]],
      [[738, 797], [798, 797], [826, 772], [900, 772], [923, 747], [965, 747]],
      [[90, 866], [148, 866], [172, 843], [237, 843], [259, 861], [324, 861]]
    ];
    return {
      width: isCompact ? 360 : 1000,
      height: isCompact ? 1540 : 900,
      dials: [{ wheel: first, ring: isCompact ? 122 : 117 },
        ...written.map(wheel => ({ wheel, ring: wheel.radius - (isCompact ? 44 : 22) }))],
      wheels: [first, ...written, ...courses],
      pinions: written.flatMap(pinions),
      courses,
      pivot: isCompact ? [26, 379] : [117, 539],
      rod: isCompact ? 122 : 224,
      walks,
      figures: isCompact ? [43, 44, 42, 47, 42, 45, 46] : [54, 59, 56, 52, 60, 55, 58]
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
    const finish = alloy(paint, r, colors);
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
    if (!wheel.open) {
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
      disc(paint, r * .22, finish, colors[0], 1.4);
      disc(paint, r * .14, colors[2], colors[3], 1.2);
      pin(paint, 0, 0, r * .068);
    }
    disc(paint, r - toothPitch * 1.72, null, "#251b18a8", 2.8);
    disc(paint, r - toothPitch * 2.25, null, colors[0] + "a0");
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
    const marks = 60;
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

  function drawChamber(paint, wheel) {
    const radius = wheel.radius - 31;
    paint.save();
    paint.translate(wheel.x, wheel.y);
    const recess = paint.createRadialGradient(-27, -28, 9, 0, 0, radius);
    recess.addColorStop(0, "#315456");
    recess.addColorStop(.62, "#18343a");
    recess.addColorStop(1, "#0d2028");
    disc(paint, radius, recess, "#160e0d", 4);
    disc(paint, radius - 3, null, "#bf926574", 2);
    disc(paint, radius - 10, null, "#8c785354");
    for (let i = 0; i < 8; i += 1) {
      const angle = (i + .5) * tau / 8;
      pin(paint, (radius - 14) * Math.cos(angle), (radius - 14) * Math.sin(angle), 2);
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

  function clockHands(dial, date) {
    const seconds = date.getSeconds() + date.getMilliseconds() / 1000;
    const minutes = date.getMinutes() + seconds / 60;
    const hours = date.getHours() + minutes / 60;
    ctx.save();
    ctx.translate(dial.wheel.x, dial.wheel.y);
    hand(ctx, hours / 12 * tau, dial.ring * .49, 9, "#c98b56");
    hand(ctx, minutes / 60 * tau, dial.ring * .69, 6, "#f0c98b");
    hand(ctx, seconds / 60 * tau, dial.ring * .73, 2.4, "#d9784a");
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

  function repairPost(paint, [x, y], height) {
    const grip = height * .43;
    paint.save();
    paint.translate(x + 11, y - grip);
    paint.fillStyle = "#32241b";
    paint.fillRect(-4, 0, 8, grip);
    paint.fillStyle = "#b2814c";
    paint.fillRect(-3, 0, 2, grip);
    disc(paint, 6, "#4a3223", "#d7a36d", 1.5);
    pin(paint, 0, 0, 3);
    paint.restore();
  }

  function tighten(x, y, height, turn) {
    ctx.save();
    ctx.translate(x + 11, y - height * .43);
    ctx.rotate(-.95 + .49 * Math.sin(turn * tau * 1.25));
    ctx.strokeStyle = "#2d2119";
    ctx.lineWidth = 5.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-height * .29, 0);
    ctx.stroke();
    ctx.strokeStyle = "#ffe0a7";
    ctx.lineWidth = 2.6;
    ctx.stroke();
    disc(ctx, 3.4, null, "#ffdea2", 1.7);
    ctx.restore();
  }

  const sheet = new Image();
  function gnome(walk, index, height, elapsed) {
    const pace = 19 + (index * 5 % 9);
    const repairTime = 1.9 + (index % 3) * .25;
    const repairDistance = repairTime * pace;
    const phase = (elapsed * pace + walk.length * (.26 + index * .34)) % (walk.length * 2 + repairDistance);
    const fixing = phase >= walk.length && phase < walk.length + repairDistance;
    const reverse = phase >= walk.length + repairDistance;
    const distance = fixing ? walk.length : reverse ? walk.length * 2 + repairDistance - phase : phase;
    const leg = walk.legs.find((section) => distance <= section.end);
    const progress = (distance - leg.start) / (leg.end - leg.start);
    const x = leg.fromX + (leg.x - leg.fromX) * progress;
    const y = leg.fromY + (leg.y - leg.fromY) * progress;
    const step = Math.sin(elapsed * (fixing ? 8 : 12) + index * 2);
    const width = height * 88 / 136;

    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#0007";
    ctx.beginPath();
    ctx.ellipse(0, 1.5, width * .36, 3, 0, 0, tau);
    ctx.fill();
    ctx.translate(fixing ? 2 : 0, fixing ? 0 : -Math.abs(step) * 2);
    ctx.rotate(fixing ? .075 + step * .025 : step * .035);
    ctx.scale(reverse ? -1 : 1, 1);
    ctx.drawImage(sheet, index % 3 * 88, 0, 88, 136, -width / 2, -height, width, height);
    ctx.restore();
    if (fixing) tighten(x, y, height, (phase - walk.length) / pace);
  }

  const nav = stage.querySelector(".profile-clock-dials");
  const courseLinks = [...stage.querySelectorAll(".profile-clock-course")];
  const toggle = workshop.querySelector(".profile-clock-toggle");
  const topic = workshop.querySelector(".profile-clock-topic");
  const parts = [
    ["Первая часть", "Часть I", 13],
    ["Вторая часть · №14–16", "Часть II · №14–16", 16],
    ["Вторая часть · №17–18", "Часть II · №17–18", 18],
    ["Вторая часть · №19–20", "Часть II · №19–20", 20]
  ].map(([name, caption, last], index) => {
    const group = document.createElement("div");
    group.className = "profile-clock-dial";
    group.dataset.clockDial = index === 0 ? "first" : "second";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", name);
    const label = document.createElement("span");
    label.className = "profile-clock-part";
    label.textContent = caption;
    label.setAttribute("aria-hidden", "true");
    group.append(label);
    nav.append(group);
    return { group, label, last, links: [] };
  });

  function describeLink(link, label) {
    link.addEventListener("pointerenter", () => { topic.textContent = label; });
    link.addEventListener("focus", () => { topic.textContent = label; });
  }

  for (const link of route) {
    const number = Number(link.dataset.examNumber);
    const part = parts.find(({ last }) => number <= last);
    const label = "№" + number + " · " + link.querySelector("strong").textContent.trim().replace(/^\d+\.\s*/, "");
    const entry = document.createElement("a");
    entry.className = "profile-clock-number";
    if (number > 13) entry.classList.add("profile-clock-number--written");
    entry.href = link.getAttribute("href");
    entry.textContent = number;
    entry.setAttribute("aria-label", label);
    describeLink(entry, label);
    part.group.append(entry);
    part.links.push(entry);
  }
  for (const link of courseLinks) describeLink(link, link.getAttribute("aria-label"));

  let scene = makeScene(compact.matches);
  let artwork;
  let elapsed = 0;
  let clockTime = new Date();
  let frame = 0;
  let previous;
  let userPaused;
  let visible = !("IntersectionObserver" in window);

  function spinWheels(wheels, layers) {
    for (const [index, wheel] of wheels.entries()) {
      const { layer, size } = layers[index];
      ctx.save();
      ctx.translate(wheel.x, wheel.y);
      ctx.rotate(wheel.phase + elapsed * angularSpeed * wheel.speed);
      ctx.drawImage(layer, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }

  function render() {
    if (!artwork) return;
    ctx.setTransform(canvas.width / scene.width, 0, 0, canvas.height / scene.height, 0, 0);
    ctx.clearRect(0, 0, scene.width, scene.height);
    pendulum(scene.pivot, scene.rod, elapsed);
    spinWheels(scene.wheels, artwork.wheels);
    ctx.drawImage(artwork.faces, 0, 0, scene.width, scene.height);
    spinWheels(scene.pinions, artwork.pinions);
    clockHands(scene.dials[0], clockTime);
    ctx.drawImage(artwork.bridges, 0, 0, scene.width, scene.height);
    if (sheet.naturalWidth) {
      artwork.routes.forEach((walk, index) => gnome(walk, index, scene.figures[index], elapsed));
    }
  }

  function locate(element, x, y, width = scene.width, height = scene.height) {
    element.style.setProperty("--clock-x", x / width * 100 + "%");
    element.style.setProperty("--clock-y", y / height * 100 + "%");
  }

  function locateWheel(element, wheel) {
    locate(element, wheel.x, wheel.y);
    element.style.setProperty("--clock-diameter", wheel.radius * 200 / scene.width + "%");
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
      const { wheel, ring } = dial;
      if (index === 0) drawDial(faces.paint, dial);
      else drawChamber(faces.paint, wheel);
      const { radius } = wheel;
      const diameter = 2 * radius;
      const part = parts[index];
      locateWheel(part.group, wheel);
      locate(part.label, radius, radius * (index === 0 ? 1.33 : 1.78), diameter, diameter);
      part.links.forEach((entry, slot) => {
        const offset = index === 0 ? slot * tau / part.links.length : (slot - (part.links.length - 1) / 2) * .68;
        const angle = offset - Math.PI / 2;
        locate(entry, radius + ring * Math.cos(angle), radius + ring * Math.sin(angle), diameter, diameter);
      });
    });
    courseLinks.forEach((link, index) => locateWheel(link, scene.courses[index]));
    scene.walks.forEach((walk, index) => {
      walkway(bridges.paint, walk);
      repairPost(bridges.paint, walk.at(-1), scene.figures[index]);
    });
    artwork = {
      scene, faces: faces.layer, bridges: bridges.layer,
      wheels: scene.wheels.map((wheel) => castWheel(wheel, scale)),
      pinions: scene.pinions.map((wheel) => castWheel(wheel, scale)),
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
