const CONDITION_OPTIONS = [
  { value: "always", label: "Always" },
  { value: "lowEnergy", label: "Energy is low" },
  { value: "highEnergy", label: "Energy is high" },
  { value: "nearFood", label: "Food is nearby" },
  { value: "detectRedParticle", label: "Detects red particle" },
  { value: "detectOrangeParticle", label: "Detects orange particle" },
  { value: "detectYellowParticle", label: "Detects yellow particle" },
  { value: "detectGreenParticle", label: "Detects green particle" },
  { value: "detectBlueParticle", label: "Detects blue particle" },
  { value: "detectPurpleParticle", label: "Detects purple particle" },
  { value: "detectPinkParticle", label: "Detects pink particle" },
  { value: "detectBlackParticle", label: "Detects black particle" },
  { value: "detectBrownParticle", label: "Detects brown particle" },
  { value: "crowded", label: "Neighborhood is crowded" },
  { value: "isolated", label: "It feels isolated" },
  { value: "touching", label: "Another creature is touching" },
  { value: "canReplicate", label: "Replication is ready" },
  { value: "nearEdge", label: "It is near the edge" },
  { value: "mature", label: "It is mature" },
  { value: "young", label: "It is newly born" },
];

const ACTION_OPTIONS = [
  { value: "seekFood", label: "Seek food" },
  { value: "speedUp", label: "Speed up" },
  { value: "slowDown", label: "Slow down" },
  { value: "rest", label: "Rest and conserve" },
  { value: "shake", label: "Shake / wiggle" },
  { value: "flee", label: "Flee the crowd" },
  { value: "gather", label: "Move toward others" },
  { value: "drift", label: "Drift / wander" },
  { value: "spin", label: "Spin while moving" },
  { value: "bounce", label: "Bounce from edges" },
  { value: "emitRed", label: "Release red particle" },
  { value: "emitOrange", label: "Release orange particle" },
  { value: "emitYellow", label: "Release yellow particle" },
  { value: "emitGreen", label: "Release green particle" },
  { value: "emitBlue", label: "Release blue particle" },
  { value: "emitPurple", label: "Release purple particle" },
  { value: "emitPink", label: "Release pink particle" },
  { value: "emitBlack", label: "Release black particle" },
  { value: "emitBrown", label: "Release brown particle" },
  { value: "eatRed", label: "Eat red particle" },
  { value: "eatOrange", label: "Eat orange particle" },
  { value: "eatYellow", label: "Eat yellow particle" },
  { value: "eatGreen", label: "Eat green particle" },
  { value: "eatBlue", label: "Eat blue particle" },
  { value: "eatPurple", label: "Eat purple particle" },
  { value: "eatPink", label: "Eat pink particle" },
  { value: "eatBlack", label: "Eat black particle" },
  { value: "eatBrown", label: "Eat brown particle" },
  { value: "kill", label: "Kill nearby creature" },
  { value: "replicate", label: "Replicate" },
];

const INTENSITY_OPTIONS = [
  { value: "tiny", label: "Very little" },
  { value: "low", label: "A little" },
  { value: "medium", label: "Normal" },
  { value: "high", label: "A lot" },
  { value: "extreme", label: "Very strongly" },
];

const DEFAULT_RULES = [
  {
    conditions: ["lowEnergy"],
    actions: [{ action: "seekFood", intensity: "high" }],
  },
  {
    conditions: ["crowded"],
    actions: [{ action: "flee", intensity: "medium" }],
  },
  {
    conditions: ["canReplicate"],
    actions: [{ action: "replicate", intensity: "medium" }],
  },
];

const CATALOG_STORAGE_KEY = "creature-lab-catalog";
const THEME_STORAGE_KEY = "creature-lab-theme";
const SIGNAL_COLORS = {
  emitRed: { h: 5, s: 86, l: 56 },
  emitOrange: { h: 28, s: 86, l: 56 },
  emitYellow: { h: 48, s: 92, l: 62 },
  emitGreen: { h: 132, s: 60, l: 52 },
  emitBlue: { h: 210, s: 82, l: 60 },
  emitPurple: { h: 276, s: 72, l: 62 },
  emitPink: { h: 328, s: 84, l: 66 },
  emitBlack: { h: 0, s: 0, l: 18 },
  emitBrown: { h: 24, s: 48, l: 38 },
};

const PARTICLE_DETECT_MAP = {
  detectRedParticle: "emitRed",
  detectOrangeParticle: "emitOrange",
  detectYellowParticle: "emitYellow",
  detectGreenParticle: "emitGreen",
  detectBlueParticle: "emitBlue",
  detectPurpleParticle: "emitPurple",
  detectPinkParticle: "emitPink",
  detectBlackParticle: "emitBlack",
  detectBrownParticle: "emitBrown",
};

const EAT_PARTICLE_MAP = {
  eatRed: "emitRed",
  eatOrange: "emitOrange",
  eatYellow: "emitYellow",
  eatGreen: "emitGreen",
  eatBlue: "emitBlue",
  eatPurple: "emitPurple",
  eatPink: "emitPink",
  eatBlack: "emitBlack",
  eatBrown: "emitBrown",
};

const SIGNAL_COLOR_NAMES = Object.keys(SIGNAL_COLORS).map((key) => key.replace("emit", ""));

const state = {
  genome: createDefaultGenome(),
  catalog: [],
  selectedCatalogId: null,
  dish: createEnvironment("dish", 520, 360, 30),
  world: createEnvironment("world", 520, 360, 56),
  lastFrame: performance.now(),
  selectedCreature: null,
  statElements: {},
  fullscreenWorld: false,
  worldScale: 1,
  paused: false,
  previewPhase: 0,
  history: {
    past: [],
    future: [],
  },
  possession: {
    creatureId: null,
    keys: { up: false, down: false, left: false, right: false },
    actions: { emit: false, eat: false },
    color: "Red",
  },
};

const refs = {
  speciesName: document.getElementById("speciesName"),
  bodyHue: document.getElementById("bodyHue"),
  size: document.getElementById("size"),
  speed: document.getElementById("speed"),
  wiggle: document.getElementById("wiggle"),
  vision: document.getElementById("vision"),
  replicationThreshold: document.getElementById("replicationThreshold"),
  trailHue: document.getElementById("trailHue"),
  maxPopulation: document.getElementById("maxPopulation"),
  lifespan: document.getElementById("lifespan"),
  needsFood: document.getElementById("needsFood"),
  immortalIfAlone: document.getElementById("immortalIfAlone"),
  immortal: document.getElementById("immortal"),
  bodyHuePreview: document.getElementById("bodyHuePreview"),
  sizePreview: document.getElementById("sizePreview"),
  speedLabel: document.getElementById("speedLabel"),
  speedPreviewDot: document.getElementById("speedPreviewDot"),
  wiggleLabel: document.getElementById("wiggleLabel"),
  visionPreview: document.getElementById("visionPreview"),
  replicationPreview: document.getElementById("replicationPreview"),
  maxPopulationPreview: document.getElementById("maxPopulationPreview"),
  lifespanPreview: document.getElementById("lifespanPreview"),
  needsFoodPreview: document.getElementById("needsFoodPreview"),
  immortalIfAlonePreview: document.getElementById("immortalIfAlonePreview"),
  immortalPreview: document.getElementById("immortalPreview"),
  trailHuePreview: document.getElementById("trailHuePreview"),
  rulesList: document.getElementById("rulesList"),
  addRuleBtn: document.getElementById("addRuleBtn"),
  saveDesignBtn: document.getElementById("saveDesignBtn"),
  randomizeBtn: document.getElementById("randomizeBtn"),
  undoBtn: document.getElementById("undoBtn"),
  redoBtn: document.getElementById("redoBtn"),
  genomeJson: document.getElementById("genomeJson"),
  copyGenomeBtn: document.getElementById("copyGenomeBtn"),
  loadGenomeBtn: document.getElementById("loadGenomeBtn"),
  catalogList: document.getElementById("catalogList"),
  catalogSelect: document.getElementById("catalogSelect"),
  dishCreatureSelect: document.getElementById("dishCreatureSelect"),
  dishSpawnCount: document.getElementById("dishSpawnCount"),
  worldSpawnCount: document.getElementById("worldSpawnCount"),
  worldScale: document.getElementById("worldScale"),
  spawnTestBtn: document.getElementById("spawnTestBtn"),
  loadDishSelectionBtn: document.getElementById("loadDishSelectionBtn"),
  resetDishBtn: document.getElementById("resetDishBtn"),
  releaseBtn: document.getElementById("releaseBtn"),
  possessBtn: document.getElementById("possessBtn"),
  possessColorSelect: document.getElementById("possessColorSelect"),
  possessReleaseBtn: document.getElementById("possessReleaseBtn"),
  possessEatBtn: document.getElementById("possessEatBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  exportSetupBtn: document.getElementById("exportSetupBtn"),
  importSetupBtn: document.getElementById("importSetupBtn"),
  importSetupInput: document.getElementById("importSetupInput"),
  resetWorldBtn: document.getElementById("resetWorldBtn"),
  fullscreenWorldBtn: document.getElementById("fullscreenWorldBtn"),
  dishCanvas: document.getElementById("dishCanvas"),
  worldCanvas: document.getElementById("worldCanvas"),
  worldCanvasWrap: document.getElementById("worldCanvasWrap"),
  worldPanel: document.getElementById("worldCanvas").closest(".sim-panel"),
  statsGrid: document.getElementById("statsGrid"),
  selectedCreature: document.getElementById("selectedCreature"),
  themeToggleBtn: document.getElementById("themeToggleBtn"),
};

initializeTheme();
setupCanvases();
initializeCatalog();
bindEvents();
renderRuleEditor();
syncGenomeToControls();
refreshGenomeJson();
initializeHistory();
buildStats();
spawnFood(state.world, 22);
spawnFood(state.dish, 10);
spawnCreatures(state.dish, getSpawnCount(refs.dishSpawnCount, 1, 50), true, state.genome);
handleResize();
requestAnimationFrame(loop);

function createDefaultGenome() {
  return {
    speciesName: "Luma",
    bodyHue: 182,
    size: 10,
    speed: 1.2,
    wiggle: 1.1,
    vision: 90,
    replicationThreshold: 180,
    trailHue: 38,
    maxPopulation: 24,
    lifespan: 5000,
    needsFood: true,
    immortalIfAlone: false,
    immortal: false,
    rules: DEFAULT_RULES.map((rule) => ({ ...rule })),
  };
}

function createEnvironment(name, width, height, maxFood) {
  return {
    name,
    baseWidth: width,
    baseHeight: height,
    width,
    height,
    maxFood,
    creatures: [],
    food: [],
    particles: [],
    births: 0,
    deaths: 0,
    totalReleased: 0,
    nextCreatureId: 1,
    selectedId: null,
    ctx: null,
    hoveredId: null,
  };
}

function setupCanvases() {
  state.dish.ctx = setupCanvasContext(refs.dishCanvas, state.dish.width, state.dish.height);
  state.world.ctx = setupCanvasContext(refs.worldCanvas, state.world.width, state.world.height);
  refs.dishCanvas.addEventListener("click", (event) => handleCanvasPick(event, state.dish, refs.dishCanvas));
  refs.worldCanvas.addEventListener("click", (event) => handleCanvasPick(event, state.world, refs.worldCanvas));
  window.addEventListener("resize", handleResize);
  window.addEventListener("keydown", handlePossessionKeyChange);
  window.addEventListener("keyup", handlePossessionKeyChange);
  window.addEventListener("keydown", handleGlobalKeydown);
}

function setupCanvasContext(canvas, width, height) {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  return ctx;
}

function bindEvents() {
  refs.addRuleBtn.addEventListener("click", () => {
    if (state.genome.rules.length >= 6) return;
    state.genome.rules.push({
      conditions: ["nearFood"],
      actions: [{ action: "emitRed", intensity: "medium" }],
    });
    renderRuleEditor();
    refreshGenomeJson();
    pushHistorySnapshot();
  });

  refs.saveDesignBtn.addEventListener("click", saveEditorGenome);

  refs.randomizeBtn.addEventListener("click", () => {
    state.genome = randomGenome();
    syncGenomeToControls();
    renderRuleEditor();
    refreshGenomeJson();
    renderCatalog();
    pushHistorySnapshot();
  });

  refs.undoBtn.addEventListener("click", undoGenomeChange);
  refs.redoBtn.addEventListener("click", redoGenomeChange);
  refs.copyGenomeBtn.addEventListener("click", refreshGenomeJson);
  refs.loadGenomeBtn.addEventListener("click", loadGenomeFromJson);
  refs.spawnTestBtn.addEventListener("click", () => {
    const selected = getSelectedDishGenome();
    if (!selected) return;
    spawnCreatures(state.dish, getSpawnCount(refs.dishSpawnCount, 1, 50), false, selected);
  });
  refs.loadDishSelectionBtn.addEventListener("click", () => {
    const selected = getSelectedDishGenome();
    if (!selected) return;
    state.genome = sanitizeGenome(selected);
    syncGenomeToControls();
    renderRuleEditor();
    refreshGenomeJson();
    pushHistorySnapshot();
  });
  refs.resetDishBtn.addEventListener("click", reseedDish);
  refs.releaseBtn.addEventListener("click", () => {
    const releaseTarget = refs.catalogSelect.value;
    if (!releaseTarget) {
      window.alert("Save a creature to the catalog first, then select it for release.");
      return;
    }
    const count = getSpawnCount(refs.worldSpawnCount, 1, 100);
    if (releaseTarget === "all") {
      state.catalog.forEach((entry) => {
        spawnCreatures(state.world, count, false, entry.genome);
      });
      return;
    }
    const catalogCreature = getSelectedCatalogCreature();
    if (!catalogCreature) return;
    spawnCreatures(state.world, count, false, catalogCreature.genome);
  });
  refs.possessBtn.addEventListener("click", () => {
    const catalogCreature = getSelectedCatalogCreature();
    if (!catalogCreature) {
      window.alert("Choose one saved creature from the catalog to possess.");
      return;
    }
    possessCreature(catalogCreature.genome);
  });
  refs.possessColorSelect.addEventListener("change", (event) => {
    state.possession.color = sanitizeSignalColor(event.target.value);
  });
  refs.possessReleaseBtn.addEventListener("click", () => triggerPossessedSignalAction("emit"));
  refs.possessEatBtn.addEventListener("click", () => triggerPossessedSignalAction("eat"));
  refs.pauseBtn.addEventListener("click", togglePause);
  refs.exportSetupBtn.addEventListener("click", exportSetup);
  refs.importSetupBtn.addEventListener("click", () => refs.importSetupInput.click());
  refs.importSetupInput.addEventListener("change", importSetup);
  refs.resetWorldBtn.addEventListener("click", () => {
    resetEnvironment(state.world);
    spawnFood(state.world, 22);
  });
  refs.worldScale.addEventListener("input", (event) => {
    state.worldScale = clamp(Number(event.target.value), 1, 5, 1);
    requestAnimationFrame(handleResize);
  });
  refs.catalogSelect.addEventListener("change", (event) => {
    state.selectedCatalogId = event.target.value || null;
    renderCatalog();
  });
  refs.dishCreatureSelect.addEventListener("change", renderCatalog);
  refs.fullscreenWorldBtn.addEventListener("click", toggleWorldFullscreen);
  refs.themeToggleBtn.addEventListener("click", toggleTheme);

  [
    refs.bodyHue,
    refs.size,
    refs.speed,
    refs.wiggle,
    refs.vision,
    refs.replicationThreshold,
    refs.maxPopulation,
    refs.lifespan,
    refs.needsFood,
    refs.immortalIfAlone,
    refs.immortal,
    refs.trailHue,
    refs.speciesName,
  ].forEach((input) => input.addEventListener("input", updateAttributePreviews));

  [
    refs.speciesName,
    refs.bodyHue,
    refs.size,
    refs.speed,
    refs.wiggle,
    refs.vision,
    refs.replicationThreshold,
    refs.trailHue,
    refs.maxPopulation,
    refs.lifespan,
    refs.needsFood,
    refs.immortalIfAlone,
    refs.immortal,
  ].forEach((input) =>
    input.addEventListener("change", () => {
      readControlsIntoGenome();
      refreshGenomeJson();
      pushHistorySnapshot();
    })
  );
}

function buildStats() {
  const metrics = [
    ["dishPopulation", "Dish population"],
    ["worldPopulation", "World population"],
    ["dishBirths", "Dish births"],
    ["worldBirths", "World births"],
    ["dishFood", "Dish nutrients"],
    ["worldFood", "World nutrients"],
    ["avgDishEnergy", "Avg dish energy"],
    ["avgWorldEnergy", "Avg world energy"],
  ];

  refs.statsGrid.innerHTML = "";
  metrics.forEach(([key, label]) => {
    const card = document.createElement("div");
    card.className = "stat-card";
    const small = document.createElement("span");
    small.className = "stat-label";
    small.textContent = label;
    const strong = document.createElement("strong");
    strong.className = "stat-value";
    strong.textContent = "--";
    card.append(small, strong);
    refs.statsGrid.appendChild(card);
    state.statElements[key] = strong;
  });
}

function renderRuleEditor() {
  refs.rulesList.innerHTML = "";
  state.genome.rules.forEach((rule, index) => {
    const card = document.createElement("div");
    card.className = "rule-card";

    const ifBlock = document.createElement("div");
    ifBlock.className = "script-block";
    const ifTitle = document.createElement("div");
    ifTitle.className = "script-title";
    ifTitle.textContent = "If ANY of these are true";
    ifBlock.appendChild(ifTitle);

    rule.conditions.forEach((condition, conditionIndex) => {
      const row = document.createElement("div");
      row.className = "script-row";
      const conditionSelect = document.createElement("select");
      CONDITION_OPTIONS.forEach((option) => {
        conditionSelect.appendChild(createOption(option.value, option.label, condition));
      });
      conditionSelect.addEventListener("change", (event) => {
        state.genome.rules[index].conditions[conditionIndex] = event.target.value;
        refreshGenomeJson();
        pushHistorySnapshot();
      });

      const removeConditionBtn = document.createElement("button");
      removeConditionBtn.type = "button";
      removeConditionBtn.className = "button danger";
      removeConditionBtn.textContent = "Remove if";
      removeConditionBtn.disabled = rule.conditions.length <= 1;
      removeConditionBtn.addEventListener("click", () => {
        state.genome.rules[index].conditions.splice(conditionIndex, 1);
        renderRuleEditor();
        refreshGenomeJson();
        pushHistorySnapshot();
      });

      row.append(conditionSelect, removeConditionBtn);
      ifBlock.appendChild(row);
    });

    const addConditionBtn = document.createElement("button");
    addConditionBtn.type = "button";
    addConditionBtn.className = "button ghost";
    addConditionBtn.textContent = "Add if";
    addConditionBtn.addEventListener("click", () => {
      state.genome.rules[index].conditions.push("nearFood");
      renderRuleEditor();
      refreshGenomeJson();
      pushHistorySnapshot();
    });
    ifBlock.appendChild(addConditionBtn);

    const thenBlock = document.createElement("div");
    thenBlock.className = "script-block";
    const thenTitle = document.createElement("div");
    thenTitle.className = "script-title";
    thenTitle.textContent = "Then do all of these";
    thenBlock.appendChild(thenTitle);

    rule.actions.forEach((actionRule, actionIndex) => {
      const row = document.createElement("div");
      row.className = "script-row script-row-wide";

      const actionSelect = document.createElement("select");
      buildActionOptions(state.genome.rules.length).forEach((option) => {
        actionSelect.appendChild(createOption(option.value, option.label, getActionSelectValue(actionRule)));
      });
      actionSelect.addEventListener("change", (event) => {
        const parsed = parseActionSelectValue(event.target.value, state.genome.rules.length);
        state.genome.rules[index].actions[actionIndex].action = parsed.action;
        state.genome.rules[index].actions[actionIndex].stopTarget = parsed.stopTarget;
        if (parsed.action === "stopScript") {
          state.genome.rules[index].actions[actionIndex].intensity = "medium";
        }
        renderRuleEditor();
        refreshGenomeJson();
        pushHistorySnapshot();
      });

      const detailSelect = document.createElement("select");
      if (actionRule.action === "stopScript") {
        detailSelect.appendChild(
          createOption(
            "",
            `Stops script ${clamp(Number(actionRule.stopTarget), 1, state.genome.rules.length, 1)}`,
            ""
          )
        );
        detailSelect.disabled = true;
      } else {
        INTENSITY_OPTIONS.forEach((option) => {
          detailSelect.appendChild(createOption(option.value, option.label, actionRule.intensity || "medium"));
        });
        detailSelect.addEventListener("change", (event) => {
          state.genome.rules[index].actions[actionIndex].intensity = event.target.value;
          refreshGenomeJson();
          pushHistorySnapshot();
        });
      }

      const removeActionBtn = document.createElement("button");
      removeActionBtn.type = "button";
      removeActionBtn.className = "button danger";
      removeActionBtn.textContent = "Remove then";
      removeActionBtn.disabled = rule.actions.length <= 1;
      removeActionBtn.addEventListener("click", () => {
        state.genome.rules[index].actions.splice(actionIndex, 1);
        renderRuleEditor();
        refreshGenomeJson();
        pushHistorySnapshot();
      });

      row.append(actionSelect, detailSelect, removeActionBtn);
      thenBlock.appendChild(row);
    });

    const addActionBtn = document.createElement("button");
    addActionBtn.type = "button";
    addActionBtn.className = "button ghost";
    addActionBtn.textContent = "Add then";
    addActionBtn.addEventListener("click", () => {
      state.genome.rules[index].actions.push({ action: "emitRed", intensity: "medium" });
      renderRuleEditor();
      refreshGenomeJson();
      pushHistorySnapshot();
    });
    thenBlock.appendChild(addActionBtn);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "button danger";
    removeBtn.textContent = "Remove script";
    removeBtn.disabled = state.genome.rules.length <= 1;
    removeBtn.addEventListener("click", () => {
      state.genome.rules.splice(index, 1);
      renderRuleEditor();
      refreshGenomeJson();
      pushHistorySnapshot();
    });

    card.append(ifBlock, thenBlock, removeBtn);
    refs.rulesList.appendChild(card);
  });
}

function createOption(value, label, selectedValue) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  option.selected = value === selectedValue;
  return option;
}

function buildActionOptions(scriptCount) {
  return [
    ...ACTION_OPTIONS,
    ...Array.from({ length: scriptCount }, (_, index) => ({
      value: `stopScript:${index + 1}`,
      label: `Stop script ${index + 1}`,
    })),
  ];
}

function parseActionSelectValue(value, scriptCount) {
  if (value.startsWith("stopScript:")) {
    return {
      action: "stopScript",
      stopTarget: clamp(Number(value.split(":")[1]), 1, scriptCount, 1),
    };
  }
  return { action: value, stopTarget: undefined };
}

function getActionSelectValue(actionRule) {
  if (actionRule.action === "stopScript") {
    return `stopScript:${clamp(Number(actionRule.stopTarget), 1, 6, 1)}`;
  }
  return actionRule.action;
}

function readControlsIntoGenome() {
  state.genome = {
    ...state.genome,
    speciesName: refs.speciesName.value.trim() || "Unnamed",
    bodyHue: Number(refs.bodyHue.value),
    size: Number(refs.size.value),
    speed: Number(refs.speed.value),
    wiggle: Number(refs.wiggle.value),
    vision: Number(refs.vision.value),
    replicationThreshold: Number(refs.replicationThreshold.value),
    trailHue: Number(refs.trailHue.value),
    maxPopulation: Number(refs.maxPopulation.value),
    lifespan: Number(refs.lifespan.value),
    needsFood: refs.needsFood.checked,
    immortalIfAlone: refs.immortalIfAlone.checked,
    immortal: refs.immortal.checked,
  };
}

function syncGenomeToControls() {
  refs.speciesName.value = state.genome.speciesName;
  refs.bodyHue.value = state.genome.bodyHue;
  refs.size.value = state.genome.size;
  refs.speed.value = state.genome.speed;
  refs.wiggle.value = state.genome.wiggle;
  refs.vision.value = state.genome.vision;
  refs.replicationThreshold.value = state.genome.replicationThreshold;
  refs.trailHue.value = state.genome.trailHue;
  refs.maxPopulation.value = state.genome.maxPopulation;
  refs.lifespan.value = state.genome.lifespan;
  refs.needsFood.checked = state.genome.needsFood;
  refs.immortalIfAlone.checked = state.genome.immortalIfAlone;
  refs.immortal.checked = state.genome.immortal;
  updateAttributePreviews();
}

function refreshGenomeJson() {
  readControlsIntoGenome();
  refs.genomeJson.value = JSON.stringify(state.genome, null, 2);
  updateAttributePreviews();
}

function updateAttributePreviews() {
  const hue = Number(refs.bodyHue.value);
  const trailHue = Number(refs.trailHue.value);
  const size = Number(refs.size.value);
  const speed = Number(refs.speed.value);
  const wiggle = Number(refs.wiggle.value);
  const vision = Number(refs.vision.value);
  const replication = Number(refs.replicationThreshold.value);
  const maxPopulation = Number(refs.maxPopulation.value);
  const lifespan = Number(refs.lifespan.value);
  const needsFood = refs.needsFood.checked;
  const immortalIfAlone = refs.immortalIfAlone.checked;
  const immortal = refs.immortal.checked;

  refs.bodyHuePreview.style.background = `hsl(${hue}, 72%, 52%)`;
  refs.trailHuePreview.style.background = `hsl(${trailHue}, 76%, 58%)`;
  refs.sizePreview.style.setProperty("--size-preview", `${Math.max(8, size * 1.2)}px`);
  refs.speedLabel.textContent = speed.toFixed(2);
  refs.wiggleLabel.textContent = wiggle.toFixed(1);
  refs.visionPreview.textContent = `${vision}px`;
  refs.replicationPreview.textContent = `${replication}`;
  refs.maxPopulationPreview.textContent = `${maxPopulation}`;
  refs.lifespanPreview.textContent = `${lifespan}`;
  refs.needsFoodPreview.textContent = needsFood ? "Yes" : "No";
  refs.immortalIfAlonePreview.textContent = immortalIfAlone ? "Yes" : "No";
  refs.immortalPreview.textContent = immortal ? "Yes" : "No";
  refs.speedPreviewDot.dataset.speed = String(speed);
}

function animateAttributePreviews(now) {
  const speed = Number(refs.speedPreviewDot.dataset.speed || refs.speed.value || 0.1);
  const normalized = (speed - 0.1) / (2.4 - 0.1);
  const distance = 20 + normalized * 86;
  const x = Math.sin(now * (0.0012 + normalized * 0.004)) * distance;
  refs.speedPreviewDot.style.transform = `translate(${x}px, -50%)`;
}

function loadGenomeFromJson() {
  try {
    const parsed = JSON.parse(refs.genomeJson.value);
    state.genome = sanitizeGenome(parsed);
    syncGenomeToControls();
    renderRuleEditor();
    refreshGenomeJson();
    renderCatalog();
    pushHistorySnapshot();
  } catch (error) {
    window.alert(`Could not parse genome JSON: ${error.message}`);
  }
}

function sanitizeGenome(input) {
  const safe = createDefaultGenome();
  const rules = Array.isArray(input.rules) && input.rules.length > 0 ? input.rules : safe.rules;
  return {
    speciesName: typeof input.speciesName === "string" ? input.speciesName.slice(0, 40) : safe.speciesName,
    bodyHue: clamp(Number(input.bodyHue), 0, 360, safe.bodyHue),
    size: clamp(Number(input.size), 6, 18, safe.size),
    speed: clamp(Number(input.speed), 0.1, 2.4, safe.speed),
    wiggle: clamp(Number(input.wiggle), 0, 2.5, safe.wiggle),
    vision: clamp(Number(input.vision), 40, 160, safe.vision),
    replicationThreshold: clamp(Number(input.replicationThreshold), 120, 260, safe.replicationThreshold),
    trailHue: clamp(Number(input.trailHue), 0, 360, safe.trailHue),
    maxPopulation: clamp(Number(input.maxPopulation), 1, 500, safe.maxPopulation),
    lifespan: clamp(Number(input.lifespan), 300, 20000, safe.lifespan),
    needsFood: typeof input.needsFood === "boolean" ? input.needsFood : safe.needsFood,
    immortalIfAlone:
      typeof input.immortalIfAlone === "boolean" ? input.immortalIfAlone : safe.immortalIfAlone,
    immortal: typeof input.immortal === "boolean" ? input.immortal : safe.immortal,
    rules: rules.slice(0, 6).map(sanitizeScriptRule),
  };
}

function sanitizeScriptRule(rule) {
  const legacyCondition = rule?.condition;
  const legacyAction = rule?.action;
  const legacyIntensity = rule?.intensity;
  const conditionsSource =
    Array.isArray(rule?.conditions) && rule.conditions.length > 0
      ? rule.conditions
      : legacyCondition
        ? [legacyCondition]
        : ["nearFood"];
  const actionsSource =
    Array.isArray(rule?.actions) && rule.actions.length > 0
      ? rule.actions
      : [{ action: legacyAction || "emitRed", intensity: legacyIntensity || "medium" }];

  return {
    conditions: conditionsSource.slice(0, 4).map((condition) =>
      CONDITION_OPTIONS.some((item) => item.value === condition) ? condition : "nearFood"
    ),
    actions: actionsSource.slice(0, 5).map((actionRule) => {
      const parsed = parseActionSelectValue(String(actionRule.action || "emitRed"), 6);
      const action =
        ACTION_OPTIONS.some((item) => item.value === parsed.action) || parsed.action === "stopScript"
          ? parsed.action
          : "emitRed";
      return {
        action,
        intensity:
          action === "stopScript"
            ? "medium"
            : INTENSITY_OPTIONS.some((item) => item.value === actionRule.intensity)
              ? actionRule.intensity
              : "medium",
        stopTarget:
          action === "stopScript"
            ? clamp(Number(actionRule.stopTarget ?? parsed.stopTarget), 1, 6, 1)
            : undefined,
      };
    }),
  };
}

function randomGenome() {
  const shuffledConditions = shuffle(CONDITION_OPTIONS.map((item) => item.value)).slice(0, 4);
  const shuffledActions = shuffle(ACTION_OPTIONS.map((item) => item.value)).slice(0, 6);
  return {
    speciesName: randomChoice(["Luma", "Halo", "Mica", "Quill", "Bloom", "Riff"]),
    bodyHue: randomInt(0, 360),
    size: randomInt(7, 16),
    speed: randomFloat(0.15, 2.2),
    wiggle: randomFloat(0.2, 2.3),
    vision: randomInt(50, 150),
    replicationThreshold: randomInt(135, 245),
    trailHue: randomInt(0, 360),
    maxPopulation: randomInt(8, 80),
    lifespan: randomInt(800, 14000),
    needsFood: Math.random() > 0.2,
    immortalIfAlone: Math.random() > 0.65,
    immortal: Math.random() > 0.88,
    rules: shuffledConditions.map((condition, index) => ({
      conditions: [condition],
      actions: [
        {
          action: shuffledActions[index],
          intensity: randomChoice(INTENSITY_OPTIONS.map((item) => item.value)),
        },
        ...(Math.random() > 0.5
          ? [
              {
                action: randomChoice(ACTION_OPTIONS.map((item) => item.value)),
                intensity: randomChoice(INTENSITY_OPTIONS.map((item) => item.value)),
              },
            ]
          : []),
      ],
    })),
  };
}

function reseedDish() {
  resetEnvironment(state.dish);
  spawnFood(state.dish, 12);
}

function resetEnvironment(environment) {
  environment.creatures = [];
  environment.food = [];
  environment.particles = [];
  environment.births = 0;
  environment.deaths = 0;
  environment.totalReleased = 0;
  environment.selectedId = null;
  if (state.selectedCreature && state.selectedCreature.environment === environment.name) {
    state.selectedCreature = null;
  }
  if (environment.name === "world") {
    state.possession.creatureId = null;
    state.possession.keys = { up: false, down: false, left: false, right: false };
    state.possession.actions = { emit: false, eat: false };
  }
  renderSelectedCreature();
}

function spawnCreatures(environment, count, clearExisting, genome) {
  const safeGenome = sanitizeGenome(genome);
  if (clearExisting) {
    resetEnvironment(environment);
    spawnFood(environment, environment.name === "dish" ? 12 : 18);
  }
  const allowedCount =
    environment.name === "world"
      ? Math.min(count, getAvailableSpeciesSlots(environment, safeGenome))
      : count;

  for (let index = 0; index < allowedCount; index += 1) {
    environment.creatures.push(createCreature(environment, safeGenome, {
      x: randomFloat(32, environment.width - 32),
      y: randomFloat(32, environment.height - 32),
      energy: randomFloat(125, 175),
      isPrototype: true,
    }));
    environment.totalReleased += 1;
  }
}

function createCreature(environment, genome, overrides = {}) {
  return {
    id: environment.nextCreatureId++,
    genome: sanitizeGenome(genome),
    environment: environment.name,
    x: overrides.x ?? environment.width / 2,
    y: overrides.y ?? environment.height / 2,
    vx: overrides.vx ?? 0,
    vy: overrides.vy ?? 0,
    energy: overrides.energy ?? 140,
    age: 0,
    cooldown: randomFloat(0, 80),
    pulseHue: genome.bodyHue,
    pulseLife: 0,
    trail: [],
    action: "rest",
    touched: false,
    signalCooldown: 0,
    threatSource: null,
    threatenedBy: null,
    intendedRules: [],
    isAlone: true,
    isPossessed: Boolean(overrides.isPossessed),
    isPrototype: Boolean(overrides.isPrototype),
  };
}

function getSpeciesPopulation(environment, genome) {
  return environment.creatures.filter((creature) => creature.genome.speciesName === genome.speciesName).length;
}

function getAvailableSpeciesSlots(environment, genome) {
  return Math.max(0, genome.maxPopulation - getSpeciesPopulation(environment, genome));
}

function spawnFood(environment, amount) {
  for (let index = 0; index < amount; index += 1) {
    environment.food.push({
      x: randomFloat(18, environment.width - 18),
      y: randomFloat(18, environment.height - 18),
      size: randomFloat(3, 6),
      energy: randomFloat(18, 38),
      hue: randomFloat(112, 132),
    });
  }
}

function loop(now) {
  const dt = state.paused ? 0 : Math.min((now - state.lastFrame) / 16.6667, 1.8);
  state.lastFrame = now;

  if (!state.paused) {
    updateEnvironment(state.dish, dt);
    updateEnvironment(state.world, dt);
  }
  drawEnvironment(state.dish);
  drawEnvironment(state.world);
  updateStats();
  animateAttributePreviews(now);
  requestAnimationFrame(loop);
}

function updateEnvironment(environment, dt) {
  maintainFood(environment);
  const newborns = [];

  environment.creatures.forEach((creature) => {
    creature.age += dt;
    creature.cooldown = Math.max(0, creature.cooldown - dt);
    creature.signalCooldown = Math.max(0, creature.signalCooldown - dt);
    if (creature.genome.needsFood && !creature.isPossessed) {
      creature.energy -= (0.12 + creature.genome.speed * 0.035 + creature.genome.size * 0.01) * dt;
    }
    creature.touched = false;
    creature.threatSource = null;
    creature.threatenedBy = null;
    creature.intendedRules = [];
  });

  environment.creatures.forEach((creature) => {
    const sensory = senseEnvironment(environment, creature);
    creature.isAlone = sensory.isolated;
    if (creature.isPossessed) {
      creature.intendedRules = [];
      return;
    }
    const resolvedActions = resolveActions(creature, sensory);
    creature.intendedRules = resolvedActions;
    resolvedActions.forEach((resolvedAction) => {
      if (resolvedAction.action === "kill") {
        const target = findKillTarget(environment, creature);
        if (target) {
          target.threatSource = creature;
          target.threatenedBy = creature;
        }
      }
    });
  });

  environment.creatures.forEach((creature) => {
    const sensory = senseEnvironment(environment, creature);
    const resolvedActions = creature.isPossessed
      ? getPossessedActions(creature)
      : creature.threatSource
        ? [{ action: "flee", intensity: "extreme", overrideTarget: creature.threatSource }, ...creature.intendedRules]
        : creature.intendedRules;
    if (resolvedActions.length === 0) {
      resolvedActions.push({ action: "rest", intensity: "medium" });
    }
    creature.action = resolvedActions.map((item) => item.action).join(", ");
    resolvedActions.forEach((resolvedAction) => {
      applyAction(creature, sensory, resolvedAction, dt, newborns, environment);
    });
    moveCreature(creature, environment, dt);
    eatFood(environment, creature);
    creature.pulseLife = Math.max(0, creature.pulseLife - 0.04 * dt);
    updateTrail(creature);
  });

  resolveTouches(environment);
  environment.creatures = environment.creatures.filter((creature) => {
    const immortal = creature.genome.immortal || creature.genome.immortalIfAlone;
    const alive = immortal || (creature.energy > 0 && creature.age < creature.genome.lifespan);
    if (!alive) {
      if (creature.id === state.possession.creatureId) {
        state.possession.creatureId = null;
      }
      environment.deaths += 1;
      burst(environment, creature.x, creature.y, creature.genome.bodyHue, 8, 0.75);
    }
    return alive;
  });
  environment.creatures.push(...newborns);
  updateParticles(environment, dt);
}

function maintainFood(environment) {
  const target = environment.maxFood;
  if (environment.food.length < target && Math.random() < 0.26) {
    spawnFood(environment, 1);
  }
}

function senseEnvironment(environment, creature) {
  let nearestFood = null;
  let nearestFoodDistance = Infinity;
  let crowdCount = 0;
  let touchCount = 0;
  let centerX = 0;
  let centerY = 0;
  const detectedParticles = Object.fromEntries(
    Object.keys(PARTICLE_DETECT_MAP).map((key) => [key, false])
  );

  environment.food.forEach((food) => {
    const distance = getDistance(creature, food);
    if (distance < nearestFoodDistance) {
      nearestFoodDistance = distance;
      nearestFood = food;
    }
  });

  environment.particles.forEach((particle) => {
    if (!particle.signalKey) return;
    const detectionKey = Object.keys(PARTICLE_DETECT_MAP).find(
      (key) => PARTICLE_DETECT_MAP[key] === particle.signalKey
    );
    if (!detectionKey) return;
    const distance = Math.hypot(creature.x - particle.x, creature.y - particle.y);
    if (distance < creature.genome.vision * 0.85) {
      detectedParticles[detectionKey] = true;
    }
  });

  environment.creatures.forEach((other) => {
    if (other.id === creature.id) return;
    const distance = getDistance(creature, other);
    if (distance < creature.genome.vision) {
      crowdCount += 1;
      centerX += other.x;
      centerY += other.y;
    }
    if (distance < creature.genome.size + other.genome.size + 2) {
      touchCount += 1;
    }
  });

  return {
    always: true,
    nearestFood,
    nearestFoodDistance,
    nearFood: nearestFoodDistance < creature.genome.vision,
    crowded: crowdCount >= 3,
    isolated: crowdCount === 0,
    touching: touchCount > 0 || creature.touched,
    threatened: Boolean(creature.threatSource),
    canReplicate: creature.energy >= creature.genome.replicationThreshold && creature.cooldown <= 0,
    lowEnergy: creature.energy < creature.genome.replicationThreshold * 0.5,
    highEnergy: creature.energy > creature.genome.replicationThreshold * 0.9,
    nearEdge:
      creature.x < creature.genome.size * 2.4 ||
      creature.y < creature.genome.size * 2.4 ||
      creature.x > environment.width - creature.genome.size * 2.4 ||
      creature.y > environment.height - creature.genome.size * 2.4,
    mature: creature.age > 260,
    young: creature.age < 120,
    ...detectedParticles,
    crowdCenter:
      crowdCount > 0
        ? { x: centerX / crowdCount, y: centerY / crowdCount }
        : null,
  };
}

function resolveActions(creature, sensory) {
  const actions = [];
  const stoppedScripts = new Set();
  for (const [scriptIndex, script] of creature.genome.rules.entries()) {
    if (stoppedScripts.has(scriptIndex + 1)) {
      continue;
    }
    const matches = script.conditions.some((condition) => sensory[condition]);
    if (matches) {
      for (const actionRule of script.actions) {
        if (actionRule.action === "stopScript") {
          const stopTarget = clamp(Number(actionRule.stopTarget), 1, creature.genome.rules.length, 1);
          if (stopTarget > scriptIndex + 1) {
            stoppedScripts.add(stopTarget);
            continue;
          }
          if (stopTarget === scriptIndex + 1) {
            break;
          }
          continue;
        }
        actions.push(actionRule);
      }
    }
  }
  if (actions.length === 0) {
    actions.push({ action: "rest", intensity: "medium" });
  }
  return dedupeActions(actions);
}

function dedupeActions(actions) {
  const seen = new Set();
  return actions.filter((action) => {
    const key = `${action.action}:${action.intensity}:${action.overrideTarget?.id || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function applyAction(creature, sensory, resolvedRule, dt, newborns, environment) {
  const action = resolvedRule.action;
  const intensity = getIntensityFactor(resolvedRule.intensity);
  const accel = 0.045 * dt * intensity;
  switch (action) {
    case "seekFood":
      if (sensory.nearestFood) {
        steerToward(creature, sensory.nearestFood, accel * 1.9);
      }
      break;
    case "speedUp":
      boostVelocity(creature, 1 + 0.014 * intensity, creature.genome.speed * (1.55 + intensity * 0.4));
      break;
    case "slowDown":
      creature.vx *= 1 - 0.02 * intensity;
      creature.vy *= 1 - 0.02 * intensity;
      break;
    case "rest":
      creature.vx *= Math.max(0, 1 - 0.22 * intensity);
      creature.vy *= Math.max(0, 1 - 0.22 * intensity);
      if (Math.abs(creature.vx) < 0.03) creature.vx = 0;
      if (Math.abs(creature.vy) < 0.03) creature.vy = 0;
      creature.energy += 0.025 * intensity;
      break;
    case "shake":
      creature.vx += Math.sin(creature.age * 0.36) * creature.genome.wiggle * 0.09 * intensity * dt;
      creature.vy += Math.cos(creature.age * 0.41) * creature.genome.wiggle * 0.09 * intensity * dt;
      pulse(creature, creature.genome.trailHue);
      break;
    case "flee":
      if (resolvedRule.overrideTarget) {
        steerAway(creature, resolvedRule.overrideTarget, accel * 2.2);
      } else if (sensory.crowdCenter) {
        steerAway(creature, sensory.crowdCenter, accel * 1.8);
      }
      break;
    case "gather":
      if (sensory.crowdCenter) {
        steerToward(creature, sensory.crowdCenter, accel * 1.35);
      }
      break;
    case "spin":
      creature.vx += Math.cos(creature.age * 0.2 + creature.id) * 0.06 * intensity * dt;
      creature.vy += Math.sin(creature.age * 0.2 + creature.id) * 0.06 * intensity * dt;
      boostVelocity(creature, 1.01, creature.genome.speed * (1.3 + intensity * 0.35));
      pulse(creature, creature.genome.bodyHue + 120);
      break;
    case "bounce":
      if (sensory.nearEdge) {
        creature.vx *= -1 * (1 + 0.04 * intensity);
        creature.vy *= -1 * (1 + 0.04 * intensity);
      }
      break;
    case "emitRed":
    case "emitOrange":
    case "emitYellow":
    case "emitGreen":
    case "emitBlue":
    case "emitPurple":
    case "emitPink":
    case "emitBlack":
    case "emitBrown":
      emitSignalParticle(environment, creature, action, intensity);
      break;
    case "eatRed":
    case "eatOrange":
    case "eatYellow":
    case "eatGreen":
    case "eatBlue":
    case "eatPurple":
    case "eatPink":
    case "eatBlack":
    case "eatBrown":
      eatSignalParticles(environment, creature, action, intensity);
      break;
    case "kill": {
      const target = findKillTarget(environment, creature);
      if (target && !target.genome.immortal) {
        target.energy = 0;
        pulse(creature, 0);
        burst(environment, target.x, target.y, 0, 10, 0.9);
      }
      break;
    }
    case "replicate":
      if (sensory.canReplicate) {
        replicateCreature(creature, environment, newborns);
      }
      break;
    default:
      creature.vx *= 0.96;
      creature.vy *= 0.96;
      if (Math.abs(creature.vx) < 0.02) creature.vx = 0;
      if (Math.abs(creature.vy) < 0.02) creature.vy = 0;
      break;
  }
}

function replicateCreature(creature, environment, newborns) {
  if (environment.name === "world") {
    const existing = getSpeciesPopulation(environment, creature.genome);
    const pending = newborns.filter((entry) => entry.genome.speciesName === creature.genome.speciesName).length;
    if (existing + pending >= creature.genome.maxPopulation) {
      return;
    }
  }

  creature.energy *= 0.54;
  creature.cooldown = 160;
  pulse(creature, creature.genome.bodyHue + 24);
  burst(environment, creature.x, creature.y, creature.genome.bodyHue, 14, 1.2);

  const childGenome = mutateGenome(creature.genome, 0.06);
  newborns.push(
    createCreature(environment, childGenome, {
      x: creature.x + randomFloat(-16, 16),
      y: creature.y + randomFloat(-16, 16),
      energy: creature.energy * 0.72,
      isPrototype: creature.isPrototype,
    })
  );
  environment.births += 1;
}

function mutateGenome(genome, amount) {
  const next = sanitizeGenome(genome);
  next.bodyHue = wrapHue(next.bodyHue + randomFloat(-55, 55) * amount * 4);
  next.size = clamp(next.size + randomFloat(-3, 3) * amount * 3, 6, 18, next.size);
  next.speed = clamp(next.speed + randomFloat(-0.8, 0.8) * amount * 2.2, 0.1, 2.4, next.speed);
  next.wiggle = clamp(next.wiggle + randomFloat(-1, 1) * amount * 3, 0, 2.5, next.wiggle);
  next.vision = clamp(next.vision + randomFloat(-30, 30) * amount * 2.2, 40, 160, next.vision);
  next.replicationThreshold = clamp(
    next.replicationThreshold + randomFloat(-38, 38) * amount * 3,
    120,
    260,
    next.replicationThreshold
  );
  next.trailHue = wrapHue(next.trailHue + randomFloat(-65, 65) * amount * 3);
  return next;
}

function moveCreature(creature, environment, dt) {
  const maxSpeed = creature.genome.speed * 1.9 + creature.genome.wiggle * 0.4;
  const currentSpeed = Math.hypot(creature.vx, creature.vy);
  if (currentSpeed > maxSpeed) {
    creature.vx = (creature.vx / currentSpeed) * maxSpeed;
    creature.vy = (creature.vy / currentSpeed) * maxSpeed;
  }

  creature.x += creature.vx * dt;
  creature.y += creature.vy * dt;

  if (creature.x < creature.genome.size || creature.x > environment.width - creature.genome.size) {
    creature.vx *= -1;
    creature.x = clamp(creature.x, creature.genome.size, environment.width - creature.genome.size, creature.x);
  }
  if (creature.y < creature.genome.size || creature.y > environment.height - creature.genome.size) {
    creature.vy *= -1;
    creature.y = clamp(creature.y, creature.genome.size, environment.height - creature.genome.size, creature.y);
  }
}

function eatFood(environment, creature) {
  for (let index = environment.food.length - 1; index >= 0; index -= 1) {
    const food = environment.food[index];
    const distance = getDistance(creature, food);
    if (distance < creature.genome.size + food.size + 1) {
      creature.energy += food.energy;
      pulse(creature, food.hue);
      burst(environment, food.x, food.y, food.hue, 5, 0.6);
      environment.food.splice(index, 1);
    }
  }
}

function resolveTouches(environment) {
  for (let index = 0; index < environment.creatures.length; index += 1) {
    const a = environment.creatures[index];
    for (let second = index + 1; second < environment.creatures.length; second += 1) {
      const b = environment.creatures[second];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy) || 0.001;
      const minDistance = a.genome.size + b.genome.size;
      if (distance < minDistance) {
        const overlap = (minDistance - distance) * 0.5;
        const nx = dx / distance;
        const ny = dy / distance;
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;
        a.vx -= nx * 0.03;
        a.vy -= ny * 0.03;
        b.vx += nx * 0.03;
        b.vy += ny * 0.03;
        a.touched = true;
        b.touched = true;
      }
    }
  }
}

function updateTrail(creature) {
  creature.trail.push({ x: creature.x, y: creature.y, life: 1 });
  if (creature.trail.length > 14) creature.trail.shift();
  creature.trail.forEach((point) => {
    point.life *= 0.92;
  });
}

function updateParticles(environment, dt) {
  environment.particles = environment.particles.filter((particle) => {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
    return particle.life > 0;
  });
}

function drawEnvironment(environment) {
  const { ctx, width, height } = environment;
  ctx.clearRect(0, 0, width, height);
  drawBackdrop(ctx, width, height, environment.name);
  drawFood(ctx, environment.food);
  drawParticles(ctx, environment.particles);
  drawCreatures(ctx, environment.creatures, environment.selectedId);
  drawHud(ctx, environment);
}

function drawBackdrop(ctx, width, height, name) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  if (name === "dish") {
    gradient.addColorStop(0, "rgba(255, 248, 231, 0.92)");
    gradient.addColorStop(1, "rgba(218, 242, 231, 0.92)");
  } else {
    gradient.addColorStop(0, "rgba(241, 250, 236, 0.92)");
    gradient.addColorStop(1, "rgba(203, 229, 220, 0.96)");
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.08;
  for (let index = 0; index < 18; index += 1) {
    ctx.beginPath();
    ctx.arc(
      ((index * 71) % width) + 10,
      ((index * 53) % height) + 10,
      8 + (index % 5) * 5,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = index % 2 === 0 ? "#f6d784" : "#86bea4";
    ctx.fill();
  }
  ctx.restore();
}

function drawFood(ctx, food) {
  food.forEach((item) => {
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(Math.PI * 0.25);
    ctx.fillStyle = `hsla(${item.hue}, 72%, 44%, 0.95)`;
    ctx.fillRect(-item.size, -item.size, item.size * 2, item.size * 2);
    ctx.restore();
  });
}

function drawParticles(ctx, particles) {
  particles.forEach((particle) => {
    const alpha = Math.max(0, particle.life / (particle.maxLife || 1));
    ctx.beginPath();
    if (particle.color) {
      ctx.fillStyle = `hsla(${particle.color.h}, ${particle.color.s}%, ${particle.color.l}%, ${alpha * 0.92})`;
    } else {
      ctx.fillStyle = `hsla(${particle.hue}, 82%, 58%, ${alpha})`;
    }
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawCreatures(ctx, creatures, selectedId) {
  creatures.forEach((creature) => {
    creature.trail.forEach((point, index) => {
      ctx.beginPath();
      ctx.fillStyle = `hsla(${creature.genome.trailHue}, 76%, 56%, ${point.life * 0.18})`;
      ctx.arc(point.x, point.y, Math.max(1.5, index * 0.28), 0, Math.PI * 2);
      ctx.fill();
    });

    const wobble = Math.sin(creature.age * 0.12 + creature.id) * creature.genome.wiggle;
    const bodyX = creature.x + Math.cos(creature.age * 0.05) * wobble * 0.5;
    const bodyY = creature.y + Math.sin(creature.age * 0.06) * wobble * 0.5;
    const pulseAlpha = creature.pulseLife;
    const outline = selectedId === creature.id ? "#16392d" : "rgba(22, 57, 45, 0.2)";

    ctx.save();
    ctx.translate(bodyX, bodyY);
    ctx.rotate(Math.atan2(creature.vy, creature.vx));
    ctx.beginPath();
    ctx.ellipse(0, 0, creature.genome.size * 1.25, creature.genome.size * (0.76 + wobble * 0.03), 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${creature.genome.bodyHue}, 72%, ${creature.isPrototype ? "52%" : "46%"})`;
    ctx.fill();
    ctx.lineWidth = selectedId === creature.id ? 3 : 1.5;
    ctx.strokeStyle = outline;
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.arc(creature.genome.size * 0.35, -creature.genome.size * 0.15, Math.max(2, creature.genome.size * 0.18), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawHud(ctx, environment) {
  ctx.save();
  ctx.fillStyle = "rgba(21, 49, 40, 0.72)";
  ctx.font = '12px "Avenir Next", sans-serif';
  ctx.fillText(`${environment.name === "dish" ? "Petri dish" : "Local world"}  |  ${environment.creatures.length} creatures`, 16, 22);
  ctx.restore();
}

function updateStats() {
  const dishPopulation = state.dish.creatures.length;
  const worldPopulation = state.world.creatures.length;
  state.statElements.dishPopulation.textContent = String(dishPopulation);
  state.statElements.worldPopulation.textContent = String(worldPopulation);
  state.statElements.dishBirths.textContent = String(state.dish.births);
  state.statElements.worldBirths.textContent = String(state.world.births);
  state.statElements.dishFood.textContent = String(state.dish.food.length);
  state.statElements.worldFood.textContent = String(state.world.food.length);
  state.statElements.avgDishEnergy.textContent = averageEnergy(state.dish.creatures);
  state.statElements.avgWorldEnergy.textContent = averageEnergy(state.world.creatures);
  renderSelectedCreature();
}

function initializeCatalog() {
  const stored = loadCatalogFromStorage();
  if (stored.length > 0) {
    state.catalog = stored;
    state.selectedCatalogId = stored[0].id;
    return renderCatalog();
  }

  const initial = createCatalogEntry(state.genome);
  state.catalog = [initial];
  state.selectedCatalogId = initial.id;
  persistCatalog();
  renderCatalog();
}

function initializeTheme() {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) || "light";
  applyTheme(storedTheme);
}

function initializeHistory() {
  state.history.past = [serializeGenome(state.genome)];
  state.history.future = [];
  updateHistoryButtons();
}

function toggleTheme() {
  const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  refs.themeToggleBtn.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function togglePause() {
  state.paused = !state.paused;
  refs.pauseBtn.textContent = state.paused ? "Resume" : "Pause";
}

function handleGlobalKeydown(event) {
  if (state.possession.creatureId) return;
  if (event.key === "p" || event.key === "P") {
    togglePause();
    event.preventDefault();
  }
}

function exportSetup() {
  const payload = {
    version: 1,
    genome: sanitizeGenome(state.genome),
    catalog: state.catalog,
    selectedCatalogId: state.selectedCatalogId,
    worldScale: state.worldScale,
    paused: state.paused,
    dish: serializeEnvironment(state.dish),
    world: serializeEnvironment(state.world),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "creature-lab-setup.json";
  link.click();
  URL.revokeObjectURL(url);
}

function importSetup(event) {
  const [file] = event.target.files || [];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      applyImportedSetup(parsed);
    } catch (error) {
      window.alert(`Could not import setup: ${error.message}`);
    } finally {
      refs.importSetupInput.value = "";
    }
  };
  reader.readAsText(file);
}

function applyImportedSetup(payload) {
  state.genome = sanitizeGenome(payload.genome || createDefaultGenome());
  state.catalog = Array.isArray(payload.catalog)
    ? payload.catalog.map((entry) => ({
        id: typeof entry.id === "string" ? entry.id : createCatalogId(),
        genome: sanitizeGenome(entry.genome || {}),
      }))
    : [];
  state.selectedCatalogId = payload.selectedCatalogId || state.catalog[0]?.id || null;
  state.worldScale = clamp(Number(payload.worldScale), 1, 5, 1);
  refs.worldScale.value = String(state.worldScale);
  state.paused = Boolean(payload.paused);
  refs.pauseBtn.textContent = state.paused ? "Resume" : "Pause";

  hydrateEnvironment(state.dish, payload.dish);
  hydrateEnvironment(state.world, payload.world);

  syncGenomeToControls();
  renderRuleEditor();
  refreshGenomeJson();
  renderCatalog();
  initializeHistory();
  handleResize();
}

function serializeEnvironment(environment) {
  return {
    width: environment.width,
    height: environment.height,
    maxFood: environment.maxFood,
    births: environment.births,
    deaths: environment.deaths,
    totalReleased: environment.totalReleased,
    nextCreatureId: environment.nextCreatureId,
    selectedId: environment.selectedId,
    food: environment.food,
    particles: environment.particles,
    creatures: environment.creatures.map((creature) => ({
      id: creature.id,
      genome: creature.genome,
      environment: creature.environment,
      x: creature.x,
      y: creature.y,
      vx: creature.vx,
      vy: creature.vy,
      energy: creature.energy,
      age: creature.age,
      cooldown: creature.cooldown,
      pulseHue: creature.pulseHue,
      pulseLife: creature.pulseLife,
      trail: creature.trail,
      action: creature.action,
      touched: creature.touched,
      signalCooldown: creature.signalCooldown,
      isAlone: creature.isAlone,
      isPrototype: creature.isPrototype,
      isPossessed: creature.isPossessed,
    })),
  };
}

function hydrateEnvironment(environment, data) {
  environment.creatures = [];
  environment.food = Array.isArray(data?.food) ? data.food : [];
  environment.particles = Array.isArray(data?.particles) ? data.particles : [];
  environment.births = Number(data?.births) || 0;
  environment.deaths = Number(data?.deaths) || 0;
  environment.totalReleased = Number(data?.totalReleased) || 0;
  environment.nextCreatureId = Number(data?.nextCreatureId) || 1;
  environment.selectedId = data?.selectedId ?? null;
  if (environment.name !== "world") {
    environment.width = environment.baseWidth;
    environment.height = environment.baseHeight;
  }

  const creatures = Array.isArray(data?.creatures) ? data.creatures : [];
  creatures.forEach((raw) => {
    const creature = createCreature(environment, raw.genome || createDefaultGenome(), {
      x: raw.x,
      y: raw.y,
      vx: raw.vx,
      vy: raw.vy,
      energy: raw.energy,
      isPrototype: raw.isPrototype,
      isPossessed: raw.isPossessed,
    });
    creature.id = raw.id;
    creature.age = raw.age || 0;
    creature.cooldown = raw.cooldown || 0;
    creature.pulseHue = raw.pulseHue || creature.genome.bodyHue;
    creature.pulseLife = raw.pulseLife || 0;
    creature.trail = Array.isArray(raw.trail) ? raw.trail : [];
    creature.action = raw.action || "rest";
    creature.touched = Boolean(raw.touched);
    creature.signalCooldown = raw.signalCooldown || 0;
    creature.isAlone = raw.isAlone ?? true;
    environment.creatures.push(creature);
    if (creature.isPossessed && environment.name === "world") {
      state.possession.creatureId = creature.id;
    }
  });
}

function saveEditorGenome() {
  readControlsIntoGenome();
  refreshGenomeJson();
  saveCurrentCreatureToCatalog();
  pushHistorySnapshot();
}

function serializeGenome(genome) {
  return JSON.stringify(sanitizeGenome(genome));
}

function pushHistorySnapshot() {
  const snapshot = serializeGenome(state.genome);
  const lastSnapshot = state.history.past[state.history.past.length - 1];
  if (snapshot === lastSnapshot) {
    updateHistoryButtons();
    return;
  }
  state.history.past.push(snapshot);
  if (state.history.past.length > 80) {
    state.history.past.shift();
  }
  state.history.future = [];
  updateHistoryButtons();
}

function undoGenomeChange() {
  if (state.history.past.length <= 1) return;
  const current = state.history.past.pop();
  state.history.future.push(current);
  applyGenomeSnapshot(state.history.past[state.history.past.length - 1]);
}

function redoGenomeChange() {
  if (state.history.future.length === 0) return;
  const snapshot = state.history.future.pop();
  state.history.past.push(snapshot);
  applyGenomeSnapshot(snapshot);
}

function applyGenomeSnapshot(snapshot) {
  state.genome = sanitizeGenome(JSON.parse(snapshot));
  syncGenomeToControls();
  renderRuleEditor();
  refreshGenomeJson();
  updateHistoryButtons();
}

function updateHistoryButtons() {
  refs.undoBtn.disabled = state.history.past.length <= 1;
  refs.redoBtn.disabled = state.history.future.length === 0;
}

function loadCatalogFromStorage() {
  try {
    const raw = window.localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => ({
        id: typeof entry.id === "string" ? entry.id : createCatalogId(),
        genome: sanitizeGenome(entry.genome || {}),
      }))
      .slice(0, 24);
  } catch (error) {
    return [];
  }
}

function saveCurrentCreatureToCatalog() {
  readControlsIntoGenome();
  const entry = createCatalogEntry(state.genome);
  const existingIndex = state.catalog.findIndex(
    (item) => item.genome.speciesName.toLowerCase() === entry.genome.speciesName.toLowerCase()
  );

  if (existingIndex >= 0) {
    state.catalog[existingIndex] = { ...entry, id: state.catalog[existingIndex].id };
    state.selectedCatalogId = state.catalog[existingIndex].id;
  } else {
    state.catalog.unshift(entry);
    state.selectedCatalogId = entry.id;
  }

  persistCatalog();
  renderCatalog();
}

function createCatalogEntry(genome) {
  return {
    id: createCatalogId(),
    genome: sanitizeGenome(genome),
  };
}

function createCatalogId() {
  return `creature-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function persistCatalog() {
  window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(state.catalog));
}

function renderCatalog() {
  const selectedDishValue = refs.dishCreatureSelect.value || "draft";
  refs.catalogList.innerHTML = "";
  refs.catalogSelect.innerHTML = "";
  refs.dishCreatureSelect.innerHTML = "";

  const draftOption = document.createElement("option");
  draftOption.value = "draft";
  draftOption.textContent = "Current draft";
  refs.dishCreatureSelect.appendChild(draftOption);

  if (state.catalog.length === 0) {
    refs.catalogList.textContent = "No saved creatures yet.";
    const option = document.createElement("option");
    option.textContent = "No creatures saved";
    option.value = "";
    refs.catalogSelect.appendChild(option);
    return;
  }

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All creatures";
  refs.catalogSelect.appendChild(allOption);

  state.catalog.forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.id;
    option.textContent = entry.genome.speciesName;
    option.selected = entry.id === state.selectedCatalogId;
    refs.catalogSelect.appendChild(option);

    const dishOption = document.createElement("option");
    dishOption.value = entry.id;
    dishOption.textContent = entry.genome.speciesName;
    refs.dishCreatureSelect.appendChild(dishOption);

    const item = document.createElement("div");
    item.className = `catalog-item${entry.id === state.selectedCatalogId ? " active" : ""}`;

    const meta = document.createElement("div");
    meta.className = "catalog-meta";
    const text = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = entry.genome.speciesName;
    const detail = document.createElement("span");
    detail.textContent = `Hue ${Math.round(entry.genome.bodyHue)} | size ${entry.genome.size} | max ${entry.genome.maxPopulation} | life ${entry.genome.lifespan} | food ${entry.genome.needsFood ? "yes" : "no"} | alone ${entry.genome.immortalIfAlone ? "forever" : "finite"} | ${entry.genome.rules.length} rules`;
    text.append(title, detail);

    const swatch = document.createElement("div");
    swatch.style.width = "18px";
    swatch.style.height = "18px";
    swatch.style.borderRadius = "50%";
    swatch.style.background = `hsl(${entry.genome.bodyHue}, 72%, 52%)`;
    swatch.style.boxShadow = "0 0 0 2px rgba(24, 49, 40, 0.08)";
    meta.append(text, swatch);

    const actions = document.createElement("div");
    actions.className = "actions-row";

    const loadBtn = document.createElement("button");
    loadBtn.type = "button";
    loadBtn.className = "button ghost";
    loadBtn.textContent = "Load";
    loadBtn.addEventListener("click", () => {
      state.genome = sanitizeGenome(entry.genome);
      syncGenomeToControls();
      renderRuleEditor();
      refreshGenomeJson();
      state.selectedCatalogId = entry.id;
      refs.catalogSelect.value = entry.id;
      renderCatalog();
      pushHistorySnapshot();
    });

    const selectBtn = document.createElement("button");
    selectBtn.type = "button";
    selectBtn.className = "button ghost";
    selectBtn.textContent = "Select for world";
    selectBtn.addEventListener("click", () => {
      state.selectedCatalogId = entry.id;
      refs.catalogSelect.value = entry.id;
      renderCatalog();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "button danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      state.catalog = state.catalog.filter((item) => item.id !== entry.id);
      if (state.selectedCatalogId === entry.id) {
        state.selectedCatalogId = state.catalog[0]?.id || null;
      }
      persistCatalog();
      renderCatalog();
    });

    actions.append(loadBtn, selectBtn, deleteBtn);
    item.append(meta, actions);
    refs.catalogList.appendChild(item);
  });

  refs.catalogSelect.value = state.selectedCatalogId || "all";
  if ([...refs.dishCreatureSelect.options].some((option) => option.value === selectedDishValue)) {
    refs.dishCreatureSelect.value = selectedDishValue;
  } else {
    refs.dishCreatureSelect.value = "draft";
  }
}

function getSelectedCatalogCreature() {
  if (!state.selectedCatalogId || state.selectedCatalogId === "all") return null;
  return state.catalog.find((entry) => entry.id === state.selectedCatalogId) || null;
}

function getSelectedDishGenome() {
  if (refs.dishCreatureSelect.value === "draft" || !refs.dishCreatureSelect.value) {
    readControlsIntoGenome();
    refreshGenomeJson();
    return state.genome;
  }
  return state.catalog.find((entry) => entry.id === refs.dishCreatureSelect.value)?.genome || null;
}

function getSpawnCount(input, min, max) {
  const value = clamp(Number(input.value), min, max, min);
  input.value = String(value);
  return value;
}

function toggleWorldFullscreen() {
  state.fullscreenWorld = !state.fullscreenWorld;
  refs.worldPanel.classList.toggle("is-fullscreen", state.fullscreenWorld);
  document.body.classList.toggle("world-fullscreen", state.fullscreenWorld);
  refs.fullscreenWorldBtn.textContent = state.fullscreenWorld ? "Exit fullscreen" : "Fullscreen world";
  requestAnimationFrame(handleResize);
}

function possessCreature(genome) {
  const safeGenome = sanitizeGenome(genome);
  state.possession.keys = { up: false, down: false, left: false, right: false };
  state.possession.actions = { emit: false, eat: false };
  state.possession.color = sanitizeSignalColor(refs.possessColorSelect.value);
  if (state.possession.creatureId) {
    const previous = state.world.creatures.find((creature) => creature.id === state.possession.creatureId);
    if (previous) previous.isPossessed = false;
  }
  const creature = createCreature(state.world, safeGenome, {
    x: state.world.width / 2,
    y: state.world.height / 2,
    energy: Math.max(160, safeGenome.replicationThreshold * 0.8),
    isPrototype: true,
    isPossessed: true,
  });
  state.world.creatures.push(creature);
  state.world.totalReleased += 1;
  state.possession.creatureId = creature.id;
  state.world.selectedId = creature.id;
  state.selectedCreature = { environment: "world", id: creature.id };
  renderSelectedCreature();
}

function getPossessedActions(creature) {
  const { up, down, left, right } = state.possession.keys;
  const { emit, eat } = state.possession.actions;
  const dx = (right ? 1 : 0) - (left ? 1 : 0);
  const dy = (down ? 1 : 0) - (up ? 1 : 0);
  const actions = [];

  if (dx !== 0 || dy !== 0) {
    const steerTarget = {
      x: creature.x - dx,
      y: creature.y - dy,
    };

    actions.push(
      { action: "flee", intensity: "extreme", overrideTarget: steerTarget },
      { action: "speedUp", intensity: "high" }
    );
  } else {
    actions.push({ action: "rest", intensity: "high" });
  }

  if (emit) {
    actions.push({ action: getPossessionActionKey("emit"), intensity: "high" });
  }

  if (eat) {
    actions.push({ action: getPossessionActionKey("eat"), intensity: "high" });
  }

  return actions;
}

function handlePossessionKeyChange(event) {
  if (!state.possession.creatureId) return;
  const isDown = event.type === "keydown";
  switch (event.key) {
    case "ArrowUp":
    case "w":
    case "W":
      state.possession.keys.up = isDown;
      event.preventDefault();
      break;
    case "ArrowDown":
    case "s":
    case "S":
      state.possession.keys.down = isDown;
      event.preventDefault();
      break;
    case "ArrowLeft":
    case "a":
    case "A":
      state.possession.keys.left = isDown;
      event.preventDefault();
      break;
    case "ArrowRight":
    case "d":
    case "D":
      state.possession.keys.right = isDown;
      event.preventDefault();
      break;
    case "o":
    case "O":
      state.possession.actions.emit = isDown;
      event.preventDefault();
      break;
    case "p":
    case "P":
      state.possession.actions.eat = isDown;
      event.preventDefault();
      break;
    default:
      break;
  }
}

function sanitizeSignalColor(value) {
  return SIGNAL_COLOR_NAMES.includes(value) ? value : "Red";
}

function getPossessionActionKey(type, color = state.possession.color) {
  const safeColor = sanitizeSignalColor(color);
  return `${type}${safeColor}`;
}

function triggerPossessedSignalAction(type) {
  const creature = getCreatureById("world", state.possession.creatureId);
  if (!creature) return;

  if (type === "emit") {
    emitSignalParticle(state.world, creature, getPossessionActionKey("emit"), getIntensityFactor("high"));
    creature.action = `manual ${state.possession.color.toLowerCase()} release`;
    pulse(creature, SIGNAL_COLORS[getPossessionActionKey("emit")].h);
  } else if (type === "eat") {
    eatSignalParticles(state.world, creature, getPossessionActionKey("eat"), getIntensityFactor("high"));
    creature.action = `manual ${state.possession.color.toLowerCase()} eat`;
  }

  if (state.selectedCreature?.environment === "world" && state.selectedCreature.id === creature.id) {
    renderSelectedCreature();
  }
}

function handleResize() {
  resizeEnvironmentCanvas(state.dish, refs.dishCanvas, false);
  resizeEnvironmentCanvas(state.world, refs.worldCanvas, state.fullscreenWorld);
}

function resizeEnvironmentCanvas(environment, canvas, useViewportSize) {
  if (!useViewportSize) {
    environment.width = environment.baseWidth;
    environment.height = environment.baseHeight;
    environment.ctx = setupCanvasContext(canvas, environment.width, environment.height);
    canvas.style.width = "";
    canvas.style.height = "";
    clampEntitiesToBounds(environment);
    return;
  }

  const wrapRect = refs.worldCanvasWrap.getBoundingClientRect();
  const width = Math.max(environment.baseWidth, Math.floor(wrapRect.width * state.worldScale));
  const height = Math.max(environment.baseHeight, Math.floor((wrapRect.height || environment.baseHeight) * state.worldScale));
  environment.width = width;
  environment.height = height;
  environment.ctx = setupCanvasContext(canvas, width, height);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  clampEntitiesToBounds(environment);
}

function clampEntitiesToBounds(environment) {
  environment.creatures.forEach((creature) => {
    creature.x = clamp(creature.x, creature.genome.size, environment.width - creature.genome.size, creature.x);
    creature.y = clamp(creature.y, creature.genome.size, environment.height - creature.genome.size, creature.y);
  });
  environment.food.forEach((food) => {
    food.x = clamp(food.x, food.size, environment.width - food.size, food.x);
    food.y = clamp(food.y, food.size, environment.height - food.size, food.y);
  });
}

function renderSelectedCreature() {
  if (!state.selectedCreature) {
    refs.selectedCreature.textContent = "Click a creature in either canvas to inspect it.";
    return;
  }

  const creature = getCreatureById(state.selectedCreature.environment, state.selectedCreature.id);
  if (!creature) {
    state.selectedCreature = null;
    refs.selectedCreature.textContent = "Selected creature no longer exists.";
    return;
  }

  refs.selectedCreature.innerHTML = [
    `<strong>${escapeHtml(creature.genome.speciesName)}${creature.isPossessed ? " (possessed)" : ""}</strong> in ${escapeHtml(creature.environment)}`,
    `Energy: ${creature.energy.toFixed(0)}`,
    `Age: ${creature.age.toFixed(0)}`,
    `Action: ${creature.action}`,
    `Hue: ${creature.genome.bodyHue.toFixed(0)}`,
    `Replication threshold: ${creature.genome.replicationThreshold.toFixed(0)}`,
  ].join("<br />");
}

function handleCanvasPick(event, environment, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = environment.width / rect.width;
  const scaleY = environment.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  let selected = null;
  environment.creatures.forEach((creature) => {
    const distance = Math.hypot(creature.x - x, creature.y - y);
    if (distance <= creature.genome.size + 6) {
      selected = creature;
    }
  });

  environment.selectedId = selected ? selected.id : null;
  if (selected) {
    state.selectedCreature = {
      environment: environment.name,
      id: selected.id,
    };
  } else if (state.selectedCreature && state.selectedCreature.environment === environment.name) {
    state.selectedCreature = null;
  }
  if (environment === state.dish) state.world.selectedId = null;
  if (environment === state.world) state.dish.selectedId = null;
  renderSelectedCreature();
}

function getCreatureById(environmentName, id) {
  const environment = environmentName === "dish" ? state.dish : state.world;
  return environment.creatures.find((creature) => creature.id === id) || null;
}

function averageEnergy(creatures) {
  if (creatures.length === 0) return "0";
  const total = creatures.reduce((sum, creature) => sum + creature.energy, 0);
  return (total / creatures.length).toFixed(0);
}

function getIntensityFactor(intensity) {
  const factors = {
    tiny: 0.45,
    low: 0.75,
    medium: 1,
    high: 1.45,
    extreme: 1.9,
  };
  return factors[intensity] || 1;
}

function steerToward(creature, target, amount) {
  const dx = target.x - creature.x;
  const dy = target.y - creature.y;
  const length = Math.hypot(dx, dy) || 1;
  creature.vx += (dx / length) * amount;
  creature.vy += (dy / length) * amount;
}

function steerAway(creature, target, amount) {
  const dx = creature.x - target.x;
  const dy = creature.y - target.y;
  const length = Math.hypot(dx, dy) || 1;
  creature.vx += (dx / length) * amount;
  creature.vy += (dy / length) * amount;
}

function boostVelocity(creature, multiplier, maxSpeed) {
  creature.vx *= multiplier;
  creature.vy *= multiplier;
  const speed = Math.hypot(creature.vx, creature.vy);
  if (speed > maxSpeed) {
    creature.vx = (creature.vx / speed) * maxSpeed;
    creature.vy = (creature.vy / speed) * maxSpeed;
  }
}

function pulse(creature, hue) {
  creature.pulseHue = wrapHue(hue);
  creature.pulseLife = 1;
}

function emitSignalParticle(environment, creature, action, intensity) {
  if (creature.signalCooldown > 0) return;
  const color = SIGNAL_COLORS[action];
  if (!color) return;

  const movingSpeed = Math.hypot(creature.vx, creature.vy);
  const baseAngle =
    movingSpeed > 0.08 ? Math.atan2(creature.vy, creature.vx) : randomFloat(0, Math.PI * 2);
  const particleCount = Math.max(1, Math.round(intensity * 1.8));

  for (let index = 0; index < particleCount; index += 1) {
    const angle = baseAngle + randomFloat(-1.35, 1.35);
    const outwardSpeed = randomFloat(0.35, 0.8 + intensity * 0.16);
    environment.particles.push({
      x: creature.x + randomFloat(-creature.genome.size * 0.35, creature.genome.size * 0.35),
      y: creature.y + randomFloat(-creature.genome.size * 0.35, creature.genome.size * 0.35),
      vx: Math.cos(angle) * outwardSpeed + creature.vx * 0.12,
      vy: Math.sin(angle) * outwardSpeed + creature.vy * 0.12 - 0.03,
      color,
      signalKey: action,
      size: randomFloat(3, 5 + intensity),
      life: 300,
      maxLife: 300,
    });
  }

  creature.signalCooldown = Math.max(4, 20 - intensity * 5);
}

function burst(environment, x, y, hue, count, speed) {
  for (let index = 0; index < count; index += 1) {
    const angle = (Math.PI * 2 * index) / count + randomFloat(-0.2, 0.2);
    environment.particles.push({
      x,
      y,
      vx: Math.cos(angle) * randomFloat(0.2, speed),
      vy: Math.sin(angle) * randomFloat(0.2, speed),
      hue: wrapHue(hue),
      size: randomFloat(1.2, 3.6),
      life: randomFloat(18, 42),
      maxLife: 42,
    });
  }
}

function getDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function findKillTarget(environment, hunter) {
  let best = null;
  let bestDistance = Infinity;
  environment.creatures.forEach((other) => {
    if (other.id === hunter.id) return;
    const distance = getDistance(hunter, other);
    if (distance < hunter.genome.size + other.genome.size + 6 && distance < bestDistance) {
      best = other;
      bestDistance = distance;
    }
  });
  return best;
}

function eatSignalParticles(environment, creature, action, intensity) {
  const targetSignal = EAT_PARTICLE_MAP[action];
  if (!targetSignal) return;

  const radius = creature.genome.size + 16 + intensity * 10;
  let eatenCount = 0;

  environment.particles = environment.particles.filter((particle) => {
    if (particle.signalKey !== targetSignal) return true;
    const distance = Math.hypot(creature.x - particle.x, creature.y - particle.y);
    if (distance > radius) return true;
    eatenCount += 1;
    return false;
  });

  if (eatenCount > 0) {
    creature.energy += eatenCount * 1.5;
  }
}

function clamp(value, min, max, fallback) {
  if (Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function wrapHue(value) {
  const hue = value % 360;
  return hue < 0 ? hue + 360 : hue;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.round(randomFloat(min, max));
}

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
