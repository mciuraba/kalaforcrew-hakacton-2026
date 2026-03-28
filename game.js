// Główna logika gry
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Dostosuj canvas do rozmiarów okna
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const board = new Board(10); // Plansza 10x10

// Dynamicznie ustaw tileSize aby mapa zajęła ekran
board.tileSize = Math.min(canvas.width, canvas.height) / board.gridSize;

// Gracz
const player = {
    x: 4,
    y: 4,
    char: '🐸'
};

// Input
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Czy pozycja jest dozwolona (nie woda, nie poza mapą)
function isValidPosition(x, y) {
    if (x < 0 || x >= board.gridSize || y < 0 || y >= board.gridSize) {
        return false;
    }
    return board.canWalk(x, y);
}

// Aktualizacja
function update() {
    // Obsługa inputu
    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        if (isValidPosition(player.x, player.y - 1)) {
            player.y--;
        }
    }
    if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        if (isValidPosition(player.x, player.y + 1)) {
            player.y++;
        }
    }
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        if (isValidPosition(player.x - 1, player.y)) {
            player.x--;
        }
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        if (isValidPosition(player.x + 1, player.y)) {
            player.x++;
        }
    }
}

// Rysowanie
function draw() {
    // Wyczyść canvas
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Rysuj planszę od lewego górnego rogu
    board.draw(ctx, 0, 0, Date.now() / 1000);

    // Rysuj gracza
    const { px, py } = board.gridToPixel(player.x, player.y, 0, 0);
    const cx = px + board.tileSize / 2;
    const cy = py + board.tileSize / 2;

    // Cień gracza
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + board.tileSize / 3, board.tileSize / 3, board.tileSize / 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ikona gracza
    ctx.font = `bold ${Math.floor(board.tileSize * 0.6)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.char, cx, cy);

    // Debugowanie
    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${player.x}, ${player.y}`, 10, 10);
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start gry
gameLoop();
