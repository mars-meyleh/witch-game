const TILE = 16;
const WIDTH = 20, HEIGHT = 15; // 320x240
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = WIDTH * TILE; canvas.height = HEIGHT * TILE;

Input.init();
const map = generateMap(WIDTH, HEIGHT, 0.18);
const spriteAPI = new SpriteAPI(ctx, 1);
const player = new Player(2, 2, WitchSprite);

// start loop immediately; sprite data is embedded (WitchSprite, GrassTile, StoneTile)
let sprites = { witch: WitchSprite, grass: GrassTile, stone: StoneTile };

let lastMove = 0;
function update() {
  const now = Date.now();
  // simple input rate limit so holding key doesn't spam movement too fast
  if (now - lastMove > 120) {
    if (Input.isDown('arrowleft') || Input.isDown('a')) { player.move(-1, 0, map); lastMove = now; }
    else if (Input.isDown('arrowright') || Input.isDown('d')) { player.move(1, 0, map); lastMove = now; }
    else if (Input.isDown('arrowup') || Input.isDown('w')) { player.move(0, -1, map); lastMove = now; }
    else if (Input.isDown('arrowdown') || Input.isDown('s')) { player.move(0, 1, map); lastMove = now; }
  }
}

function draw() {
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const tx = x * TILE, ty = y * TILE;
      if (map[y][x] === 1) {
        if (window.wallSprite) spriteAPI.draw(window.wallSprite, tx, ty, false);
        else { ctx.fillStyle = '#DAB6D8'; ctx.fillRect(tx, ty, TILE, TILE); }
      } else {
        if (window.floorSprite) spriteAPI.draw(window.floorSprite, tx, ty, false);
        else { ctx.fillStyle = '#F6E7F2'; ctx.fillRect(tx, ty, TILE, TILE); }
      }
    }
  }
  // draw player using SpriteAPI; scale is 1 (sprite pixels = canvas pixels), tile size is TILE
  player.draw(ctx, player.x * TILE, player.y * TILE, TILE, spriteAPI);
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

// start the game loop after initialization
loop();
