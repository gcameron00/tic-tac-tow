/* =========================================================================
   Tic-Tac-Toe — game engine
   Vanilla JS, no framework. Handles one- and two-player games, an AI
   opponent with three difficulty levels, "thinking time" for the computer,
   score tracking, and the occasional nod to WarGames (1983).
   ========================================================================= */

(function () {
  "use strict";

  /* --------------------------------------------------------------- Config */
  const HUMAN = "X"; // in one-player mode the human is always X and moves first
  const AI = "O";
  const LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6],            // diagonals
  ];

  // Pixel-space endpoints (0-100 viewBox) for the winning-line overlay,
  // keyed by the sorted line index in LINES.
  const LINE_COORDS = [
    { x1: 4, y1: 16.5, x2: 96, y2: 16.5 },  // row 0
    { x1: 4, y1: 50, x2: 96, y2: 50 },      // row 1
    { x1: 4, y1: 83.5, x2: 96, y2: 83.5 },  // row 2
    { x1: 16.5, y1: 4, x2: 16.5, y2: 96 },  // col 0
    { x1: 50, y1: 4, x2: 50, y2: 96 },      // col 1
    { x1: 83.5, y1: 4, x2: 83.5, y2: 96 },  // col 2
    { x1: 6, y1: 6, x2: 94, y2: 94 },       // diag TL-BR
    { x1: 94, y1: 6, x2: 6, y2: 94 },       // diag TR-BL
  ];

  /* --------------------------------------------------- WarGames easter eggs */
  // "Shall we play a game?" — occasionally the machine gets chatty.
  const WOPR_LINES = [
    "GREETINGS, PROFESSOR FALKEN. Shall we play a game?",
    "How about a nice game of chess? …No? Tic-Tac-Toe it is.",
    "A strange game. The only winning move is not to play.",
    "Wouldn't you prefer a good game of chess?",
    "I'm learning. Every game teaches me something.",
    "Interesting. Let me run the simulations…",
    "You are a hard opponent, Professor Falken.",
    "Curious. This one always ends the same way.",
  ];
  const DRAW_LINES = [
    "A strange game. The only winning move is not to play.",
    "Stalemate. As I predicted — nobody wins.",
    "A draw. Global thermonuclear war averted, for now.",
  ];

  function maybeWopr(chance) {
    if (Math.random() < chance) {
      return WOPR_LINES[Math.floor(Math.random() * WOPR_LINES.length)];
    }
    return null;
  }

  /* ------------------------------------------------------------- Game state */
  const state = {
    board: Array(9).fill(null),
    current: HUMAN,
    mode: 1,            // 1 = vs computer, 2 = local two-player
    difficulty: "hard", // easy | medium | hard
    over: false,
    busy: false,        // true while the computer is "thinking"
    scores: { X: 0, O: 0, draw: 0 },
  };

  const DIFFICULTY_HINTS = {
    easy: "Playful — moves at random. A gentle warm-up.",
    medium: "Wary — blocks and pounces, but can be outfoxed.",
    hard: "W.O.P.R. — the only winning move is not to play. Good luck.",
  };

  /* ------------------------------------------------------------------- DOM */
  const el = {};
  function cacheDom() {
    el.setup = document.getElementById("setup");
    el.board = document.getElementById("board");
    el.status = document.getElementById("status");
    el.difficultyGroup = document.getElementById("difficulty-group");
    el.difficultyHint = document.getElementById("difficulty-hint");
    el.newRound = document.getElementById("new-round");
    el.resetScores = document.getElementById("reset-scores");
    el.winLine = document.getElementById("win-line");
    el.winSeg = document.getElementById("win-line-seg");
    el.scoreX = document.getElementById("score-x");
    el.scoreO = document.getElementById("score-o");
    el.scoreDraw = document.getElementById("score-draw");
    el.labelX = document.getElementById("label-x");
    el.labelO = document.getElementById("label-o");
    el.cardX = document.getElementById("score-x-card");
    el.cardO = document.getElementById("score-o-card");
  }

  /* -------------------------------------------------------------- Rendering */
  function buildBoard() {
    el.board.innerHTML = "";
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.dataset.index = String(i);
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", "Empty cell " + (i + 1));
      cell.addEventListener("click", onCellClick);
      el.board.appendChild(cell);
    }
  }

  function renderCell(i) {
    const cell = el.board.children[i];
    const mark = state.board[i];
    if (mark) {
      cell.innerHTML = '<span class="glyph">' + mark + "</span>";
      cell.classList.add("is-filled", mark === "X" ? "mark-x" : "mark-o");
      cell.disabled = true;
      cell.setAttribute("aria-label", (mark === "X" ? "Cross" : "Nought") + " in cell " + (i + 1));
    } else {
      cell.innerHTML = "";
      cell.className = "cell";
      cell.disabled = false;
      cell.setAttribute("aria-label", "Empty cell " + (i + 1));
    }
  }

  function renderBoard() {
    for (let i = 0; i < 9; i++) renderCell(i);
  }

  function setStatus(text, opts) {
    opts = opts || {};
    el.status.textContent = text;
    el.status.classList.toggle("is-thinking", !!opts.thinking);
  }

  function playerName(mark) {
    if (state.mode === 1) {
      return mark === HUMAN ? "You" : "W.O.P.R.";
    }
    return mark === "X" ? "Player X" : "Player O";
  }

  function updateLabels() {
    el.labelX.textContent = state.mode === 1 ? "You (X)" : "Player X";
    el.labelO.textContent = state.mode === 1 ? "W.O.P.R. (O)" : "Player O";
  }

  function updateTurnIndicator() {
    const xTurn = !state.over && state.current === "X";
    const oTurn = !state.over && state.current === "O";
    el.cardX.classList.toggle("is-turn", xTurn);
    el.cardO.classList.toggle("is-turn", oTurn);
  }

  function renderScores() {
    el.scoreX.textContent = state.scores.X;
    el.scoreO.textContent = state.scores.O;
    el.scoreDraw.textContent = state.scores.draw;
  }

  function showWinLine(lineIndex) {
    const c = LINE_COORDS[lineIndex];
    if (!c) return;
    el.winSeg.setAttribute("x1", c.x1);
    el.winSeg.setAttribute("y1", c.y1);
    el.winSeg.setAttribute("x2", c.x2);
    el.winSeg.setAttribute("y2", c.y2);
    el.winLine.classList.add("is-shown");
  }

  function hideWinLine() {
    el.winLine.classList.remove("is-shown");
  }

  /* ------------------------------------------------------------ Game logic */
  function winnerInfo(board) {
    for (let i = 0; i < LINES.length; i++) {
      const [a, b, c] = LINES[i];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line: i, cells: LINES[i] };
      }
    }
    if (board.every(Boolean)) return { winner: "draw", line: -1, cells: [] };
    return null;
  }

  function emptyCells(board) {
    const out = [];
    for (let i = 0; i < 9; i++) if (!board[i]) out.push(i);
    return out;
  }

  function place(i, mark) {
    state.board[i] = mark;
    renderCell(i);
  }

  function finishRound(info) {
    state.over = true;
    state.busy = false;
    updateTurnIndicator();

    if (info.winner === "draw") {
      state.scores.draw++;
      renderScores();
      setStatus(state.mode === 1
        ? DRAW_LINES[Math.floor(Math.random() * DRAW_LINES.length)]
        : "It's a draw. A strange game.");
      return;
    }

    // Highlight the winning line.
    info.cells.forEach((idx) => el.board.children[idx].classList.add("is-win"));
    showWinLine(info.line);

    state.scores[info.winner]++;
    renderScores();

    if (state.mode === 1) {
      if (info.winner === HUMAN) {
        setStatus("You win! Remarkable — you beat the machine.");
      } else {
        setStatus("W.O.P.R. wins. A strange game… care to try again?");
      }
    } else {
      setStatus(playerName(info.winner) + " wins!");
    }
  }

  function nextTurn() {
    const info = winnerInfo(state.board);
    if (info) {
      finishRound(info);
      return;
    }

    state.current = state.current === "X" ? "O" : "X";
    updateTurnIndicator();

    if (state.mode === 1 && state.current === AI) {
      computerMove();
    } else {
      setStatus(promptFor(state.current));
    }
  }

  function promptFor(mark) {
    if (state.mode === 1) {
      return mark === HUMAN ? "Your move." : "W.O.P.R. is choosing…";
    }
    return playerName(mark) + " — your move (" + mark + ").";
  }

  /* --------------------------------------------------------------- Input */
  function onCellClick(event) {
    if (state.over || state.busy) return;
    const i = Number(event.currentTarget.dataset.index);
    if (state.board[i]) return;
    if (state.mode === 1 && state.current !== HUMAN) return; // not your turn

    place(i, state.current);
    nextTurn();
  }

  /* ------------------------------------------------------- Computer opponent */
  function computerMove() {
    state.busy = true;
    updateTurnIndicator();

    // A little chatter now and then.
    const banter = maybeWopr(0.28);
    setStatus(banter || "W.O.P.R. is thinking", { thinking: true });

    // "Thinking time" — a human-feeling pause, longer for tougher settings.
    const base = { easy: 450, medium: 650, hard: 800 }[state.difficulty];
    const delay = base + Math.random() * 550;

    window.setTimeout(() => {
      if (state.over) return; // round reset mid-think
      const move = chooseMove();
      place(move, AI);
      state.busy = false;
      nextTurn();
    }, delay);
  }

  function chooseMove() {
    const board = state.board;
    const avail = emptyCells(board);

    if (state.difficulty === "easy") {
      return randomOf(avail);
    }

    if (state.difficulty === "medium") {
      // Win if possible, block if needed, otherwise a decent-but-fallible move.
      return findWinning(board, AI)
        ?? findWinning(board, HUMAN)
        ?? preferCenterCornerRandom(board);
    }

    // hard — perfect play via minimax.
    return minimaxMove(board, AI);
  }

  function randomOf(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function findWinning(board, mark) {
    for (const i of emptyCells(board)) {
      board[i] = mark;
      const win = winnerInfo(board);
      board[i] = null;
      if (win && win.winner === mark) return i;
    }
    return null;
  }

  function preferCenterCornerRandom(board) {
    // Medium sometimes plays optimally-ish, sometimes wanders — beatable.
    if (Math.random() < 0.65) {
      if (!board[4]) return 4;
      const corners = [0, 2, 6, 8].filter((i) => !board[i]);
      if (corners.length) return randomOf(corners);
    }
    return randomOf(emptyCells(board));
  }

  // Minimax with depth preference so the AI wins fast and stalls losses.
  function minimaxMove(board, mark) {
    let bestScore = -Infinity;
    let bestMove = null;
    for (const i of emptyCells(board)) {
      board[i] = mark;
      const score = minimax(board, false, 0, mark);
      board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
    return bestMove;
  }

  function minimax(board, maximizing, depth, aiMark) {
    const humanMark = aiMark === "X" ? "O" : "X";
    const info = winnerInfo(board);
    if (info) {
      if (info.winner === aiMark) return 10 - depth;
      if (info.winner === humanMark) return depth - 10;
      return 0; // draw
    }

    if (maximizing) {
      let best = -Infinity;
      for (const i of emptyCells(board)) {
        board[i] = aiMark;
        best = Math.max(best, minimax(board, false, depth + 1, aiMark));
        board[i] = null;
      }
      return best;
    }
    let best = Infinity;
    for (const i of emptyCells(board)) {
      board[i] = humanMark;
      best = Math.min(best, minimax(board, true, depth + 1, aiMark));
      board[i] = null;
    }
    return best;
  }

  /* ------------------------------------------------------------ Round reset */
  function newRound() {
    state.board = Array(9).fill(null);
    state.current = "X";
    state.over = false;
    state.busy = false;
    hideWinLine();
    renderBoard();
    updateLabels();
    updateTurnIndicator();

    if (state.mode === 1) {
      // Human (X) always starts; greet occasionally.
      const greet = maybeWopr(0.35);
      setStatus(greet || "Your move. You are X.");
    } else {
      setStatus("Player X — your move.");
    }
  }

  function resetScores() {
    state.scores = { X: 0, O: 0, draw: 0 };
    renderScores();
  }

  /* ----------------------------------------------------------- Option UI */
  function selectSegment(container, activeBtn) {
    container.querySelectorAll(".seg").forEach((b) => {
      const on = b === activeBtn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-checked", on ? "true" : "false");
    });
  }

  function onModeChange(btn) {
    state.mode = Number(btn.dataset.mode);
    el.difficultyGroup.hidden = state.mode !== 1;
    newRound();
  }

  function onDifficultyChange(btn) {
    state.difficulty = btn.dataset.difficulty;
    el.difficultyHint.textContent = DIFFICULTY_HINTS[state.difficulty];
    newRound();
  }

  function wireOptions() {
    document.querySelectorAll("[data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectSegment(btn.closest(".segmented"), btn);
        onModeChange(btn);
      });
    });
    document.querySelectorAll("[data-difficulty]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectSegment(btn.closest(".segmented"), btn);
        onDifficultyChange(btn);
      });
    });
    el.newRound.addEventListener("click", newRound);
    el.resetScores.addEventListener("click", resetScores);
  }

  /* --------------------------------------------------------------- Boot */
  function init() {
    cacheDom();
    buildBoard();
    wireOptions();
    el.difficultyHint.textContent = DIFFICULTY_HINTS[state.difficulty];
    renderScores();
    newRound();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
