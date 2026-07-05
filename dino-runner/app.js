const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const refs = {
  score: document.getElementById("score"),
  bestScore: document.getElementById("bestScore"),
  overlay: document.getElementById("overlay"),
  overlayKicker: document.getElementById("overlayKicker"),
  overlayTitle: document.getElementById("overlayTitle"),
  overlayText: document.getElementById("overlayText"),
  startBtn: document.getElementById("startBtn"),
  jumpBtn: document.getElementById("jumpBtn"),
  duckBtn: document.getElementById("duckBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  restartBtn: document.getElementById("restartBtn"),
};

const storageKey = "dino-runner-best-score";
const world = {
  width: 960,
  height: 360,
  groundY: 286,
  gravity: 0.48,
  holdGravity: 0.34,
  releaseGravity: 0.9,
  fastFallGravity: 0.78,
  jumpVelocity: -16.2,
  jumpCutVelocity: -6.6,
  maxJumpHoldMs: 190,
  baseSpeed: 5.6,
};

const state = {
  mode: "ready",
  lastFrame: 0,
  elapsed: 0,
  score: 0,
  bestScore: Number(localStorage.getItem(storageKey) || 0),
  speed: world.baseSpeed,
  nextObstacleIn: 980,
  nextCloudIn: 200,
  obstacles: [],
  clouds: [],
  dust: [],
  keys: { duck: false, jump: false },
};

const dino = {
  x: 86,
  y: world.groundY - 62,
  width: 48,
  height: 62,
  duckHeight: 36,
  velocityY: 0,
  grounded: true,
  ducking: false,
  jumpHeldMs: 0,
  step: 0,
};

function resetGame(startRunning = false) {
  state.mode = startRunning ? "running" : "ready";
  state.elapsed = 0;
  state.score = 0;
  state.speed = world.baseSpeed;
  state.nextObstacleIn = 900;
  state.nextCloudIn = 140;
  state.obstacles = [];
  state.clouds = [];
  state.dust = [];
  state.lastFrame = performance.now();
  dino.y = world.groundY - dino.height;
  dino.velocityY = 0;
  dino.grounded = true;
  dino.ducking = false;
  dino.jumpHeldMs = 0;
  state.keys.jump = false;
  state.keys.duck = false;
  updateScore();
  if (startRunning) {
    hideOverlay();
  } else {
    showOverlay("Ready", "Press Space to Run", "Jump over cacti. Duck under birds.", "Start Game");
  }
}

function startGame() {
  if (state.mode === "gameover" || state.mode === "ready") {
    resetGame(true);
    return;
  }
  if (state.mode === "paused") {
    state.mode = "running";
    state.lastFrame = performance.now();
    refs.pauseBtn.textContent = "Pause";
    hideOverlay();
  }
}

function startJump() {
  if (state.mode !== "running") {
    startGame();
  }
  state.keys.jump = true;
  if (state.mode !== "running") return;
  if (!dino.grounded) return;
  dino.velocityY = world.jumpVelocity;
  dino.grounded = false;
  dino.ducking = false;
  dino.jumpHeldMs = 0;
  addDust(8);
}

function endJump() {
  state.keys.jump = false;
  if (dino.velocityY < world.jumpCutVelocity) {
    dino.velocityY = world.jumpCutVelocity;
  }
}

function setDuck(ducking) {
  state.keys.duck = ducking;
  if (state.mode !== "running") return;
  dino.ducking = ducking && dino.grounded;
}

function togglePause() {
  if (state.mode === "ready" || state.mode === "gameover") return;
  if (state.mode === "paused") {
    startGame();
    return;
  }
  state.mode = "paused";
  refs.pauseBtn.textContent = "Resume";
  showOverlay("Paused", "Game Paused", "Catch your breath, then keep running.", "Resume");
}

function update(delta) {
  if (state.mode !== "running") return;
  const frameStep = delta / 16.67;
  state.elapsed += delta;
  state.speed = world.baseSpeed + Math.min(8.5, state.elapsed / 10500);
  state.score += delta * 0.012 * (state.speed / world.baseSpeed);
  dino.step += delta * 0.013;

  if (!dino.grounded && state.keys.jump && dino.velocityY < 0) {
    dino.jumpHeldMs += delta;
  }
  const holdingJump = state.keys.jump && dino.velocityY < 0 && dino.jumpHeldMs < world.maxJumpHoldMs;
  const gravity = getGravity(holdingJump);
  dino.velocityY += gravity * frameStep;
  dino.y += dino.velocityY * frameStep;
  const targetHeight = dino.ducking ? dino.duckHeight : dino.height;
  const floorY = world.groundY - targetHeight;
  if (dino.y >= floorY) {
    dino.y = floorY;
    dino.velocityY = 0;
    dino.grounded = true;
    dino.ducking = state.keys.duck;
    dino.jumpHeldMs = 0;
  } else {
    dino.grounded = false;
    dino.ducking = false;
  }

  state.nextObstacleIn -= delta;
  if (state.nextObstacleIn <= 0) {
    spawnObstacle();
  }

  state.nextCloudIn -= delta;
  if (state.nextCloudIn <= 0) {
    spawnCloud();
  }

  moveWorldItems(delta);
  checkCollisions();
  updateScore();
}

function getGravity(holdingJump) {
  if (state.keys.duck && !dino.grounded) return world.fastFallGravity;
  if (holdingJump) return world.holdGravity;
  if (!state.keys.jump && dino.velocityY < 0) return world.releaseGravity;
  return world.gravity;
}

function spawnObstacle() {
  const progress = Math.min(1, state.elapsed / 22000);
  const canBird = state.score > 180 && Math.random() < 0.28 + progress * 0.18;
  if (canBird) {
    const heights = [world.groundY - 118, world.groundY - 88, world.groundY - 62];
    const y = heights[Math.floor(Math.random() * heights.length)];
    state.obstacles.push({
      type: "bird",
      x: world.width + 24,
      y,
      width: 54,
      height: 30,
      phase: Math.random() * Math.PI * 2,
    });
  } else {
    const groupChance = state.score < 120 ? 0.12 : 0.28 + progress * 0.18;
    const group = Math.random() < groupChance ? 2 + Math.floor(Math.random() * 2) : 1;
    const height = 38 + Math.floor(Math.random() * 24);
    state.obstacles.push({
      type: "cactus",
      x: world.width + 20,
      y: world.groundY - height,
      width: group * 24 + (group - 1) * 8,
      height,
      group,
    });
  }
  state.nextObstacleIn = 900 + Math.random() * 760 - Math.min(280, state.speed * 22);
}

function spawnCloud() {
  state.clouds.push({
    x: world.width + 80,
    y: 40 + Math.random() * 92,
    width: 74 + Math.random() * 46,
    speed: 0.45 + Math.random() * 0.45,
  });
  state.nextCloudIn = 700 + Math.random() * 1200;
}

function moveWorldItems(delta) {
  const distance = state.speed * (delta / 16.67);
  state.obstacles.forEach((obstacle) => {
    obstacle.x -= distance;
    if (obstacle.type === "bird") {
      obstacle.phase += delta * 0.018;
    }
  });
  state.clouds.forEach((cloud) => {
    cloud.x -= cloud.speed * (delta / 16.67);
  });
  state.dust.forEach((puff) => {
    puff.x -= distance * 0.8;
    puff.y += puff.vy;
    puff.life -= delta;
    puff.size *= 0.985;
  });
  state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -30);
  state.clouds = state.clouds.filter((cloud) => cloud.x + cloud.width > -80);
  state.dust = state.dust.filter((puff) => puff.life > 0 && puff.size > 0.4);
}

function checkCollisions() {
  const box = getDinoBox();
  const hit = state.obstacles.some((obstacle) => intersects(box, getObstacleBox(obstacle)));
  if (!hit) return;
  state.mode = "gameover";
  addDust(14);
  state.bestScore = Math.max(state.bestScore, Math.floor(state.score));
  localStorage.setItem(storageKey, String(state.bestScore));
  updateScore();
  refs.pauseBtn.textContent = "Pause";
  showOverlay("Crashed", "Game Over", `Score ${padScore(state.score)}. Tap restart and try again.`, "Run Again");
}

function getDinoBox() {
  const height = dino.ducking ? dino.duckHeight : dino.height;
  const width = dino.ducking ? 66 : dino.width;
  return {
    x: dino.x + 12,
    y: dino.y + 10,
    width: width - 22,
    height: height - 16,
  };
}

function getObstacleBox(obstacle) {
  if (obstacle.type === "bird") {
    return {
      x: obstacle.x + 6,
      y: obstacle.y + 7,
      width: obstacle.width - 12,
      height: obstacle.height - 12,
    };
  }
  return {
    x: obstacle.x + 8,
    y: obstacle.y + 8,
    width: obstacle.width - 16,
    height: obstacle.height - 8,
  };
}

function intersects(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function render() {
  ctx.clearRect(0, 0, world.width, world.height);
  drawSky();
  drawClouds();
  drawGround();
  drawDust();
  drawDino();
  state.obstacles.forEach(drawObstacle);
  if (state.mode === "ready") drawPrompt();
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, world.height);
  gradient.addColorStop(0, "#d8edf7");
  gradient.addColorStop(0.7, "#f7edcf");
  gradient.addColorStop(1, "#f2d38b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, world.width, world.height);
  ctx.fillStyle = "rgba(255, 255, 255, 0.76)";
  ctx.beginPath();
  ctx.arc(835, 62, 30, 0, Math.PI * 2);
  ctx.fill();
}

function drawClouds() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
  state.clouds.forEach((cloud) => {
    ctx.beginPath();
    ctx.ellipse(cloud.x, cloud.y + 12, cloud.width * 0.38, 13, 0, 0, Math.PI * 2);
    ctx.ellipse(cloud.x + cloud.width * 0.25, cloud.y, cloud.width * 0.28, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(cloud.x + cloud.width * 0.5, cloud.y + 12, cloud.width * 0.34, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawGround() {
  ctx.fillStyle = "#d9ad63";
  ctx.fillRect(0, world.groundY, world.width, world.height - world.groundY);
  ctx.strokeStyle = "#9b7543";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, world.groundY + 1);
  ctx.lineTo(world.width, world.groundY + 1);
  ctx.stroke();

  ctx.fillStyle = "rgba(120, 88, 43, 0.34)";
  const offset = -(state.elapsed * state.speed * 0.004) % 80;
  for (let x = offset; x < world.width; x += 80) {
    ctx.fillRect(x, world.groundY + 34, 28, 3);
    ctx.fillRect(x + 42, world.groundY + 58, 18, 2);
  }
}

function drawDino() {
  const height = dino.ducking ? dino.duckHeight : dino.height;
  const width = dino.ducking ? 68 : dino.width;
  const x = dino.x;
  const y = world.groundY - height + (dino.grounded ? 0 : dino.y - (world.groundY - height));
  const legShift = dino.grounded ? Math.sin(dino.step) * 6 : 0;

  ctx.fillStyle = "#3d4a3f";
  roundRect(x + 4, y + 14, width - 16, height - 15, 8);
  ctx.fill();

  ctx.fillStyle = "#303932";
  if (dino.ducking) {
    roundRect(x + 38, y + 4, 30, 22, 6);
    ctx.fill();
    ctx.fillRect(x + 12, y + 26, 15, 18);
    ctx.fillRect(x + 42, y + 26, 15, 18);
  } else {
    roundRect(x + 25, y, 27, 28, 6);
    ctx.fill();
    ctx.fillRect(x + 10, y + 42, 11, 22 + legShift * 0.25);
    ctx.fillRect(x + 30, y + 42, 11, 22 - legShift * 0.25);
    ctx.fillRect(x - 4, y + 20, 16, 9);
  }

  ctx.fillStyle = "#fffdf7";
  ctx.fillRect(dino.ducking ? x + 59 : x + 43, dino.ducking ? y + 10 : y + 9, 4, 4);
}

function drawObstacle(obstacle) {
  if (obstacle.type === "bird") {
    drawBird(obstacle);
  } else {
    drawCactus(obstacle);
  }
}

function drawCactus(obstacle) {
  ctx.fillStyle = "#2f7d55";
  for (let i = 0; i < obstacle.group; i += 1) {
    const x = obstacle.x + i * 32;
    const h = obstacle.height - (i % 2) * 12;
    const y = world.groundY - h;
    roundRect(x + 8, y, 14, h, 7);
    ctx.fill();
    roundRect(x, y + 18, 12, 9, 5);
    ctx.fill();
    roundRect(x + 20, y + 28, 12, 9, 5);
    ctx.fill();
  }
}

function drawBird(obstacle) {
  const wing = Math.sin(obstacle.phase) * 10;
  ctx.fillStyle = "#6e5646";
  roundRect(obstacle.x + 18, obstacle.y + 9, 24, 14, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(obstacle.x + 20, obstacle.y + 14);
  ctx.quadraticCurveTo(obstacle.x + 4, obstacle.y + wing, obstacle.x, obstacle.y + 18);
  ctx.quadraticCurveTo(obstacle.x + 16, obstacle.y + 20, obstacle.x + 24, obstacle.y + 16);
  ctx.moveTo(obstacle.x + 40, obstacle.y + 14);
  ctx.quadraticCurveTo(obstacle.x + 58, obstacle.y + wing, obstacle.x + 62, obstacle.y + 18);
  ctx.quadraticCurveTo(obstacle.x + 44, obstacle.y + 20, obstacle.x + 36, obstacle.y + 16);
  ctx.fill();
  ctx.fillStyle = "#3d3028";
  ctx.fillRect(obstacle.x + 42, obstacle.y + 12, 4, 4);
}

function drawDust() {
  state.dust.forEach((puff) => {
    ctx.fillStyle = `rgba(120, 88, 43, ${Math.max(0, puff.life / 420)})`;
    ctx.beginPath();
    ctx.arc(puff.x, puff.y, puff.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPrompt() {
  ctx.fillStyle = "rgba(32, 33, 36, 0.72)";
  ctx.font = "700 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Space / tap to jump", world.width / 2, world.groundY - 82);
}

function addDust(count) {
  for (let i = 0; i < count; i += 1) {
    state.dust.push({
      x: dino.x + 12 + Math.random() * 34,
      y: world.groundY - 4 + Math.random() * 8,
      vy: -0.8 + Math.random() * 1.6,
      size: 2 + Math.random() * 5,
      life: 220 + Math.random() * 220,
    });
  }
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function updateScore() {
  refs.score.textContent = padScore(state.score);
  refs.bestScore.textContent = padScore(state.bestScore);
}

function padScore(score) {
  return String(Math.floor(score)).padStart(5, "0");
}

function showOverlay(kicker, title, text, buttonText) {
  refs.overlayKicker.textContent = kicker;
  refs.overlayTitle.textContent = title;
  refs.overlayText.textContent = text;
  refs.startBtn.textContent = buttonText;
  refs.overlay.classList.remove("hidden");
}

function hideOverlay() {
  refs.overlay.classList.add("hidden");
}

function loop(now) {
  const delta = Math.min(40, now - state.lastFrame || 16.67);
  state.lastFrame = now;
  update(delta);
  render();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    if (!event.repeat) startJump();
  }
  if (event.code === "ArrowDown") {
    event.preventDefault();
    setDuck(true);
  }
  if (event.code === "KeyP") {
    togglePause();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp") {
    endJump();
  }
  if (event.code === "ArrowDown") {
    setDuck(false);
  }
});

refs.startBtn.addEventListener("click", startGame);
refs.restartBtn.addEventListener("click", () => resetGame(true));
refs.pauseBtn.addEventListener("click", togglePause);
refs.jumpBtn.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  startJump();
});
refs.jumpBtn.addEventListener("pointerup", endJump);
refs.jumpBtn.addEventListener("pointerleave", endJump);
refs.jumpBtn.addEventListener("pointercancel", endJump);
refs.duckBtn.addEventListener("pointerdown", () => setDuck(true));
refs.duckBtn.addEventListener("pointerup", () => setDuck(false));
refs.duckBtn.addEventListener("pointerleave", () => setDuck(false));
refs.duckBtn.addEventListener("pointercancel", () => setDuck(false));
canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  startJump();
});
canvas.addEventListener("pointerup", endJump);
canvas.addEventListener("pointerleave", endJump);
canvas.addEventListener("pointercancel", endJump);

resetGame(false);
requestAnimationFrame(loop);
