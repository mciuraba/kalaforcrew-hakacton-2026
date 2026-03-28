// firebase.js
firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.database();

const FB = (() => {
  let myId = null;

    async function initMap() {
        const snap = await db.ref('mapSeed').once('value');
        let seed = snap.val();
        
        if (!seed) {
            // Pierwszy gracz generuje seed
            seed = Math.floor(Math.random() * 1000000);
            await db.ref('mapSeed').set(seed);
        }
        
        return seed;
    }

    async function join(name, spriteIndex) {
        myId = `frog_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const data = { name, spriteIndex, x: 5, y: 5, message: '', messageTime: 0 };

        const ref = db.ref(`frogs/${myId}`);
        ref.set(data);
        ref.onDisconnect().remove();

        db.ref('frogs').on('value', snapshot => {
            const frogs = snapshot.val() || {};
            updatePlayerCount(Object.keys(frogs).length);
            if (typeof GAME !== 'undefined') GAME.renderFrogs(frogs, myId);
        });

        // Pobierz seed i zwróć go
        const seed = await initMap();
        return { id: myId, seed };
    }

  let lastUpdate = 0;
  function updatePosition(x, y) {
    const now = Date.now();
    if (now - lastUpdate < 100) return;
    lastUpdate = now;
    if (!myId) return;
    db.ref(`frogs/${myId}`).update({ x, y });
  }

  function sendMessage() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg || !myId) return;
    input.value = '';
    db.ref(`frogs/${myId}`).update({ message: msg, messageTime: Date.now() });
    setTimeout(() => {
      db.ref(`frogs/${myId}`).update({ message: '', messageTime: 0 });
    }, 4000);
  }

  function updatePlayerCount(count) {
    const el = document.getElementById('player-count');
    if (el) el.textContent = `${count} / 10`;
  }

  async function isFull() {
    const snap = await db.ref('frogs').once('value');
    return Object.keys(snap.val() || {}).length >= 10;
  }

  return { join, updatePosition, sendMessage, isFull };
})();