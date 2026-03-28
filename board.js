// Generacja i rysowanie planszy — styl top-down z ścianką dirt
class Board {
    constructor(gridSize = 10, tileSize = 48, seed = 12345) {
        this.gridSize = gridSize;
        this.tileSize = tileSize;
        this.sideDepth = 10; // grubość ścianki dirt widocznej od frontu
        this.seed = seed; // do generacji

        // Typy terenu
        this.GRASS = 'grass';
        this.WATER = 'water';
        this.LILY  = 'lily';
        this.PLANT = 'plant';
        this.DIRT  = 'dirt';

        // Kolory topface i ścianek
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

    generateTerrain() {
        const tiles = [];
        for (let y = 0; y < this.gridSize; y++) {
            const row = [];
            for (let x = 0; x < this.gridSize; x++) {
                let type = this.GRASS;
                const distFromEdge = Math.min(x, y, this.gridSize-1-x, this.gridSize-1-y);

                if (distFromEdge === 0) {
                    type = this.DIRT;
                } else if (distFromEdge === 1) {
                    const r = this._rand();  // ← zamiast Math.random()
                    if      (r < 0.65) type = this.WATER;
                    else if (r < 0.80) type = this.LILY;
                    else               type = this.GRASS;
                } else if (distFromEdge <= 3) {
                    const r = this._rand();
                    if      (r < 0.25) type = this.WATER;
                    else if (r < 0.32) type = this.LILY;
                    else               type = this.GRASS;
                } else {
                    type = this._rand() < 0.12 ? this.PLANT : this.GRASS;
                }

                row.push({ type });
            }
            tiles.push(row);
        }
        return tiles;
    }

    // Czy żabka może wejść na ten kafelek
    canWalk(x, y) {
        if (x < 0 || y < 0 || x >= this.gridSize || y >= this.gridSize) return false;
        const t = this.tiles[y][x].type;
        return t === this.GRASS || t === this.PLANT;
    }

    // Konwersja współrzędnych gridu na piksele ekranu
    gridToPixel(x, y, offsetX, offsetY) {
        return {
            px: offsetX + x * this.tileSize,
            py: offsetY + y * this.tileSize,
        };
    }

    // Rysowanie całej planszy
    // offsetX, offsetY — lewy górny róg planszy
    // time             — Date.now()/1000, potrzebne do animacji wody
    // frogX, frogY     — pozycja gracza (opcjonalne, możesz rysować żabkę osobno)
    draw(ctx, offsetX = 0, offsetY = 0, time = 0) {
        // Rysuj od dołu do góry żeby ścianka dolnego rzędu nie przykrywała kafelków
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

        // --- Ścianka boczna (tylko dolny rząd) ---
        if (isBottomRow) {
            // Ciemna podstawa
            ctx.fillStyle = c.dark;
            ctx.fillRect(x, y + TH, TW, SD);

            // Jaśniejszy środkowy pasek dirt
            ctx.fillStyle = c.side;
            ctx.fillRect(x + 1, y + TH + 2, TW - 2, SD - 4);

            // Outline ścianki
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y + TH, TW, SD);
        }

        // --- Topface ---
        ctx.fillStyle = c.top;
        ctx.fillRect(x, y, TW, TH);

        // --- Siatka / outline ---
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, TW, TH);

        // --- Dekoracje per typ ---
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
        // Pad (zielone kółko z wycięciem)
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.arc(x + TW / 2, y + TH / 2, 14, 0, Math.PI * 2);
        ctx.fill();
        // Wycięcie klina
        ctx.fillStyle = this.colors.lily.top;
        ctx.beginPath();
        ctx.moveTo(x + TW / 2, y + TH / 2);
        ctx.lineTo(x + TW / 2 + 14, y + TH / 2);
        ctx.arc(x + TW / 2, y + TH / 2, 14, 0, Math.PI * 0.5);
        ctx.closePath();
        ctx.fill();
        // Kwiatek
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(x + TW / 2 - 2, y + TH / 2 - 2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f9ca24';
        ctx.beginPath();
        ctx.arc(x + TW / 2 - 2, y + TH / 2 - 2, 2, 0, Math.PI * 2);
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
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx - 2, by - 6);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(bx + 4, by + 4);
            ctx.lineTo(bx + 2, by - 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    _drawPlant(ctx, x, y, TW, TH) {
        ctx.save();
        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.arc(x + TW / 2, y + TH / 2, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.arc(x + TW / 2 - 5, y + TH / 2 - 5, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + TW / 2 + 5, y + TH / 2 - 3, 6, 0, Math.PI * 2);
        ctx.fill();
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