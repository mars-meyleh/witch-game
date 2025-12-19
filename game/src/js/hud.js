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

  function makeInvSlot() {
    const wrap = document.createElement('div');
    wrap.className = 'inv-slot';
    const canvas = document.createElement('canvas');
    canvas.width = ICON_SIZE; canvas.height = ICON_SIZE; canvas.className = 'hud-icon';
    const badge = document.createElement('span'); badge.className = 'inv-count'; badge.textContent = '0';
    wrap.appendChild(canvas); wrap.appendChild(badge);
    return wrap;
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
      this.invRow = document.getElementById('hud-inventory');
      this.heartSprite = window.HeartSprite || null;
      this.starSprite = window.StarSprite || null;
      this.manaPotionSprite = window.ManaPotionSprite || window.ManaPotionSprite;
      this.healthPotionSprite = window.HealthPotionSprite || window.HealthPotionSprite;
      this.keySprite = window.KeySprite || null;

      // inventory state
      this.inventory = { healthPotion: 2, manaPotion: 2, keys: 0 };
      if (this.invRow) {
        // create three slots: health potion, mana potion, keys
        while (this.invRow.children.length < 3) this.invRow.appendChild(makeInvSlot());
        this._renderInventory();
      }
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

    // inventory methods
    setInventory(inv) {
      this.inventory = Object.assign(this.inventory || {}, inv);
      this._renderInventory();
    }

    _renderInventory() {
      if (!this.invRow) return;
      const slots = this.invRow.children;
      // health potion slot
      const hpSlot = slots[0];
      const hpCanvas = hpSlot.querySelector('canvas');
      const hpBadge = hpSlot.querySelector('.inv-count');
      if (this.healthPotionSprite) renderSpriteToCanvas(this.healthPotionSprite, hpCanvas, true);
      hpBadge.textContent = String(this.inventory.healthPotion || 0);

      // mana potion slot
      const mpSlot = slots[1];
      const mpCanvas = mpSlot.querySelector('canvas');
      const mpBadge = mpSlot.querySelector('.inv-count');
      if (this.manaPotionSprite) renderSpriteToCanvas(this.manaPotionSprite, mpCanvas, true);
      mpBadge.textContent = String(this.inventory.manaPotion || 0);

      // keys slot
      const kSlot = slots[2];
      const kCanvas = kSlot.querySelector('canvas');
      const kBadge = kSlot.querySelector('.inv-count');
      if (this.keySprite) renderSpriteToCanvas(this.keySprite, kCanvas, true);
      else {
        // draw simple placeholder box
        const ctx = kCanvas.getContext('2d'); ctx.clearRect(0, 0, kCanvas.width, kCanvas.height);
        ctx.fillStyle = '#CCCCCC'; ctx.fillRect(6, 6, ICON_SIZE - 12, ICON_SIZE - 12);
      }
      kBadge.textContent = String(this.inventory.keys || 0);
    }
  }

  window.HUD = HUD;
})();
