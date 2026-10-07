# Zoinbase Simulator 3D

Satirical social-engineering desk game. **Call dialogue renders on the 3D monitor screen.**

## Play

```bash
python3 -m http.server 8080
```

Open http://localhost:8080 — click the phone, watch the monitor.

## Deploy (Vercel)

Import this repo → Framework: Other → Deploy.

## Structure

- `js/monitor.js` — canvas texture painted onto the monitor (chat UI)
- `js/scene.js` — Three.js desk + phone raycast
- `js/game.js` — infinite shift, heat, dialogue
- `js/tools.js` — case / SMS / wallet / AnyDesk / mixer

## Disclaimer

Satire. The real thing ruins lives. Don't.
