# Zoinbase Simulator 3D

Satirical social-engineering desk game. Infinite night shift, 3D office, toolkit, conversation bubbles.

## Deploy on Vercel

1. Import **https://github.com/8msv88/zoinbase-simulator-3d** in the Vercel dashboard
2. Framework: **Other** (static)
3. Root directory: `.` (repo root)
4. Deploy

Or CLI:

```bash
npx vercel --prod
```

## Local

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

ES modules need `http://` (not `file://`).

## Structure

```
index.html
css/main.css
js/
  main.js     boot
  scene.js    Three.js desk + phone
  audio.js    SFX
  state.js    shared state
  ui.js       HUD + bubbles
  tools.js    case / SMS / wallet / AnyDesk / mixer
  game.js     calls, heat, infinite shift
vercel.json
```

## Disclaimer

Satire. The real thing ruins lives. Don't.
