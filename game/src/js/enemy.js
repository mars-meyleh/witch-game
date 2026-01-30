// Enemy class - simple static enemy for now
class Enemy {
  // patrolPoints: optional array of {x,y} positions
  constructor(x, y, sprite = null, hp = 50, damage = 50, patrolPoints = null) {
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
    this.hp -= amount;
    if (this.hp <= 0) {
      this.alive = false;
    }
  }
}

window.Enemy = Enemy;

// Simple EnemyManager placed here so all enemy control lives in this file.

class EnemyManager {
  constructor() {
    this.enemies = [];
    this.map = null;
    this.tileSize = 16;
    this._inited = false;
    this._loop = this._loop.bind(this);
    // try to initialize (will poll for game globals)
    this.init();
    if (window.GameState) window.GameState.enemyManager = this;
  }

  init() {
    if (this._inited) return;
    const gs = window.GameState;
    if (!((gs && gs.map) || window.gameMap) || !((gs && gs.ctx) || window.ctx)) {
      setTimeout(() => this.init(), 200);
      return;
    }
    this.map = (gs && gs.map) ? gs.map : window.gameMap;
    this.tileSize = (gs && gs.TILE) ? gs.TILE : (window.TILE || 16);
    this._inited = true;
    requestAnimationFrame(this._loop);
  }

  spawn(id, x, y, opts = {}) {
    const sprite = (window.SpriteMap && window.SpriteMap[id]) ? window.SpriteMap[id] : (window[id] || null);
    const e = new Enemy(x, y, sprite, opts.hp || 50, opts.damage || 50, opts.patrolPoints || null);
    e.id = id;
    this.enemies.push(e);
    return e;
  }

  findAt(x, y) {
    return this.enemies.find(e => e && e.alive && e.x === x && e.y === y) || null;
  }

  update(now = Date.now(), map = null) {
    if (!this._inited) return;
    const m = map || this.map;
    for (let en of this.enemies) {
      if (!en || !en.alive) continue;
      en.update(now, m);
    }

    // handle projectile collisions (projectiles are created by Player and exposed as window.projectiles)
    const projectiles = (window.GameState && window.GameState.projectiles) ? window.GameState.projectiles : window.projectiles;
    if (projectiles && projectiles.length) {
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        if (!p || !p.alive) continue;
        const hit = this.findAt(p.x, p.y);
        if (hit) {
          hit.takeDamage(p.damage || 0);
          p.alive = false;
          projectiles.splice(i, 1);
          if (!hit.alive) this._onDeath(hit);
        }
      }
    }
  }

  draw(ctx = null, tileSize = null) {
    const c = ctx || window.ctx;
    const ts = tileSize || this.tileSize;
    for (let en of this.enemies) {
      if (!en) continue;
      en.draw(c, ts);
    }
  }

  _loop() {
    const now = Date.now();
    this.update(now, this.map);
    this.draw(window.ctx, this.tileSize);
    requestAnimationFrame(this._loop);
  }

  _onDeath(en) {
    const items = (window.GameState && window.GameState.items) ? window.GameState.items : (window.items || []);
    // Drop mushroom or lunar fruit (placeholder: heart/star PNG)
    const isMushroom = Math.random() < 0.5;
    const type = isMushroom ? 'mushroom' : 'lunarfruit';
    const spriteName = isMushroom ? 'heartSprite' : 'starSprite';
    items.push({ x: en.x, y: en.y, type, spriteName, sprite: window[spriteName] || null });
  }
}

window.enemyManager = new EnemyManager();
