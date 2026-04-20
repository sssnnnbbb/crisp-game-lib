title = "LOCK ON";

description = `HOLD to aim
RELEASE to fire`;

characters = [];

const CONFIG = {
  MAX_CHAIN: 4,
  BEAM_RANGE: 60,
  ENEMY_SPEEDS: [0.3, 0.5, 0.8],
  SPAWN_INTERVAL_BEATS: [2, 1, 1], // beats between spawns per tier
  SPAWN_COUNTS: [1, 1, 2],         // enemies spawned per event per tier
  COMBO_TO_L2: 4,
  COMBO_TO_L3: 8,
  PLAYER_Y: 80,
  LOCK_RADIUS: 5,
  MAX_LIVES: 3,
};

options = { theme: "simple", isPlayingBgm: false };

/** @type {{pos: import("../bundle").Vector}, speed: number, dead: boolean, locked: boolean, lockIndex: number}[]} */
let enemies;
/** @type {{enemy: object}[]} */
let chain;
let combo;
let intensity;
let flashFrames;
/** @type {{enemy: object, fireTime: number}[]} */
let pendingHits;
let lives;

function update() {
  if (!ticks) {
    initGame();
    music.startBed(intensity);
  }
  music.tick();

  // Subtle beat pulse on the background
  if (music.isOnBeatFrame()) {
    color("light_black");
    rect(0, 0, 100, 100);
  }

  // Brief flash triggered by enemy kills
  if (flashFrames > 0) {
    flashFrames--;
    color("light_cyan");
    rect(0, 0, 100, 100);
  }

  // Process time-delayed enemy destructions (keeps particle/score inside update)
  processPendingHits();

  // Draw enemies (before beam so beam renders on top)
  updateAndDrawEnemies();

  // Player ship (small upward triangle)
  color("cyan");
  line(vec(50, CONFIG.PLAYER_Y - 4), vec(46, CONFIG.PLAYER_Y + 3), 1.5);
  line(vec(50, CONFIG.PLAYER_Y - 4), vec(54, CONFIG.PLAYER_Y + 3), 1.5);
  line(vec(46, CONFIG.PLAYER_Y + 3), vec(54, CONFIG.PLAYER_Y + 3), 1.5);

  // Beam + lock-on while button held
  if (input.isPressed) {
    drawBeamAndLock();
  }

  // Fire on release
  if (input.isJustReleased) {
    fireChain();
  }

  // Lives indicator (bottom-left dots)
  drawLives();
}

function initGame() {
  music.init({
    bpm: 120,
    rootMidi: 60,
    scale: music.SCALES.minor,
    bedPatterns: music.BED_PRESETS.minimal,
  });
  music.clearBeatListeners();
  music.onBeat(onBeatTick);
  enemies = [];
  chain = [];
  combo = 0;
  intensity = 1;
  flashFrames = 0;
  pendingHits = [];
  lives = CONFIG.MAX_LIVES;
}

function onBeatTick(beatIdx) {
  const tier = Math.min(2, Math.floor(ticks / 60 / 20));
  const every = CONFIG.SPAWN_INTERVAL_BEATS[tier];
  const count = CONFIG.SPAWN_COUNTS[tier];
  if (beatIdx % every === 0) {
    for (let i = 0; i < count; i++) {
      spawnEnemy(tier);
    }
  }
}

function spawnEnemy(tier) {
  const baseSpeed = CONFIG.ENEMY_SPEEDS[tier];
  enemies.push({
    pos: vec(rnd(8, 92), -4),
    speed: baseSpeed * (0.85 + rnd(0, 0.3)),
    dead: false,
    locked: false,
    lockIndex: -1,
  });
}

function updateAndDrawEnemies() {
  remove(enemies, (e) => {
    if (e.dead) return true;

    e.pos.y += e.speed;

    // Locked enemies are highlighted cyan; unlocked enemies are red
    color(e.locked ? "cyan" : "red");
    box(e.pos, 5, 3);

    // Lock-order number above locked enemy
    if (e.locked && e.lockIndex >= 0) {
      color("yellow");
      text(`${e.lockIndex + 1}`, e.pos.x - 2, e.pos.y - 6, { isSmallText: true });
    }

    // Enemy reached the ground → miss
    if (e.pos.y > 95) {
      chain = chain.filter((c) => c.enemy !== e);
      onEnemyMiss();
      return true;
    }

    return false;
  });
}

function onEnemyMiss() {
  music.playNote(-1, { waveform: "sawtooth", volume: 0.1, octave: -1 });
  intensity = Math.max(0, intensity - 1);
  music.setBedIntensity(intensity);
  combo = 0;
  lives--;
  if (lives <= 0) {
    music.stopBed();
    music.playNote(-7, { waveform: "sawtooth", volume: 0.2, octave: -1 });
    end();
  }
}

function drawBeamAndLock() {
  const px = 50;
  const py = CONFIG.PLAYER_Y;
  const cx = input.pos.x;
  const cy = input.pos.y;

  // Clamp beam endpoint to BEAM_RANGE distance from player
  const dx = cx - px;
  const dy = cy - py;
  const dist = sqrt(dx * dx + dy * dy);
  let ex, ey;
  if (dist <= CONFIG.BEAM_RANGE || dist < 0.001) {
    ex = cx; ey = cy;
  } else {
    const s = CONFIG.BEAM_RANGE / dist;
    ex = px + dx * s;
    ey = py + dy * s;
  }

  // Beam "breathes" with the beat phase for a living feel
  const beamWidth = 1 + music.getBeatPhase() * 0.5;
  color("yellow");
  line(vec(px, py), vec(ex, ey), beamWidth);

  // Detect new lock-ons: enemy near the beam line gets queued
  if (chain.length < CONFIG.MAX_CHAIN) {
    enemies.forEach((e) => {
      if (e.dead || e.locked) return;
      if (!isNearSegment(px, py, ex, ey, e.pos.x, e.pos.y, CONFIG.LOCK_RADIUS)) return;
      e.locked = true;
      e.lockIndex = chain.length;
      chain.push({ enemy: e });
      // Soft preview note: rising scale degree, quiet sine
      music.playNote(e.lockIndex * 2, { octave: 0, waveform: "sine", volume: 0.08 });
    });
  }

  // Draw circular markers around locked enemies
  chain.forEach((c) => {
    if (!c.enemy.dead) {
      color("yellow");
      arc(c.enemy.pos, 5, 1, 0, PI * 2);
    }
  });
}

/**
 * Point-to-segment distance check.
 * Returns true if (px, py) is within `threshold` pixels of segment (x1,y1)→(x2,y2).
 */
function isNearSegment(x1, y1, x2, y2, px, py, threshold) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 0.001) {
    return sqrt((px - x1) ** 2 + (py - y1) ** 2) < threshold;
  }
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / lenSq, 0, 1);
  const qx = x1 + t * dx;
  const qy = y1 + t * dy;
  return sqrt((px - qx) ** 2 + (py - qy) ** 2) < threshold;
}

function processPendingHits() {
  const now = Date.now();
  remove(pendingHits, (hit) => {
    if (now < hit.fireTime) return false;
    if (!hit.enemy.dead) {
      hit.enemy.dead = true;
      music.vibrate(8);
      particle(hit.enemy.pos, { count: 6, speed: 2, angle: 0, angleWidth: PI * 2 });
      addScore(10, hit.enemy.pos);
      flashFrames = 1;
    }
    return true;
  });
}

function fireChain() {
  // Filter out enemies already killed before release
  const validChain = chain.filter((c) => !c.enemy.dead);

  // Reset locked state for everything in the old chain
  chain.forEach((c) => {
    c.enemy.locked = false;
    c.enemy.lockIndex = -1;
  });
  chain = [];

  if (validChain.length === 0) {
    // No targets — low dud note
    music.playNote(-1, { volume: 0.08, waveform: "triangle" });
    return;
  }

  // Fire ascending arpeggio (0→2→4→6 = root, 3rd, 5th, 7th of minor scale)
  music.playArpeggio(
    validChain.map((_, i) => i * 2),
    { quantize: true, stepSec: 0.08, octave: 1, volume: 0.18 }
  );

  // Schedule visual + haptic hits to sync with each arpeggio note
  const now = Date.now();
  validChain.forEach((c, i) => {
    pendingHits.push({ enemy: c.enemy, fireTime: now + i * 80 });
  });

  // Advance combo and bed intensity
  combo++;
  if (combo >= CONFIG.COMBO_TO_L3 && intensity < 3) {
    intensity = 3;
    music.setBedIntensity(3);
  } else if (combo >= CONFIG.COMBO_TO_L2 && intensity < 2) {
    intensity = 2;
    music.setBedIntensity(2);
    music.playChord(0, "add9", { octave: 1 });
  }
}

function drawLives() {
  for (let i = 0; i < lives; i++) {
    color("cyan");
    rect(3 + i * 6, 93, 4, 4);
  }
}
