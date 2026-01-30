
# Pastel Roguelike (Retro 16-bit, browser)

## Overview
- Small roguelike skeleton using HTML/CSS/JS
- Pixel-perfect (canvas scaled for retro look)
- Pastel, girly arcade aesthetic

## Files
- `index.html` — entry page
- `src/css/style.css` — pastel theme + pixelated canvas
- `src/js/*` — game modules (`game.js`, `player.js`, `rooms.js`, `input.js`, `spriteLoader.js`, etc.)
- `src/assets/sprites/` — place your PNG sprite files here

## Sprite Integration (PNG Only)
1. Place your PNG sprite files into `src/assets/sprites/` and its subfolders (e.g. `witch/`, `enemies/`, `selection/`).
2. Sprites are loaded at startup using the `SpriteLoader.load()` function in `game.js`:

   ```js
   await SpriteLoader.load({
     WitchSprite: 'src/assets/sprites/witch/witch.png',
     GolemSprite: 'src/assets/sprites/enemies/golem1.png',
     heartSprite: 'src/assets/sprites/selection/heart.png',
     starSprite: 'src/assets/sprites/selection/star.png',
     healthPotionSprite: 'src/assets/sprites/selection/potion-health.png',
     manaPotionSprite: 'src/assets/sprites/selection/potion-mana.png',
     wallSprite: 'src/assets/sprites/selection/wall.png',
     floorSprite: 'src/assets/sprites/selection/floor.png'
   });
   // Each key becomes a global (e.g. window.WitchSprite)
   ```

3. All sprite drawing uses native Canvas API:

   ```js
   ctx.drawImage(window.WitchSprite, x, y, TILE, TILE);
   ```

4. If a sprite fails to load, the game will fall back to drawing a colored rectangle.

## Troubleshooting
- If sprites do not appear, check the browser console for errors about missing files or failed image loads.
- Make sure all sprite paths in `SpriteLoader.load()` match the actual file locations.
- No support for SpriteAPI, palettes, or data-driven sprite objects—only PNG files are supported.

## Running the Game
- Open `index.html` in a browser. For some browsers, serving from `file://` may restrict image loading; use a simple local server if needed.

### Quick local server (optional):

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000/](http://localhost:8000/) in your browser.

## Next steps
- Add new PNG sprites to `src/assets/sprites/` and update the loader in `game.js` as needed.
- Expand gameplay: add more enemies, items, and features.
