const rowsInput = document.getElementById("rows");
const colsInput = document.getElementById("cols");
const playersInput = document.getElementById("players");
const playerConfig = document.getElementById("playerConfig");
const dropRow = document.getElementById("dropRow");
const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const applyBtn = document.getElementById("apply");
const restartBtn = document.getElementById("restart");
const legendEl = document.getElementById("legend");
const historyList = document.getElementById("historyList");
const splash = document.getElementById("splash");
const splashTitle = document.getElementById("splashTitle");
const splashText = document.getElementById("splashText");
const playAgainBtn = document.getElementById("playAgain");

const defaultPalette = [
  "#f94144",
  "#f3722c",
  "#f9c74f",
  "#90be6d",
  "#577590",
  "#5f0f40",
];

const MAX_AI_TIME_MS = 15000;

let rows = 6;
let cols = 7;
let players = 2;
let playerColors = [];
let playerNames = [];
let playerTypes = [];
let playerLevels = [];
let board = [];
let currentPlayer = 0;
let gameOver = false;
let moveHistory = [];
let aiWorker = null;
let aiThinking = false;

function clampValue(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function buildPlayerConfig() {
  const count = clampValue(parseInt(playersInput.value, 10), 2, 6);
  playersInput.value = count;
  players = count;

  if (playerColors.length !== players) {
    playerColors = Array.from({ length: players }, (_, index) => {
      return playerColors[index] || defaultPalette[index % defaultPalette.length];
    });
  }

  if (playerNames.length !== players) {
    playerNames = Array.from({ length: players }, (_, index) => {
      return playerNames[index] || `Player ${index + 1}`;
    });
  }

  if (playerTypes.length !== players) {
    playerTypes = Array.from({ length: players }, (_, index) => {
      return playerTypes[index] || "human";
    });
  }

  if (playerLevels.length !== players) {
    playerLevels = Array.from({ length: players }, (_, index) => {
      return playerLevels[index] || "easy";
    });
  }

  playerConfig.innerHTML = "";

  playerColors.forEach((color, index) => {
    const card = document.createElement("div");
    card.className = "player-card";

    const meta = document.createElement("div");
    meta.className = "player-meta";

    const nameLabel = document.createElement("label");
    nameLabel.textContent = `Player ${index + 1} name`;

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = playerNames[index];
    nameInput.addEventListener("input", (event) => {
      playerNames[index] = event.target.value.trim() || `Player ${index + 1}`;
      renderLegend();
      updateStatus();
      renderHistory();
    });

    const typeSelect = document.createElement("select");
    const humanOption = document.createElement("option");
    humanOption.value = "human";
    humanOption.textContent = "Human";
    const aiOption = document.createElement("option");
    aiOption.value = "ai";
    aiOption.textContent = "AI";
    typeSelect.append(humanOption, aiOption);
    const levelSelect = document.createElement("select");
    const levels = [
      { value: "easy", label: "AI Easy" },
      { value: "medium", label: "AI Medium" },
      { value: "hard", label: "AI Hard" },
      { value: "hardest", label: "AI Hardest (15s)" },
    ];
    levels.forEach((level) => {
      const option = document.createElement("option");
      option.value = level.value;
      option.textContent = level.label;
      levelSelect.appendChild(option);
    });
    levelSelect.value = playerLevels[index];
    levelSelect.disabled = playerTypes[index] !== "ai";
    levelSelect.addEventListener("change", (event) => {
      playerLevels[index] = event.target.value;
      maybeTriggerAi();
    });

    typeSelect.value = playerTypes[index];
    typeSelect.addEventListener("change", (event) => {
      playerTypes[index] = event.target.value;
      levelSelect.disabled = playerTypes[index] !== "ai";
      updateStatus();
      maybeTriggerAi();
    });

    meta.append(nameLabel, nameInput, typeSelect);
    meta.append(levelSelect);

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = color;
    colorInput.addEventListener("input", (event) => {
      playerColors[index] = event.target.value;
      renderLegend();
      renderBoard();
    });

    card.append(meta, colorInput);
    playerConfig.appendChild(card);
  });

  renderLegend();
}

function renderLegend() {
  legendEl.innerHTML = "";
  playerColors.forEach((color, index) => {
    const chip = document.createElement("div");
    chip.className = "chip";

    const swatch = document.createElement("span");
    swatch.style.background = color;

    const text = document.createElement("div");
    text.textContent = playerNames[index] || `Player ${index + 1}`;

    chip.append(swatch, text);
    legendEl.appendChild(chip);
  });
}

function buildBoard() {
  rows = clampValue(parseInt(rowsInput.value, 10), 4, 12);
  cols = clampValue(parseInt(colsInput.value, 10), 4, 12);
  rowsInput.value = rows;
  colsInput.value = cols;

  board = Array.from({ length: rows }, () => Array(cols).fill(null));
  currentPlayer = 0;
  gameOver = false;
  moveHistory = [];
  renderHistory();
  hideSplash();
  aiThinking = false;
  updateStatus();
  maybeTriggerAi();

  document.documentElement.style.setProperty("--cols", cols);

  dropRow.innerHTML = "";
  for (let c = 0; c < cols; c += 1) {
    const btn = document.createElement("button");
    btn.textContent = "Drop";
    btn.dataset.col = String(c);
    btn.addEventListener("click", () => handleDrop(c));
    dropRow.appendChild(btn);
  }

  renderBoard();
}

function renderBoard() {
  boardEl.innerHTML = "";
  board.forEach((row, rIndex) => {
    row.forEach((cell, cIndex) => {
      const slot = document.createElement("div");
      slot.className = "cell";
      slot.dataset.row = String(rIndex);
      slot.dataset.col = String(cIndex);

      if (cell !== null) {
        slot.classList.add("filled");
        slot.style.background = playerColors[cell];
      }

      boardEl.appendChild(slot);
    });
  });
}

function handleDrop(col) {
  if (gameOver) return;
  if (playerTypes[currentPlayer] === "ai") return;

  for (let row = rows - 1; row >= 0; row -= 1) {
    if (board[row][col] === null) {
      placePiece(row, col);
      return;
    }
  }
}

function checkDraw() {
  return board.every((row) => row.every((cell) => cell !== null));
}

function checkWin(row, col) {
  const player = board[row][col];
  if (player === null) return false;

  const directions = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 1, dc: 1 },
    { dr: 1, dc: -1 },
  ];

  return directions.some(({ dr, dc }) => {
    let count = 1;
    count += countDirection(player, row, col, dr, dc);
    count += countDirection(player, row, col, -dr, -dc);
    return count >= 4;
  });
}

function countDirection(player, startRow, startCol, dr, dc) {
  let r = startRow + dr;
  let c = startCol + dc;
  let count = 0;

  while (r >= 0 && r < rows && c >= 0 && c < cols) {
    if (board[r][c] !== player) break;
    count += 1;
    r += dr;
    c += dc;
  }

  return count;
}

function placePiece(row, col) {
  board[row][col] = currentPlayer;
  const playerName = playerNames[currentPlayer] || `Player ${currentPlayer + 1}`;
  moveHistory.push(`${playerName} dropped in column ${col + 1}`);
  renderHistory();
  renderBoard();

  if (checkWin(row, col)) {
    gameOver = true;
    showSplash(`${playerName} wins!`, "Game over. Thanks for playing.");
    statusEl.textContent = `${playerName} wins!`;
    return;
  }

  if (checkDraw()) {
    gameOver = true;
    showSplash("Draw game", "No more moves remain.");
    statusEl.textContent = "It's a draw.";
    return;
  }

  currentPlayer = (currentPlayer + 1) % players;
  updateStatus();
  maybeTriggerAi();
}

function updateStatus(isThinking = false) {
  const playerName = playerNames[currentPlayer] || `Player ${currentPlayer + 1}`;
  const label = playerTypes[currentPlayer] === "ai" ? "AI" : "Human";
  const level = playerLevels[currentPlayer] || "easy";
  if (isThinking) {
    statusEl.textContent = `${playerName} is thinking (${label} ${level}).`;
    return;
  }
  statusEl.textContent = `${playerName}'s turn (${label}).`;
}

function renderHistory() {
  historyList.innerHTML = "";
  moveHistory.slice().reverse().forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = entry;
    historyList.appendChild(item);
  });
}

function setDropRowDisabled(disabled) {
  Array.from(dropRow.querySelectorAll("button")).forEach((btn) => {
    btn.disabled = disabled;
  });
}

function getValidColumns() {
  const valid = [];
  for (let c = 0; c < cols; c += 1) {
    if (board[0][c] === null) valid.push(c);
  }
  return valid;
}

function maybeTriggerAi() {
  if (gameOver) return;
  if (playerTypes[currentPlayer] !== "ai") return;
  if (aiThinking) return;

  const valid = getValidColumns();
  if (valid.length === 0) return;

  const level = playerLevels[currentPlayer] || "easy";
  if (level === "hardest") {
    updateStatus(true);
    setDropRowDisabled(true);
    aiThinking = true;
    pickBestColumnTimedAsync(MAX_AI_TIME_MS, (choice) => {
      aiThinking = false;
      setDropRowDisabled(false);
      updateStatus();
      if (gameOver) return;
      if (playerTypes[currentPlayer] !== "ai") return;
      if (typeof choice !== "number") return;
      for (let row = rows - 1; row >= 0; row -= 1) {
        if (board[row][choice] === null) {
          placePiece(row, choice);
          return;
        }
      }
    });
    return;
  }

  const choice = pickAiColumn();
  setTimeout(() => {
    if (gameOver) return;
    for (let row = rows - 1; row >= 0; row -= 1) {
      if (board[row][choice] === null) {
        placePiece(row, choice);
        return;
      }
    }
  }, 500);
}

function pickAiColumn() {
  const level = playerLevels[currentPlayer] || "easy";
  if (level === "easy") return pickRandomColumn();
  if (level === "medium") return pickBestColumn(2);
  if (level === "hard") return pickBestColumn(4);
  return pickBestColumnTimed(MAX_AI_TIME_MS);
}

function pickRandomColumn() {
  const valid = getValidColumns();
  return valid[Math.floor(Math.random() * valid.length)];
}

function pickBestColumn(depth) {
  const valid = getValidColumns();
  let bestScore = -Infinity;
  let bestCols = [];

  valid.forEach((col) => {
    const row = findDropRow(board, col);
    if (row === -1) return;
    const nextBoard = cloneBoard(board);
    nextBoard[row][col] = currentPlayer;
    const score = minimax(nextBoard, depth - 1, (currentPlayer + 1) % players, false);
    if (score > bestScore) {
      bestScore = score;
      bestCols = [col];
    } else if (score === bestScore) {
      bestCols.push(col);
    }
  });

  if (bestCols.length === 0) return pickRandomColumn();
  return bestCols[Math.floor(Math.random() * bestCols.length)];
}

function pickBestColumnTimed(timeLimitMs) {
  const deadline = performance.now() + timeLimitMs;
  let bestCol = pickBestColumn(4);
  let depth = 2;

  while (performance.now() < deadline) {
    const result = minimaxTimed(
      board,
      depth,
      currentPlayer,
      -Infinity,
      Infinity,
      deadline
    );
    if (result.aborted) break;
    if (result.col !== null && result.col !== undefined) {
      bestCol = result.col;
    }
    depth += 1;
  }

  return bestCol;
}

function minimax(state, depth, playerIndex, isMaximizing) {
  const outcome = evaluateTerminal(state, playerIndex);
  if (outcome !== null) return outcome;
  if (depth === 0) return evaluateBoard(state, currentPlayer);

  const valid = getValidColumnsForState(state);
  if (valid.length === 0) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    valid.forEach((col) => {
      const row = findDropRow(state, col);
      if (row === -1) return;
      const nextState = cloneBoard(state);
      nextState[row][col] = playerIndex;
      const score = minimax(nextState, depth - 1, (playerIndex + 1) % players, false);
      best = Math.max(best, score);
    });
    return best;
  }

  let best = Infinity;
  valid.forEach((col) => {
    const row = findDropRow(state, col);
    if (row === -1) return;
    const nextState = cloneBoard(state);
    nextState[row][col] = playerIndex;
    const score = minimax(nextState, depth - 1, (playerIndex + 1) % players, true);
    best = Math.min(best, score);
  });
  return best;
}

function minimaxTimed(state, depth, playerIndex, alpha, beta, deadline) {
  if (performance.now() >= deadline) return { score: 0, col: null, aborted: true };

  const outcome = evaluateTerminal(state, playerIndex);
  if (outcome !== null) return { score: outcome, col: null, aborted: false };
  if (depth === 0) {
    return { score: evaluateBoard(state, currentPlayer), col: null, aborted: false };
  }

  const valid = getOrderedColumns(state);
  if (valid.length === 0) return { score: 0, col: null, aborted: false };

  const isMaximizing = playerIndex === currentPlayer;
  let bestCol = valid[0];

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (const col of valid) {
      const row = findDropRow(state, col);
      if (row === -1) continue;
      const nextState = cloneBoard(state);
      nextState[row][col] = playerIndex;
      const child = minimaxTimed(
        nextState,
        depth - 1,
        (playerIndex + 1) % players,
        alpha,
        beta,
        deadline
      );
      if (child.aborted) return { score: 0, col: null, aborted: true };
      if (child.score > bestScore) {
        bestScore = child.score;
        bestCol = col;
      }
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) break;
    }
    return { score: bestScore, col: bestCol, aborted: false };
  }

  let bestScore = Infinity;
  for (const col of valid) {
    const row = findDropRow(state, col);
    if (row === -1) continue;
    const nextState = cloneBoard(state);
    nextState[row][col] = playerIndex;
    const child = minimaxTimed(
      nextState,
      depth - 1,
      (playerIndex + 1) % players,
      alpha,
      beta,
      deadline
    );
    if (child.aborted) return { score: 0, col: null, aborted: true };
    if (child.score < bestScore) {
      bestScore = child.score;
      bestCol = col;
    }
    beta = Math.min(beta, bestScore);
    if (beta <= alpha) break;
  }
  return { score: bestScore, col: bestCol, aborted: false };
}

function evaluateTerminal(state, playerIndex) {
  const winner = findWinner(state);
  if (winner === null) return null;
  if (winner === currentPlayer) return 10000;
  return -10000;
}

function evaluateBoard(state, maximizingPlayer) {
  let score = 0;
  score += scoreLines(state, maximizingPlayer);
  return score;
}

function scoreLines(state, maximizingPlayer) {
  let score = 0;
  const lines = getAllLines(state);
  lines.forEach((line) => {
    const counts = countLine(line, maximizingPlayer);
    score += counts;
  });
  return score;
}

function countLine(line, maximizingPlayer) {
  let maxCount = 0;
  let oppCount = 0;
  line.forEach((cell) => {
    if (cell === maximizingPlayer) maxCount += 1;
    else if (cell !== null) oppCount += 1;
  });
  if (maxCount > 0 && oppCount > 0) return 0;
  if (maxCount === 4) return 1000;
  if (maxCount === 3) return 50;
  if (maxCount === 2) return 10;
  if (maxCount === 1) return 1;
  if (oppCount === 4) return -1000;
  if (oppCount === 3) return -50;
  if (oppCount === 2) return -10;
  if (oppCount === 1) return -1;
  return 0;
}

function getAllLines(state) {
  const lines = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c <= cols - 4; c += 1) {
      lines.push([state[r][c], state[r][c + 1], state[r][c + 2], state[r][c + 3]]);
    }
  }
  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r <= rows - 4; r += 1) {
      lines.push([state[r][c], state[r + 1][c], state[r + 2][c], state[r + 3][c]]);
    }
  }
  for (let r = 0; r <= rows - 4; r += 1) {
    for (let c = 0; c <= cols - 4; c += 1) {
      lines.push([state[r][c], state[r + 1][c + 1], state[r + 2][c + 2], state[r + 3][c + 3]]);
    }
  }
  for (let r = 3; r < rows; r += 1) {
    for (let c = 0; c <= cols - 4; c += 1) {
      lines.push([state[r][c], state[r - 1][c + 1], state[r - 2][c + 2], state[r - 3][c + 3]]);
    }
  }
  return lines;
}

function cloneBoard(state) {
  return state.map((row) => row.slice());
}

function findDropRow(state, col) {
  for (let r = rows - 1; r >= 0; r -= 1) {
    if (state[r][col] === null) return r;
  }
  return -1;
}

function getValidColumnsForState(state) {
  const valid = [];
  for (let c = 0; c < cols; c += 1) {
    if (state[0][c] === null) valid.push(c);
  }
  return valid;
}

function getOrderedColumns(state) {
  const valid = getValidColumnsForState(state);
  const center = Math.floor(cols / 2);
  return valid.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
}

function pickBestColumnTimedAsync(timeLimitMs, callback) {
  const worker = getAiWorker();
  worker.onmessage = (event) => {
    callback(event.data?.col);
  };
  worker.postMessage({
    board,
    rows,
    cols,
    players,
    currentPlayer,
    timeLimitMs,
  });
}

function getAiWorker() {
  if (aiWorker) return aiWorker;

  const workerSource = `
    self.onmessage = (event) => {
      const { board, rows, cols, players, currentPlayer, timeLimitMs } = event.data;
      const deadline = performance.now() + timeLimitMs;
      let bestCol = pickBestColumn(board, rows, cols, players, currentPlayer, 4);
      let depth = 2;
      while (performance.now() < deadline) {
        const result = minimaxTimed(
          board,
          rows,
          cols,
          players,
          currentPlayer,
          depth,
          currentPlayer,
          -Infinity,
          Infinity,
          deadline
        );
        if (result.aborted) break;
        if (result.col !== null && result.col !== undefined) bestCol = result.col;
        depth += 1;
      }
      self.postMessage({ col: bestCol });
    };

    function pickBestColumn(state, rows, cols, players, currentPlayer, depth) {
      const valid = getValidColumnsForState(state, cols);
      let bestScore = -Infinity;
      let bestCols = [];
      valid.forEach((col) => {
        const row = findDropRow(state, rows, col);
        if (row === -1) return;
        const nextState = cloneBoard(state);
        nextState[row][col] = currentPlayer;
        const score = minimax(
          nextState,
          rows,
          cols,
          players,
          currentPlayer,
          depth - 1,
          (currentPlayer + 1) % players,
          false
        );
        if (score > bestScore) {
          bestScore = score;
          bestCols = [col];
        } else if (score === bestScore) {
          bestCols.push(col);
        }
      });
      if (bestCols.length === 0) return valid[0];
      return bestCols[Math.floor(Math.random() * bestCols.length)];
    }

    function minimax(state, rows, cols, players, maximizingPlayer, depth, playerIndex, isMaximizing) {
      const outcome = evaluateTerminal(state, rows, cols, maximizingPlayer);
      if (outcome !== null) return outcome;
      if (depth === 0) return evaluateBoard(state, rows, cols, maximizingPlayer);

      const valid = getValidColumnsForState(state, cols);
      if (valid.length === 0) return 0;

      if (isMaximizing) {
        let best = -Infinity;
        valid.forEach((col) => {
          const row = findDropRow(state, rows, col);
          if (row === -1) return;
          const nextState = cloneBoard(state);
          nextState[row][col] = playerIndex;
          const score = minimax(
            nextState,
            rows,
            cols,
            players,
            maximizingPlayer,
            depth - 1,
            (playerIndex + 1) % players,
            false
          );
          best = Math.max(best, score);
        });
        return best;
      }

      let best = Infinity;
      valid.forEach((col) => {
        const row = findDropRow(state, rows, col);
        if (row === -1) return;
        const nextState = cloneBoard(state);
        nextState[row][col] = playerIndex;
        const score = minimax(
          nextState,
          rows,
          cols,
          players,
          maximizingPlayer,
          depth - 1,
          (playerIndex + 1) % players,
          true
        );
        best = Math.min(best, score);
      });
      return best;
    }

    function minimaxTimed(state, rows, cols, players, maximizingPlayer, depth, playerIndex, alpha, beta, deadline) {
      if (performance.now() >= deadline) return { score: 0, col: null, aborted: true };
      const outcome = evaluateTerminal(state, rows, cols, maximizingPlayer);
      if (outcome !== null) return { score: outcome, col: null, aborted: false };
      if (depth === 0) {
        return { score: evaluateBoard(state, rows, cols, maximizingPlayer), col: null, aborted: false };
      }

      const valid = getOrderedColumns(state, cols);
      if (valid.length === 0) return { score: 0, col: null, aborted: false };

      const isMaximizing = playerIndex === maximizingPlayer;
      let bestCol = valid[0];

      if (isMaximizing) {
        let bestScore = -Infinity;
        for (const col of valid) {
          const row = findDropRow(state, rows, col);
          if (row === -1) continue;
          const nextState = cloneBoard(state);
          nextState[row][col] = playerIndex;
          const child = minimaxTimed(
            nextState,
            rows,
            cols,
            players,
            maximizingPlayer,
            depth - 1,
            (playerIndex + 1) % players,
            alpha,
            beta,
            deadline
          );
          if (child.aborted) return { score: 0, col: null, aborted: true };
          if (child.score > bestScore) {
            bestScore = child.score;
            bestCol = col;
          }
          alpha = Math.max(alpha, bestScore);
          if (beta <= alpha) break;
        }
        return { score: bestScore, col: bestCol, aborted: false };
      }

      let bestScore = Infinity;
      for (const col of valid) {
        const row = findDropRow(state, rows, col);
        if (row === -1) continue;
        const nextState = cloneBoard(state);
        nextState[row][col] = playerIndex;
        const child = minimaxTimed(
          nextState,
          rows,
          cols,
          players,
          maximizingPlayer,
          depth - 1,
          (playerIndex + 1) % players,
          alpha,
          beta,
          deadline
        );
        if (child.aborted) return { score: 0, col: null, aborted: true };
        if (child.score < bestScore) {
          bestScore = child.score;
          bestCol = col;
        }
        beta = Math.min(beta, bestScore);
        if (beta <= alpha) break;
      }
      return { score: bestScore, col: bestCol, aborted: false };
    }

    function evaluateTerminal(state, rows, cols, maximizingPlayer) {
      const winner = findWinner(state, rows, cols);
      if (winner === null) return null;
      if (winner === maximizingPlayer) return 10000;
      return -10000;
    }

    function evaluateBoard(state, rows, cols, maximizingPlayer) {
      let score = 0;
      score += scoreLines(state, rows, cols, maximizingPlayer);
      return score;
    }

    function scoreLines(state, rows, cols, maximizingPlayer) {
      let score = 0;
      const lines = getAllLines(state, rows, cols);
      lines.forEach((line) => {
        const counts = countLine(line, maximizingPlayer);
        score += counts;
      });
      return score;
    }

    function countLine(line, maximizingPlayer) {
      let maxCount = 0;
      let oppCount = 0;
      line.forEach((cell) => {
        if (cell === maximizingPlayer) maxCount += 1;
        else if (cell !== null) oppCount += 1;
      });
      if (maxCount > 0 && oppCount > 0) return 0;
      if (maxCount === 4) return 1000;
      if (maxCount === 3) return 50;
      if (maxCount === 2) return 10;
      if (maxCount === 1) return 1;
      if (oppCount === 4) return -1000;
      if (oppCount === 3) return -50;
      if (oppCount === 2) return -10;
      if (oppCount === 1) return -1;
      return 0;
    }

    function getAllLines(state, rows, cols) {
      const lines = [];
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c <= cols - 4; c += 1) {
          lines.push([state[r][c], state[r][c + 1], state[r][c + 2], state[r][c + 3]]);
        }
      }
      for (let c = 0; c < cols; c += 1) {
        for (let r = 0; r <= rows - 4; r += 1) {
          lines.push([state[r][c], state[r + 1][c], state[r + 2][c], state[r + 3][c]]);
        }
      }
      for (let r = 0; r <= rows - 4; r += 1) {
        for (let c = 0; c <= cols - 4; c += 1) {
          lines.push([state[r][c], state[r + 1][c + 1], state[r + 2][c + 2], state[r + 3][c + 3]]);
        }
      }
      for (let r = 3; r < rows; r += 1) {
        for (let c = 0; c <= cols - 4; c += 1) {
          lines.push([state[r][c], state[r - 1][c + 1], state[r - 2][c + 2], state[r - 3][c + 3]]);
        }
      }
      return lines;
    }

    function cloneBoard(state) {
      return state.map((row) => row.slice());
    }

    function findDropRow(state, rows, col) {
      for (let r = rows - 1; r >= 0; r -= 1) {
        if (state[r][col] === null) return r;
      }
      return -1;
    }

    function getValidColumnsForState(state, cols) {
      const valid = [];
      for (let c = 0; c < cols; c += 1) {
        if (state[0][c] === null) valid.push(c);
      }
      return valid;
    }

    function getOrderedColumns(state, cols) {
      const valid = getValidColumnsForState(state, cols);
      const center = Math.floor(cols / 2);
      return valid.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
    }

    function findWinner(state, rows, cols) {
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const player = state[r][c];
          if (player === null) continue;
          if (checkWinAt(state, rows, cols, r, c, player)) return player;
        }
      }
      return null;
    }

    function checkWinAt(state, rows, cols, row, col, player) {
      const dirs = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1],
      ];
      return dirs.some(([dr, dc]) => {
        for (let i = 0; i < 4; i += 1) {
          const r = row + dr * i;
          const c = col + dc * i;
          if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
          if (state[r][c] !== player) return false;
        }
        return true;
      });
    }
  `;

  aiWorker = new Worker(URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" })));
  return aiWorker;
}

function findWinner(state) {
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const player = state[r][c];
      if (player === null) continue;
      if (checkWinAt(state, r, c, player)) return player;
    }
  }
  return null;
}

function checkWinAt(state, row, col, player) {
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  return dirs.some(([dr, dc]) => {
    let count = 0;
    for (let i = 0; i < 4; i += 1) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
      if (state[r][c] !== player) return false;
      count += 1;
    }
    return count === 4;
  });
}

function showSplash(title, text) {
  splashTitle.textContent = title;
  splashText.textContent = text;
  splash.classList.remove("hidden");
}

function hideSplash() {
  splash.classList.add("hidden");
}

applyBtn.addEventListener("click", () => {
  buildPlayerConfig();
  buildBoard();
});

restartBtn.addEventListener("click", () => {
  buildBoard();
});

playersInput.addEventListener("change", buildPlayerConfig);
playAgainBtn.addEventListener("click", () => {
  buildBoard();
});

buildPlayerConfig();
buildBoard();
