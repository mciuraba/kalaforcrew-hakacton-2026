// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let board = null;
// board.tileSize = Math.min(canvas.width, canvas.height) / board.gridSize;

const player = { x: 4, y: 4, name: 'Frog', spriteIndex: 0 };
let allFrogs = {};
let myId = null;

const FROG_COLORS = ['#00ff88', '#ff6644', '#4488ff', '#ffdd00', '#ff44bb'];

// ✅ 1 klawisz = 1 ruch (keydown z e.repeat guard)
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (document.activeElement.tagName === 'INPUT') return;

  let { x, y } = player;
  if (e.key === 'ArrowUp'    || e.key === 'w') y--;
  if (e.key === 'ArrowDown'  || e.key === 's') y++;
  if (e.key === 'ArrowLeft'  || e.key === 'a') x--;
  if (e.key === 'ArrowRight' || e.key === 'd') x++;

  if (board.canWalk(x, y)) {
    player.x = x;
    player.y = y;
    if (typeof FB !== 'undefined' && myId) {
      FB.updatePosition(x, y);
    }
  }
});

// Enter = wyślij wiadomość
window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.activeElement.id === 'chat-input') {
    FB.sendMessage();
  }
});

// Wywoływane przez Firebase gdy dane się zmieniają
function renderFrogs(frogs, id) {
  allFrogs = frogs;
  myId = id;
}

function draw() {
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!board) return;

  board.draw(ctx, 0, 0, Date.now() / 1000);

  // Rysuj innych graczy z Firebase
  Object.entries(allFrogs).forEach(([id, frog]) => {
    drawFrog(frog, id === myId);
  });

  // Jeśli nie ma Firebase — rysuj lokalnego gracza
  if (!myId) drawFrog(player, true);
}

function drawFrog(frog, isMe) {
  const ts = board.tileSize;
  const { px, py } = board.gridToPixel(frog.x, frog.y, 0, 0);
  const cx = px + ts / 2;
  const cy = py + ts / 2;

  // Podświetlenie własnej żaby
  if (isMe) {
    ctx.fillStyle = 'rgba(255,255,100,0.25)';
    ctx.fillRect(px, py, ts, ts);
  }

  // Cień
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + ts / 3, ts / 3, ts / 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Emoji żaby (lub kolor jeśli brak sprite)
  ctx.font = `bold ${Math.floor(ts * 0.6)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🐸', cx, cy);

  // Imię
  ctx.fillStyle = isMe ? '#FFD700' : '#ffffff';
  ctx.font = `bold ${Math.floor(ts * 0.18)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(frog.name || 'Frog', cx, py + 4);

  // Chat bubble
  const msgAge = Date.now() - (frog.messageTime || 0);
  if (frog.message && msgAge < 4000) {
    drawBubble(cx, py, frog.message, ts);
  }
}

function drawBubble(x, y, text, ts) {
  const padding = 6;
  ctx.font = `bold ${Math.floor(ts * 0.16)}px monospace`;
  const w = ctx.measureText(text).width + padding * 2;
  const h = 18;
  const bx = x - w / 2;
  const by = y - h - 4;

  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(bx, by, w, h);
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx, by, w, h);
  ctx.fillStyle = '#00ff88';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(text, x, by + 3);
}

function gameLoop() {
  draw();
  requestAnimationFrame(gameLoop);
}

// Do testów przypisywanie lokalnego ID
window.onload = async () => {
    const { id, seed } = await FB.join("Kermit", 0);
    myId = id;
    player.name = "Kermit";
    
    // Stwórz planszę z seedem z Firebase
    board = new Board(10, Math.min(canvas.width, canvas.height) / 10, seed);
    board.tileSize = Math.min(canvas.width, canvas.height) / board.gridSize;
};


gameLoop();

// Eksport dla Firebase i UI
const GAME = { renderFrogs };