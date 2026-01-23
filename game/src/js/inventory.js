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

      const title = document.createElement('h3'); title.textContent = 'Equipment';
      this.container.appendChild(title);

      this.equipmentArea = document.createElement('div');
      this.equipmentArea.className = 'inv-equipment';

      // example equipment slots: head, body, main, off
      this.equipSlots = [];
      const equipNames = ['Head', 'Body', 'Main', 'Off'];
      for (let i = 0; i < 4; i++) {
        const wrap = document.createElement('div'); wrap.className = 'inv-slot-panel';
        const cvs = makeSlotCanvas(); wrap.appendChild(cvs);
        const label = document.createElement('div'); label.style.fontSize = '10px'; label.style.marginTop = '4px'; label.style.textAlign = 'center';
        label.textContent = equipNames[i];
        const v = document.createElement('div'); v.style.display = 'flex'; v.style.flexDirection = 'column'; v.style.alignItems = 'center';
        v.appendChild(wrap); v.appendChild(label);
        this.equipmentArea.appendChild(v);
        this.equipSlots.push({ wrap, cvs, sprite: null });
      }
      this.container.appendChild(this.equipmentArea);

      const invTitle = document.createElement('h3'); invTitle.textContent = 'Inventory';
      this.container.appendChild(invTitle);

      this.invArea = document.createElement('div');
      this.invArea.className = 'inv-grid';
      this.invSlots = [];
      // 24 slots (4x6)
      for (let i = 0; i < 24; i++) {
        const wrap = document.createElement('div'); wrap.className = 'inv-slot-panel';
        const cvs = makeSlotCanvas(); wrap.appendChild(cvs);
        this.invArea.appendChild(wrap);
        this.invSlots.push({ wrap, cvs, sprite: null });
      }
      this.container.appendChild(this.invArea);

      const footer = document.createElement('div'); footer.className = 'inv-panel-footer'; footer.textContent = 'Press C to close';
      this.container.appendChild(footer);

      document.body.appendChild(this.container);

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

    // render sprites into slots
    render() {
      const renderSlot = (slot) => {
        const ctx = slot.cvs.getContext('2d'); ctx.clearRect(0, 0, slot.cvs.width, slot.cvs.height);
        if (slot.sprite && window.SpriteAPI) {
          const api = new window.SpriteAPI(ctx, ICON_SCALE);
          api.draw(slot.sprite, 0, 0, false);
        } else {
          // empty visual
          ctx.fillStyle = 'rgba(0,0,0,0.03)'; ctx.fillRect(0, 0, slot.cvs.width, slot.cvs.height);
        }
      };
      for (let s of this.equipSlots) renderSlot(s);
      for (let s of this.invSlots) renderSlot(s);
    }
  }

  window.InventoryPanel = InventoryPanel;
  // auto-create instance
  window.inventoryPanel = new InventoryPanel();
  // initial render
  window.inventoryPanel.render();
})();
