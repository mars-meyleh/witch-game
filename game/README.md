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
2. The project supports three integration styles — choose which fits your generator:

   - File assets (PNG): place files in `src/assets/sprites/` and call:

      ```js
      SpriteLoader.load(['src/assets/sprites/player.png']).then(({images}) => {
         // images['src/assets/sprites/player.png'] is an Image or null
      });
      ```

   - Data-driven sprites (recommended): your generator produces sprite objects that match the project's format (palette name + 16x16 index map). Example shape:

      ```js
      const sprite = {
         id: 'witch.mushroom',
         size: 16,
         palette: 'witch',
         pixels: [ /* 16 arrays of 16 indices */ ]
      };
      SpriteLoader.load([sprite]).then(({sprites}) => {
         // sprites['witch.mushroom'] is registered and can be used by SpriteAPI
      });
      ```

   - Palette registration: you can register palettes directly (useful if your generator returns palettes):

      ```js
      SpriteLoader.load([{ type: 'palette', id: 'witch', map: { 0: null, 1: '#fff', ... } }])
         .then(({palettes}) => { /* palettes.witch available */ });
      ```

   - Convenience: call `SpriteLoader.loadEmbedded()` to pick up palettes and sprites defined in `src/js/sprites.js`.

Example: wiring a sprite-generator function

If your generator exports a function that returns an object or array, adapt like this:

```js
// hypothetical generator API: generateAll() -> { palettes: {...}, sprites: [...] }
const generated = mySpriteGenerator.generateAll();

// prepare items for SpriteLoader (mix of palette entries and sprite objects)
const items = [];
if(generated.palettes){
   Object.keys(generated.palettes).forEach(k => items.push({ type: 'palette', id: k, map: generated.palettes[k] }));
}
if(generated.sprites && Array.isArray(generated.sprites)){
   generated.sprites.forEach(s => items.push(s));
}

SpriteLoader.load(items).then(({palettes, sprites, images}) => {
   // now SpriteAPI can draw registered sprites
   const spriteAPI = new SpriteAPI(ctx, 1);
   spriteAPI.draw(sprites['witch.mushroom'], 100, 100, false);
});
```

Run
- Open `index.html` in a browser. No server required for basic testing (for some browsers serving from file:// may restrict image loading; use a simple local server if needed).

Quick local server (optional):

```bash
python -m http.server 8000
```

Next steps I can do for you
- Wire your sprite-generation method into `spriteLoader.js` if you provide the API.
- Add level persistence, procedural rooms, enemies, and items.
