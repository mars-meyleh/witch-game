// SpriteMap: maps sprite ids (from pixel sprites) to PNG paths and options
// If a sprite has no PNGs available, we'll use the chest closed frame as placeholder.
(function () {
  const placeholder = 'src/assets/sprites/chest/chest-closed.png';

  const SpriteMap = {
    // UI
    'ui.heart': { paths: ['src/assets/sprites/selection/heart.png'] },
    'ui.star': { paths: ['src/assets/sprites/selection/star.png'] },
    'ui.health_potion': { paths: ['src/assets/sprites/selection/potion-health.png'] },
    'ui.mana_potion': { paths: ['src/assets/sprites/selection/potion-mana.png'] },

    // tiles
    'tile.wall': { paths: ['src/assets/sprites/selection/wall.png'] },
    'tile.floor': { paths: ['src/assets/sprites/selection/floor.png'] },

    // characters / enemies
    'witch.mushroom': { paths: ['src/assets/sprites/witch/witch.png'] },
    'golem.basic': { paths: ['src/assets/sprites/enemies/golem1.png', 'src/assets/sprites/enemies/golem2.png'], noFallback: true },

    // equipment (map to images if present)
    'equipment.hat': { paths: ['src/assets/sprites/equipment/equipment_hat.png'] },
    'equipment.dress': { paths: ['src/assets/sprites/equipment/equipment_dress.png'] },
    'equipment.corset': { paths: ['src/assets/sprites/equipment/equipment_corset.png'] }
  };

  // expose the map so it can be edited or inspected at runtime
  window.SpriteMap = SpriteMap;

  // helper to collect unique paths and load them using SpriteLoader
  function loadSpriteMap(map) {
    if (!window.SpriteLoader) return Promise.resolve();
    const allPaths = [];
    Object.keys(map).forEach(id => {
      const entry = map[id];
      if (entry && Array.isArray(entry.paths)) {
        for (let p of entry.paths) if (allPaths.indexOf(p) === -1) allPaths.push(p);
      }
    });
    // always ensure placeholder is available if not included
    if (allPaths.indexOf(placeholder) === -1) allPaths.push(placeholder);

    return SpriteLoader.load(allPaths).then(({images}) => {
      window._spriteImages = window._spriteImages || {};
      window._spriteImagesLoaded = window._spriteImagesLoaded || {};
      Object.keys(map).forEach(id => {
        const entry = map[id];
        if (!entry || !Array.isArray(entry.paths)) {
          window._spriteImages[id] = [images[placeholder] || null];
          window._spriteImagesLoaded[id] = !!images[placeholder];
          return;
        }
        const imgs = entry.paths.map(p => images[p] || null);
        // if any of the mapped images are missing, replace with placeholder image for that frame
        for (let i = 0; i < imgs.length; i++) if (!imgs[i]) imgs[i] = images[placeholder] || null;
        window._spriteImages[id] = imgs;
        window._spriteImagesLoaded[id] = imgs.every(i => !!i);
        if (window.debugLog) window.debugLog(`SpriteMap: ${id} -> ${imgs.map(i => i ? 'ok' : 'missing').join(',')}`, window._spriteImagesLoaded[id] ? 'info' : 'warn');
      });

      // also ensure that any embedded sprites without mapping get the placeholder
      try {
        const embedded = Object.keys(SpriteLoader.sprites || {});
        embedded.forEach(k => {
          if (!window._spriteImages[k]) {
            window._spriteImages[k] = [images[placeholder] || null];
            window._spriteImagesLoaded[k] = !!images[placeholder];
            if (window.debugLog) window.debugLog(`SpriteMap: ${k} -> placeholder`, 'info');
          }
        });
      } catch (e) { /* ignore */ }
    });
  }

  window.loadSpriteMap = loadSpriteMap;
  window.getSpriteImages = function (spriteId) { return (window._spriteImages && window._spriteImages[spriteId]) || null; };
})();