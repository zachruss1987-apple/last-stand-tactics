# Credits & Licenses — Last Stand: Tactics

All bundled assets are either original to this project or permissively licensed. Every
third-party asset must be listed here with its source and license before use.

## Engine / libraries
- **Phaser** 3.80.1 — © Phaser Studio Inc. — **MIT License**. Vendored locally at
  `src/vendor/phaser.min.js` (https://phaser.io). No modifications.

## Art
- **Pixel tiles & unit sprites** — *original*, authored procedurally in code
  (`src/js/game/art.js`). Own work, no third-party assets. (CC0-equivalent / project-owned.)
- **Level skyline backdrop** (`assets/graphics/skyline.svg`) — *original*, own work.

## Audio
- **All SFX & ambience** — *original*, generated at runtime via the Web Audio API
  (`src/js/engine/audio.js`). No third-party audio.

## Notes
As of M3 the pixel art is **code-authored** rather than sourced from CC0 packs — see
Open Question **Q7** in `docs/decisions.md`. If/when third-party CC0 or AI-generated
assets are added, list each here (name, author, source URL, license: CC0 / CC-BY + link),
and keep CC-BY attributions visible in-game or in this file as the license requires.
