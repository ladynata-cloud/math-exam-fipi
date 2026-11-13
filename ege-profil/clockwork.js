(() => {
  "use strict";

  const workshop = document.querySelector("#profile-clock");
  if (!workshop) return;

  const route = [...document.querySelectorAll("#profile-2027 .first-three-link[data-exam-number]")];
  if (route.length !== 20 || route.some((link, index) => Number(link.dataset.examNumber) !== index + 1)) return;

  const stage = workshop.querySelector(".profile-clock-case");
  const canvas = stage.querySelector("canvas");
  const ctx = typeof Path2D === "function" ? canvas.getContext("2d") : null;
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
      [[219, 544], [248, 544], [267, 562], [301, 562]],
      [[17, 305], [47, 305], [68, 327], [102, 327]],
      [[21, 70], [122, 70]],
      [[20, 718], [54, 718], [72, 739], [105, 739]],
      [[221, 957], [249, 957], [269, 976], [312, 976]],
      [[17, 1131], [46, 1131], [64, 1151], [98, 1151]],
      [[220, 1499], [252, 1499], [274, 1478], [306, 1478]]
    ] : [
      [[20, 125], [51, 125], [62, 104], [76, 104]],
      [[49, 462], [116, 462], [143, 440], [233, 440], [258, 421], [309, 421]],
      [[657, 128], [922, 128]],
      [[840, 390], [881, 390], [906, 369], [945, 369]],
      [[273, 507], [331, 507], [354, 486], [422, 486]],
      [[738, 797], [798, 797], [826, 772], [900, 772], [923, 747], [947, 747]],
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
      figures: isCompact ? [47, 47, 49, 48, 46, 47, 49] : [62, 64, 68, 59, 64, 62, 64]
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

  const alphabets = globalThis.ProfileAlphabetCatalog;
  const alphabetShortcut = workshop.querySelector(".profile-clock-topic-alphabets");

  function describeLink(link, label, number) {
    function describe() {
      topic.textContent = label;
      if (number && !alphabets?.forNumber(number).length) {
        alphabetShortcut.hidden = true;
      } else if (number) {
        alphabetShortcut.hidden = false;
        alphabetShortcut.href = alphabets.href("", "", number);
        alphabetShortcut.textContent = "Основы для №" + number;
      }
    }
    link.addEventListener("pointerenter", describe);
    link.addEventListener("focus", describe);
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
    describeLink(entry, label, number);
    part.group.append(entry);
    part.links.push(entry);
  }
  for (const link of courseLinks) describeLink(link, link.getAttribute("aria-label"));
  const alphabetNav = workshop.querySelector(".profile-clock-alphabets");
  for (const alphabet of alphabets?.list ?? []) {
    const link = document.createElement("a");
    link.className = "profile-clock-alphabet";
    link.href = alphabets.href(alphabet.id);
    link.setAttribute("aria-label", alphabet.title);
    const wheel = document.createElement("span");
    wheel.className = "profile-clock-alphabet-wheel";
    wheel.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.textContent = alphabet.short;
    const numbers = document.createElement("small");
    numbers.textContent = "№" + alphabet.numbers.join(", ");
    label.append(numbers);
    link.append(wheel, label);
    describeLink(link, alphabet.title);
    alphabetNav.append(link);
  }

  let scene = makeScene(compact.matches);
  let artwork;
  const arrangeGnomes = globalThis.EgeProfileGnomes?.create(render);
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
    artwork.gnomes?.(ctx, elapsed);
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
    scene.walks.forEach(walk => walkway(bridges.paint, walk));
    artwork = {
      scene, faces: faces.layer, bridges: bridges.layer,
      wheels: scene.wheels.map((wheel) => castWheel(wheel, scale)),
      pinions: scene.pinions.map((wheel) => castWheel(wheel, scale)),
      gnomes: arrangeGnomes?.(scene, bridges.paint)
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
    workshop.classList.toggle("is-paused", paused);
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
