class Board {
    constructor(gridSize = 30, tileSize = 48, seed = 12345) {
        this.gridSize = gridSize;
        this.tileSize = tileSize;
        this.sideDepth = 10;
        this.seed = seed;

        this.GRASS = 'grass';
        this.WATER = 'water';
        this.LILY  = 'lily';
        this.PLANT = 'plant';
        this.DIRT  = 'dirt';

        this.colors = {
            grass: { top: '#5cb85c', side: '#3d7d38', dark: '#2d5a2d' },
            water: { top: '#4a90e2', side: '#1a3a7f', dark: '#0d1f4d' },
            lily:  { top: '#228B22', side: '#1a6b1a', dark: '#0d4d0d' },
            plant: { top: '#6ab06a', side: '#4d7a4d', dark: '#3d5a3d' },
            dirt:  { top: '#8b5e3c', side: '#5c3a1e', dark: '#3a2210' },
        };

        this.tiles = this.generateTerrain();
    }

    _rand() {
        this.seed = (this.seed * 1664525 + 1013904223) & 0xffffffff;
        return (this.seed >>> 0) / 0xffffffff;
    }

    // Prosty noise — sumuje kilka sinusów żeby dać organiczny kształt
    _noise(x, y) {
        return (
            Math.sin(x * 0.4 + this._rand() * 0.1) +
            Math.sin(y * 0.35 + this._rand() * 0.1) +
            Math.sin((x + y) * 0.25 + this._rand() * 0.1)
        ) / 3;
    }

    generateTerrain() {
        const G = this.gridSize;

        // Pre-generuj noise dla całej mapy
        const noise = [];
        for (let y = 0; y < G; y++) {
            noise.push([]);
            for (let x = 0; x < G; x++) {
                // Organiczny kształt stawu w środku
                const cx = (x - G/2) / (G/2);
                const cy = (y - G/2) / (G/2);
                const dist = Math.sqrt(cx*cx + cy*cy);
                const wobble = Math.sin(x * 0.7) * 0.15 + Math.cos(y * 0.8) * 0.15 + this._rand() * 0.2;
                noise[y].push(dist + wobble);
            }
        }

        const tiles = [];
        for (let y = 0; y < G; y++) {
            const row = [];
            for (let x = 0; x < G; x++) {
                const distFromEdge = Math.min(x, y, G-1-x, G-1-y);
                const n = noise[y][x];
                let type;

                if (distFromEdge === 0) {
                    type = this.DIRT;
                } else if (distFromEdge === 1) {
                    // Brzeg — głównie woda z liliami
                    const r = this._rand();
                    if      (r < 0.6) type = this.WATER;
                    else if (r < 0.75) type = this.LILY;
                    else               type = this.GRASS;
                } else if (n > 0.55) {
                    // Daleko od środka = trawa/rośliny
                    type = this._rand() < 0.18 ? this.PLANT : this.GRASS;
                } else if (n > 0.3) {
                    // Strefa przejściowa — mieszana
                    const r = this._rand();
                    if      (r < 0.3)  type = this.WATER;
                    else if (r < 0.42) type = this.LILY;
                    else if (r < 0.55) type = this.PLANT;
                    else               type = this.GRASS;
                } else if (n > 0.0) {
                    // Wewnętrzna strefa stawu
                    const r = this._rand();
                    if      (r < 0.65) type = this.WATER;
                    else if (r < 0.82) type = this.LILY;
                    else               type = this.GRASS;
                } else {
                    // Centrum stawu — prawie same woda
                    type = this._rand() < 0.9 ? this.WATER : this.LILY;
                }

                row.push({ type });
            }
            tiles.push(row);
        }
        return tiles;
    }

    canWalk(x, y) {
        if (x < 0 || y < 0 || x >= this.gridSize || y >= this.gridSize) return false;
        const t = this.tiles[y][x].type;
        return t === this.GRASS || t === this.PLANT;
    }

    gridToPixel(x, y, offsetX, offsetY) {
        return {
            px: offsetX + x * this.tileSize,
            py: offsetY + y * this.tileSize,
        };
    }

    draw(ctx, offsetX = 0, offsetY = 0, time = 0) {
        for (let y = this.gridSize - 1; y >= 0; y--) {
            for (let x = 0; x < this.gridSize; x++) {
                const tile = this.tiles[y][x];
                const { px, py } = this.gridToPixel(x, y, offsetX, offsetY);
                this.drawTile(ctx, px, py, tile, y === this.gridSize - 1, time);
            }
        }
    }

    drawTile(ctx, x, y, tile, isBottomRow, time) {
        const TW = this.tileSize;
        const TH = this.tileSize;
        const SD = this.sideDepth;
        const c  = this.colors[tile.type] || this.colors.grass;

        if (isBottomRow) {
            ctx.fillStyle = c.dark;
            ctx.fillRect(x, y + TH, TW, SD);
            ctx.fillStyle = c.side;
            ctx.fillRect(x + 1, y + TH + 2, TW - 2, SD - 4);
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y + TH, TW, SD);
        }

        ctx.fillStyle = c.top;
        ctx.fillRect(x, y, TW, TH);
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, TW, TH);

        if (tile.type === this.WATER) {
            this._drawWater(ctx, x, y, TW, TH, time);
        } else if (tile.type === this.LILY) {
            this._drawLily(ctx, x, y, TW, TH);
        } else if (tile.type === this.GRASS) {
            this._drawGrass(ctx, x, y);
        } else if (tile.type === this.PLANT) {
            this._drawPlant(ctx, x, y, TW, TH);
        } else if (tile.type === this.DIRT) {
            this._drawDirt(ctx, x, y, TW, TH);
        }
    }

    _drawWater(ctx, x, y, TW, TH, time) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x + 2, y + 2, TW - 4, TH - 4);
        ctx.clip();
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = '#aad4f5';
        ctx.lineWidth = 2;
        for (let i = 0; i < 2; i++) {
            const wx = x + 6 + i * 14 + Math.sin(time * 1.6 + i * 2) * 4;
            const wy = y + TH / 2 + Math.cos(time + i) * 3;
            ctx.beginPath();
            ctx.moveTo(wx, wy);
            ctx.lineTo(wx + 14, wy + 1);
            ctx.stroke();
        }
        ctx.restore();
    }

    _drawLily(ctx, x, y, TW, TH) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.arc(x + TW/2, y + TH/2, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.colors.lily.top;
        ctx.beginPath();
        ctx.moveTo(x + TW/2, y + TH/2);
        ctx.lineTo(x + TW/2 + 14, y + TH/2);
        ctx.arc(x + TW/2, y + TH/2, 14, 0, Math.PI * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(x + TW/2 - 2, y + TH/2 - 2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f9ca24';
        ctx.beginPath();
        ctx.arc(x + TW/2 - 2, y + TH/2 - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    _drawGrass(ctx, x, y) {
        ctx.save();
        ctx.strokeStyle = '#69c44d';
        ctx.lineWidth = 1.5;
        const blades = [
            { bx: x + 10, by: y + 12 },
            { bx: x + 22, by: y + 18 },
            { bx: x + 34, by: y + 10 },
        ];
        for (const { bx, by } of blades) {
            ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - 2, by - 6); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(bx + 4, by + 4); ctx.lineTo(bx + 2, by - 2); ctx.stroke();
        }
        ctx.restore();
    }

    _drawPlant(ctx, x, y, TW, TH) {
        ctx.save();
        ctx.fillStyle = '#27ae60';
        ctx.beginPath(); ctx.arc(x + TW/2, y + TH/2, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath(); ctx.arc(x + TW/2 - 5, y + TH/2 - 5, 7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + TW/2 + 5, y + TH/2 - 3, 6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    _drawDirt(ctx, x, y, TW, TH) {
        ctx.save();
        ctx.fillStyle = '#a0785a';
        ctx.beginPath(); ctx.arc(x + 12, y + 16, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 30, y + 28, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 38, y + 14, 2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}