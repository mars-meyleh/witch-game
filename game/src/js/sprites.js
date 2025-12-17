// Palette registry and sprite data (16x16 indexed pixels)
const Palette = {
  witch: {
    0: null,
    1: "#FFFFEB",
    2: "#F2DB5E",
    3: "#DBC651",
    4: "#B9A63D",
    5: "#D99292",
    6: "#BD4882",
    7: "#80366B",
    8: "#422445",
    9: "#492C0C",
    10: "#2C1B08",
    11: "#EA0707",
    12: "#BE0000",
    13: "#66FFE3"
  },

  grass: {
    0: null,
    14: "#3CA370",
    15: "#277E53",
    16: "#206342"
  },

  stone: {
    0: null,
    17: "#606070",
    18: "#43434F",
    19: "#272736"
  }
  ,
  ui: {
    0: null,
    100: '#7F55B1',
    101: '#9B7EBD',
    102: '#F49BAB',
    103: '#FFE1E0',
    104: '#F7CFD8',
    105: '#F4F8D3',
    106: '#A6D6D6',
    107: '#8E7DBE'
  }
};

const WitchSprite = {
  id: "witch.mushroom",
  size: 16,
  palette: "witch",
  pixels: [
    [0, 11, 11, 1, 11, 11, 11, 11, 1, 11, 11, 1, 0, 0, 0, 0],
    [11, 11, 1, 11, 11, 11, 1, 11, 11, 11, 11, 11, 11, 0, 0, 0],
    [0, 0, 0, 11, 1, 11, 11, 11, 11, 1, 11, 11, 1, 11, 0, 0],
    [0, 0, 0, 0, 11, 1, 11, 1, 11, 11, 12, 12, 12, 1, 0, 0],
    [0, 0, 0, 0, 11, 11, 11, 11, 11, 11, 10, 10, 12, 11, 11, 11],
    [0, 0, 11, 11, 11, 1, 11, 11, 1, 9, 13, 9, 12, 12, 1, 0],
    [0, 1, 11, 1, 11, 11, 11, 2, 2, 9, 9, 9, 0, 0, 0, 0],
    [11, 11, 11, 11, 11, 1, 2, 10, 9, 9, 9, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 2, 2, 2, 4, 9, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 2, 2, 2, 4, 6, 6, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 2, 2, 4, 9, 9, 9, 6, 10, 10, 0, 0, 0],
    [2, 2, 2, 4, 2, 2, 10, 4, 5, 6, 5, 0, 0, 10, 0, 0],
    [2, 3, 4, 2, 2, 10, 4, 7, 7, 7, 10, 10, 0, 0, 0, 0],
    [2, 3, 4, 3, 2, 10, 4, 8, 10, 8, 8, 8, 0, 0, 0, 0],
    [2, 3, 3, 3, 2, 2, 4, 8, 10, 8, 8, 8, 0, 0, 0, 0],
    [2, 2, 2, 2, 2, 4, 8, 10, 8, 8, 8, 8, 8, 0, 0, 0]
  ]
};

// Example tiles (can be swapped for JSON-loaded data later)
const GrassTile = {
  id: "tile.grass",
  size: 16,
  palette: "grass",
  pixels: (function () {
    const rows = [];
    for (let y = 0; y < 16; y++) {
      const row = [];
      for (let x = 0; x < 16; x++) { row.push(14 + ((x + y) & 1)); }
      rows.push(row);
    }
    return rows;
  })()
};

const StoneTile = {
  id: "tile.stone",
  size: 16,
  palette: "stone",
  pixels: (function () {
    const rows = [];
    for (let y = 0; y < 16; y++) {
      const row = [];
      for (let x = 0; x < 16; x++) { row.push(17 + ((x + y) % 3)); }
      rows.push(row);
    }
    return rows;
  })()
};

class SpriteAPI {
  constructor(ctx, scale = 1) {
    this.ctx = ctx;
    this.scale = scale;
  }

  draw(sprite, x, y, flip = false) {
    const palette = Palette[sprite.palette] || {};
    const px = sprite.pixels;
    const size = sprite.size || 16;

    for (let y0 = 0; y0 < size; y0++) {
      for (let x0 = 0; x0 < size; x0++) {
        const sx = flip ? (size - 1 - x0) : x0;
        const color = palette[px[y0][sx]];
        if (!color) continue;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
          x + x0 * this.scale,
          y + y0 * this.scale,
          this.scale,
          this.scale
        );
      }
    }
  }
}

// expose on window for easy access from other modules
window.Palette = Palette;
window.WitchSprite = WitchSprite;
window.GrassTile = GrassTile;
window.StoneTile = StoneTile;
window.SpriteAPI = SpriteAPI;
