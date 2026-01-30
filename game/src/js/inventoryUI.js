// Inventory UI Module: Handles drag-and-drop, inventory state, and rendering
(function () {
  const GameState = window.GameState || {};
  class InventoryUI {
    constructor(panel) {
      this.panel = panel || window.inventoryPanel;
      this.manager = GameState.inventoryManager;
      // Attach drag-and-drop handlers if not already present
      // ...existing code...
    }

    // Proxy drag-and-drop methods to panel
    startDrag(type, index, x, y) {
      if (this.panel && typeof this.panel._startDrag === 'function') {
        this.panel._startDrag(type, index, x, y);
      }
    }
    onDragMove(x, y) {
      if (this.panel && typeof this.panel._onDragMove === 'function') {
        this.panel._onDragMove(x, y);
      }
    }
    endDrag(x, y) {
      if (this.panel && typeof this.panel._endDrag === 'function') {
        this.panel._endDrag(x, y);
      }
    }

    // Render inventory and equipment slots
    render() {
      if (this.panel && typeof this.panel.render === 'function') {
        this.panel.render();
      }
    }

    // Update attributes panel
    updateAttributes(attrs) {
      if (this.panel && typeof this.panel.updateAttributes === 'function') {
        this.panel.updateAttributes(attrs);
      }
    }

    // Open/close/toggle panel
    open() { if (this.panel) this.panel.open(); }
    close() { if (this.panel) this.panel.close(); }
    toggle() { if (this.panel) this.panel.toggle(); }
  }

  window.InventoryUI = InventoryUI;
  GameState.inventoryUI = new InventoryUI(window.inventoryPanel);
})();
