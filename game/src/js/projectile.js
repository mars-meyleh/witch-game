// Projectile class - simple orthogonal projectile moving left/right on tile grid
class Projectile {
  constructor(x, y, dir = 'right', sprite = null, speedMs = 160, damage = 50) {
    this.x = x;
    this.y = y;
    this.dir = dir === 'left' ? 'left' : 'right';
    this.sprite = sprite || null;
    this.speedMs = speedMs;
    this.damage = damage;
    this._lastMove = 0;
    this.alive = true;
  }

  update(now = Date.now(), map) {
    if (!this.alive) return;
    if (now - this._lastMove < this.speedMs) return;
    this._lastMove = now;
    const dx = this.dir === 'left' ? -1 : 1;
    const nx = this.x + dx, ny = this.y;
    // bounds check
    if (!map || ny < 0 || ny >= map.length || nx < 0 || nx >= map[0].length) { this.alive = false; return; }
    // stop at wall
    if (map[ny][nx] === 1) { this.alive = false; return; }
    this.x = nx; this.y = ny;
  }

  draw(spriteAPI, tileSize) {
    if (!this.alive) return;
    if (spriteAPI && this.sprite) {
      const flip = (this.dir === 'left');
      spriteAPI.draw(this.sprite, this.x * tileSize, this.y * tileSize, flip);
    }
  }
}

window.Projectile = Projectile;
