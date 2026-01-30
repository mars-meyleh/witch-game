const TILE = 16;
const WIDTH = 20, HEIGHT = 15; // 320x240
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// expose canvas context for external managers (enemy manager will use this)
window.ctx = ctx;
canvas.width = WIDTH * TILE; canvas.height = HEIGHT * TILE;
window.TILE = TILE;
window.WIDTH = WIDTH; window.HEIGHT = HEIGHT;

// Global error overlay to surface runtime errors (helps debugging when game won't load)
(function () {
  function showError(msg) {
    console.error(msg);
    try {
      let el = document.getElementById('js-error-overlay');
      if (!el) {
        el = document.createElement('div'); el.id = 'js-error-overlay';
        Object.assign(el.style, {
          position: 'fixed', left: '8px', right: '8px', top: '8px', padding: '12px', background: 'rgba(255,80,80,0.95)', color: 'white', fontFamily: 'monospace', zIndex: 99999, borderRadius: '6px', whiteSpace: 'pre-wrap'
        });
        document.body.appendChild(el);
      }
      el.textContent = String(msg);
    } catch (e) { console.error('Failed to show error overlay', e); }
  }
  window.addEventListener('error', (ev) => {
    const msg = ev && ev.message ? (ev.message + ' @ ' + ev.filename + ':' + ev.lineno) : String(ev);
    showError(msg);
  });
  window.addEventListener('unhandledrejection', (ev) => {
    const r = ev && ev.reason ? ev.reason : ev;
    const msg = r && r.message ? ('UnhandledRejection: ' + r.message) : ('UnhandledRejection: ' + String(r));
    showError(msg);
  });
})();

// Create a small debug log panel on the right side of the canvas
(function createDebugPanel() {
  const maxLines = 500;
  const panel = document.createElement('div');
  panel.id = 'debug-panel';
  Object.assign(panel.style, {
    position: 'fixed', right: '8px', top: '64px', width: '300px', height: '320px',
    background: 'rgba(0,0,0,0.72)', color: '#fff', fontFamily: 'monospace', fontSize: '12px',
    padding: '8px', overflowY: 'auto', zIndex: 99998, borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.6)'
  });

  const header = document.createElement('div');
  header.style.display = 'flex'; header.style.justifyContent = 'space-between'; header.style.alignItems = 'center'; header.style.marginBottom = '6px';
  const title = document.createElement('strong'); title.textContent = 'Debug Log'; title.style.fontSize = '12px';
  const controls = document.createElement('div');
  const clearBtn = document.createElement('button'); clearBtn.textContent = 'Clear'; clearBtn.title = 'Clear logs';
  Object.assign(clearBtn.style, { marginLeft: '6px', fontSize: '11px' });
  const toggleBtn = document.createElement('button'); toggleBtn.textContent = '▣'; toggleBtn.title = 'Toggle';
  Object.assign(toggleBtn.style, { marginLeft: '6px', fontSize: '11px' });
  controls.appendChild(clearBtn); controls.appendChild(toggleBtn);
  header.appendChild(title); header.appendChild(controls);
  panel.appendChild(header);

  const content = document.createElement('div'); content.id = 'debug-panel-content'; panel.appendChild(content);
  document.body.appendChild(panel);

  function formatTs(d) { return d.toTimeString().split(' ')[0]; }
  function appendLine(msg, level = 'info') {
    const el = document.createElement('div');
    el.textContent = `[${formatTs(new Date())}] ${msg}`;
    el.style.whiteSpace = 'pre-wrap';
    if (level === 'error') el.style.color = '#ff9b9b';
    else if (level === 'warn') el.style.color = '#ffd59b';
    content.appendChild(el);
    while (content.children.length > maxLines) content.removeChild(content.firstChild);
    content.scrollTop = content.scrollHeight;
  }

  window.debugLog = function (msg, level = 'info') {
    try { appendLine(String(msg), level); } catch (e) { /* ignore */ }
    // still forward to console
    if (level === 'error') console.error(msg);
    else if (level === 'warn') console.warn(msg);
    else console.log(msg);
  };

  clearBtn.addEventListener('click', () => { content.innerHTML = ''; });
  let visible = true;
  toggleBtn.addEventListener('click', () => {
    visible = !visible;
    content.style.display = visible ? 'block' : 'none';
    panel.style.height = visible ? '320px' : '28px';
  });

  // Capture console.* calls and mirror them into the panel
  const orig = { log: console.log.bind(console), warn: console.warn.bind(console), error: console.error.bind(console) };
  console.log = function (...args) { try { window.debugLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), 'info'); } catch (e) { }
    orig.log(...args);
  };
  console.warn = function (...args) { try { window.debugLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), 'warn'); } catch (e) { }
    orig.warn(...args);
  };
  console.error = function (...args) { try { window.debugLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), 'error'); } catch (e) { }
    orig.error(...args);
  };

  // expose for debug/testing
  window._debugPanel = { panel, content, appendLine };
})();

Input.init();
const map = generateMap(WIDTH, HEIGHT, 0.18);
// expose map for external managers
window.gameMap = map;

// Load all sprites at startup
SpriteLoader.load({
  WitchSprite: 'src/assets/sprites/witch/witch.png',
  GolemSprite: 'src/assets/sprites/enemies/golem1.png',
  wallSprite: 'src/assets/sprites/wall.png',
  floorSprite: 'src/assets/sprites/floor.png',
  wattkSprite: 'src/assets/sprites/wattk.png'
}).catch(err => console.warn('Sprite loading error:', err));

// helper: find a free (non-wall) tile in the map. If preferred provided, try that first.
function findFreeTile(map, preferred) {
  if (!map || !map.length) return { x: 1, y: 1 };
  const H = map.length, W = map[0].length;
  if (preferred && preferred.x >= 0 && preferred.x < W && preferred.y >= 0 && preferred.y < H) {
    if (map[preferred.y][preferred.x] === 0) return { x: preferred.x, y: preferred.y };
  }
  // try random probes
  for (let i = 0; i < 300; i++) {
    const x = 1 + Math.floor(Math.random() * (W - 2));
    const y = 1 + Math.floor(Math.random() * (H - 2));
    if (map[y][x] === 0) return { x, y };
  }
  // fallback: scan for first non-wall
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (map[y][x] === 0) return { x, y };
  return { x: 1, y: 1 };
}

// spawn player on a free tile
const playerSpawn = findFreeTile(map, { x: 2, y: 2 });
const player = new Player(playerSpawn.x, playerSpawn.y, window.WitchSprite || null);
// attach input handlers (mouse + movement/keys) on player
if (typeof player.initInput === 'function') player.initInput(canvas);

// static golem enemy (placed in the room) with simple patrol between two points; ensure free spawn
const golemSpawn = findFreeTile(map, { x: 6, y: 6 });

// spawn golem via manager (will use loaded sprite)
let golem = enemyManager.spawn('golem.basic', golemSpawn.x, golemSpawn.y, { hp: 50, damage: 50, patrolPoints: [{ x: golemSpawn.x, y: golemSpawn.y }, { x: Math.min(WIDTH - 2, golemSpawn.x + 4), y: golemSpawn.y }] });
// override sprite with loaded image
if (golem && window.GolemSprite) golem.sprite = window.GolemSprite;


// items dropped in the level (e.g., potions)
const items = []; // { x, y, type, sprite }
// chest objects
const chests = []; // { x,y, opened }
// active projectiles
const projectiles = [];

// player firing moved into `Player` (see player.initInput and player.update)

// spawn a few chests on the map (avoid player/golem positions)
function placeChests(count = 2) {
  for (let i = 0; i < count; i++) {
    let tries = 0;
    while (tries++ < 400) {
      const pos = findFreeTile(map);
      // avoid player/enemy and other chests
      if (pos.x === player.x && pos.y === player.y) continue;
      if (enemyManager && enemyManager.findAt(pos.x, pos.y)) continue;
      if (chests.some(c => c.x === pos.x && c.y === pos.y)) continue;
      chests.push({ x: pos.x, y: pos.y, opened: false });
      break;
    }
  }
}
placeChests(2);

// start loop immediately; sprite data is embedded (WitchSprite, GrassTile, StoneTile)
let sprites = { witch: (typeof WitchSprite !== 'undefined') ? WitchSprite : (window.WitchSprite || null) };

// preload chest images (3-frame opening animation)
// simple inline fetch-based image loader (replaces SpriteLoader)
(async function loadChestImages() {
  const paths = [
    'src/assets/sprites/chest/chest-closed.png',
    'src/assets/sprites/chest/chest-open1.png',
    'src/assets/sprites/chest/chest-open2.png'
  ];
  try {
    const images = await Promise.all(paths.map(path =>
      fetch(path).then(r => r.blob()).then(blob => {
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        return img;
      }).catch(() => null)
    ));
    window._chestImages = images;
    window._chestImagesLoaded = images.every(img => img !== null && img !== undefined);
    if (window._chestImagesLoaded) {
      console.info('Chest images loaded:', window._chestImages.length, 'frames');
    } else {
      console.warn('Some chest images failed to load');
    }
  } catch (e) {
    console.warn('Failed to load chest images:', e);
  }
})();


let lastMove = 0;
// player stats (HP uses hpPerIcon = 50 by default in HUD)
window.playerHP = 150; window.playerMaxHP = 150;
window.playerMana = 25; window.playerMaxMana = 75;

// player attributes (base values, can be modified by equipment/weapons)
let playerAttributes = {
  attk: 5,           // attack
  deff: 5,           // defense
  maxHp: 150,        // max health (50 points per icon)
  maxMp: 150,        // max mana (50 points per icon)
  attkSpeed: 0,      // attack speed
  thorn: 0,          // thorn damage
  poisonDmg: 0,      // poison damage
  fireDmg: 0,        // fire damage
  coldDmg: 0,        // cold damage
  bleeding: 0,       // bleeding damage
  burning: 0,        // burning damage
  freezing: 0        // freezing damage
};

// instantiate HUD (outside of canvas)
const hud = (window.HUD) ? new window.HUD({ hpPerIcon: 50, manaPerIcon: 25 }) : null;
if (hud) { hud.setHP(window.playerHP, window.playerMaxHP); hud.setMana(window.playerMana, window.playerMaxMana); }
// inventory state (health potions, mana potions, keys)
let inventory = { healthPotion: 2, manaPotion: 2, keys: 0 };
if (hud) hud.setInventory(inventory);

// expose player attributes to inventory panel
window.playerAttributes = playerAttributes;
// expose hud reference so inventory panel can sync counts
if (hud) window.hud = hud;

// handler called by the InventoryPanel when its contents change
window._onInventoryPanelChanged = function (counts) {
  if (!counts) return;
  inventory.healthPotion = counts.healthPotion || 0;
  inventory.manaPotion = counts.manaPotion || 0;
  inventory.keys = counts.keys || 0;
  if (window.hud && typeof window.hud.setInventory === 'function') window.hud.setInventory(inventory);
};
// if panel already exists, ask it to emit its current counts so HUD syncs
if (window.inventoryPanel && typeof window.inventoryPanel._emitInventorySync === 'function') window.inventoryPanel._emitInventorySync();
function update() {
  const now = Date.now();
  // test keys: O = enemy attack (50), P = boss attack (100)
  if (!window._testKeyCooldown) window._testKeyCooldown = 0;
  if (now - window._testKeyCooldown > 180) {
    if (Input.isDown('o')) { playerHP = Math.max(0, playerHP - 50); window._testKeyCooldown = now; }
    else if (Input.isDown('p')) { playerHP = Math.max(0, playerHP - 100); window._testKeyCooldown = now; }
  }
  // inventory use keys: Q = use health potion, E = use mana potion
  // delegate player-specific input (movement, attack, potions) to Player
  if (window.player && typeof window.player.update === 'function') window.player.update(now, map);

  // pickup items if player stands on them
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    if (it.x === player.x && it.y === player.y) {
      // try to add to inventory panel first
      let added = false;
      if (window.inventoryPanel && it.spriteName) {
        try { added = window.inventoryPanel.addItemByName(it.spriteName); } catch (e) { added = false; }
      }
      if (!added) {
        if (it.type === 'health') {
          inventory.healthPotion = (inventory.healthPotion || 0) + 1;
          if (hud) hud.setInventory(inventory);
        } else if (it.type === 'mana') {
          inventory.manaPotion = (inventory.manaPotion || 0) + 1;
          if (hud) hud.setInventory(inventory);
        }
      }
      // remove item
      items.splice(i, 1);
    }
  }

  // chest interaction: G to open adjacent or same-tile chest
  if (!window._chestCooldown) window._chestCooldown = 0;
  if (now - window._chestCooldown > 300) {
    if (Input.isDown('g')) {
      for (let c of chests) {
        if (c.opened) continue;
        const man = Math.abs(player.x - c.x) + Math.abs(player.y - c.y);
        if (man <= 1) {
          c.opened = true;
          // record animation start time
          c.openStart = now;
          // random potion: 50% health, 50% mana
          // try to insert into inventory panel first
          if (window.inventoryPanel) {
            if (Math.random() < 0.5) {
              if (!window.inventoryPanel.addItemByName('HealthPotionSprite')) { inventory.healthPotion = (inventory.healthPotion || 0) + 1; }
            } else {
              if (!window.inventoryPanel.addItemByName('ManaPotionSprite')) { inventory.manaPotion = (inventory.manaPotion || 0) + 1; }
            }
            if (hud) hud.setInventory(inventory);
          } else {
            if (Math.random() < 0.5) inventory.healthPotion = (inventory.healthPotion || 0) + 1;
            else inventory.manaPotion = (inventory.manaPotion || 0) + 1;
            if (hud) hud.setInventory(inventory);
          }
          window._chestCooldown = now;
          break;
        }
      }
    }
  }

  // update projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    if (!p || !p.alive) { projectiles.splice(i, 1); continue; }
    p.update(now, map);
    if (!p.alive) { projectiles.splice(i, 1); continue; }
  }
}

function draw() {
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const tx = x * TILE, ty = y * TILE;
      if (map[y][x] === 1) {
        if (window.wallSprite && window.wallSprite instanceof Image) ctx.drawImage(window.wallSprite, tx, ty, TILE, TILE);
        else { ctx.fillStyle = '#DAB6D8'; ctx.fillRect(tx, ty, TILE, TILE); }
      } else {
        if (window.floorSprite && window.floorSprite instanceof Image) ctx.drawImage(window.floorSprite, tx, ty, TILE, TILE);
        else { ctx.fillStyle = '#F6E7F2'; ctx.fillRect(tx, ty, TILE, TILE); }
      }
    }
  }
  // draw & update enemies via EnemyManager
  if (enemyManager) {
    enemyManager.update(Date.now(), map);
    enemyManager.draw(ctx, TILE);
  }

  // draw items on ground
  for (let it of items) {
    if (it && !it.sprite && it.spriteName && window[it.spriteName]) it.sprite = window[it.spriteName];
    if (it && it.sprite && it.sprite instanceof Image) ctx.drawImage(it.sprite, it.x * TILE, it.y * TILE, TILE, TILE);
    else {
      // fallback: simple marker
      ctx.fillStyle = '#FF8080'; ctx.fillRect(it.x * TILE + 4, it.y * TILE + 4, TILE - 8, TILE - 8);
    }
  }
  // draw chests
  for (let c of chests) {
    if (!c) continue;
    const chestImgs = (window._chestImages && window._chestImages.length) ? window._chestImages : null;
    const chestImgsLoaded = window._chestImagesLoaded === true;
    if (c.opened) {
      if (chestImgs && chestImgsLoaded) {
        // play opening animation: frames 0..N-1 over duration
        const frameDuration = 120; // ms per frame
        const elapsed = (c.openStart ? (Date.now() - c.openStart) : Infinity);
        const total = chestImgs.length * frameDuration;
        const idx = elapsed >= total ? (chestImgs.length - 1) : Math.floor(elapsed / frameDuration);
        ctx.imageSmoothingEnabled = false;
        const img = chestImgs[Math.max(0, Math.min(chestImgs.length - 1, idx))];
        if (img) ctx.drawImage(img, c.x * TILE, c.y * TILE, TILE, TILE);
        else ctx.fillStyle = '#C4A36A', ctx.fillRect(c.x * TILE + 1, c.y * TILE + 4, TILE - 2, TILE - 8);
      } else if (chestImgs && !chestImgsLoaded) {
        // images partially available or failed to load — warn once and fall back to rectangle
        if (!c._chestLoadWarned) { console.warn('Chest images not fully available; falling back to rectangle fallback.'); c._chestLoadWarned = true; }
        ctx.fillStyle = '#C4A36A'; ctx.fillRect(c.x * TILE + 1, c.y * TILE + 4, TILE - 2, TILE - 8);
      } else {
        ctx.fillStyle = '#C4A36A'; ctx.fillRect(c.x * TILE + 1, c.y * TILE + 4, TILE - 2, TILE - 8);
      }
    } else {
      if (chestImgs && chestImgsLoaded) {
        // show closed frame (frame 0)
        ctx.imageSmoothingEnabled = false;
        const img = chestImgs[0];
        if (img) ctx.drawImage(img, c.x * TILE, c.y * TILE, TILE, TILE);
        else ctx.fillStyle = '#A66A2A', ctx.fillRect(c.x * TILE + 1, c.y * TILE + 4, TILE - 2, TILE - 8);
      } else if (chestImgs && !chestImgsLoaded) {
        if (!c._chestLoadWarned) { console.warn('Chest images not fully available; falling back to rectangle fallback.'); c._chestLoadWarned = true; }
        ctx.fillStyle = '#A66A2A'; ctx.fillRect(c.x * TILE + 1, c.y * TILE + 4, TILE - 2, TILE - 8);
      } else {
        ctx.fillStyle = '#A66A2A'; ctx.fillRect(c.x * TILE + 1, c.y * TILE + 4, TILE - 2, TILE - 8);
      }
    }
  }
  // draw projectiles
  for (let p of projectiles) {
    if (p && p.alive) p.draw(ctx, TILE);
  }
  // draw player; tile size is TILE
  player.draw(ctx, player.x * TILE, player.y * TILE, TILE);
  // update DOM HUD
  if (hud) { hud.setHP(window.playerHP, window.playerMaxHP); hud.setMana(window.playerMana, window.playerMaxMana); }



  // debug overlay showing golem status
  try {
    const gs = golem ? (golem.alive ? 'alive' : 'dead') : 'missing';
    const gx = golem ? golem.x : '-';
    const gy = golem ? golem.y : '-';
    const gi = (window._spriteImagesLoaded && window._spriteImagesLoaded['golem.basic']) ? 'imgs' : 'noimgs';
    ctx.save();
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(6,6,180,40);
    ctx.fillStyle = '#fff'; ctx.fillText(`Golem: ${gs} (${gx},${gy}) ${gi}`, 10, 20);
    if (golem && golem.sprite) ctx.fillText(`Sprite id: ${golem.sprite.id}`, 10, 34);
    ctx.restore();
  } catch (e) { /* ignore */ }


}

function loop() { update(); draw(); requestAnimationFrame(loop); }

// start the game loop after initialization
loop();
