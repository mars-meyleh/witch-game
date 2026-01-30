
// Centralized game state object
const GameState = {
  TILE: 16,
  WIDTH: 20,
  HEIGHT: 15,
  canvas: null,
  ctx: null,
  map: null,
  player: null,
  playerHP: 150,
  playerMaxHP: 150,
  playerMana: 25,
  playerMaxMana: 75,
  playerAttributes: null,
  inventory: null,
  items: [],
  projectiles: [],
  chests: [],
  hud: null,
  enemyManager: null,
  wattkSprite: null,
  _chestImages: null,
  _chestImagesLoaded: false,
  _testKeyCooldown: 0,
  _chestCooldown: 0
};
window.GameState = GameState;

GameState.canvas = document.getElementById('game');
GameState.ctx = GameState.canvas.getContext('2d');
window.ctx = GameState.ctx;
GameState.canvas.width = GameState.WIDTH * GameState.TILE;
GameState.canvas.height = GameState.HEIGHT * GameState.TILE;
window.TILE = GameState.TILE;
window.WIDTH = GameState.WIDTH;
window.HEIGHT = GameState.HEIGHT;

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
GameState.map = generateMap(GameState.WIDTH, GameState.HEIGHT, 0.18);
window.gameMap = GameState.map;


// Load all sprites at startup (ASYNC - waits for all images to load)
async function initGame() {
  // Set witch projectile sprite to star
  GameState.wattkSprite = window.starSprite || null;
  try {
    await SpriteLoader.load({
      WitchSprite: 'src/assets/sprites/witch/witch.png',
      GolemSprite: 'src/assets/sprites/enemies/golem1.png',
      heartSprite: 'src/assets/sprites/selection/heart.png',
      starSprite: 'src/assets/sprites/selection/star.png',
      healthPotionSprite: 'src/assets/sprites/selection/potion-health.png',
      manaPotionSprite: 'src/assets/sprites/selection/potion-mana.png',
      wallSprite: 'src/assets/sprites/selection/wall.png',
      floorSprite: 'src/assets/sprites/selection/floor.png',
      hatSprite: 'src/assets/sprites/equipment/equipment_hat.png',
      dressSprite: 'src/assets/sprites/equipment/equipment_dress.png',
      corsetSprite: 'src/assets/sprites/equipment/equipment_corset.png'
    });
    console.info('All sprites loaded successfully');
  } catch (err) {
    console.warn('Sprite loading error:', err);
  }

  // helper: find a free (non-wall) tile in the map. If preferred provided, try that first.
  function findFreeTile(map, preferred) {
    if (!map || !map.length) return { x: 1, y: 1 };
    const H = map.length, W = map[0].length;
    if (preferred && preferred.x >= 0 && preferred.x < W && preferred.y >= 0 && preferred.y < H) {
      if (map[preferred.y][preferred.x] === 0) return { x: preferred.x, y: preferred.y };
    }
    for (let i = 0; i < 300; i++) {
      const x = 1 + Math.floor(Math.random() * (W - 2));
      const y = 1 + Math.floor(Math.random() * (H - 2));
      if (map[y][x] === 0) return { x, y };
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (map[y][x] === 0) return { x, y };
    return { x: 1, y: 1 };
  }

  // spawn player on a free tile
  const playerSpawn = findFreeTile(GameState.map, { x: 2, y: 2 });
  const player = new Player(playerSpawn.x, playerSpawn.y, window.WitchSprite || null);
  GameState.player = player;
  window.player = player;
  if (typeof player.initInput === 'function') player.initInput(GameState.canvas);

  // chest objects
  GameState.chests = [];

  // spawn 6 golems at random, valid positions
  const golemPositions = [];
  for (let i = 0; i < 6; i++) {
    let tries = 0, pos;
    while (tries++ < 400) {
      pos = findFreeTile(GameState.map);
      if (pos.x === player.x && pos.y === player.y) continue;
      if (GameState.chests.some(c => c.x === pos.x && c.y === pos.y)) continue;
      if (golemPositions.some(gp => gp.x === pos.x && gp.y === pos.y)) continue;
      break;
    }
    golemPositions.push(pos);
    let patrol = [{ x: pos.x, y: pos.y }, { x: Math.min(GameState.WIDTH - 2, pos.x + 4), y: pos.y }];
    let golem = enemyManager.spawn('golem.basic', pos.x, pos.y, { hp: 50, damage: 50, patrolPoints: patrol });
    if (golem && window.GolemSprite) golem.sprite = window.GolemSprite;
  }

  // items dropped in the level
  GameState.items = [];
  GameState.projectiles = [];
  window.projectiles = GameState.projectiles;

  // spawn a few chests on the map
  function placeChests(count = 2) {
    for (let i = 0; i < count; i++) {
      let tries = 0;
      while (tries++ < 400) {
        const pos = findFreeTile(GameState.map);
        if (pos.x === player.x && pos.y === player.y) continue;
        if (enemyManager && enemyManager.findAt(pos.x, pos.y)) continue;
        if (GameState.chests.some(c => c.x === pos.x && c.y === pos.y)) continue;
        GameState.chests.push({ x: pos.x, y: pos.y, opened: false });
        break;
      }
    }
  }
  placeChests(2);

  // load chest images
  await (async function loadChestImages() {
    const paths = [
      'src/assets/sprites/chest/chest-closed.png',
      'src/assets/sprites/chest/chest-open1.png',
      'src/assets/sprites/chest/chest-open2.png'
    ];
    try {
      const images = await Promise.all(paths.map(path =>
        fetch(path).then(r => r.blob()).then(blob => {
          const img = new Image();
          return new Promise((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load chest image'));
            img.src = URL.createObjectURL(blob);
          });
        }).catch(() => null)
      ));
      GameState._chestImages = images;
      GameState._chestImagesLoaded = images.every(img => img !== null && img !== undefined);
      window._chestImages = GameState._chestImages;
      window._chestImagesLoaded = GameState._chestImagesLoaded;
      if (GameState._chestImagesLoaded) {
        console.info('Chest images loaded:', GameState._chestImages.length, 'frames');
      } else {
        console.warn('Some chest images failed to load');
      }
    } catch (e) {
      console.warn('Failed to load chest images:', e);
    }
  })();

  // player stats
  GameState.playerHP = 150; GameState.playerMaxHP = 150;
  GameState.playerMana = 25; GameState.playerMaxMana = 75;

  // player attributes
  GameState.playerAttributes = {
    attk: 5, deff: 5, maxHp: 150, maxMp: 150, attkSpeed: 0, thorn: 0, poisonDmg: 0, fireDmg: 0, coldDmg: 0, bleeding: 0, burning: 0, freezing: 0
  };
  window.playerAttributes = GameState.playerAttributes;

  // instantiate HUD
  const hud = (window.HUD) ? new window.HUD({ hpPerIcon: 50, manaPerIcon: 25 }) : null;
  GameState.hud = hud;
  if (hud) {
    hud.setHP(GameState.playerHP, GameState.playerMaxHP);
    hud.setMana(GameState.playerMana, GameState.playerMaxMana);
    if (window.heartSprite) hud.heartSprite = window.heartSprite;
    if (window.starSprite) hud.starSprite = window.starSprite;
    if (window.healthPotionSprite) hud.healthPotionSprite = window.healthPotionSprite;
    if (window.manaPotionSprite) hud.manaPotionSprite = window.manaPotionSprite;
  }

  // inventory state
  GameState.inventory = { healthPotion: 2, manaPotion: 2, keys: 0, equipment: [], equipmentSlots: { hat: null, corset: null, dress: null } };
  if (hud) hud.setInventory(GameState.inventory);

  // expose hud reference so inventory panel can sync counts
  if (hud) window.hud = hud;

  // handler called by the InventoryManager when its contents change
  window._onInventoryPanelChanged = function (counts) {
    if (!counts) return;
    if (GameState.inventoryManager) GameState.inventoryManager.syncInventory();
  };
  if (GameState.inventoryManager) GameState.inventoryManager.syncInventory();

  // Define update and draw functions
  window._update = function update() {
    const now = Date.now();
    if (!GameState._testKeyCooldown) GameState._testKeyCooldown = 0;
    if (now - GameState._testKeyCooldown > 180) {
      if (Input.isDown('o')) { GameState.playerHP = Math.max(0, GameState.playerHP - 50); GameState._testKeyCooldown = now; }
      else if (Input.isDown('p')) { GameState.playerHP = Math.max(0, GameState.playerHP - 100); GameState._testKeyCooldown = now; }
    }
    if (GameState.player && typeof GameState.player.update === 'function') GameState.player.update(now, GameState.map);

    // pickup items if player stands on them
    for (let i = GameState.items.length - 1; i >= 0; i--) {
      const it = GameState.items[i];
      if (it.x === GameState.player.x && it.y === GameState.player.y && Input.isDown('f')) {
        let added = false;
        if (GameState.inventoryManager && it.spriteName) {
          try { added = GameState.inventoryManager.addItem(it.spriteName); } catch (e) { added = false; }
        }
        if (!added) {
          if (GameState.inventoryManager) {
            if (it.type === 'health') {
              GameState.inventoryManager.inventory.healthPotion = (GameState.inventoryManager.inventory.healthPotion || 0) + 1;
              if (hud) hud.setInventory(GameState.inventoryManager.inventory);
            } else if (it.type === 'mana') {
              GameState.inventoryManager.inventory.manaPotion = (GameState.inventoryManager.inventory.manaPotion || 0) + 1;
              if (hud) hud.setInventory(GameState.inventoryManager.inventory);
            } else if (it.type === 'mushroom' || it.type === 'lunarfruit') {
              GameState.inventoryManager.addItem(it.spriteName);
            } else if (it.type === 'hat' || it.type === 'corset' || it.type === 'dress') {
              if (!GameState.inventoryManager.inventory.equipment) GameState.inventoryManager.inventory.equipment = [];
              GameState.inventoryManager.inventory.equipment.push({ type: it.type, name: it.name, spriteName: it.spriteName, equipped: false });
              if (hud) hud.setInventory(GameState.inventoryManager.inventory);
            }
          }
        }
        if (window.inventoryPanel && typeof window.inventoryPanel.render === 'function') {
          window.inventoryPanel.render();
        }
        GameState.items.splice(i, 1);
      }
    }

    // chest interaction: G to open adjacent or same-tile chest
    if (!GameState._chestCooldown) GameState._chestCooldown = 0;
    if (now - GameState._chestCooldown > 300) {
      if (Input.isDown('g')) {
        for (let c of GameState.chests) {
          if (c.opened) continue;
          const man = Math.abs(GameState.player.x - c.x) + Math.abs(GameState.player.y - c.y);
          if (man <= 1) {
            c.opened = true;
            c.openStart = now;
            const eqTypes = [
              { type: 'hat', name: 'Witch Hat', spriteName: 'hatSprite' },
              { type: 'corset', name: 'Corset', spriteName: 'corsetSprite' },
              { type: 'dress', name: 'Dress', spriteName: 'dressSprite' }
            ];
            const eq = eqTypes[Math.floor(Math.random() * eqTypes.length)];
            GameState.items.push({ x: c.x, y: c.y, type: eq.type, name: eq.name, spriteName: eq.spriteName, sprite: window[eq.spriteName] || null });
            GameState._chestCooldown = now;
            break;
          }
        }
      }
    }

    // update projectiles
    for (let i = GameState.projectiles.length - 1; i >= 0; i--) {
      const p = GameState.projectiles[i];
      if (!p || !p.alive) { GameState.projectiles.splice(i, 1); continue; }
      p.update(now, GameState.map);
      if (!p.alive) { GameState.projectiles.splice(i, 1); continue; }
    }
  };

  window._draw = function draw() {
    for (let y = 0; y < GameState.HEIGHT; y++) {
      for (let x = 0; x < GameState.WIDTH; x++) {
        const tx = x * GameState.TILE, ty = y * GameState.TILE;
        if (GameState.map[y][x] === 1) {
          if (window.wallSprite && window.wallSprite instanceof Image) GameState.ctx.drawImage(window.wallSprite, tx, ty, GameState.TILE, GameState.TILE);
          else { GameState.ctx.fillStyle = '#DAB6D8'; GameState.ctx.fillRect(tx, ty, GameState.TILE, GameState.TILE); }
        } else {
          if (window.floorSprite && window.floorSprite instanceof Image) GameState.ctx.drawImage(window.floorSprite, tx, ty, GameState.TILE, GameState.TILE);
          else { GameState.ctx.fillStyle = '#F6E7F2'; GameState.ctx.fillRect(tx, ty, GameState.TILE, GameState.TILE); }
        }
      }
    }
    if (enemyManager) {
      enemyManager.update(Date.now(), GameState.map);
      enemyManager.draw(GameState.ctx, GameState.TILE);
    }
    for (let c of GameState.chests) {
      if (!c) continue;
      const chestImgs = (GameState._chestImages && GameState._chestImages.length) ? GameState._chestImages : null;
      const chestImgsLoaded = GameState._chestImagesLoaded === true;
      if (c.opened) {
        if (chestImgs && chestImgsLoaded) {
          const frameDuration = 120;
          const elapsed = (c.openStart ? (Date.now() - c.openStart) : Infinity);
          const total = chestImgs.length * frameDuration;
          const idx = elapsed >= total ? (chestImgs.length - 1) : Math.floor(elapsed / frameDuration);
          GameState.ctx.imageSmoothingEnabled = false;
          const img = chestImgs[Math.max(0, Math.min(chestImgs.length - 1, idx))];
          if (img) GameState.ctx.drawImage(img, c.x * GameState.TILE, c.y * GameState.TILE, GameState.TILE, GameState.TILE);
          else GameState.ctx.fillStyle = '#C4A36A', GameState.ctx.fillRect(c.x * GameState.TILE + 1, c.y * GameState.TILE + 4, GameState.TILE - 2, GameState.TILE - 8);
        } else if (chestImgs && !chestImgsLoaded) {
          if (!c._chestLoadWarned) { console.warn('Chest images not fully available; falling back to rectangle fallback.'); c._chestLoadWarned = true; }
          GameState.ctx.fillStyle = '#C4A36A'; GameState.ctx.fillRect(c.x * GameState.TILE + 1, c.y * GameState.TILE + 4, GameState.TILE - 2, GameState.TILE - 8);
        } else {
          GameState.ctx.fillStyle = '#C4A36A'; GameState.ctx.fillRect(c.x * GameState.TILE + 1, c.y * GameState.TILE + 4, GameState.TILE - 2, GameState.TILE - 8);
        }
      } else {
        if (chestImgs && chestImgsLoaded) {
          GameState.ctx.imageSmoothingEnabled = false;
          const img = chestImgs[0];
          if (img) GameState.ctx.drawImage(img, c.x * GameState.TILE, c.y * GameState.TILE, GameState.TILE, GameState.TILE);
          else GameState.ctx.fillStyle = '#A66A2A', GameState.ctx.fillRect(c.x * GameState.TILE + 1, c.y * GameState.TILE + 4, GameState.TILE - 2, GameState.TILE - 8);
        } else if (chestImgs && !chestImgsLoaded) {
          if (!c._chestLoadWarned) { console.warn('Chest images not fully available; falling back to rectangle fallback.'); c._chestLoadWarned = true; }
          GameState.ctx.fillStyle = '#A66A2A'; GameState.ctx.fillRect(c.x * GameState.TILE + 1, c.y * GameState.TILE + 4, GameState.TILE - 2, GameState.TILE - 8);
        } else {
          GameState.ctx.fillStyle = '#A66A2A'; GameState.ctx.fillRect(c.x * GameState.TILE + 1, c.y * GameState.TILE + 4, GameState.TILE - 2, GameState.TILE - 8);
        }
      }
    }
    for (let it of GameState.items) {
      if (it && !it.sprite && it.spriteName && window[it.spriteName]) it.sprite = window[it.spriteName];
      if (it && it.sprite && it.sprite instanceof Image) GameState.ctx.drawImage(it.sprite, it.x * GameState.TILE, it.y * GameState.TILE, GameState.TILE, GameState.TILE);
      else {
        GameState.ctx.fillStyle = '#FF8080'; GameState.ctx.fillRect(it.x * GameState.TILE + 4, it.y * GameState.TILE + 4, GameState.TILE - 8, GameState.TILE - 8);
      }
    }
    if (GameState.player && typeof GameState.player.draw === 'function') {
      GameState.player.draw(GameState.ctx, GameState.player.x * GameState.TILE, GameState.player.y * GameState.TILE, GameState.TILE);
    }
    // ...existing code...
  };

  function loop() { window._update(); window._draw(); requestAnimationFrame(loop); }
  loop();
}

initGame().catch(err => console.error('Game initialization failed:', err, err && err.stack ? err.stack : ''));
