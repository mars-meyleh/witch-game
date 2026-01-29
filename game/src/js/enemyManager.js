// EnemyManager: centralize enemy spawn/update/draw and lifecycle
(function () {
  class EnemyManager {
    constructor() {
      this.enemies = [];
      this.onDeath = null; // callback(enemy)
    }

    spawn(typeId, x, y, opts = {}) {
      if (!window.Enemy) return null;
      // find a sprite object if present
      let spriteObj = null;
      // prefer explicit window.<Var> sprite names when available
      try {
        if (window.SpriteLoader && window.SpriteLoader.sprites && window.SpriteLoader.sprites[typeId]) spriteObj = window.SpriteLoader.sprites[typeId];
      } catch (e) {}
      if (!spriteObj && window && typeof window[typeId.replace('.', '') + 'Sprite'] !== 'undefined') spriteObj = window[typeId.replace('.', '') + 'Sprite'];
      if (!spriteObj) spriteObj = window[typeId] || { id: typeId, size: 16 };

      const hp = (typeof opts.hp === 'number') ? opts.hp : 50;
      const dmg = (typeof opts.damage === 'number') ? opts.damage : 50;
      const patrol = Array.isArray(opts.patrolPoints) ? opts.patrolPoints : (opts.patrol || null);

      const e = new window.Enemy(x, y, spriteObj, hp, dmg, patrol);
      // attach metadata
      e.typeId = typeId;
      e._wasAlive = !!e.alive;
      this.enemies.push(e);
      return e;
    }

    // utility: find first enemy by typeId
    findByType(typeId) {
      return this.enemies.find(en => en && en.typeId === typeId) || null;
    }

    // find enemy at tile
    findAt(x, y) {
      return this.enemies.find(en => en && en.x === x && en.y === y && en.alive);
    }

    update(now = Date.now(), map) {
      for (let i = 0; i < this.enemies.length; i++) {
        const en = this.enemies[i];
        if (!en) continue;
        // update movement/patrol
        if (typeof en.update === 'function') en.update(now, map);
        // check death transition
        if (en._wasAlive && !en.alive) {
          en._wasAlive = false;
          if (typeof this.onDeath === 'function') {
            try { this.onDeath(en); } catch (e) { console.error('EnemyManager.onDeath callback failed', e); }
          }
        }
      }
    }

    draw(spriteAPI, tileSize) {
      for (let en of this.enemies) {
        if (!en || !en.alive) continue;
        if (typeof en.draw === 'function') en.draw(spriteAPI, tileSize);
      }
    }

    // remove dead enemies from the list if desired
    cleanupDead() {
      this.enemies = this.enemies.filter(e => e && e.alive);
    }
  }

  window.EnemyManager = EnemyManager;
})();