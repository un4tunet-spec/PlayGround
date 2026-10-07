# Hangar 7 — Jet Engine Teardown (3D, Desktop)

Strip a turbofan jet engine down to its core shaft in the right order, with the right tool.
Built with **Three.js + Vite**, playable in the browser and packaged as a **desktop app via Electron**.

## Play
- **Goal:** remove all 25 assemblies in manual order, front to back: Nose Cowl Lip → Fan Cowl Top/Bottom → Spinner Cone → Fan Blades → Fan Disc → Outlet Guide Vanes → Fan Case → LPC Booster → Accessory Gearbox → HPC Casing → HPC Rotor → EEC + Harness → Ignition Exciters → Combustor Case → Fuel Manifold → Burner Cans → HPT Vanes → HPT Rotor → LPT Vanes → LPT Rotor → Exhaust Case → Mixer → Plug → Nozzle.
- **How:** pick the tool shown (`1` wrench, `2` screwdriver, `3` puller), click every glowing bolt, then click the loose part to extract it to the workbench.
- **Rules:** wrong tool or wrong order = −points and airframe damage. `H` = hint (−100). Strip all 25 (168 fasteners) to win; time + condition bonuses apply.
- **Controls (desktop):** left-drag orbit · wheel zoom · right-drag pan · `F` refocus camera · `R` restart · `M` mute · `F1` help.
- **Difficulties:** Apprentice (guided), Mechanic (1.5× score), Master (2× score, no highlights). Best score persists in `localStorage`.

## Run (web / preview)
```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static output in dist/
```

## Run as desktop app
```bash
npm install
npm run build
npx electron electron/main.js
# or: ELECTRON_START_URL=http://localhost:3000 npx electron electron/main.js
```
Package installers with `npm run dist-desktop` (electron-packager → `release/`).

## Project layout
- `index.html` — HUD, manual, toolbelt, overlays
- `src/main.js` — scene, picking, scoring, game flow
- `src/engineModel.js` — procedural turbofan (no external assets)
- `src/gameState.js` — steps/score/difficulty/best records
- `src/audio.js` — procedural WebAudio SFX
- `electron/main.js` — desktop shell

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://omgithub.com).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://omgithub.com/un4tunet-spec/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/un4tunet-spec/PlayGround)

- 🎮 [Open the project](https://omgithub.com/un4tunet-spec/PlayGround).
- ✨ [Remix this project](https://omgithub.com/?remix=un4tunet-spec%2FPlayGround).
- 💻 [Explore the source](https://github.com/un4tunet-spec/PlayGround).
- 🛠️ [Check build runs](https://github.com/un4tunet-spec/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/un4tunet-spec/PlayGround/issues).
- 👤 [Explore the creator's projects](https://omgithub.com/un4tunet-spec).
- 🌍 [Create with OMGithub](https://omgithub.com).
<!-- omgithub:readme:end -->
