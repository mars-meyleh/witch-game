const TILE = 16;
const WIDTH = 20, HEIGHT = 15; // 320x240
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = WIDTH * TILE; canvas.height = HEIGHT * TILE;

Input.init();
const map = generateMap(WIDTH, HEIGHT, 0.18);
const spriteAPI = new SpriteAPI(ctx, 1);

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
const player = new Player(playerSpawn.x, playerSpawn.y, WitchSprite);

// static knight enemy (placed in the room) with simple patrol between two points; ensure free spawn
const knightSpawn = findFreeTile(map, { x: 6, y: 6 });
const knight = (window.Enemy && window.knightSprite) ? new window.Enemy(knightSpawn.x, knightSpawn.y, window.knightSprite, 50, 50, [{ x: knightSpawn.x, y: knightSpawn.y }, { x: Math.min(WIDTH - 2, knightSpawn.x + 4), y: knightSpawn.y }]) : null;

// items dropped in the level (e.g., potions)
const items = []; // { x, y, type, sprite }
// chest objects
const chests = []; // { x,y, opened }
// active projectiles
const projectiles = [];

// firing from mouse click (left button). Fires one tile ahead in player's facing direction.
canvas.addEventListener('mousedown', (ev) => {
  // left button only
  if (ev.button !== 0) return;
  const now = Date.now();
  if (!window._fireCooldown) window._fireCooldown = 0;
  if (now - window._fireCooldown < 180) return;
  window._fireCooldown = now;
  const dir = player.facing || 'right';
  const dx = dir === 'left' ? -1 : 1;
  const sx = player.x + dx, sy = player.y;
  if (map[sy] && map[sy][sx] === 0) {
    const sprite = window.wattkSprite || null;
    const proj = new window.Projectile(sx, sy, dir, sprite, 140, 50);
    projectiles.push(proj);
  }
});

// spawn a few chests on the map (avoid player/knight positions)
function placeChests(count = 2) {
  for (let i = 0; i < count; i++) {
    let tries = 0;
    while (tries++ < 400) {
      const pos = findFreeTile(map);
      // avoid player/knight and other chests
      if (pos.x === player.x && pos.y === player.y) continue;
      if (knight && pos.x === knight.x && pos.y === knight.y) continue;
      if (chests.some(c => c.x === pos.x && c.y === pos.y)) continue;
      chests.push({ x: pos.x, y: pos.y, opened: false });
      break;
    }
  }
}
placeChests(2);

// start loop immediately; sprite data is embedded (WitchSprite, GrassTile, StoneTile)
let sprites = { witch: WitchSprite, grass: GrassTile, stone: StoneTile };

let lastMove = 0;
// player stats (HP uses hpPerIcon = 50 by default in HUD)
let playerHP = 150, playerMaxHP = 150;
let playerMana = 40, playerMaxMana = 100;

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
if (hud) { hud.setHP(playerHP, playerMaxHP); hud.setMana(playerMana, playerMaxMana); }
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
  if (!window._invKeyCooldown) window._invKeyCooldown = 0;
  if (now - window._invKeyCooldown > 180) {
    if (Input.isDown('q')) {
      // try to consume from inventory panel first
      if (window.inventoryPanel && window.inventoryPanel.consumeItemByName && window.inventoryPanel.consumeItemByName('HealthPotionSprite')) {
        const heal = hud ? hud.hpPerIcon : 50;
        playerHP = Math.min(playerMaxHP, playerHP + heal);
        window._invKeyCooldown = now;
      } else if (inventory.healthPotion > 0) {
        inventory.healthPotion--;
        const heal = hud ? hud.hpPerIcon : 50;
        playerHP = Math.min(playerMaxHP, playerHP + heal);
        if (hud) hud.setInventory(inventory);
        window._invKeyCooldown = now;
      }
    } else if (Input.isDown('e')) {
      if (window.inventoryPanel && window.inventoryPanel.consumeItemByName && window.inventoryPanel.consumeItemByName('ManaPotionSprite')) {
        const mana = hud ? hud.manaPerIcon : 25;
        playerMana = Math.min(playerMaxMana, playerMana + mana);
        window._invKeyCooldown = now;
      } else if (inventory.manaPotion > 0) {
        inventory.manaPotion--;
        const mana = hud ? hud.manaPerIcon : 25;
        playerMana = Math.min(playerMaxMana, playerMana + mana);
        if (hud) hud.setInventory(inventory);
        window._invKeyCooldown = now;
      }
    }
  }
  // simple input rate limit so holding key doesn't spam movement too fast
  if (now - lastMove > 120) {
    if (Input.isDown('arrowleft') || Input.isDown('a')) { player.move(-1, 0, map); lastMove = now; }
    else if (Input.isDown('arrowright') || Input.isDown('d')) { player.move(1, 0, map); lastMove = now; }
    else if (Input.isDown('arrowup') || Input.isDown('w')) { player.move(0, -1, map); lastMove = now; }
    else if (Input.isDown('arrowdown') || Input.isDown('s')) { player.move(0, 1, map); lastMove = now; }
  }

  // enemy touch damage (knight)
  // player attack: F = strike adjacent enemy for 50
  if (!window._attackCooldown) window._attackCooldown = 0;
  if (now - window._attackCooldown > 220) {
    if (Input.isDown('f') && knight && knight.alive) {
      const manhattan = Math.abs(player.x - knight.x) + Math.abs(player.y - knight.y);
      if (manhattan === 1) {
        knight.takeDamage(50);
        // if knight died this hit, spawn a health potion where it died
        if (!knight.alive) {
          const drop = { x: knight.x, y: knight.y, type: 'health', spriteName: 'HealthPotionSprite', sprite: window.HealthPotionSprite || null };
          items.push(drop);
        }
        window._attackCooldown = now;
      }
    }
  }

  // enemy touch damage (knight) - adjacency hitbox
  if (knight && knight.alive) {
    if (knight.tryTouch(player, now)) {
      playerHP = Math.max(0, playerHP - knight.damage);
    }
  }

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
    // check collision with knight
    if (knight && knight.alive && p.x === knight.x && p.y === knight.y) {
      knight.takeDamage(p.damage);
      p.alive = false;
      projectiles.splice(i, 1);
      if (!knight.alive) {
        const drop = { x: knight.x, y: knight.y, type: 'health', spriteName: 'HealthPotionSprite', sprite: window.HealthPotionSprite || null };
        items.push(drop);
      }
    }
  }
}

function draw() {
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const tx = x * TILE, ty = y * TILE;
      if (map[y][x] === 1) {
        if (window.wallSprite) spriteAPI.draw(window.wallSprite, tx, ty, false);
        else { ctx.fillStyle = '#DAB6D8'; ctx.fillRect(tx, ty, TILE, TILE); }
      } else {
        if (window.floorSprite) spriteAPI.draw(window.floorSprite, tx, ty, false);
        else { ctx.fillStyle = '#F6E7F2'; ctx.fillRect(tx, ty, TILE, TILE); }
      }
    }
  }
  // draw enemy (patrolling)
  if (knight) {
    // update enemy movement
    if (typeof knight.update === 'function') knight.update(Date.now(), map);
    if (knight.alive) knight.draw(spriteAPI, TILE);
  }

  // draw items on ground
  for (let it of items) {
    if (it && !it.sprite && it.spriteName && window[it.spriteName]) it.sprite = window[it.spriteName];
    if (it && it.sprite) spriteAPI.draw(it.sprite, it.x * TILE, it.y * TILE, false);
    else {
      // fallback: simple marker
      ctx.fillStyle = '#FF8080'; ctx.fillRect(it.x * TILE + 4, it.y * TILE + 4, TILE - 8, TILE - 8);
    }
  }
  // draw chests
  for (let c of chests) {
    if (!c) continue;
    if (c.opened) {
      if (window.ChestOpenSprite) spriteAPI.draw(window.ChestOpenSprite, c.x * TILE, c.y * TILE, false);
      else ctx.fillStyle = '#C4A36A', ctx.fillRect(c.x * TILE + 1, c.y * TILE + 4, TILE - 2, TILE - 8);
    } else {
      if (window.ChestSprite) spriteAPI.draw(window.ChestSprite, c.x * TILE, c.y * TILE, false);
      else ctx.fillStyle = '#A66A2A', ctx.fillRect(c.x * TILE + 1, c.y * TILE + 4, TILE - 2, TILE - 8);
    }
  }
  // draw projectiles
  for (let p of projectiles) {
    if (p && p.alive) p.draw(spriteAPI, TILE);
  }
  // draw player using SpriteAPI; scale is 1 (sprite pixels = canvas pixels), tile size is TILE
  player.draw(ctx, player.x * TILE, player.y * TILE, TILE, spriteAPI);
  // update DOM HUD
  if (hud) { hud.setHP(playerHP, playerMaxHP); hud.setMana(playerMana, playerMaxMana); }
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

// start the game loop after initialization
loop();
