// Enemy class - simple static enemy for now
class Enemy {
  // patrolPoints: optional array of {x,y} positions
  constructor(x, y, sprite = null, health = 50, damage = 50, patrolPoints = null) {
    this.x = x;
    this.y = y;
    this.sprite = sprite || null;
    this.health = health;
    this.damage = damage;
    this._lastHit = 0; // ms timestamp for touch cooldown
    this.hitCooldown = 500; // prevent repeated instant damage

    this.patrol = Array.isArray(patrolPoints) && patrolPoints.length ? patrolPoints : null;
    this._patrolIndex = 0;
    this.moveCooldown = 420; // ms between patrol steps
    this._lastMove = 0;
    this.alive = true;
  }

  draw(ctx, tileSize) {
    if (!this.sprite || !ctx || !this.alive) return;
    const px = this.x * tileSize;
    const py = this.y * tileSize;
    if (this.sprite instanceof Image) ctx.drawImage(this.sprite, px, py, tileSize, tileSize);
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

  takeDamage(amount = 1) {
    if (!this.alive) return;
    this.health -= amount;
    if (this.health <= 0) {
      this.alive = false;
    }
  }
}

window.Enemy = Enemy;

// Simple EnemyManager placed here so all enemy control lives in this file.

class EnemyManager {
  constructor(gameState) {
    this.gameState = gameState || window.GameState;
    this.enemies = [];
    this.map = null;
    this.tileSize = 16;
    this._inited = false;
    this._loop = this._loop.bind(this);
    this.init();
    if (this.gameState) this.gameState.enemyManager = this;
  }

  init() {
    if (this._inited) return;
    const gs = this.gameState;
    if (!(gs && gs.map) || !(gs && gs.ctx)) {
      setTimeout(() => this.init(), 200);
      return;
    }
    this.map = gs.map;
    this.tileSize = gs.TILE;
    this._inited = true;
    requestAnimationFrame(this._loop);
  }

  spawn(id, x, y, opts = {}) {
    const spriteManager = this.gameState.spriteManager;
    const sprite = (spriteManager && spriteManager.get(id)) ? spriteManager.get(id) : null;
    const e = new Enemy(x, y, sprite, opts.health || 50, opts.damage || 50, opts.patrolPoints || null);
    e.id = id;
    this.enemies.push(e);
    return e;
  }

  findAt(x, y) {
    return this.enemies.find(enemy => enemy && enemy.alive && enemy.x === x && enemy.y === y) || null;
  }

  update(now = Date.now(), map = null) {
    if (!this._inited) return;
    const m = map || this.map;
    for (let enemy of this.enemies) {
      if (!enemy || !enemy.alive) continue;
      enemy.update(now, m);
    }

    // handle projectile collisions
    const projectiles = this.gameState.projectiles;
    if (projectiles && projectiles.length) {
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        if (!projectile || !projectile.alive) continue;
        const hit = this.findAt(projectile.x, projectile.y);
        if (hit) {
          hit.takeDamage(projectile.damage || 0);
          projectile.alive = false;
          projectiles.splice(i, 1);
          if (!hit.alive) this._onDeath(hit);
        }
      }
    }
  }

  draw(canvasContext = null, tileSize = null) {
    const ctx = canvasContext || (this.gameState && this.gameState.ctx);
    const ts = tileSize || this.tileSize;
    for (let enemy of this.enemies) {
      if (!enemy) continue;
      enemy.draw(ctx, ts);
    }
  }

  _loop() {
    const now = Date.now();
    this.update(now, this.map);
    this.draw(window.ctx, this.tileSize);
    requestAnimationFrame(this._loop);
  }

  _onDeath(enemy) {
    const items = this.gameState.items;
    const spriteManager = this.gameState.spriteManager;
    // Drop mushroom or lunar fruit (placeholder: heart/star PNG)
    const isMushroom = Math.random() < 0.5;
    const type = isMushroom ? 'mushroom' : 'lunarfruit';
    const spriteName = isMushroom ? 'heartSprite' : 'starSprite';
    items.push({ x: enemy.x, y: enemy.y, type, spriteName, sprite: spriteManager.get(spriteName) });
  }
}

if (window.GameState) window.GameState.enemyManager = new EnemyManager(window.GameState);
