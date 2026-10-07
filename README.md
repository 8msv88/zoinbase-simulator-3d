# Zoinbase Simulator 3D

Satirical **social-engineering desk** game. Night shift, infinite runs, 3D office, real playbook flavor.

## Play

Open `index.html` via a local static server (ES modules need `http://`, not `file://`):

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then visit the URL it prints.

**Deployed:** GitHub Pages / Vercel — just point at this folder.

## Structure

```
index.html          shell + HUD markup
css/main.css        UI, bubbles, immersion overlays
js/
  main.js           boot
  scene.js          Three.js desk + phone raycast
  audio.js          procedural SFX
  state.js          shared state + helpers
  ui.js             HUD, log, speech bubbles, choices
  tools.js          case / SMS / wallet / AnyDesk / mixer
  game.js           calls, heat, streaks, infinite shift
```

## Features

- **Infinite shift** — heat crises force cool-downs, not game over
- **Conversation popup** — speech bubbles over the desk
- **Toolkit** — case IDs, SMS spoof, recovery wallet, AnyDesk sim, mixer
- **Streaks & ranks** — session progression
- **3D desk** — orbit, zoom, click the glowing burner phone

## Disclaimer

Satire. The real thing ruins lives. Don't.
