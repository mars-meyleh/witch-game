// Enemy class - simple static enemy for now
class Enemy {
  // patrolPoints: optional array of {x,y} positions
  constructor(x, y, sprite, hp = 50, damage = 50, patrolPoints = null) {
    this.x = x;
    this.y = y;
    this.sprite = sprite || null;
    this.hp = hp;
    this.damage = damage;
    this._lastHit = 0; // ms timestamp for touch cooldown
    this.hitCooldown = 500; // prevent repeated instant damage

    this.patrol = Array.isArray(patrolPoints) && patrolPoints.length ? patrolPoints : null;
    this._patrolIndex = 0;
    this.moveCooldown = 420; // ms between patrol steps
    this._lastMove = 0;
    this.alive = true;
  }

  draw(spriteAPI, tileSize) {
    if (!this.sprite || !spriteAPI || !this.alive) return;
    const px = this.x * tileSize;
    const py = this.y * tileSize;
    // delegate drawing to SpriteAPI which will prefer PNGs if mapped
    spriteAPI.draw(this.sprite, px, py, false);
  }

  // update called from game loop to advance patrol
  update(now = Date.now(), map) {
    if (!this.alive) return;
    if (!this.patrol || this.patrol.length === 0) return;
    if (now - this._lastMove < this.moveCooldown) return;
    this._lastMove = now;
    const target = this.patrol[this._patrolIndex];
    const dx = Math.sign(target.x - this.x);
    const dy = Math.sign(target.y - this.y);
    // try horizontal move first, then vertical
    if (dx !== 0) {
      const nx = this.x + dx;
      if (map && map[this.y] && map[this.y][nx] === 0) { this.x = nx; }
    } else if (dy !== 0) {
      const ny = this.y + dy;
      if (map && map[ny] && map[ny][this.x] === 0) { this.y = ny; }
    }
    // reached target?
    if (this.x === target.x && this.y === target.y) {
      this._patrolIndex = (this._patrolIndex + 1) % this.patrol.length;
    }
  }

  // adjacency-based hitbox: orthogonal neighbors
  tryTouch(player, now = Date.now()) {
    if (!player || !this.alive) return false;
    const manhattan = Math.abs(player.x - this.x) + Math.abs(player.y - this.y);
    if (manhattan === 1) {
      if (now - this._lastHit >= this.hitCooldown) {
        this._lastHit = now;
        return true;
      }
    }
    return false;
  }

  takeDamage(amount = 1) {
    if (!this.alive) return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.alive = false;
    }
  }
}

window.Enemy = Enemy;
