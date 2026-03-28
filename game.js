// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ============================================================
// CONFIG
// ============================================================
const PROXIMITY_RANGE = 2; // ile tilów od gracza żeby widzieć wiadomości
// ============================================================

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let board = null;

const player = { x: 4, y: 4, name: 'Frog', spriteIndex: 0 };
let allFrogs = {};
let myId = null;

const FROG_COLORS = ['#00ff88', '#ff6644', '#4488ff', '#ffdd00', '#ff44bb'];

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (document.activeElement.tagName === 'INPUT') return;

  let { x, y } = player;
  if (e.key === 'ArrowUp'    || e.key === 'w') y--;
  if (e.key === 'ArrowDown'  || e.key === 's') y++;
  if (e.key === 'ArrowLeft'  || e.key === 'a') x--;
  if (e.key === 'ArrowRight' || e.key === 'd') x++;

  if (board && board.canWalk(x, y)) {
    player.x = x;
    player.y = y;
    if (typeof FB !== 'undefined' && myId) {
      FB.updatePosition(x, y);
    }
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.activeElement.id === 'chat-input') {
    FB.sendMessage();
  }
});

function renderFrogs(frogs, id) {
  allFrogs = frogs;
  myId = id;
}

// Sprawdź dystans między dwoma żabami (Manhattan distance)
function isNearby(frogA, frogB) {
  const dist = Math.abs(frogA.x - frogB.x) + Math.abs(frogA.y - frogB.y);
  return dist <= PROXIMITY_RANGE;
}

function draw() {
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!board) return;

  board.draw(ctx, 0, 0, Date.now() / 1000);

  Object.entries(allFrogs).forEach(([id, frog]) => {
    const isMe = id === myId;
    // Znajdź moje dane z allFrogs (nie lokalny player) żeby mieć aktualną pozycję
    const myFrog = allFrogs[myId] || player;
    const nearby = isMe || isNearby(myFrog, frog);
    drawFrog(frog, isMe, nearby);
  });

  if (!myId) drawFrog(player, true, true);
}

function drawFrog(frog, isMe, nearby) {
  if (!board) return;
  const ts = board.tileSize;
  const { px, py } = board.gridToPixel(frog.x, frog.y, 0, 0);
  const cx = px + ts / 2;
  const cy = py + ts / 2;

  if (isMe) {
    ctx.fillStyle = 'rgba(255,255,100,0.25)';
    ctx.fillRect(px, py, ts, ts);
  }

  // Cień
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + ts / 3, ts / 3, ts / 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Żaba
  ctx.font = `bold ${Math.floor(ts * 0.6)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🐸', cx, cy);

  // Imię — zawsze widoczne
  ctx.fillStyle = isMe ? '#FFD700' : '#ffffff';
  ctx.font = `bold ${Math.floor(ts * 0.18)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(frog.name || 'Frog', cx, py + 4);

  // Chat bubble — TYLKO gdy w zasięgu proximity
  const msgAge = Date.now() - (frog.messageTime || 0);
  if (nearby && frog.message && msgAge < 4000) {
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

window.onload = async () => {
  const saved = localStorage.getItem('frogPlayer');
  const playerInfo = saved ? JSON.parse(saved) : { name: 'Anon Frog', spriteIndex: 0 };

  player.name = playerInfo.name;
  player.spriteIndex = playerInfo.spriteIndex;

  const { id, seed } = await FB.join(player.name, player.spriteIndex);
  myId = id;

  board = new Board(10, Math.min(canvas.width, canvas.height) / 10, seed);
  board.tileSize = Math.min(canvas.width, canvas.height) / board.gridSize;
};

window.addEventListener('beforeunload', () => {
    localStorage.removeItem('frogPlayer');
});

gameLoop();

const GAME = { renderFrogs };

