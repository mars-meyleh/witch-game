class Player {
  constructor(x, y, sprite = null) {
    this.x = x;
    this.y = y;
    this.sprite = sprite;
    this.facing = 'right';
  }

  move(dx, dy, map) {
    if (dx < 0) this.facing = 'left';
    else if (dx > 0) this.facing = 'right';

    const nx = this.x + dx, ny = this.y + dy;
    if (nx < 0 || ny < 0 || ny >= map.length || nx >= map[0].length) return;
    if (map[ny][nx] === 1) return; // wall
    this.x = nx; this.y = ny;
  }

  setSprite(sprite) { this.sprite = sprite; }

  draw(ctx, tx, ty, tileSize, spriteAPI) {
    if (spriteAPI && this.sprite) {
      const flip = (this.facing === 'left');
      spriteAPI.draw(this.sprite, tx, ty, flip);
    } else {
      ctx.fillStyle = '#FFB3C6';
      ctx.fillRect(tx, ty, tileSize, tileSize);
    }
  }
}