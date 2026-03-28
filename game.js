// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ============================================================
// CONFIG
// ============================================================
// Na górze game.js zmień CONFIG
const PROXIMITY_RANGE = 3;
const GRID_SIZE = 30;
const TILE_SIZE = 40; // mniejszy tile żeby więcej było widać
// ============================================================

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.imageSmoothingEnabled = false;
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
  ctx.fillStyle = '#1a2e1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!board) return;

  const ts = board.tileSize;
  // Kamera centrowana na graczu
  const camX = Math.floor(canvas.width/2  - player.x * ts - ts/2);
  const camY = Math.floor(canvas.height/2 - player.y * ts - ts/2);

  board.draw(ctx, camX, camY, Date.now() / 1000);

  Object.entries(allFrogs).forEach(([id, frog]) => {
    const isMe = id === myId;
    const myFrog = allFrogs[myId] || player;
    const nearby = isMe || isNearby(myFrog, frog);
    drawFrog(frog, isMe, nearby, camX, camY);
  });

  if (!myId) drawFrog(player, true, true, camX, camY);
}
function drawFrog(frog, isMe, nearby, camX, camY) {
  if (!board) return;
  const ts = board.tileSize;
  const px = camX + frog.x * ts;
  const py = camY + frog.y * ts;
  const cx = px + ts / 2;
  const cy = py + ts / 2;

  // Podświetlenie własnej żaby
  if (isMe) {
    ctx.fillStyle = 'rgba(255,255,100,0.35)';
    ctx.fillRect(px - 4, py - 4, ts + 8, ts + 8);
  }

  // Cień
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + ts * 0.38, ts * 0.32, ts * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Żaba — większa (ts * 0.85 zamiast 0.6)
  ctx.font = `${Math.floor(ts * 0.85)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🐸', cx, cy);

  // Imię — czarny outline żeby było widać na każdym tle
  const nameSize = Math.max(11, Math.floor(ts * 0.22));
  ctx.font = `bold ${nameSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  // Outline
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeText(frog.name || 'Frog', cx, py - 2);
  // Fill
  ctx.fillStyle = isMe ? '#FFD700' : '#ffffff';
  ctx.fillText(frog.name || 'Frog', cx, py - 2);

  // Chat bubble
  const msgAge = Date.now() - (frog.messageTime || 0);
  if (nearby && frog.message && msgAge < 4000) {
    drawBubble(cx, py, frog.message, ts);
  }
}

function drawBubble(x, y, text, ts) {
  const fontSize = Math.max(13, Math.floor(ts * 0.28)); // dużo większy font
  ctx.font = `bold ${fontSize}px monospace`;

  const padding = 10;
  const w = ctx.measureText(text).width + padding * 2;
  const h = fontSize + 14;
  const bx = x - w / 2;
  const by = y - h - 36; // wyżej nad żabą

  // Tło z zaokrąglonymi rogami
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  roundRect(ctx, bx, by, w, h, 6);
  ctx.fill();

  // Zielona ramka
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 2;
  roundRect(ctx, bx, by, w, h, 6);
  ctx.stroke();

  // Trójkąt wskazujący na żabę
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.beginPath();
  ctx.moveTo(x - 6, by + h);
  ctx.lineTo(x + 6, by + h);
  ctx.lineTo(x, by + h + 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 6, by + h);
  ctx.lineTo(x, by + h + 8);
  ctx.lineTo(x + 6, by + h);
  ctx.stroke();

  // Tekst
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, by + h / 2);
}

// Helper do zaokrąglonych prostokątów
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
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
  // Spawn w rogu gdzie jest trawa, nie w środku stawu
  player.x = 2;
  player.y = 2;

  const { id, seed } = await FB.join(player.name, player.spriteIndex);
  myId = id;

  board = new Board(GRID_SIZE, TILE_SIZE, seed);
};

window.addEventListener('beforeunload', () => {
    localStorage.removeItem('frogPlayer');
});

gameLoop();

const GAME = { renderFrogs };

