# reflectRacer

reflectRacer is a minimalist arcade-style game built with [crisp-game-lib](../..). The player moves continuously and you rotate the direction by tapping to dodge obstacles.

## Gameplay

- Tap or click to rotate the player 90° clockwise.
- Leaving the screen or hitting an obstacle ends the run.
- Obstacles spawn at the top and fall downward, increasing the challenge.
- Background music plays and replays are enabled by default (seed 10).
- Current game version: 1.0.6.

## Local development

This folder contains the game logic (`main.js`) and a small editor configuration (`jsconfig.json`). To play or modify the game locally, start the dev server from the project root:

```bash
npm install
npm run watch_games
```

The `watch_games` script serves the contents of the `docs` directory and reloads on changes.
