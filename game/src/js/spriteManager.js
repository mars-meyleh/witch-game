// Unified Sprite Manager
// Handles loading, access, and error handling for all game sprites
(function () {
  const GameState = window.GameState || {};

  class SpriteManager {
    constructor() {
      this.sprites = {};
    }

    async load(spriteMap) {
      const results = {};
      const promises = Object.entries(spriteMap).map(async ([varName, path]) => {
        try {
          const response = await fetch(path);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const blob = await response.blob();
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Image load failed'));
            img.src = URL.createObjectURL(blob);
          });
          results[varName] = img;
          this.sprites[varName] = img;
        } catch (e) {
          console.warn(`Failed to load sprite ${varName} (${path}):`, e);
          results[varName] = null;
          this.sprites[varName] = null;
        }
      });
      await Promise.all(promises);
      return results;
    }

    get(name) {
      return this.sprites[name] || null;
    }
  }

  window.SpriteManager = SpriteManager;
  GameState.spriteManager = new SpriteManager();
})();
