Pastel Roguelike (Retro 16-bit, browser)

Overview
- Small roguelike skeleton using HTML/CSS/JS
- Pixel-perfect (canvas scaled for retro look)
- Pastel, girly arcade aesthetic

Files
- `index.html` — entry page
- `src/css/style.css` — pastel theme + pixelated canvas
- `src/js/*` — game modules (`game.js`, `player.js`, `rooms.js`, `input.js`, `spriteLoader.js`)
- `src/assets/sprites/` — put your generated sprites here

Sprite integration
1. Place generated sprite PNGs into `src/assets/sprites/`.
2. In `src/js/game.js` update the `SpriteLoader.load([...])` call with the paths to your images, e.g.
   `SpriteLoader.load(['src/assets/sprites/player.png']).then(...)`
3. Alternatively, replace `src/js/spriteLoader.js` with a small adapter that calls your sprite-generation function and returns a promise resolving to a map of keys -> `Image` objects.

Run
- Open `index.html` in a browser. No server required for basic testing (for some browsers serving from file:// may restrict image loading; use a simple local server if needed).

Next steps I can do for you
- Wire your sprite-generation method into `spriteLoader.js` if you provide the API.
- Add level persistence, procedural rooms, enemies, and items.
