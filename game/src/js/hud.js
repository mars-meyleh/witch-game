// HUD: draws heart and star icons outside the canvas using SpriteAPI
(function () {
  const ICON_SCALE = 2; // each icon will be 32x32
  const ICON_SIZE = 16 * ICON_SCALE;

  function makeIconCanvas() {
    const c = document.createElement('canvas');
    c.width = ICON_SIZE; c.height = ICON_SIZE;
    c.style.width = (ICON_SIZE) + 'px';
    c.style.height = (ICON_SIZE) + 'px';
    c.className = 'hud-icon';
    return c;
  }

  function renderSpriteToCanvas(sprite, canvas, filled = true) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = filled ? 1 : 0.28;
    const api = new SpriteAPI(ctx, ICON_SCALE);
    api.draw(sprite, 0, 0, false);
    ctx.restore();
  }

  class HUD {
    constructor(opts = {}) {
      this.hpPerIcon = opts.hpPerIcon || 50; // health points represented by one heart
      this.manaPerIcon = opts.manaPerIcon || 25; // mana per star
      this.container = document.getElementById('hud');
      this.healthRow = document.getElementById('hud-health');
      this.manaRow = document.getElementById('hud-mana');
      this.heartSprite = window.HeartSprite || null;
      this.starSprite = window.StarSprite || null;
    }

    setHP(cur, max) {
      this._updateRow(this.healthRow, this.heartSprite, cur, max, this.hpPerIcon);
    }

    setMana(cur, max) {
      this._updateRow(this.manaRow, this.starSprite, cur, max, this.manaPerIcon);
    }

    _updateRow(rowEl, sprite, cur, max, perIcon) {
      if (!rowEl) return;
      const needed = Math.max(1, Math.ceil(max / perIcon));
      // ensure children count
      while (rowEl.children.length < needed) { rowEl.appendChild(makeIconCanvas()); }
      while (rowEl.children.length > needed) { rowEl.removeChild(rowEl.lastChild); }

      const full = Math.floor(cur / perIcon);
      // because damage is always rounded to perIcon (50), partial icons not required
      for (let i = 0; i < needed; i++) {
        const c = rowEl.children[i];
        if (sprite) { renderSpriteToCanvas(sprite, c, i < full); }
        else {
          const ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height);
          ctx.fillStyle = i < full ? '#ff8080' : 'rgba(255,255,255,0.2)';
          ctx.fillRect(0, 0, c.width, c.height);
        }
      }
    }
  }

  window.HUD = HUD;
})();
