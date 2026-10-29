(() => {
  "use strict";

  /* YouTube Playables SDK — no-ops outside YouTube. */
  const YT = typeof window.ytgame !== "undefined" ? window.ytgame : null;
  const IN_PLAYABLES = !!(YT && YT.IN_PLAYABLES_ENV);

  function ytCall(fn) {
    try {
      return fn && fn();
    } catch (err) {
      console.warn("[CarJam] ytgame call failed:", err);
      return undefined;
    }
  }

  function firstFrameReady() {
    ytCall(() => YT && YT.game && YT.game.firstFrameReady());
  }

  function gameReady() {
    ytCall(() => YT && YT.game && YT.game.gameReady());
  }

  function sendScore(value) {
    ytCall(() => YT && YT.engagement && YT.engagement.sendScore({ value }));
  }

  function logWarning(msg) {
    console.warn(msg);
    ytCall(() => YT && YT.health && YT.health.logWarning && YT.health.logWarning());
  }

  async function loadCloudData() {
    if (!(YT && YT.game && typeof YT.game.loadData === "function")) return null;
    try {
      const raw = await YT.game.loadData();
      if (!raw) return null;
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (err) {
      logWarning("[CarJam] loadData failed");
      return null;
    }
  }

  async function saveCloudData(data) {
    if (!(YT && YT.game && typeof YT.game.saveData === "function")) return;
    try {
      await YT.game.saveData(JSON.stringify(data));
    } catch (err) {
      logWarning("[CarJam] saveData failed");
    }
  }

  /* dir: 0 up, 1 right, 2 down, 3 left. (x,y) is the nose. */
  const DIRS = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ];

  const COLORS = [
    ["#ff5d5d", "#c62828"],
    ["#5b8cff", "#1d4ed8"],
    ["#ffd15c", "#e09a10"],
    ["#3ddc84", "#128a45"],
    ["#c084fc", "#7c3aed"],
    ["#ff8a3d", "#e85d04"],
    ["#2dd4bf", "#0f766e"],
    ["#ff6ba9", "#db2777"],
  ];

  const LEVELS = [
    { w: 4, h: 4, blocks: [], seals: [], cars: [
      { x: 1, y: 1, dir: 1, len: 1, color: 0 },
      { x: 1, y: 2, dir: 0, len: 1, color: 1 },
      { x: 2, y: 2, dir: 3, len: 1, color: 3 },
    ]},
    { w: 4, h: 4, blocks: [], seals: [], cars: [
      { x: 0, y: 1, dir: 2, len: 2, color: 1 },
      { x: 3, y: 0, dir: 0, len: 2, color: 4 },
      { x: 1, y: 2, dir: 1, len: 2, color: 2 },
      { x: 2, y: 2, dir: 2, len: 2, color: 3 },
      { x: 1, y: 3, dir: 3, len: 2, color: 5 },
      { x: 0, y: 3, dir: 3, len: 1, color: 0 },
    ]},
    { w: 5, h: 5, blocks: [], seals: [], cars: [
      { x: 2, y: 2, dir: 1, len: 2, color: 1 },
      { x: 1, y: 3, dir: 3, len: 1, color: 2 },
      { x: 0, y: 3, dir: 0, len: 2, color: 3 },
      { x: 1, y: 0, dir: 1, len: 2, color: 5 },
      { x: 3, y: 4, dir: 1, len: 2, color: 4 },
      { x: 4, y: 0, dir: 2, len: 1, color: 0 },
      { x: 4, y: 2, dir: 2, len: 1, color: 6 },
      { x: 4, y: 3, dir: 2, len: 1, color: 7 },
    ]},
    { w: 5, h: 5, blocks: [], seals: [], cars: [
      { x: 2, y: 2, dir: 1, len: 2, color: 1 },
      { x: 1, y: 3, dir: 3, len: 1, color: 2 },
      { x: 0, y: 3, dir: 0, len: 1, color: 3 },
      { x: 1, y: 0, dir: 1, len: 2, color: 5 },
      { x: 3, y: 4, dir: 1, len: 2, color: 4 },
      { x: 4, y: 0, dir: 2, len: 1, color: 6 },
      { x: 4, y: 2, dir: 2, len: 1, color: 7 },
      { x: 4, y: 3, dir: 2, len: 1, color: 0 },
      { x: 1, y: 1, dir: 1, len: 1, color: 2 },
    ]},
    { w: 5, h: 5, blocks: [], seals: [], cars: [
      { x: 4, y: 0, dir: 0, len: 1, color: 1 },
      { x: 4, y: 2, dir: 2, len: 2, color: 2 },
      { x: 1, y: 1, dir: 2, len: 1, color: 5 },
      { x: 1, y: 4, dir: 1, len: 2, color: 3 },
      { x: 2, y: 3, dir: 0, len: 2, color: 4 },
      { x: 3, y: 1, dir: 0, len: 2, color: 6 },
      { x: 2, y: 2, dir: 0, len: 1, color: 0 },
      { x: 4, y: 4, dir: 2, len: 1, color: 7 },
      { x: 2, y: 0, dir: 3, len: 2, color: 1 },
      { x: 0, y: 0, dir: 0, len: 2, color: 3 },
    ]},
    { w: 6, h: 6, blocks: [], seals: [], cars: [
      { x: 4, y: 2, dir: 3, len: 1, color: 1 },
      { x: 0, y: 3, dir: 2, len: 1, color: 4 },
      { x: 0, y: 4, dir: 1, len: 1, color: 2 },
      { x: 1, y: 3, dir: 1, len: 1, color: 3 },
      { x: 3, y: 3, dir: 0, len: 1, color: 5 },
      { x: 2, y: 4, dir: 0, len: 2, color: 6 },
      { x: 2, y: 3, dir: 0, len: 1, color: 0 },
      { x: 3, y: 2, dir: 0, len: 1, color: 7 },
      { x: 5, y: 3, dir: 2, len: 3, color: 2 },
      { x: 3, y: 0, dir: 0, len: 1, color: 1 },
      { x: 5, y: 4, dir: 1, len: 2, color: 3 },
      { x: 1, y: 0, dir: 3, len: 2, color: 4 },
    ]},
    { w: 6, h: 6, blocks: [], seals: [], cars: [
      { x: 3, y: 5, dir: 3, len: 1, color: 0 },
      { x: 2, y: 1, dir: 0, len: 1, color: 1 },
      { x: 4, y: 2, dir: 2, len: 2, color: 2 },
      { x: 2, y: 3, dir: 1, len: 2, color: 3 },
      { x: 0, y: 5, dir: 2, len: 1, color: 4 },
      { x: 2, y: 0, dir: 1, len: 2, color: 5 },
      { x: 5, y: 4, dir: 3, len: 1, color: 6 },
      { x: 5, y: 3, dir: 0, len: 1, color: 7 },
      { x: 4, y: 4, dir: 3, len: 1, color: 0 },
      { x: 5, y: 2, dir: 0, len: 1, color: 1 },
      { x: 1, y: 4, dir: 2, len: 1, color: 2 },
      { x: 5, y: 0, dir: 1, len: 1, color: 3 },
    ]},
    { w: 5, h: 5, blocks: [{ x: 4, y: 1 }, { x: 0, y: 3 }], seals: [], cars: [
      { x: 1, y: 3, dir: 2, len: 1, color: 1 },
      { x: 4, y: 2, dir: 2, len: 1, color: 5 },
      { x: 4, y: 3, dir: 0, len: 1, color: 2, bidir: 1 },
      { x: 3, y: 0, dir: 0, len: 2, color: 3 },
      { x: 3, y: 4, dir: 3, len: 2, color: 4 },
      { x: 1, y: 4, dir: 3, len: 1, color: 0, bidir: 1 },
      { x: 0, y: 4, dir: 2, len: 1, color: 6, bidir: 1 },
      { x: 1, y: 2, dir: 3, len: 1, color: 7 },
    ]},
    { w: 6, h: 5, blocks: [{ x: 2, y: 3 }], seals: [], cars: [
      { x: 2, y: 2, dir: 2, len: 1, color: 0, bidir: 1 },
      { x: 1, y: 1, dir: 2, len: 2, color: 1 },
      { x: 1, y: 3, dir: 2, len: 1, color: 2 },
      { x: 3, y: 3, dir: 2, len: 1, color: 3 },
      { x: 0, y: 0, dir: 2, len: 1, color: 4 },
      { x: 5, y: 2, dir: 0, len: 2, color: 5 },
      { x: 1, y: 4, dir: 1, len: 2, color: 6 },
      { x: 3, y: 4, dir: 2, len: 1, color: 7 },
      { x: 5, y: 1, dir: 1, len: 3, color: 1 },
      { x: 2, y: 0, dir: 1, len: 1, color: 2 },
    ]},
    { w: 6, h: 6, blocks: [], seals: [{ x: 5, y: 0, dir: 0 }], cars: [
      { x: 2, y: 4, dir: 2, len: 3, color: 1 },
      { x: 5, y: 5, dir: 3, len: 1, color: 4 },
      { x: 3, y: 4, dir: 0, len: 2, color: 2 },
      { x: 4, y: 2, dir: 2, len: 1, color: 3 },
      { x: 2, y: 0, dir: 1, len: 1, color: 5 },
      { x: 4, y: 3, dir: 1, len: 1, color: 6 },
      { x: 1, y: 1, dir: 2, len: 1, color: 0 },
      { x: 5, y: 2, dir: 0, len: 2, color: 7, bidir: 1 },
      { x: 2, y: 5, dir: 2, len: 1, color: 3 },
      { x: 1, y: 2, dir: 2, len: 1, color: 2 },
      { x: 3, y: 0, dir: 0, len: 2, color: 4 },
    ]},
    { w: 6, h: 6, blocks: [], seals: [], cars: [
      { x: 0, y: 1, dir: 2, len: 2, color: 0 },
      { x: 0, y: 3, dir: 2, len: 1, color: 1 },
      { x: 2, y: 2, dir: 1, len: 2, color: 2 },
      { x: 4, y: 3, dir: 2, len: 1, color: 3 },
      { x: 4, y: 5, dir: 3, len: 2, color: 4 },
      { x: 3, y: 0, dir: 1, len: 1, color: 5 },
      { x: 5, y: 2, dir: 0, len: 2, color: 6 },
      { x: 4, y: 1, dir: 1, len: 2, color: 7 },
      { x: 1, y: 4, dir: 2, len: 1, color: 0 },
      { x: 1, y: 5, dir: 3, len: 2, color: 1 },
      { x: 5, y: 0, dir: 0, len: 2, color: 2 },
      { x: 0, y: 5, dir: 3, len: 1, color: 3 },
    ]},
    { w: 6, h: 6, blocks: [{ x: 5, y: 4 }], seals: [{ x: 0, y: 5, dir: 3 }], cars: [
      { x: 5, y: 2, dir: 0, len: 1, color: 1 },
      { x: 4, y: 4, dir: 1, len: 1, color: 5, bidir: 1 },
      { x: 3, y: 4, dir: 0, len: 2, color: 2 },
      { x: 4, y: 0, dir: 3, len: 2, color: 3 },
      { x: 1, y: 1, dir: 2, len: 2, color: 4 },
      { x: 1, y: 2, dir: 2, len: 1, color: 6 },
      { x: 0, y: 0, dir: 2, len: 1, color: 0 },
      { x: 0, y: 4, dir: 2, len: 2, color: 7 },
      { x: 2, y: 1, dir: 1, len: 1, color: 1 },
      { x: 5, y: 1, dir: 1, len: 1, color: 2 },
      { x: 1, y: 5, dir: 2, len: 2, color: 3 },
      { x: 3, y: 2, dir: 0, len: 1, color: 4 },
      { x: 0, y: 5, dir: 3, len: 1, color: 6, bidir: 1 },
    ]},
  ];

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const levelEl = document.getElementById("level");
  const leftEl = document.getElementById("left");
  const movesEl = document.getElementById("moves");
  const overlay = document.getElementById("overlay");
  const titleEl = document.getElementById("title");
  const subtitleEl = document.getElementById("subtitle");
  const starsEl = document.getElementById("stars");
  const startBtn = document.getElementById("startBtn");
  const undoBtn = document.getElementById("undoBtn");
  const hintBtn = document.getElementById("hintBtn");
  const restartBtn = document.getElementById("restartBtn");
  const pausedEl = document.getElementById("paused");

  const LOCAL_KEY = "carjam_v1";
  const BASE_W = 400;
  const BASE_H = 640;

  let progress = { next: 0, stars: [], v: 1 };
  let cloudLoaded = false;
  let audioEnabled = true;
  let systemPaused = false;
  let firstFrameSent = false;
  let gameReadySent = false;
  let audioCtx = null;

  let levelIndex = 0;
  let gridW = 4;
  let gridH = 4;
  let blocks = [];
  let seals = [];
  let cars = [];
  let moves = 0;
  let wrong = 0;
  let history = [];
  let phase = "menu";
  let hintId = -1;
  let hintTime = 0;
  let toast = null;
  let particles = [];
  let finger = 0;

  function cellsOf(car) {
    const d = DIRS[car.dir];
    const out = [];
    for (let i = 0; i < car.len; i++) out.push([car.x - d.x * i, car.y - d.y * i]);
    return out;
  }

  function canLeave(car, forward) {
    if (!forward && !car.bidir) return false;
    const dir = forward ? car.dir : (car.dir + 2) % 4;
    const d = DIRS[dir];
    const occ = new Set();
    for (const b of blocks) occ.add(b.x + "," + b.y);
    for (const other of cars) {
      if (other === car || other.travel) continue;
      for (const cell of cellsOf(other)) occ.add(cell[0] + "," + cell[1]);
    }
    const lead = forward ? [car.x, car.y] : cellsOf(car)[car.len - 1];
    let x = lead[0];
    let y = lead[1];
    let nx = x + d.x;
    let ny = y + d.y;
    while (nx >= 0 && ny >= 0 && nx < gridW && ny < gridH) {
      if (occ.has(nx + "," + ny)) return false;
      x = nx;
      y = ny;
      nx += d.x;
      ny += d.y;
    }
    for (const s of seals) {
      if (s.x === x && s.y === y && s.dir === dir) return false;
    }
    return true;
  }

  function chooseExit(car) {
    if (canLeave(car, true)) return true;
    if (canLeave(car, false)) return false;
    return null;
  }

  function travelInfo(car, forward) {
    const dir = forward ? car.dir : (car.dir + 2) % 4;
    const d = DIRS[dir];
    const lead = forward ? [car.x, car.y] : cellsOf(car)[car.len - 1];
    let steps = 0;
    let x = lead[0] + d.x;
    let y = lead[1] + d.y;
    while (x >= 0 && y >= 0 && x < gridW && y < gridH) {
      steps++;
      x += d.x;
      y += d.y;
    }
    return { vx: d.x, vy: d.y, cells: steps + car.len + 0.85 };
  }

  function layout() {
    const gutter = 36;
    const cell = Math.max(36, Math.floor(Math.min((BASE_W - gutter) / gridW, (BASE_H - 28) / gridH)));
    const lotW = cell * gridW;
    const lotH = cell * gridH;
    return {
      cell,
      lotW,
      lotH,
      ox: (BASE_W - lotW) / 2,
      oy: (BASE_H - lotH) / 2,
    };
  }

  function readLocal() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY) || "null");
    } catch (_) {
      return null;
    }
  }

  function writeLocal(data) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
    } catch (_) {
      /* private mode */
    }
  }

  async function initSave() {
    if (IN_PLAYABLES) {
      const cloud = await loadCloudData();
      cloudLoaded = true;
      if (cloud && typeof cloud.next === "number") progress = sanitize(cloud);
    } else {
      const local = readLocal();
      if (local && typeof local.next === "number") progress = sanitize(local);
      cloudLoaded = true;
    }
  }

  function sanitize(data) {
    const next = Math.max(0, Math.min(LEVELS.length, data.next | 0));
    const stars = Array.isArray(data.stars) ? data.stars.slice(0, LEVELS.length) : [];
    return { next, stars, v: 1 };
  }

  async function persist() {
    if (!cloudLoaded) return;
    if (IN_PLAYABLES) await saveCloudData(progress);
    else writeLocal(progress);
  }

  function ensureAudio() {
    if (!audioEnabled) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function tone(freq, dur, type, gain, when) {
    if (!audioEnabled || !audioCtx) return;
    const t = audioCtx.currentTime + (when || 0);
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function playHorn() {
    tone(196, 0.16, "square", 0.05);
    tone(146, 0.2, "sawtooth", 0.03);
  }

  function playDrive() {
    tone(240, 0.1, "triangle", 0.05);
    tone(360, 0.16, "sine", 0.04);
  }

  function playWin() {
    tone(523, 0.12, "sine", 0.06, 0);
    tone(659, 0.12, "sine", 0.06, 0.1);
    tone(784, 0.22, "sine", 0.07, 0.2);
  }

  function build(index) {
    const src = LEVELS[index];
    levelIndex = index;
    gridW = src.w;
    gridH = src.h;
    blocks = src.blocks.map((b) => ({ x: b.x, y: b.y }));
    seals = src.seals.map((s) => ({ x: s.x, y: s.y, dir: s.dir }));
    cars = src.cars.map((c, id) => ({
      x: c.x,
      y: c.y,
      dir: c.dir,
      len: c.len,
      color: c.color,
      bidir: !!c.bidir,
      id,
      shake: 0,
      travel: null,
    }));
    moves = 0;
    wrong = 0;
    history = [];
    hintId = -1;
    hintTime = 0;
    particles = [];
    finger = 0;
    toast = null;
    updateHud();
  }

  function showTip() {
    const tip = levelTip(LEVELS[levelIndex]);
    toast = tip ? { text: tip, life: 2.6, banner: true } : null;
  }

  function levelTip(src) {
    const hasCone = src.blocks.length > 0;
    const hasSeal = src.seals.length > 0;
    const hasBidir = src.cars.some((c) => c.bidir);
    if (hasCone && hasSeal) return "Cones and barriers block lanes";
    if (hasCone) return "Orange cones never move";
    if (hasSeal) return "Stripes close that exit";
    if (hasBidir) return "Double arrow can reverse";
    if (levelIndex === 0) return "Tap the car with a clear lane";
    return "";
  }

  function showOverlay(title, subtitle, btn, stars) {
    titleEl.textContent = title;
    subtitleEl.textContent = subtitle;
    startBtn.textContent = btn;
    if (stars) {
      starsEl.hidden = false;
      starsEl.innerHTML = "<span>" + "★".repeat(stars) + "</span><span class=\"off\">" + "★".repeat(3 - stars) + "</span>";
    } else {
      starsEl.hidden = true;
      starsEl.textContent = "";
    }
    overlay.classList.add("show");
  }

  function hideOverlay() {
    overlay.classList.remove("show");
  }

  function showMenu() {
    const clearedAll = progress.next >= LEVELS.length;
    const idx = clearedAll ? 0 : progress.next;
    build(idx);
    phase = "menu";
    showOverlay(
      clearedAll ? "All clear" : "Tap to play",
      clearedAll
        ? "Every lot is empty. Play them again?"
        : "Tap a car. If its lane is clear, it drives straight off. Clear the whole lot.",
      clearedAll ? "Play again" : progress.next > 0 ? "Continue" : "Play"
    );
    updateHud();
  }

  function starCount() {
    if (wrong === 0) return 3;
    if (wrong <= 2) return 2;
    return 1;
  }

  function finishLevel() {
    phase = "cleared";
    const stars = starCount();
    progress.stars[levelIndex] = Math.max(progress.stars[levelIndex] || 0, stars);
    progress.next = Math.max(progress.next, Math.min(LEVELS.length, levelIndex + 1));
    persist();
    sendScore(progress.next);
    playWin();
    const m = layout();
    for (let i = 0; i < 36; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 70 + Math.random() * 160;
      particles.push({
        x: m.ox + m.lotW / 2,
        y: m.oy + m.lotH / 2,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 40,
        life: 0.8 + Math.random() * 0.4,
        max: 1.1,
        color: COLORS[i % COLORS.length][0],
        r: 3 + Math.random() * 3,
      });
    }
    const last = levelIndex + 1 >= LEVELS.length;
    showOverlay(
      last ? "All clear" : "Lot clear",
      (last ? "You emptied every lot. " : "") + "Moves " + moves,
      last ? "Play again" : "Next",
      stars
    );
    updateHud();
  }

  function snapshot() {
    return cars
      .filter((c) => !c.travel)
      .map((c) => ({
        x: c.x,
        y: c.y,
        dir: c.dir,
        len: c.len,
        color: c.color,
        bidir: c.bidir,
      }));
  }

  function restore(list) {
    cars = list.map((c, id) => ({
      x: c.x,
      y: c.y,
      dir: c.dir,
      len: c.len,
      color: c.color,
      bidir: !!c.bidir,
      id,
      shake: 0,
      travel: null,
    }));
  }

  function tapCar(car) {
    if (phase !== "play" || systemPaused) return;
    if (cars.some((c) => c.travel)) return;
    const forward = chooseExit(car);
    if (forward === null) {
      car.shake = 0.42;
      wrong++;
      const m = layout();
      toast = {
        text: "Blocked",
        life: 0.65,
        x: m.ox + (car.x + 0.5) * m.cell,
        y: m.oy + car.y * m.cell - 6,
      };
      playHorn();
      updateHud();
      return;
    }
    history.push(snapshot());
    if (history.length > 50) history.shift();
    const info = travelInfo(car, forward);
    car.travel = { vx: info.vx, vy: info.vy, cells: info.cells, t: 0 };
    moves++;
    hintId = -1;
    playDrive();
    updateHud();
  }

  function undo() {
    if (phase !== "play" || systemPaused) return;
    if (cars.some((c) => c.travel)) return;
    const prev = history.pop();
    if (!prev) return;
    restore(prev);
    moves = Math.max(0, moves - 1);
    hintId = -1;
    updateHud();
  }

  function hint() {
    if (phase !== "play" || systemPaused) return;
    if (cars.some((c) => c.travel)) return;
    const free = cars.find((c) => chooseExit(c) !== null);
    if (!free) return;
    hintId = free.id;
    hintTime = 1.7;
    ensureAudio();
    tone(660, 0.08, "sine", 0.04);
  }

  function restart() {
    if (phase === "menu" || systemPaused) return;
    beginPlay(levelIndex);
  }

  function updateHud() {
    levelEl.textContent = String(levelIndex + 1);
    leftEl.textContent = String(cars.filter((c) => !c.travel).length);
    movesEl.textContent = String(moves);
    const playing = phase === "play" && !systemPaused;
    undoBtn.disabled = !playing || history.length === 0;
    hintBtn.disabled = !playing;
    restartBtn.disabled = phase === "menu";
  }

  function update(dt) {
    if (systemPaused) return;
    finger += dt;
    if (toast) {
      toast.life -= dt;
      if (toast.life <= 0) toast = null;
    }
    if (hintTime > 0) hintTime -= dt;
    for (const p of particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 280 * dt;
    }
    particles = particles.filter((p) => p.life > 0);

    if (phase !== "play") return;

    for (const car of cars) {
      if (car.shake > 0) car.shake = Math.max(0, car.shake - dt);
      if (!car.travel) continue;
      car.travel.t += dt * 7.2;
      if (car.travel.t >= car.travel.cells) car.gone = true;
    }

    const leaving = cars.filter((c) => c.gone);
    if (leaving.length) {
      const m = layout();
      for (const car of leaving) {
        const spot = carCenter(car, m);
        const col = COLORS[car.color % COLORS.length][0];
        for (let i = 0; i < 8; i++) {
          const a = Math.random() * Math.PI * 2;
          particles.push({
            x: spot.x,
            y: spot.y,
            vx: Math.cos(a) * 90,
            vy: Math.sin(a) * 90,
            life: 0.35,
            max: 0.35,
            color: col,
            r: 2.5,
          });
        }
      }
      cars = cars.filter((c) => !c.gone);
      updateHud();
      if (cars.length === 0) finishLevel();
    }
  }

  function carCenter(car, m) {
    const cells = cellsOf(car);
    let sx = 0;
    let sy = 0;
    for (const c of cells) {
      sx += c[0];
      sy += c[1];
    }
    let x = m.ox + ((sx / cells.length) + 0.5) * m.cell;
    let y = m.oy + ((sy / cells.length) + 0.5) * m.cell;
    if (car.travel) {
      x += car.travel.vx * car.travel.t * m.cell;
      y += car.travel.vy * car.travel.t * m.cell;
    }
    if (car.shake > 0) {
      const d = DIRS[car.dir];
      const mag = Math.sin(car.shake * 46) * 5;
      x += -d.y * mag;
      y += d.x * mag;
    }
    return { x, y };
  }

  function roundRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, BASE_H);
    g.addColorStop(0, "#1c2433");
    g.addColorStop(1, "#12161e");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, BASE_W, BASE_H);
  }

  function drawLot(m) {
    ctx.save();
    ctx.fillStyle = "#323846";
    roundRect(m.ox - 22, m.oy - 22, m.lotW + 44, m.lotH + 44, 18);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 204, 77, 0.55)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#d9d3c5";
    roundRect(m.ox, m.oy, m.lotW, m.lotH, 8);
    ctx.fill();

    ctx.strokeStyle = "rgba(90, 78, 60, 0.28)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let c = 1; c < gridW; c++) {
      const x = m.ox + c * m.cell;
      ctx.moveTo(x, m.oy + 8);
      ctx.lineTo(x, m.oy + m.lotH - 8);
    }
    for (let r = 1; r < gridH; r++) {
      const y = m.oy + r * m.cell;
      ctx.moveTo(m.ox + 8, y);
      ctx.lineTo(m.ox + m.lotW - 8, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawSeal(s, m) {
    const x = m.ox + s.x * m.cell;
    const y = m.oy + s.y * m.cell;
    const pad = 6;
    let rx = x + pad;
    let ry = y + pad;
    let rw = m.cell - pad * 2;
    let rh = 10;
    if (s.dir === 0) ry = y - 12;
    else if (s.dir === 2) ry = y + m.cell + 2;
    else if (s.dir === 3) {
      rx = x - 12;
      ry = y + pad;
      rw = 10;
      rh = m.cell - pad * 2;
    } else {
      rx = x + m.cell + 2;
      ry = y + pad;
      rw = 10;
      rh = m.cell - pad * 2;
    }
    ctx.save();
    roundRect(rx, ry, rw, rh, 2);
    ctx.fillStyle = "#f4f4f4";
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = "#e23b3b";
    const span = Math.max(rw, rh);
    for (let i = -span; i < span * 2; i += 8) {
      ctx.beginPath();
      ctx.moveTo(rx + i, ry);
      ctx.lineTo(rx + i + 4, ry);
      ctx.lineTo(rx + i + 4 + rh, ry + rh);
      ctx.lineTo(rx + i + rh, ry + rh);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawCone(b, m) {
    const cx = m.ox + (b.x + 0.5) * m.cell;
    const cy = m.oy + (b.y + 0.5) * m.cell;
    const h = m.cell * 0.42;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(0, h * 0.45, h * 0.55, h * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff8a1e";
    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.lineTo(h * 0.62, h * 0.45);
    ctx.lineTo(-h * 0.62, h * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(-h * 0.36, -h * 0.05, h * 0.72, h * 0.16);
    ctx.restore();
  }

  function drawArrow(lenPx, widPx, bidir) {
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    const head = (sign, tip, tail) => {
      ctx.beginPath();
      ctx.moveTo(sign * tip, 0);
      ctx.lineTo(sign * tail, -widPx * 0.2);
      ctx.lineTo(sign * tail, widPx * 0.2);
      ctx.closePath();
      ctx.fill();
    };
    if (bidir) {
      head(1, lenPx * 0.36, lenPx * 0.1);
      head(-1, lenPx * 0.36, lenPx * 0.1);
      return;
    }
    head(1, lenPx * 0.24, -lenPx * 0.02);
  }

  function drawCar(car, m) {
    const spot = carCenter(car, m);
    const lenPx = car.len * m.cell - m.cell * 0.2;
    const widPx = m.cell * 0.66;
    const rot = [-Math.PI / 2, 0, Math.PI / 2, Math.PI][car.dir];
    const palette = COLORS[car.color % COLORS.length];
    const hinted = car.id === hintId && hintTime > 0;

    ctx.save();
    ctx.translate(spot.x, spot.y);
    if (hinted) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 204, 77, 0.95)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(0, 0, lenPx * 0.62, widPx * 0.85, rot, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.rotate(rot);

    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(0, widPx * 0.55, lenPx * 0.42, widPx * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    const body = ctx.createLinearGradient(0, -widPx / 2, 0, widPx / 2);
    body.addColorStop(0, palette[0]);
    body.addColorStop(1, palette[1]);
    roundRect(-lenPx / 2, -widPx / 2, lenPx, widPx, Math.min(12, widPx * 0.35));
    ctx.fillStyle = body;
    ctx.fill();

    ctx.fillStyle = "rgba(0,0,0,0.14)";
    roundRect(-lenPx * 0.18, -widPx * 0.34, lenPx * 0.42, widPx * 0.68, 6);
    ctx.fill();

    ctx.fillStyle = "rgba(214, 236, 255, 0.55)";
    roundRect(lenPx * 0.12, -widPx * 0.28, lenPx * 0.16, widPx * 0.56, 3);
    ctx.fill();

    ctx.fillStyle = "#1b1f27";
    const wheelW = Math.max(4, m.cell * 0.07);
    const wheelH = widPx * 0.22;
    const inset = lenPx * 0.28;
    ctx.fillRect(-inset, -widPx / 2 - wheelW * 0.2, wheelH, wheelW);
    ctx.fillRect(inset - wheelH, -widPx / 2 - wheelW * 0.2, wheelH, wheelW);
    ctx.fillRect(-inset, widPx / 2 - wheelW * 0.8, wheelH, wheelW);
    ctx.fillRect(inset - wheelH, widPx / 2 - wheelW * 0.8, wheelH, wheelW);

    ctx.fillStyle = "#ffe08a";
    ctx.beginPath();
    ctx.arc(lenPx * 0.42, -widPx * 0.22, 2.2, 0, Math.PI * 2);
    ctx.arc(lenPx * 0.42, widPx * 0.22, 2.2, 0, Math.PI * 2);
    ctx.fill();

    drawArrow(lenPx, widPx, car.bidir);
    ctx.restore();
  }

  function drawFinger(m) {
    if (phase !== "play" || levelIndex !== 0 || moves > 0 || wrong > 0) return;
    const car = cars.find((c) => chooseExit(c) !== null);
    if (!car) return;
    const spot = carCenter(car, m);
    const bob = Math.sin(finger * 5) * 6;
    ctx.save();
    ctx.translate(spot.x, spot.y - m.cell * 0.62 + bob);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2a1c08";
    ctx.font = "700 12px Trebuchet MS, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TAP", 0, 1);
    ctx.restore();
  }

  function drawToast(m) {
    if (!toast) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, toast.life * 2));
    ctx.font = "700 16px Trebuchet MS, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const text = toast.text;
    const width = ctx.measureText(text).width + 22;
    const x = toast.banner ? BASE_W / 2 : toast.x;
    const y = toast.banner ? m.oy - 8 : toast.y;
    roundRect(x - width / 2, y - 16, width, 30, 15);
    ctx.fillStyle = toast.banner ? "rgba(20, 24, 32, 0.88)" : "rgba(120, 24, 24, 0.92)";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    const cssW = canvas._cssW || canvas.clientWidth || BASE_W;
    const cssH = canvas._cssH || canvas.clientHeight || BASE_H;
    ctx.fillStyle = "#12161e";
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.save();
    ctx.translate(canvas._ox || 0, canvas._oy || 0);
    ctx.scale(canvas._scale || 1, canvas._scale || 1);

    const m = layout();
    drawBackground();
    drawLot(m);
    for (const s of seals) drawSeal(s, m);
    for (const b of blocks) drawCone(b, m);
    const ordered = cars.slice().sort((a, b) => (a.travel ? 1 : 0) - (b.travel ? 1 : 0));
    for (const car of ordered) drawCar(car, m);
    drawParticles();
    drawFinger(m);
    drawToast(m);

    ctx.restore();

    if (!firstFrameSent) {
      firstFrameSent = true;
      firstFrameReady();
    }
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas._cssW = cssW;
    canvas._cssH = cssH;
    canvas._scale = Math.min(cssW / BASE_W, cssH / BASE_H);
    canvas._ox = (cssW - BASE_W * canvas._scale) / 2;
    canvas._oy = (cssH - BASE_H * canvas._scale) / 2;
  }

  function toGame(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - (canvas._ox || 0)) / (canvas._scale || 1),
      y: (clientY - rect.top - (canvas._oy || 0)) / (canvas._scale || 1),
    };
  }

  function carAt(px, py) {
    const m = layout();
    const col = Math.floor((px - m.ox) / m.cell);
    const row = Math.floor((py - m.oy) / m.cell);
    if (col < 0 || row < 0 || col >= gridW || row >= gridH) return null;
    for (let i = cars.length - 1; i >= 0; i--) {
      if (cars[i].travel) continue;
      for (const cell of cellsOf(cars[i])) {
        if (cell[0] === col && cell[1] === row) return cars[i];
      }
    }
    return null;
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (overlay.classList.contains("show")) return;
    ensureAudio();
    const p = toGame(e.clientX, e.clientY);
    const car = carAt(p.x, p.y);
    if (car) tapCar(car);
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  undoBtn.addEventListener("click", () => {
    ensureAudio();
    undo();
  });
  hintBtn.addEventListener("click", () => {
    ensureAudio();
    hint();
  });
  restartBtn.addEventListener("click", () => {
    ensureAudio();
    restart();
  });
  function beginPlay(index) {
    if (typeof index === "number") build(index);
    phase = "play";
    hideOverlay();
    showTip();
    updateHud();
  }

  startBtn.addEventListener("click", () => {
    ensureAudio();
    if (phase === "cleared") {
      beginPlay(levelIndex + 1 >= LEVELS.length ? 0 : levelIndex + 1);
      return;
    }
    beginPlay();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "z" || e.key === "Z" || e.key === "Backspace") {
      undo();
      e.preventDefault();
    } else if (e.key === "h" || e.key === "H") {
      hint();
    } else if (e.key === "r" || e.key === "R") {
      restart();
    } else if ((e.key === "Enter" || e.key === " " || e.key === "Escape") && overlay.classList.contains("show")) {
      startBtn.click();
      e.preventDefault();
    }
  });

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => setTimeout(resize, 80));

  function setSystemPaused(on) {
    systemPaused = on;
    pausedEl.hidden = !on;
    if (on && audioCtx) audioCtx.suspend();
    else if (!on && audioEnabled && audioCtx) audioCtx.resume();
    updateHud();
  }

  function wirePlayables() {
    if (!YT || !YT.system) return;
    if (typeof YT.system.isAudioEnabled === "function") {
      audioEnabled = !!YT.system.isAudioEnabled();
    }
    if (typeof YT.system.onAudioEnabledChange === "function") {
      YT.system.onAudioEnabledChange((enabled) => {
        audioEnabled = !!enabled;
        if (!audioEnabled && audioCtx) audioCtx.suspend();
        else if (audioEnabled && audioCtx && !systemPaused) audioCtx.resume();
      });
    }
    if (typeof YT.system.onPause === "function") {
      YT.system.onPause(() => {
        setSystemPaused(true);
        if (cloudLoaded) persist();
      });
    }
    if (typeof YT.system.onResume === "function") {
      YT.system.onResume(() => setSystemPaused(false));
    }
  }

  async function boot() {
    resize();
    wirePlayables();
    build(0);
    phase = "menu";
    draw();
    await initSave();
    showMenu();

    if (!gameReadySent) {
      gameReadySent = true;
      gameReady();
    }
    requestAnimationFrame(loop);
  }

  boot();
})();
