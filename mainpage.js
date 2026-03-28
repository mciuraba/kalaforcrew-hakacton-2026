// ============================================================
// ZARZĄDZANIE CIASTECZKAMI
// ============================================================

/**
 * Ustaw ciasteczko z określoną wartością i czasem ważności
 * @param {string} name - Nazwa ciasteczka
 * @param {string} value - Wartość ciasteczka
 * @param {number} days - Liczba dni ważności (domyślnie 365)
 */
function setCookie(name, value, days = 365) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
}

/**
 * Pobierz wartość ciasteczka
 * @param {string} name - Nazwa ciasteczka
 * @returns {string|null} Wartość ciasteczka lub null
 */
function getCookie(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.indexOf(nameEQ) === 0) {
            return decodeURIComponent(cookie.substring(nameEQ.length));
        }
    }
    return null;
}

// ============================================================
// GENEROWANIE UNIKALNEGO ID
// ============================================================

/**
 * Wygeneruj unikalny identyfikator użytkownika (UUID v4)
 * @returns {string} UUID v4
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ============================================================
// INICJALIZACJA STRONY
// ============================================================

// Zmienna przechowująca wybrane dane
let playerData = {
    nickname: null,
    frogType: null,
    frogName: null,
    playerID: null
};

// Inicjalizuj stronę
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

function initializePage() {
    // Pobranie elementów DOM
    const nicknameInput = document.getElementById('nicknameInput');
    const nicknameForm = document.getElementById('nicknameForm');
    const frogButtons = document.querySelectorAll('.frog-card');
    const infoSection = document.getElementById('infoSection');
    const startGameBtn = document.getElementById('startGameBtn');

    // Sprawdzenie czy użytkownik już ma zapisane dane w ciasteczku
    const storedPlayerID = getCookie('playerID');
    const storedNickname = getCookie('nickname');
    const storedFrogType = getCookie('frogType');
    const storedFrogName = getCookie('frogName');

    if (storedPlayerID && storedNickname && storedFrogType) {
        // Użytkownik już istnieje - załaduj jego dane
        playerData.playerID = storedPlayerID;
        playerData.nickname = storedNickname;
        playerData.frogType = storedFrogType;
        playerData.frogName = storedFrogName;

        nicknameInput.value = storedNickname;
        // nicknameInput.disabled = true;

        // Podświetl wybraną żabkę
        frogButtons.forEach(button => {
            if (button.dataset.frogType === storedFrogType) {
                button.classList.add('selected');
            }
        });

        // Pokaż sekcję informacyjną
        updateInfoSection();
    } else {
        // Nowy użytkownik - wygeneruj ID
        playerData.playerID = generateUUID();
    }

    // Event listener - zmiana nicku
    nicknameInput.addEventListener('change', function() {
        if (this.value.trim()) {
            playerData.nickname = this.value.trim();
            checkAllDataComplete();
        }
    });

    // Event listener - klik na żabkę
    frogButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Usuń zaznaczenie ze wszystkich przycisków
            frogButtons.forEach(btn => btn.classList.remove('selected'));
            
            // Dodaj zaznaczenie do klikniętego przycisku
            this.classList.add('selected');

            // Zapisz dane wyboru
            playerData.frogType = this.dataset.frogType;
            playerData.frogName = this.dataset.frogName;

            checkAllDataComplete();
        });
    });

    // Event listener - przycisk "Zacznij grę"
    startGameBtn.addEventListener('click', function() {
        savePlayerData();
        
        // Zapisz do localStorage żeby game.js mógł to odczytać
        localStorage.setItem('frogPlayer', JSON.stringify({
            name: playerData.nickname,
            frogType: playerData.frogType,  // np. "GreenBlue"
            spriteIndex: ['BlueBlue','BlueBrown','GreenBlue','GreenBrown','PurpleBlue','PurpleWhite']
                        .indexOf(playerData.frogType)
        }));
        
        // Przekieruj do gry
        window.location.href = 'index.html';
    });
}

/**
 * Sprawdź czy wszystkie dane są kompletne i pokaż sekcję informacyjną
 */
function checkAllDataComplete() {
    if (playerData.nickname && playerData.frogType && playerData.playerID) {
        updateInfoSection();
    }
}

/**
 * Zaktualizuj sekcję z informacjami o graczu
 */
function updateInfoSection() {
    const infoSection = document.getElementById('infoSection');

    if (playerData.nickname && playerData.frogType) {
        document.getElementById('selectedNickname').textContent = playerData.nickname;
        document.getElementById('selectedFrog').textContent = playerData.frogName;
        document.getElementById('playerID').textContent = playerData.playerID;
        
        infoSection.style.display = 'block';  // ← zostaw to
        infoSection.classList.add('visible'); // ← dodaj to dla animacji
    }
}

/**
 * Zapisz dane gracza w ciasteczku
 */
function savePlayerData() {
    if (playerData.nickname && playerData.frogType && playerData.playerID) {
        // Zapisz każdą część danych w osobnym ciasteczku
        setCookie('playerID', playerData.playerID, 365);
        setCookie('nickname', playerData.nickname, 365);
        setCookie('frogType', playerData.frogType, 365);
        setCookie('frogName', playerData.frogName, 365);

        // Alternatywnie - zapisz wszystkie dane w jednym JSON ciasteczku
        const playerDataJSON = JSON.stringify({
            playerID: playerData.playerID,
            nickname: playerData.nickname,
            frogType: playerData.frogType,
            frogName: playerData.frogName,
            timestamp: new Date().toISOString()
        });
        setCookie('playerData', playerDataJSON, 365);

        console.log('✅ Dane gracza zapisane w ciasteczku');
        console.log('📊 Dane gracza:', playerData);
    } else {
        console.error('❌ Nie wszystkie dane są wypełnione');
    }
}

/**
 * Funkcja debugowania - wyświetl wszystkie ciasteczka
 */
function debugCookies() {
    console.log('🍪 CIASTECZKA:');
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
        console.log(cookie.trim());
    });
}

/**
 * Wyczyść wszystkie ciasteczka (do testowania)
 */
function clearAllCookies() {
    document.cookie.split(';').forEach(function(c) {
        document.cookie = c.replace(/^ +/, '')
            .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    console.log('🗑️ Ciasteczka wyczyszczone');
    location.reload();
}