// Inventory + Equipment panel UI
(function () {
  const ICON_SCALE = 3; // bigger canvases for equipment/inventory slots
  function makeSlotCanvas() {
    const c = document.createElement('canvas');
    c.width = 16 * ICON_SCALE; c.height = 16 * ICON_SCALE;
    c.style.width = (16 * ICON_SCALE) + 'px';
    c.style.height = (16 * ICON_SCALE) + 'px';
    c.className = 'inv-slot-canvas';
    return c;
  }

  class InventoryPanel {
    constructor() {
      this.container = document.createElement('div');
      this.container.id = 'inventory-panel';
      this.container.className = 'inventory-panel hidden';

      // Create tab buttons
      this.tabButtonsContainer = document.createElement('div');
      this.tabButtonsContainer.className = 'inv-tab-buttons';
      
      this.tabs = {};
      const tabNames = ['Equipment & Inventory', 'Attributes', 'Grimoire'];
      tabNames.forEach((tabName, idx) => {
        const btn = document.createElement('button');
        btn.className = 'inv-tab-button' + (idx === 0 ? ' active' : '');
        btn.textContent = tabName;
        const tabKey = tabName === 'Equipment & Inventory' ? 'equipment' : tabName.toLowerCase();
        btn.dataset.tab = tabKey;
        btn.addEventListener('click', () => this.switchTab(tabKey));
        this.tabButtonsContainer.appendChild(btn);
        this.tabs[tabKey] = { button: btn };
      });
      this.container.appendChild(this.tabButtonsContainer);

      // Create tab content areas
      this.contentContainer = document.createElement('div');
      this.contentContainer.className = 'inv-content-area';
      this.container.appendChild(this.contentContainer);

      // Equipment & Inventory tab content
      const equipmentTab = document.createElement('div');
      equipmentTab.className = 'inv-tab-content active';
      equipmentTab.dataset.tab = 'equipment';
      this.tabs['equipment'].content = equipmentTab;

      const equipTitle = document.createElement('h3'); equipTitle.textContent = 'Equipment';
      equipmentTab.appendChild(equipTitle);

      this.equipmentArea = document.createElement('div');
      this.equipmentArea.className = 'inv-equipment';

      // equipment slots: Hat, Clothes A, Clothes B, Boot, Corset, Weapon
      this.equipSlots = [];
      const equipNames = ['Hat', 'Clothes A', 'Clothes B', 'Boot', 'Corset', 'Weapon'];
      for (let i = 0; i < equipNames.length; i++) {
        const wrap = document.createElement('div'); wrap.className = 'inv-slot-panel';
        const cvs = makeSlotCanvas(); wrap.appendChild(cvs);
        const label = document.createElement('div'); label.style.fontSize = '10px'; label.style.marginTop = '4px'; label.style.textAlign = 'center';
        label.textContent = equipNames[i];
        const v = document.createElement('div'); v.style.display = 'flex'; v.style.flexDirection = 'column'; v.style.alignItems = 'center';
        v.appendChild(wrap); v.appendChild(label);
        this.equipmentArea.appendChild(v);
        this.equipSlots.push({ wrap, cvs, sprite: null, spriteName: null, disabled: false, labelEl: label });
      }
      equipmentTab.appendChild(this.equipmentArea);

      // Add Inventory title and grid to same tab
      const invTitle = document.createElement('h3'); invTitle.textContent = 'Inventory';
      equipmentTab.appendChild(invTitle);

      this.invArea = document.createElement('div');
      this.invArea.className = 'inv-grid';
      this.invSlots = [];
      // 24 slots (4x6)
      for (let i = 0; i < 24; i++) {
        const wrap = document.createElement('div'); wrap.className = 'inv-slot-panel';
        const cvs = makeSlotCanvas(); wrap.appendChild(cvs);
        this.invArea.appendChild(wrap);
        this.invSlots.push({ wrap, cvs, sprite: null, spriteName: null, qty: 0 });
      }
      equipmentTab.appendChild(this.invArea);
      this.contentContainer.appendChild(equipmentTab);

      // Attributes tab content
      const attributesTab = document.createElement('div');
      attributesTab.className = 'inv-tab-content';
      attributesTab.dataset.tab = 'attributes';
      this.tabs['attributes'].content = attributesTab;

      const attrTitle = document.createElement('h3'); attrTitle.textContent = 'Attributes';
      attributesTab.appendChild(attrTitle);

      this.attributesArea = document.createElement('div');
      this.attributesArea.className = 'inv-attributes';
      
      // Create attribute rows: each row has a label and a value
      const attributeNames = [
        { key: 'attack', label: 'Attack' },
        { key: 'defense', label: 'Defense' },
        { key: 'maxHealth', label: 'Max Health' },
        { key: 'maxMana', label: 'Max Mana' },
        { key: 'attackSpeed', label: 'Attack Speed' },
        { key: 'thorn', label: 'Thorn' },
        { key: 'poisonDamage', label: 'Poison Damage' },
        { key: 'fireDamage', label: 'Fire Damage' },
        { key: 'coldDamage', label: 'Cold Damage' },
        { key: 'bleeding', label: 'Bleeding' },
        { key: 'burning', label: 'Burning' },
        { key: 'freezing', label: 'Freezing' }
      ];

      this.attributeElements = {};
      for (let attr of attributeNames) {
        const row = document.createElement('div');
        row.className = 'attr-row';
        
        const label = document.createElement('span');
        label.className = 'attr-label';
        label.textContent = attr.label;
        
        const value = document.createElement('span');
        value.className = 'attr-value';
        value.textContent = '0';
        
        row.appendChild(label);
        row.appendChild(value);
        this.attributesArea.appendChild(row);
        
        this.attributeElements[attr.key] = value;
      }
      
      attributesTab.appendChild(this.attributesArea);
      this.contentContainer.appendChild(attributesTab);

      // Grimoire tab content (knowledge log from runs)
      const grimoireTab = document.createElement('div');
      grimoireTab.className = 'inv-tab-content';
      grimoireTab.dataset.tab = 'grimoire';
      this.tabs['grimoire'].content = grimoireTab;

      const grimTitle = document.createElement('h3'); grimTitle.textContent = 'Grimoire';
      grimoireTab.appendChild(grimTitle);

      this.grimoireArea = document.createElement('div');
      this.grimoireArea.className = 'inv-grimoire';
      
      const grimContent = document.createElement('div');
      grimContent.className = 'grimoire-content';
      grimContent.textContent = 'Knowledge and discoveries will be recorded here...';
      this.grimoireArea.appendChild(grimContent);

      grimoireTab.appendChild(this.grimoireArea);
      this.contentContainer.appendChild(grimoireTab);

      const footer = document.createElement('div'); footer.className = 'inv-panel-footer'; footer.textContent = 'Press C to close';
      this.container.appendChild(footer);

      document.body.appendChild(this.container);

      // drag state
      this._drag = null; // { type: 'inv'|'equip', index, spriteName, qty, sprite }

      // attach handlers to slots (equip and inv)
      const attachSlotHandlers = (slot, type, idx) => {
        slot.wrap.addEventListener('mousedown', (ev) => {
          ev.preventDefault();
          this._startDrag(type, idx, ev.clientX, ev.clientY);
        });
        // touch support
        slot.wrap.addEventListener('touchstart', (ev) => {
          const t = ev.touches[0];
          ev.preventDefault();
          this._startDrag(type, idx, t.clientX, t.clientY);
        }, { passive: false });
      };
      this.equipSlots.forEach((s, i) => { attachSlotHandlers(s, 'equip', i); s.wrap.dataset.slotType = 'equip'; s.wrap.dataset.slotIndex = i; });
      this.invSlots.forEach((s, i) => { attachSlotHandlers(s, 'inv', i); s.wrap.dataset.slotType = 'inv'; s.wrap.dataset.slotIndex = i; });

      // global mouse/touch move and up handlers for dragging
      window.addEventListener('mousemove', (e) => { if (this._drag) this._onDragMove(e.clientX, e.clientY); });
      window.addEventListener('mouseup', (e) => { if (this._drag) this._endDrag(e.clientX, e.clientY); });
      window.addEventListener('touchmove', (e) => { if (this._drag) { const t = e.touches[0]; this._onDragMove(t.clientX, t.clientY); } }, { passive: false });
      window.addEventListener('touchend', (e) => { if (this._drag) { this._endDrag(); } });

      // key toggle
      document.addEventListener('keydown', (e) => {
        if (e.key && e.key.toLowerCase() === 'c') {
          this.toggle();
        }
      });
    }

    open() { this.container.classList.remove('hidden'); }
    close() { this.container.classList.add('hidden'); }
    toggle() { this.container.classList.toggle('hidden'); }

    // Switch between tabs
    switchTab(tabName) {
      // Hide all tabs and deactivate all buttons
      Object.keys(this.tabs).forEach(key => {
        if (this.tabs[key].content) this.tabs[key].content.classList.remove('active');
        if (this.tabs[key].button) this.tabs[key].button.classList.remove('active');
      });
      
      // Show selected tab and activate button
      if (this.tabs[tabName]) {
        if (this.tabs[tabName].content) this.tabs[tabName].content.classList.add('active');
        if (this.tabs[tabName].button) this.tabs[tabName].button.classList.add('active');
      }
    }

    // update displayed attributes from playerAttributes
    updateAttributes(attrs) {
      if (!attrs) return;
      if (this.attributeElements['attack']) this.attributeElements['attack'].textContent = String(attrs.attack || 0);
      if (this.attributeElements['defense']) this.attributeElements['defense'].textContent = String(attrs.defense || 0);
      if (this.attributeElements['maxHealth']) this.attributeElements['maxHealth'].textContent = String(attrs.maxHealth || 0);
      if (this.attributeElements['maxMana']) this.attributeElements['maxMana'].textContent = String(attrs.maxMana || 0);
      if (this.attributeElements['attackSpeed']) this.attributeElements['attackSpeed'].textContent = String(attrs.attackSpeed || 0);
      if (this.attributeElements['thorn']) this.attributeElements['thorn'].textContent = String(attrs.thorn || 0);
      if (this.attributeElements['poisonDamage']) this.attributeElements['poisonDamage'].textContent = String(attrs.poisonDamage || 0);
      if (this.attributeElements['fireDamage']) this.attributeElements['fireDamage'].textContent = String(attrs.fireDamage || 0);
      if (this.attributeElements['coldDamage']) this.attributeElements['coldDamage'].textContent = String(attrs.coldDamage || 0);
      if (this.attributeElements['bleeding']) this.attributeElements['bleeding'].textContent = String(attrs.bleeding || 0);
      if (this.attributeElements['burning']) this.attributeElements['burning'].textContent = String(attrs.burning || 0);
      if (this.attributeElements['freezing']) this.attributeElements['freezing'].textContent = String(attrs.freezing || 0);
    }

    // render sprites into slots
    render() {
      const renderSlot = (slot) => {
        const ctx = slot.cvs.getContext('2d'); ctx.clearRect(0, 0, slot.cvs.width, slot.cvs.height);
        if (slot.sprite && slot.sprite instanceof Image) {
          ctx.drawImage(slot.sprite, 0, 0, slot.cvs.width, slot.cvs.height);
        } else {
          // empty visual
          ctx.fillStyle = 'rgba(0,0,0,0.03)'; ctx.fillRect(0, 0, slot.cvs.width, slot.cvs.height);
        }
        if (slot.disabled) {
          ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(0, 0, slot.cvs.width, slot.cvs.height);
          ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(4, 4); ctx.lineTo(slot.cvs.width - 4, slot.cvs.height - 4); ctx.moveTo(slot.cvs.width - 4, 4); ctx.lineTo(4, slot.cvs.height - 4); ctx.stroke();
        }
        // draw quantity for stackable items
        if (slot.qty && slot.qty > 1) {
          const fontSize = Math.max(10, ICON_SCALE * 4);
          ctx.font = fontSize + 'px sans-serif';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          const text = String(slot.qty);
          ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.strokeText(text, slot.cvs.width - 4, slot.cvs.height - 4);
          ctx.fillStyle = 'white'; ctx.fillText(text, slot.cvs.width - 4, slot.cvs.height - 4);
        }
      };
      for (let s of this.equipSlots) renderSlot(s);
      for (let s of this.invSlots) renderSlot(s);
    }

    // add an item into the first empty inventory slot by sprite variable name
    addItemByName(spriteName) {
      if (!spriteName) return false;
      // stack into existing consumable if possible
      if (this._isConsumable(spriteName)) {
        for (let s of this.invSlots) {
          if (s.spriteName === spriteName) {
            s.qty = (s.qty || 1) + 1;
            if (!s.sprite) s.sprite = window[spriteName] || null;
            this.render(); this.save(); this._emitInventorySync();
            return true;
          }
        }
      }
      // ensure sprite reference when stacking
      if (this._isConsumable(spriteName)) {
        for (let s of this.invSlots) {
          if (s.spriteName === spriteName && !s.sprite) { s.sprite = window[spriteName] || null; }
        }
      }
      // find first empty slot
      for (let s of this.invSlots) {
        if (!s.sprite) {
          s.spriteName = spriteName;
          s.sprite = window[spriteName] || null;
          s.qty = this._isConsumable(spriteName) ? 1 : 0;
          this.render();
          this.save();
          this._emitInventorySync();
          return true;
        }
      }
      return false;
    }

    // helper to detect dresses by name
    _isDress(name) {
      return (typeof name === 'string') && /dress/i.test(name);
    }

    // consumable detection (potion/health/mana)
    _isConsumable(name) {
      return (typeof name === 'string') && /(potion|health|mana)/i.test(name);
    }

    // equip by slot index using sprite variable name
    equipSlot(index, spriteName) {
      if (index < 0 || index >= this.equipSlots.length) return false;
      // Clothes B (index 2) is disabled if Clothes A (index 1) contains a Dress
      const s = this.equipSlots[index];

      // If trying to equip Clothes B while Clothes A is a dress, prevent it
      if (index === 2) {
        const a = this.equipSlots[1];
        if (a && this._isDress(a.spriteName)) {
          console.warn('Cannot equip Clothes B while Clothes A is a Dress.');
          return false;
        }
      }

      s.spriteName = spriteName || null;
      s.sprite = spriteName ? (window[spriteName] || null) : null;
      // special handling when equipping Clothes A
      if (index === 1) {
        const b = this.equipSlots[2];
        if (this._isDress(s.spriteName)) {
          // disable and clear Clothes B
          if (b) { b.spriteName = null; b.sprite = null; b.disabled = true; }
        } else {
          if (b) { b.disabled = false; }
        }
      }

      this.render();
      this.save();
      this._emitInventorySync();
      // --- Attribute and HUD update logic ---
      const GameState = window.GameState || {};
      const playerAttributes = GameState.playerAttributes || window.playerAttributes;
      if (playerAttributes) {
        // Reset to base values
        const base = { attk: 5, deff: 5, maxHp: 75, maxMp: 75, attkSpeed: 0, thorn: 0, poisonDmg: 0, fireDmg: 0, coldDmg: 0, bleeding: 0, burning: 0, freezing: 0 };
        Object.assign(playerAttributes, base);
        // Apply bonuses from equipped items
        for (let s of this.equipSlots) {
          if (!s.spriteName) continue;
          if (/hat/i.test(s.spriteName)) playerAttributes.maxMp += 25; // +1 star
          if (/dress/i.test(s.spriteName)) playerAttributes.maxHp += 50; // +1 heart
          if (/corset/i.test(s.spriteName)) {
            playerAttributes.deff += 5;
            playerAttributes.thorn += 5;
          }
        }
        // Update HUD (hearts/stars)
        if (window.hud) {
          const playerHP = (GameState.playerHP !== undefined) ? GameState.playerHP : window.playerHP;
          const playerMana = (GameState.playerMana !== undefined) ? GameState.playerMana : window.playerMana;
          window.hud.setHP(playerHP, playerAttributes.maxHp);
          window.hud.setMana(playerMana, playerAttributes.maxMp);
        }
        // Update attribute panel
        if (window.inventoryPanel && typeof window.inventoryPanel.updateAttributes === 'function') {
          window.inventoryPanel.updateAttributes(playerAttributes);
        }
      }
      return true;
    }

    // Drag & drop helpers
    _startDrag(type, index, x, y) {
      const src = (type === 'equip') ? this.equipSlots[index] : this.invSlots[index];
      if (!src || !src.spriteName) return;
      // don't start drag on disabled slot
      if (src.disabled) return;
      this._drag = {
        type, index,
        spriteName: src.spriteName,
        qty: src.qty || 1,
        sprite: src.sprite
      };
      // create ghost canvas
      const g = document.createElement('canvas'); g.width = src.cvs.width; g.height = src.cvs.height; g.className = 'inv-drag-ghost';
      g.style.position = 'fixed'; g.style.pointerEvents = 'none'; g.style.zIndex = 9999; g.style.width = src.cvs.style.width; g.style.height = src.cvs.style.height;
      document.body.appendChild(g);
      this._drag.ghost = g; this._drag.ghostCtx = g.getContext('2d');
      if (this._drag && this._drag.ghostCtx && this._drag.sprite && this._drag.sprite instanceof Image) {
        this._drag.ghostCtx.clearRect(0, 0, this._drag.ghost.width, this._drag.ghost.height);
        this._drag.ghostCtx.drawImage(this._drag.sprite, 0, 0, this._drag.ghost.width, this._drag.ghost.height);
      }
      this._onDragMove(x, y);
    }

    _onDragMove(x, y) {
      if (!this._drag) return;
      const g = this._drag.ghost;
      g.style.left = (x - g.width / 2) + 'px'; g.style.top = (y - g.height / 2) + 'px';
    }

    _endDrag(x, y) {
      if (!this._drag) return;
      const ghost = this._drag.ghost; if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
      // find drop target
      let targetEl = null;
      if (typeof x === 'number' && typeof y === 'number') targetEl = document.elementFromPoint(x, y);
      // fallback: if no coords provided, cancel
      if (!targetEl) { this._drag = null; return; }
      // find slot element ancestor
      let el = targetEl;
      while (el && el !== document.body && !el.classList.contains('inv-slot-panel')) el = el.parentNode;
      if (!el || el === document.body) { this._drag = null; return; }
      // determine target slot
      const isEquip = el && el.dataset && el.dataset.slotType === 'equip';
      const idx = el ? Number(el.dataset.slotIndex) : NaN;
      if (isNaN(idx)) { this._drag = null; return; }
      this._performDrop(this._drag, isEquip ? 'equip' : 'inv', idx);
      this._drag = null;
      this.render(); this.save();
    }

    _performDrop(drag, destType, destIndex) {
      const srcType = drag.type; const srcIndex = drag.index;
      const srcSlot = (srcType === 'equip') ? this.equipSlots[srcIndex] : this.invSlots[srcIndex];
      const destSlot = (destType === 'equip') ? this.equipSlots[destIndex] : this.invSlots[destIndex];
      if (!srcSlot || !destSlot) return;
      // if destination is disabled, do nothing
      if (destSlot.disabled) return;
      // stacking: if dest is inv and both consumable and same name
      if (destType === 'inv' && this._isConsumable(drag.spriteName) && destSlot.spriteName === drag.spriteName) {
        destSlot.qty = (destSlot.qty || 1) + (drag.qty || 1);
        // clear or decrement source
        if (srcType === 'inv') { srcSlot.spriteName = null; srcSlot.sprite = null; srcSlot.qty = 0; }
        else { srcSlot.spriteName = null; srcSlot.sprite = null; srcSlot.qty = 0; }
        return;
      }
      // If destination empty: move
      if (!destSlot.spriteName) {
        destSlot.spriteName = drag.spriteName; destSlot.sprite = drag.sprite; destSlot.qty = drag.qty || (this._isConsumable(drag.spriteName) ? 1 : 0);
        // clear source
        srcSlot.spriteName = null; srcSlot.sprite = null; srcSlot.qty = 0;
        return;
      }
      // otherwise swap
      const tmpName = destSlot.spriteName; const tmpSprite = destSlot.sprite; const tmpQty = destSlot.qty || 0;
      destSlot.spriteName = drag.spriteName; destSlot.sprite = drag.sprite; destSlot.qty = drag.qty || (this._isConsumable(drag.spriteName) ? 1 : 0);
      srcSlot.spriteName = tmpName; srcSlot.sprite = tmpSprite; srcSlot.qty = tmpQty;
      // special: if swapping into Clothes B but Clothes A is a dress, disallow and revert
      if (destType === 'equip' && destIndex === 2 && this._isDress(this.equipSlots[1] && this.equipSlots[1].spriteName)) {
        // revert swap
        destSlot.spriteName = tmpName; destSlot.sprite = tmpSprite; destSlot.qty = tmpQty;
        srcSlot.spriteName = drag.spriteName; srcSlot.sprite = drag.sprite; srcSlot.qty = drag.qty || 0;
        console.warn('Cannot place into Clothes B while Clothes A is a Dress.');
      }
      // recompute Clothes B disabled state derived from Clothes A
      if (this._isDress(this.equipSlots[1] && this.equipSlots[1].spriteName)) {
        if (this.equipSlots[2]) { this.equipSlots[2].spriteName = null; this.equipSlots[2].sprite = null; this.equipSlots[2].qty = 0; this.equipSlots[2].disabled = true; }
      } else {
        if (this.equipSlots[2]) { this.equipSlots[2].disabled = false; }
      }
      this._emitInventorySync();
      // --- Attribute and HUD update logic (for drag-and-drop) ---
      const GameState2 = window.GameState || {};
      const playerAttributes2 = GameState2.playerAttributes || window.playerAttributes;
      if (playerAttributes2) {
        const base = { attk: 5, deff: 5, maxHp: 75, maxMp: 75, attkSpeed: 0, thorn: 0, poisonDmg: 0, fireDmg: 0, coldDmg: 0, bleeding: 0, burning: 0, freezing: 0 };
        Object.assign(playerAttributes2, base);
        for (let s of this.equipSlots) {
          if (!s.spriteName) continue;
          if (/hat/i.test(s.spriteName)) playerAttributes2.maxMp += 25;
          if (/dress/i.test(s.spriteName)) playerAttributes2.maxHp += 50;
          if (/corset/i.test(s.spriteName)) {
            playerAttributes2.deff += 5;
            playerAttributes2.thorn += 5;
          }
        }
        if (window.hud) {
          const playerHP = (GameState2.playerHP !== undefined) ? GameState2.playerHP : window.playerHP;
          const playerMana = (GameState2.playerMana !== undefined) ? GameState2.playerMana : window.playerMana;
          window.hud.setHP(playerHP, playerAttributes2.maxHp);
          window.hud.setMana(playerMana, playerAttributes2.maxMp);
        }
        if (window.inventoryPanel && typeof window.inventoryPanel.updateAttributes === 'function') {
          window.inventoryPanel.updateAttributes(playerAttributes2);
        }
      }
    }

    // consume a consumable from inventory panel by spriteName, returns true if consumed
    consumeItemByName(spriteName, count = 1) {
      if (!spriteName || count <= 0) return false;
      for (let s of this.invSlots) {
        if (s.spriteName === spriteName && (s.qty || 0) > 0) {
          s.qty = (s.qty || 1) - count;
          if (s.qty <= 0) { s.spriteName = null; s.sprite = null; s.qty = 0; }
          this.render(); this.save(); this._emitInventorySync();
          return true;
        }
      }
      return false;
    }

    // compute consumable counts in inventory and notify host (if handler exists)
    _emitInventorySync() {
      const counts = { healthPotion: 0, manaPotion: 0, keys: 0 };
      for (let s of this.invSlots) {
        if (!s || !s.spriteName) continue;
        const n = s.spriteName;
        const qty = s.qty || 1;
        if (/health/i.test(n) || /HealthPotion/i.test(n)) counts.healthPotion += qty;
        else if (/mana/i.test(n) || /ManaPotion/i.test(n)) counts.manaPotion += qty;
        else if (/key/i.test(n) || /KeySprite/i.test(n)) counts.keys += qty;
      }
      // if a global handler exists, call it
      if (typeof window._onInventoryPanelChanged === 'function') {
        try { window._onInventoryPanelChanged(counts); } catch (e) { console.warn('inventory sync handler error', e); }
      } else if (window.hud && typeof window.hud.setInventory === 'function') {
        // fallback: update hud directly
        try { window.hud.setInventory(counts); } catch (e) { /* ignore */ }
      }
    }

    // persistence
    save() {
      try {
        const data = {
          equip: this.equipSlots.map(s => s.spriteName || null),
          inv: this.invSlots.map(s => s.spriteName ? { name: s.spriteName, qty: s.qty || 1 } : null)
        };
        localStorage.setItem('game.inventoryPanel', JSON.stringify(data));
      } catch (e) { console.warn('inventory save failed', e); }
    }

    load() {
      try {
        const raw = localStorage.getItem('game.inventoryPanel');
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (data.equip && Array.isArray(data.equip)) {
          for (let i = 0; i < this.equipSlots.length; i++) {
            const name = data.equip[i] || null;
            this.equipSlots[i].spriteName = name;
            this.equipSlots[i].sprite = name ? (window[name] || null) : null;
            this.equipSlots[i].disabled = false;
          }
          // derived disabled state: if Clothes A is a Dress, disable Clothes B
          if (this._isDress(this.equipSlots[1] && this.equipSlots[1].spriteName)) {
            if (this.equipSlots[2]) { this.equipSlots[2].spriteName = null; this.equipSlots[2].sprite = null; this.equipSlots[2].disabled = true; }
          }
        }
        if (data.inv && Array.isArray(data.inv)) {
          for (let i = 0; i < this.invSlots.length; i++) {
            const entry = data.inv[i] || null;
            if (!entry) { this.invSlots[i].spriteName = null; this.invSlots[i].sprite = null; this.invSlots[i].qty = 0; continue; }
            if (typeof entry === 'string') {
              this.invSlots[i].spriteName = entry;
              this.invSlots[i].sprite = window[entry] || null;
              this.invSlots[i].qty = 1;
            } else if (entry && typeof entry === 'object') {
              const name = entry.name || null; const qty = Number(entry.qty) || 1;
              this.invSlots[i].spriteName = name;
              this.invSlots[i].sprite = name ? (window[name] || null) : null;
              this.invSlots[i].qty = qty;
            } else {
              this.invSlots[i].spriteName = null; this.invSlots[i].sprite = null; this.invSlots[i].qty = 0;
            }
          }
        }
        this.render();
        this._emitInventorySync();
        return true;
      } catch (e) { console.warn('inventory load failed', e); return false; }
    }
  }

  window.InventoryPanel = InventoryPanel;
  // auto-create instance
  window.inventoryPanel = new InventoryPanel();
  // initial render
  window.inventoryPanel.load();
  window.inventoryPanel.render();
})();
