class Player {
  constructor(x,y,sprite=null){ this.x = x; this.y = y; this.sprite = sprite; }
  move(dx,dy,map){
    const nx = this.x + dx, ny = this.y + dy;
    if(nx<0 || ny<0 || ny>=map.length || nx>=map[0].length) return;
    if(map[ny][nx] === 1) return; // wall
    this.x = nx; this.y = ny;
  }
  draw(ctx, tx, ty, tileSize){
    if(this.sprite){ ctx.drawImage(this.sprite, tx, ty, tileSize, tileSize); }
    else { ctx.fillStyle = '#FFB3C6'; ctx.fillRect(tx, ty, tileSize, tileSize); }
  }
}