// Dostępne żabki
const FROGS = [
    { id: 'blueblue', name: 'Niebieska-Niebieska', folder: 'BlueBlue', file: 'ToxicFrogBlueBlue_Idle.png' },
    { id: 'bluebrown', name: 'Niebieska-Brązowa', folder: 'BlueBrown', file: 'ToxicFrogBlueBrown_Idle.png' },
    { id: 'greenblue', name: 'Zielona-Niebieska', folder: 'GreenBlue', file: 'ToxicFrogGreenBlue_Idle.png' },
    { id: 'greenbrown', name: 'Zielona-Brązowa', folder: 'GreenBrown', file: 'ToxicFrogGreenBrown_Idle.png' },
    { id: 'purpleblue', name: 'Fioletowa-Niebieska', folder: 'PurpleBlue', file: 'ToxicFrogPurpleBlue_Idle.png' },
    { id: 'purplewhite', name: 'Fioletowa-Biała', folder: 'PurpleWhite', file: 'ToxicFrogPurpleWhite_Idle.png' }
];

const COOKIE_NAME = 'playerData';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 dni

let selectedFrogId = null;

// Cookie functions
function setCookie(name, value, maxAge) {
    const cookieString = `${name}=${encodeURIComponent(JSON.stringify(value))}; max-age=${maxAge}; path=/`;
    document.cookie = cookieString;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');
    
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.indexOf(nameEQ) === 0) {
            try {
                return JSON.parse(decodeURIComponent(cookie.substring(nameEQ.length)));
            } catch (e) {
                return null;
            }
        }
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = `${name}=; max-age=0; path=/`;
}

// Generate unique player ID
function generatePlayerId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000);
    return `PLAYER_${timestamp}_${random}`;
}

// Create Phaser scene for frog preview
function createFrogScene(frog) {
    return {
        key: `scene_${frog.id}`,
        preload: function() {
            const imagePath = `../ToxicFrog/${frog.folder}/${frog.file}`;
            this.load.spritesheet(frog.id, imagePath, {
                frameWidth: 48,
                frameHeight: 48
            });
        },
        create: function() {
            // Display frame 3 (middle frame from the 7 frames)
            this.add.image(75, 50, frog.id, 3).setScale(3);
        }
    };
}

// Initialize gallery with Phaser previews
function initializeGallery() {
    const gallery = document.getElementById('frogGallery');
    gallery.innerHTML = '';

    FROGS.forEach(frog => {
        const card = document.createElement('div');
        card.className = 'frog-card';
        card.dataset.frogId = frog.id;

        const previewContainer = document.createElement('div');
        previewContainer.id = `preview_${frog.id}`;
        previewContainer.className = 'frog-preview';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'frog-card-name';
        nameDiv.textContent = frog.name;

        const checkmark = document.createElement('div');
        checkmark.className = 'checkmark';
        checkmark.textContent = '✓';

        card.appendChild(checkmark);
        card.appendChild(previewContainer);
        card.appendChild(nameDiv);

        gallery.appendChild(card);

        // Create Phaser game for this frog
        const config = {
            type: Phaser.AUTO,
            width: 150,
            height: 150,
            parent: `preview_${frog.id}`,
            scene: createFrogScene(frog),
            render: {
                pixelArt: true,
                antialias: false
            }
        };

        new Phaser.Game(config);

        card.addEventListener('click', () => selectFrog(frog.id));
    });
}

// Select frog
function selectFrog(frogId) {
    // Remove previous selection
    document.querySelectorAll('.frog-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Add selection to clicked card
    document.querySelector(`[data-frog-id="${frogId}"]`).classList.add('selected');
    selectedFrogId = frogId;

    // Enable start button if nickname is filled
    updateButtonState();
}

// Update button state
function updateButtonState() {
    const nickname = document.getElementById('nicknameInput').value.trim();
    const startBtn = document.getElementById('startBtn');
    
    startBtn.disabled = !(nickname.length > 0 && selectedFrogId);
}

// Handle start button
function startGame() {
    const nickname = document.getElementById('nicknameInput').value.trim();
    const errorMessage = document.getElementById('errorMessage');
    
    // Validation
    if (!nickname) {
        errorMessage.textContent = 'Proszę wpisać nickname!';
        return;
    }

    if (!selectedFrogId) {
        errorMessage.textContent = 'Proszę wybrać żabkę!';
        return;
    }

    if (nickname.length > 20) {
        errorMessage.textContent = 'Nickname nie może być dłuższy niż 20 znaków!';
        return;
    }

    // Generate ID
    const playerId = generatePlayerId();

    // Find selected frog
    const selectedFrog = FROGS.find(f => f.id === selectedFrogId);

    // Create player data
    const playerData = {
        playerId: playerId,
        nickname: nickname,
        frogId: selectedFrogId,
        frogName: selectedFrog.name,
        frogFolder: selectedFrog.folder,
        createdAt: new Date().toISOString()
    };

    console.log('Zapisane dane gracza:', playerData);

    // Save to cookie
    setCookie(COOKIE_NAME, playerData, COOKIE_MAX_AGE);

    // Clear messages
    errorMessage.textContent = '';

    // Show success message
    const successMsg = document.getElementById('successMessage');
    successMsg.style.display = 'block';
    successMsg.textContent = `✓ Witaj ${nickname}! (ID: ${playerId})`;

    // Simulate game start after delay
    setTimeout(() => {
        console.log('Rozpoczynanie gry z danymi:', playerData);
        // Tutaj możesz dodać kod przechodzący do gry
        // window.location.href = '../game.html';
    }, 2000);
}

// Reset form
function resetForm() {
    document.getElementById('nicknameInput').value = '';
    document.querySelectorAll('.frog-card').forEach(card => {
        card.classList.remove('selected');
    });
    selectedFrogId = null;
    document.getElementById('errorMessage').textContent = '';
    document.getElementById('successMessage').style.display = 'none';
    updateButtonState();
    deleteCookie(COOKIE_NAME);
    console.log('Formularz wyczyszczony, ciasteczko usunięte');
}

// Load saved data
function loadSavedData() {
    const saved = getCookie(COOKIE_NAME);
    
    if (saved) {
        console.log('Znaleziono zapisane dane:', saved);
        document.getElementById('nicknameInput').value = saved.nickname;
        selectFrog(saved.frogId);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeGallery();
    loadSavedData();

    document.getElementById('nicknameInput').addEventListener('input', updateButtonState);
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('resetBtn').addEventListener('click', resetForm);

    // Allow Enter key to start game
    document.getElementById('nicknameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !document.getElementById('startBtn').disabled) {
            startGame();
        }
    });
});
