# Tic-Tac-Toe — *Shall we play a game?*

An elegant, framework-free game of **Tic-Tac-Toe** (a.k.a. **noughts and
crosses**) for one or two players. Built as static HTML, CSS, and JavaScript
and hosted on **Cloudflare Pages** — no build step, no dependencies.

> "A strange game. The only winning move is not to play." — WOPR, *WarGames* (1983)

## Features

- 🎮 **One-player** mode against the computer, and **two-player** local play.
- 🧠 **Three difficulty levels** for the computer opponent:
  - **Playful** — random moves; a gentle warm-up.
  - **Wary** — takes wins and blocks threats, but is beatable.
  - **W.O.P.R.** — perfect play via the minimax algorithm (unbeatable — the best you can do is draw).
- ⏳ **"Thinking time"** — in one-player mode the computer pauses briefly before
  moving, so it feels like a real opponent rather than an instant reply.
- 🎬 **WarGames easter eggs** — the machine occasionally gets chatty.
- 🌗 **Light & dark themes** that follow the system preference.
- ♿ Accessible: keyboard-focusable cells, ARIA roles/labels, live status region,
  and reduced-motion support.
- 📱 Fully responsive; the board scales to any screen.
- 📊 Score tracking across rounds (wins for each side, plus draws).

## Project structure

```
.
├── index.html            # The game
├── about/
│   └── index.html        # About page (rules, modes, WarGames note)
├── assets/
│   ├── css/styles.css     # Design tokens, layout, board, animations
│   ├── js/main.js         # Game engine (state, AI/minimax, rendering)
│   └── favicon.svg        # Grid icon (theme-aware)
├── docs/
│   └── IMPLEMENTATION_PLAN.md
├── README.md
└── .gitignore
```

## Running locally

No build tooling is required — it's plain static files. Because the pages use
root-absolute paths (e.g. `/assets/...`) and a `/about/` route, serve the folder
over HTTP rather than opening `index.html` from the filesystem:

```bash
# Python 3 (built in on most systems)
python3 -m http.server 8080

# …or any static server, e.g. Node's http-server
npx http-server -p 8080
```

Then open <http://localhost:8080>.

## Deploying to Cloudflare Pages

This repo is ready to deploy as-is:

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages** and
   connect this Git repository.
2. **Build settings:**
   - **Framework preset:** *None*
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/` (the repository root)
3. Deploy. Every push to the production branch publishes automatically.

You can also deploy from the command line with
[Wrangler](https://developers.cloudflare.com/pages/):

```bash
npx wrangler pages deploy . --project-name tic-tac-toe
```

## How to play

Take turns marking squares on the 3×3 grid — X (crosses) versus O (noughts).
Get three of your marks in a row (horizontally, vertically, or diagonally) to
win. Fill the board with no line and it's a draw. See the
[About page](about/index.html) for full details.

## Credits & license

A tribute to the 1983 film *WarGames*. Built with vanilla web technologies.

Released under the [MIT License](LICENSE).
