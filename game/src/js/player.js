class Player {
  constructor(x, y, sprite = null) {
    this.x = x;
    this.y = y;
    this.sprite = sprite;
    this.facing = 'right';
    this._lastMove = 0;
    this._invLast = 0;
    this._attackLast = 0;
    this._fireLast = 0;
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

  draw(ctx, tx, ty, tileSize) {
    if (this.sprite && this.sprite instanceof Image) {
      const flip = (this.facing === 'left');
      if (flip) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(this.sprite, -tx - tileSize, ty, tileSize, tileSize);
        ctx.restore();
      } else {
        ctx.drawImage(this.sprite, tx, ty, tileSize, tileSize);
      }
    } else {
      ctx.fillStyle = '#FFB3C6';
      ctx.fillRect(tx, ty, tileSize, tileSize);
    }
  }

  // attach input handlers (mouse) to the game canvas
  initInput(canvas) {
    if (!canvas) canvas = document.getElementById('game');
    if (!canvas) return;
    this._mouseHandler = (ev) => this.handleMouseDown(ev);
    canvas.addEventListener('mousedown', this._mouseHandler);
  }

  // remove attached handlers
  disposeInput(canvas) {
    if (!canvas) canvas = document.getElementById('game');
    if (!canvas || !this._mouseHandler) return;
    canvas.removeEventListener('mousedown', this._mouseHandler);
    this._mouseHandler = null;
  }

  handleMouseDown(ev) {
    // left button only
    if (!ev || ev.button !== 0) return;
    const now = Date.now();
    if (now - this._fireLast < 180) return;
    this._fireLast = now;
    const dir = this.facing || 'right';
    const dx = dir === 'left' ? -1 : 1;
    const sx = this.x + dx, sy = this.y;
    if (window.gameMap && window.gameMap[sy] && window.gameMap[sy][sx] === 0) {
      const sprite = window.wattkSprite || null;
      if (!window.projectiles) window.projectiles = [];
      const proj = new Projectile(sx, sy, dir, sprite, 140, 50);
      window.projectiles.push(proj);
    }
  }

  // per-frame update: handle movement keys, attack, and potions
  update(now = Date.now(), map) {
    // movement rate limit
    if (!this._lastMove) this._lastMove = 0;
    if (now - this._lastMove > 120) {
      if (Input.isDown('arrowleft') || Input.isDown('a')) { this.move(-1, 0, map); this._lastMove = now; }
      else if (Input.isDown('arrowright') || Input.isDown('d')) { this.move(1, 0, map); this._lastMove = now; }
      else if (Input.isDown('arrowup') || Input.isDown('w')) { this.move(0, -1, map); this._lastMove = now; }
      else if (Input.isDown('arrowdown') || Input.isDown('s')) { this.move(0, 1, map); this._lastMove = now; }
    }

    // potion/use keys and attack
    if (!this._invLast) this._invLast = 0;
    if (!this._attackLast) this._attackLast = 0;
    if (now - this._invLast > 180) {
      if (Input.isDown('q')) {
        // try to consume from inventory panel first
        if (window.inventoryPanel && window.inventoryPanel.consumeItemByName && window.inventoryPanel.consumeItemByName('HealthPotionSprite')) {
          const heal = (window.hud && window.hud.hpPerIcon) ? window.hud.hpPerIcon : 50;
          window.playerHP = Math.min(window.playerMaxHP || 150, window.playerHP + heal);
          this._invLast = now;
        } else if (window.inventory && window.inventory.healthPotion > 0) {
          window.inventory.healthPotion--;
          const heal = (window.hud && window.hud.hpPerIcon) ? window.hud.hpPerIcon : 50;
          window.playerHP = Math.min(window.playerMaxHP || 150, window.playerHP + heal);
          if (window.hud) window.hud.setInventory(window.inventory);
          this._invLast = now;
        }
      } else if (Input.isDown('e')) {
        if (window.inventoryPanel && window.inventoryPanel.consumeItemByName && window.inventoryPanel.consumeItemByName('ManaPotionSprite')) {
          const mana = (window.hud && window.hud.manaPerIcon) ? window.hud.manaPerIcon : 25;
          window.playerMana = Math.min(window.playerMaxMana || 100, window.playerMana + mana);
          this._invLast = now;
        } else if (window.inventory && window.inventory.manaPotion > 0) {
          window.inventory.manaPotion--;
          const mana = (window.hud && window.hud.manaPerIcon) ? window.hud.manaPerIcon : 25;
          window.playerMana = Math.min(window.playerMaxMana || 100, window.playerMana + mana);
          if (window.hud) window.hud.setInventory(window.inventory);
          this._invLast = now;
        }
      }
    }

    if (now - this._attackLast > 220) {
      if (Input.isDown('f')) {
        // find first adjacent alive enemy
        let attacked = false;
        if (window.enemyManager && window.enemyManager.enemies) {
          for (let en of window.enemyManager.enemies) {
            if (!en || !en.alive) continue;
            const manhattan = Math.abs(this.x - en.x) + Math.abs(this.y - en.y);
            if (manhattan === 1) { en.takeDamage(50); attacked = true; break; }
          }
        }
        if (attacked) this._attackLast = now;
      }
    }
  }
}

// Simple Projectile class embedded into player.js so player owns attack behaviour
class Projectile {
  constructor(x, y, dir = 'right', sprite = null, speedMs = 160, damage = 50) {
    this.x = x; this.y = y; this.dir = dir === 'left' ? 'left' : 'right';
    this.sprite = sprite || null; this.speedMs = speedMs; this.damage = damage;
    this._lastMove = 0; this.alive = true;
  }
  update(now = Date.now(), map) {
    if (!this.alive) return;
    if (now - this._lastMove < this.speedMs) return;
    this._lastMove = now;
    const dx = this.dir === 'left' ? -1 : 1;
    const nx = this.x + dx, ny = this.y;
    if (!map || ny < 0 || ny >= map.length || nx < 0 || nx >= map[0].length) { this.alive = false; return; }
    if (map[ny][nx] === 1) { this.alive = false; return; }
    this.x = nx; this.y = ny;
  }
  draw(ctx, tileSize) {
    if (!this.alive || !ctx) return;
    if (this.sprite && this.sprite instanceof Image) {
      const flip = (this.dir === 'left');
      const x = this.x * tileSize;
      const y = this.y * tileSize;
      if (flip) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(this.sprite, -x - tileSize, y, tileSize, tileSize);
        ctx.restore();
      } else {
        ctx.drawImage(this.sprite, x, y, tileSize, tileSize);
      }
    }
  }
}

// keep global compatibility in case other code expects window.Projectile
window.Projectile = Projectile;