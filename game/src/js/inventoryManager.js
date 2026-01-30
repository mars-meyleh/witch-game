// Centralized Inventory and Attribute Manager
// Handles inventory state, equipment, consumables, and attribute calculations
(function () {
  const GameState = window.GameState || {};

  class InventoryManager {
    constructor() {
      this.inventory = GameState.inventory || {
        healthPotion: 2,
        manaPotion: 2,
        keys: 0,
        equipment: [],
        equipmentSlots: { hat: null, corset: null, dress: null }
      };
      this.playerAttributes = GameState.playerAttributes || {
        attk: 5, deff: 5, maxHp: 150, maxMp: 150, attkSpeed: 0, thorn: 0,
        poisonDmg: 0, fireDmg: 0, coldDmg: 0, bleeding: 0, burning: 0, freezing: 0
      };
      GameState.inventory = this.inventory;
      GameState.playerAttributes = this.playerAttributes;
    }

    // Add item to inventory
    addItem(spriteName, qty = 1) {
      if (!spriteName) return false;
      // Stack into existing slot if possible
      for (let s of (window.inventoryPanel?.invSlots || [])) {
        if (s.spriteName === spriteName) {
          s.qty = (s.qty || 1) + qty;
          if (!s.sprite) s.sprite = window[spriteName] || null;
          window.inventoryPanel.render();
          this.syncInventory();
          return true;
        }
      }
      // Find first empty slot
      for (let s of (window.inventoryPanel?.invSlots || [])) {
        if (!s.sprite) {
          s.spriteName = spriteName;
          s.sprite = window[spriteName] || null;
          s.qty = qty;
          window.inventoryPanel.render();
          this.syncInventory();
          return true;
        }
      }
      return false;
    }

    // Equip item by slot index
    equipItem(index, spriteName) {
      if (!window.inventoryPanel) return false;
      return window.inventoryPanel.equipSlot(index, spriteName);
    }

    // Consume item by spriteName
    consumeItem(spriteName, count = 1) {
      if (!window.inventoryPanel) return false;
      return window.inventoryPanel.consumeItemByName(spriteName, count);
    }

    // Update attributes based on equipment
    updateAttributes() {
      if (!window.inventoryPanel) return;
      window.inventoryPanel.updateAttributes(this.playerAttributes);
    }

    // Sync inventory counts to GameState and HUD
    syncInventory() {
      const counts = { healthPotion: 0, manaPotion: 0, keys: 0 };
      for (let s of (window.inventoryPanel?.invSlots || [])) {
        if (!s || !s.spriteName) continue;
        const n = s.spriteName;
        const qty = s.qty || 1;
        if (/health/i.test(n) || /HealthPotion/i.test(n)) counts.healthPotion += qty;
        else if (/mana/i.test(n) || /ManaPotion/i.test(n)) counts.manaPotion += qty;
        else if (/key/i.test(n) || /KeySprite/i.test(n)) counts.keys += qty;
      }
      this.inventory.healthPotion = counts.healthPotion;
      this.inventory.manaPotion = counts.manaPotion;
      this.inventory.keys = counts.keys;
      if (window.hud && typeof window.hud.setInventory === 'function') window.hud.setInventory(this.inventory);
    }
  }

  window.InventoryManager = InventoryManager;
  GameState.inventoryManager = new InventoryManager();
})();
