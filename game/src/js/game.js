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
    if (Input.isDown('ArrowLeft')) { player.move(-1, 0, map); lastMove = now; }
    else if (Input.isDown('ArrowRight')) { player.move(1, 0, map); lastMove = now; }
    else if (Input.isDown('ArrowUp')) { player.move(0, -1, map); lastMove = now; }
    else if (Input.isDown('ArrowDown')) { player.move(0, 1, map); lastMove = now; }
  }
}

function draw() {
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (map[y][x] === 1) { ctx.fillStyle = '#DAB6D8'; }
      else { ctx.fillStyle = '#F6E7F2'; }
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }
  // draw player using SpriteAPI; scale is 1 (sprite pixels = canvas pixels), tile size is TILE
  player.draw(ctx, player.x * TILE, player.y * TILE, TILE, spriteAPI);
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

// start the game loop after initialization
loop();
