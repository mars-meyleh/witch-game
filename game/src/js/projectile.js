// Projectile module: handles projectile logic and rendering
(function () {
	class Projectile {
		constructor(x, y, dir = 'right', sprite = null, speedMs = 160, damage = 50) {
			this.x = x; this.y = y; this.dir = dir === 'left' ? 'left' : 'right';
			this.sprite = sprite || null; this.speedMs = speedMs; this.damage = damage;
			this._lastMove = 0; this.alive = true;
		}
		update(now = Date.now(), map) {
			if (!this.alive) return;
			if (now - this._lastMove < this.speedMs) return;
			this._lastMove = now;
			const dx = this.dir === 'left' ? -1 : 1;
			const nx = this.x + dx, ny = this.y;
			if (!map || ny < 0 || ny >= map.length || nx < 0 || nx >= map[0].length) { this.alive = false; return; }
			if (map[ny][nx] === 1) { this.alive = false; return; }
			this.x = nx; this.y = ny;
		}
		draw(ctx, tileSize) {
			if (!this.alive || !ctx) return;
			if (this.sprite && this.sprite instanceof Image) {
				const flip = (this.dir === 'left');
				const x = this.x * tileSize;
				const y = this.y * tileSize;
				if (flip) {
					ctx.save();
					ctx.scale(-1, 1);
					ctx.drawImage(this.sprite, -x - tileSize, y, tileSize, tileSize);
					ctx.restore();
				} else {
					ctx.drawImage(this.sprite, x, y, tileSize, tileSize);
				}
			}
		}
	}
	window.Projectile = Projectile;
})();
