const SpriteLoader = {
  palettes: {},
  sprites: {},
  images: {},

  registerPalette(name, map) {
    this.palettes[name] = map;
  },

  registerSprite(sprite) {
    if (!sprite || !sprite.id) return;
    this.sprites[sprite.id] = sprite;
    // if palette exists on window, register it if not present
    if (sprite.palette && !this.palettes[sprite.palette] && window && window.Palette && window.Palette[sprite.palette]) {
      this.palettes[sprite.palette] = window.Palette[sprite.palette];
    }
  },

  registerImage(key, img) {
    this.images[key] = img;
  },

  // items: array of strings (paths), Image objects, sprite objects ({id,pixels,palette}),
  // or palette objects ({type:'palette', id: 'name', map: {...}})
  load(items) {
    const self = this;
    if (!items || items.length === 0) return Promise.resolve({ palettes: this.palettes, sprites: this.sprites, images: this.images });

    const toLoadImages = [];
    const resultsImages = {};

    items.forEach(it => {
      if (typeof it === 'string') {
        toLoadImages.push(it);
      } else if (it instanceof Image) {
        self.registerImage(it.src || (`image_${Object.keys(self.images).length}`), it);
      } else if (it && it.type === 'palette' && it.id && it.map) {
        self.registerPalette(it.id, it.map);
      } else if (it && it.id && it.pixels) {
        self.registerSprite(it);
      } else if (it && it.path && typeof it.path === 'string') {
        toLoadImages.push(it.path);
      }
    });

    if (toLoadImages.length === 0) return Promise.resolve({ palettes: this.palettes, sprites: this.sprites, images: this.images });

    return new Promise((resolve) => {
      let loaded = 0, total = toLoadImages.length;
      toLoadImages.forEach(p => {
        const img = new Image();
        img.onload = () => { self.registerImage(p, img); loaded++; if (loaded === total) resolve({ palettes: self.palettes, sprites: self.sprites, images: self.images }); };
        img.onerror = () => { self.registerImage(p, null); loaded++; if (loaded === total) resolve({ palettes: self.palettes, sprites: self.sprites, images: self.images }); };
        img.src = p;
      });
    });
  },

  // convenience: register all palettes and sprites defined on window (if any)
  loadEmbedded() {
    if (window && window.Palette) {
      Object.keys(window.Palette).forEach(k => this.registerPalette(k, window.Palette[k]));
    }
    ['WitchSprite', 'GrassTile', 'StoneTile'].forEach(name => {
      if (window && window[name]) this.registerSprite(window[name]);
    });
    return Promise.resolve({ palettes: this.palettes, sprites: this.sprites, images: this.images });
  }
};

// Backwards-compatible default export style (for scripts referencing SpriteLoader.load([...]))
window.SpriteLoader = SpriteLoader;

// Usage examples are in README — this loader accepts sprite objects (palette+pixels)
// and image paths. Call `SpriteLoader.load([...])` with a mixed array, or
// call `SpriteLoader.loadEmbedded()` to pick up definitions from `src/js/sprites.js`.
