const TILE = 16;
const WIDTH = 20, HEIGHT = 15; // 320x240
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = WIDTH * TILE; canvas.height = HEIGHT * TILE;

Input.init();
const map = generateMap(WIDTH, HEIGHT, 0.18);
const player = new Player(2,2,null);
let sprites = {};

// If you have sprite files, list them here as relative paths, e.g. ['src/assets/sprites/player.png']
SpriteLoader.load([]).then(loaded => { sprites = loaded; loop(); });

let lastMove = 0;
function update(){
  const now = Date.now();
  // simple input rate limit so holding key doesn't spam movement too fast
  if(now - lastMove > 120){
    if(Input.isDown('ArrowLeft')){ player.move(-1,0,map); lastMove = now; }
    else if(Input.isDown('ArrowRight')){ player.move(1,0,map); lastMove = now; }
    else if(Input.isDown('ArrowUp')){ player.move(0,-1,map); lastMove = now; }
    else if(Input.isDown('ArrowDown')){ player.move(0,1,map); lastMove = now; }
  }
}

function draw(){
  for(let y=0;y<HEIGHT;y++){
    for(let x=0;x<WIDTH;x++){
      if(map[y][x] === 1){ ctx.fillStyle = '#DAB6D8'; }
      else { ctx.fillStyle = '#F6E7F2'; }
      ctx.fillRect(x*TILE, y*TILE, TILE, TILE);
    }
  }
  player.draw(ctx, player.x * TILE, player.y * TILE, TILE);
}

function loop(){ update(); draw(); requestAnimationFrame(loop); }
