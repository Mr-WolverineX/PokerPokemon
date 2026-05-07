// Configuración del juego
const INITIAL_MONEY = 1000;
const MIN_BET = 10;

// Estado del juego
let playerMoney = INITIAL_MONEY;
let houseMoney = INITIAL_MONEY; // Dinero de la casa
let pot = 0;
let currentBet = 0;
let playerHand = []; // 5 cartas del jugador
let communityCards = []; // 5 cartas comunitarias (PokéCartas)
let deck = [];
let gameInProgress = false;
let gamePhase = 0; // 0: inicio, 1: flop (3 cartas), 2: turn (4 cartas), 3: river (5 cartas)

// Pokémon por tipo con sus IDs de la PokéAPI
const pokemonCards = {
    fire: [
        {name: 'Charizard', id: 6},
        {name: 'Arcanine', id: 59},
        {name: 'Flareon', id: 136},
        {name: 'Ninetales', id: 38},
        {name: 'Rapidash', id: 78},
        {name: 'Magmar', id: 126},
        {name: 'Moltres', id: 146},
        {name: 'Typhlosion', id: 157},
        {name: 'Blaziken', id: 257},
        {name: 'Infernape', id: 392},
        {name: 'Emboar', id: 500},
        {name: 'Torchic', id: 255},
        {name: 'Cyndaquil', id: 155}
    ],
    water: [
        {name: 'Blastoise', id: 9},
        {name: 'Gyarados', id: 130},
        {name: 'Vaporeon', id: 134},
        {name: 'Lapras', id: 131},
        {name: 'Starmie', id: 121},
        {name: 'Kingdra', id: 230},
        {name: 'Suicune', id: 245},
        {name: 'Feraligatr', id: 160},
        {name: 'Swampert', id: 260},
        {name: 'Empoleon', id: 395},
        {name: 'Samurott', id: 503},
        {name: 'Greninja', id: 658},
        {name: 'Squirtle', id: 7}
    ],
    grass: [
        {name: 'Venusaur', id: 3},
        {name: 'Vileplume', id: 45},
        {name: 'Victreebel', id: 71},
        {name: 'Exeggutor', id: 103},
        {name: 'Tangrowth', id: 465},
        {name: 'Meganium', id: 154},
        {name: 'Sceptile', id: 254},
        {name: 'Torterra', id: 389},
        {name: 'Serperior', id: 497},
        {name: 'Bulbasaur', id: 1},
        {name: 'Leafeon', id: 470},
        {name: 'Chikorita', id: 152},
        {name: 'Treecko', id: 252}
    ],
    electric: [
        {name: 'Pikachu', id: 25},
        {name: 'Raichu', id: 26},
        {name: 'Magneton', id: 82},
        {name: 'Electabuzz', id: 125},
        {name: 'Jolteon', id: 135},
        {name: 'Zapdos', id: 145},
        {name: 'Ampharos', id: 181},
        {name: 'Raikou', id: 243},
        {name: 'Manectric', id: 310},
        {name: 'Luxray', id: 405},
        {name: 'Emolga', id: 587},
        {name: 'Dedenne', id: 702},
        {name: 'Pachirisu', id: 417}
    ],
    psychic: [
        {name: 'Alakazam', id: 65},
        {name: 'Hypno', id: 97},
        {name: 'Espeon', id: 196},
        {name: 'Mewtwo', id: 150},
        {name: 'Mew', id: 151},
        {name: 'Lugia', id: 249},
        {name: 'Gardevoir', id: 282},
        {name: 'Metagross', id: 376},
        {name: 'Latios', id: 381},
        {name: 'Gallade', id: 475},
        {name: 'Reuniclus', id: 579},
        {name: 'Abra', id: 63},
        {name: 'Ralts', id: 280}
    ]
};

// Crear mazo
function createDeck() {
    const suits = ['fire', 'water', 'grass', 'electric', 'psychic'];
    const suitSymbols = {
        fire: '🔥',
        water: '💧',
        grass: '🍃',
        electric: '⚡',
        psychic: '🔮'
    };
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    deck = [];
    suits.forEach(suit => {
        values.forEach((value, index) => {
            const pokemon = pokemonCards[suit][index % pokemonCards[suit].length];
            deck.push({
                suit: suit,
                suitSymbol: suitSymbols[suit],
                value: value,
                numValue: index + 1,
                pokemonName: pokemon.name,
                pokemonId: pokemon.id,
                imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
            });
        });
    });
    
    // Mezclar el mazo
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// Repartir cartas iniciales (5 cartas al jugador)
function dealInitialCards() {
    playerHand = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];
    communityCards = [];
    gamePhase = 0;
}

// Repartir el Flop (3 cartas comunitarias)
function dealFlop() {
    deck.pop(); // Quemar una carta (tradición del poker)
    communityCards = [deck.pop(), deck.pop(), deck.pop()];
    gamePhase = 1;
}

// Repartir el Turn (4ta carta comunitaria)
function dealTurn() {
    deck.pop(); // Quemar una carta
    communityCards.push(deck.pop());
    gamePhase = 2;
}

// Repartir el River (5ta carta comunitaria)
function dealRiver() {
    deck.pop(); // Quemar una carta
    communityCards.push(deck.pop());
    gamePhase = 3;
}

// Evaluar la mejor mano usando las cartas del jugador y las PokéCartas
function evaluatePlayerHand() {
    // El jugador usa sus 5 cartas para formar su mano
    return evaluateHand(playerHand);
}

// Evaluar las PokéCartas comunitarias
function evaluateCommunityHand() {
    // Las PokéCartas se evalúan como una mano completa
    if (communityCards.length === 5) {
        return evaluateHand(communityCards);
    }
    return { rank: 0, name: 'Incompleto' };
}

// Mostrar carta
function createCardElement(card, hidden = false) {
    const cardDiv = document.createElement('div');
    cardDiv.className = `card ${hidden ? 'back' : card.suit}`;
    
    if (hidden) {
        cardDiv.innerHTML = `
            <div style="font-size: 2em;">🎴</div>
            <div style="font-size: 0.8em;">Pokémon</div>
        `;
    } else {
        cardDiv.innerHTML = `
            <div class="card-value">${card.value}</div>
            <div class="card-suit">${card.suitSymbol}</div>
            <img src="${card.imageUrl}" alt="${card.pokemonName}" class="card-image" onerror="this.style.display='none'">
            <div class="card-pokemon">${card.pokemonName}</div>
        `;
    }
    
    return cardDiv;
}

// Mostrar manos y PokéCartas
function displayHands() {
    const playerCardsDiv = document.getElementById('playerCards');
    const communityCardsDiv = document.getElementById('communityCards');
    
    playerCardsDiv.innerHTML = '';
    communityCardsDiv.innerHTML = '';
    
    // Mostrar cartas del jugador
    playerHand.forEach(card => {
        playerCardsDiv.appendChild(createCardElement(card));
    });
    
    // Mostrar PokéCartas comunitarias
    communityCards.forEach(card => {
        communityCardsDiv.appendChild(createCardElement(card));
    });
}

// Evaluar mano de poker
function evaluateHand(hand) {
    const values = hand.map(card => card.numValue).sort((a, b) => a - b);
    const suits = hand.map(card => card.suit);
    
    // Contar valores
    const valueCounts = {};
    values.forEach(v => valueCounts[v] = (valueCounts[v] || 0) + 1);
    const counts = Object.values(valueCounts).sort((a, b) => b - a);
    
    // Verificar color (flush)
    const isFlush = suits.every(s => s === suits[0]);
    
    // Verificar escalera (straight)
    let isStraight = true;
    for (let i = 1; i < values.length; i++) {
        if (values[i] !== values[i-1] + 1) {
            isStraight = false;
            break;
        }
    }
    
    // Escalera real
    if (isStraight && isFlush && values[0] === 10) {
        return { rank: 10, name: '🏆 Escalera Real de Color' };
    }
    
    // Escalera de color
    if (isStraight && isFlush) {
        return { rank: 9, name: '💎 Escalera de Color' };
    }
    
    // Poker (4 iguales)
    if (counts[0] === 4) {
        return { rank: 8, name: '🎯 Poker (4 iguales)' };
    }
    
    // Full (3 + 2)
    if (counts[0] === 3 && counts[1] === 2) {
        return { rank: 7, name: '🏠 Full House' };
    }
    
    // Color (flush)
    if (isFlush) {
        return { rank: 6, name: '🌈 Color' };
    }
    
    // Escalera (straight)
    if (isStraight) {
        return { rank: 5, name: '📊 Escalera' };
    }
    
    // Trío (3 iguales)
    if (counts[0] === 3) {
        return { rank: 4, name: '🎲 Trío' };
    }
    
    // Doble par
    if (counts[0] === 2 && counts[1] === 2) {
        return { rank: 3, name: '👥 Doble Par' };
    }
    
    // Par
    if (counts[0] === 2) {
        return { rank: 2, name: '🎴 Par' };
    }
    
    // Carta alta
    return { rank: 1, name: '📄 Carta Alta' };
}

// Mostrar efecto YOU WIN / YOU LOSE
function showWinEffect(isWin) {
    const overlay = document.createElement('div');
    overlay.className = 'win-overlay';
    
    const winText = document.createElement('div');
    winText.className = isWin ? 'win-text' : 'lose-text';
    winText.textContent = isWin ? 'YOU WIN!' : 'YOU LOSE';
    
    overlay.appendChild(winText);
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 500);
    }, 2500);
}

// Determinar ganador
function determineWinner() {
    const playerResult = evaluatePlayerHand();
    const communityResult = evaluateCommunityHand();
    
    document.getElementById('playerResult').textContent = `Tu mano: ${playerResult.name}`;
    
    let message = '';
    let winner = '';
    
    if (playerResult.rank > communityResult.rank) {
        playerMoney += pot;
        message = `🎉 ¡Ganaste! ${playerResult.name} supera a las PokéCartas (${communityResult.name}). Ganaste ${pot}`;
        winner = 'player';
        showWinEffect(true);
    } else if (communityResult.rank > playerResult.rank) {
        houseMoney += pot;
        message = `😢 Perdiste. Las PokéCartas (${communityResult.name}) superan tu ${playerResult.name}. Perdiste ${pot}`;
        winner = 'house';
        showWinEffect(false);
    } else {
        // Empate - devolver apuesta
        playerMoney += pot;
        message = `🤝 Empate con ${playerResult.name}. Apuesta devuelta.`;
        winner = 'tie';
    }
    
    addToHistory(winner, pot, playerResult.name, communityResult.name);
    pot = 0;
    updateDisplay();
    document.getElementById('gameMessage').textContent = message;
    
    // Verificar si el jugador se quedó sin dinero
    if (playerMoney <= 0) {
        setTimeout(() => {
            alert('😢 Te quedaste sin dinero. Fin del juego.');
            resetGame();
        }, 3000);
    }
}

// Agregar al historial
function addToHistory(winner, amount, playerHandName, communityHandName) {
    const historyList = document.getElementById('historyList');
    const historyItem = document.createElement('div');
    historyItem.className = `history-item ${winner === 'player' ? 'player-win' : winner === 'house' ? 'computer-win' : 'tie'}`;
    
    const winnerText = winner === 'player' ? '👤 Ganaste' : winner === 'house' ? '🎩 Casa Gana' : '🤝 Empate';
    
    historyItem.innerHTML = `
        <span>${winnerText} - ${amount}</span>
        <span style="font-size: 0.8em;">${playerHandName} vs ${communityHandName}</span>
    `;
    
    historyList.insertBefore(historyItem, historyList.firstChild);
    
    // Mantener solo las últimas 10 entradas
    while (historyList.children.length > 10) {
        historyList.removeChild(historyList.lastChild);
    }
}

// Sistema de Ranking
function loadRankings() {
    const rankings = localStorage.getItem('pokemonPokerRankings');
    return rankings ? JSON.parse(rankings) : [];
}

function saveRankings(rankings) {
    localStorage.setItem('pokemonPokerRankings', JSON.stringify(rankings));
}

function updateRankingDisplay() {
    const rankings = loadRankings();
    rankings.sort((a, b) => b.money - a.money);
    
    // Actualizar Top 3
    for (let i = 1; i <= 3; i++) {
        const nameEl = document.getElementById(`rank${i}Name`);
        const moneyEl = document.getElementById(`rank${i}Money`);
        
        if (rankings[i - 1]) {
            nameEl.textContent = rankings[i - 1].name;
            moneyEl.textContent = `${rankings[i - 1].money}`;
        } else {
            nameEl.textContent = '---';
            moneyEl.textContent = '$0';
        }
    }
}

function showTop10() {
    const rankings = loadRankings();
    rankings.sort((a, b) => b.money - a.money);
    const top10 = rankings.slice(0, 10);
    
    const top10List = document.getElementById('top10List');
    top10List.innerHTML = '';
    
    if (top10.length === 0) {
        top10List.innerHTML = '<p style="text-align: center; color: #ffd700; padding: 20px;">No hay puntuaciones guardadas aún.</p>';
        return;
    }
    
    top10.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = `top10-item ${index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : ''}`;
        
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        
        item.innerHTML = `
            <span class="top10-rank">${medal} #${index + 1}</span>
            <span class="top10-name">${player.name}</span>
            <span class="top10-money">${player.money}</span>
        `;
        
        top10List.appendChild(item);
    });
}

function savePlayerScore() {
    const nameInput = document.getElementById('playerNameInput');
    const playerName = nameInput.value.trim();
    
    if (!playerName) {
        alert('Por favor ingresa tu nombre');
        return;
    }
    
    const rankings = loadRankings();
    rankings.push({
        name: playerName,
        money: playerMoney,
        date: new Date().toISOString()
    });
    
    saveRankings(rankings);
    updateRankingDisplay();
    showTop10();
    
    nameInput.value = '';
    alert(`¡Puntuación guardada! ${playerName}: ${playerMoney}`);
}

// Actualizar display
function updateDisplay() {
    document.getElementById('playerMoney').textContent = `${playerMoney}`;
    document.getElementById('potAmount').textContent = `${pot}`;
}

// Resetear juego
function resetGame() {
    playerMoney = INITIAL_MONEY;
    houseMoney = INITIAL_MONEY;
    pot = 0;
    gameInProgress = false;
    gamePhase = 0;
    playerHand = [];
    communityCards = [];
    document.getElementById('historyList').innerHTML = '';
    document.getElementById('playerCards').innerHTML = '';
    document.getElementById('communityCards').innerHTML = '';
    document.getElementById('playerResult').textContent = '';
    updateDisplay();
    enableDealButton();
}

// Habilitar/deshabilitar botones
function enableDealButton() {
    document.getElementById('dealBtn').disabled = false;
    document.getElementById('foldBtn').disabled = true;
    document.getElementById('callBtn').disabled = true;
    document.getElementById('raiseBtn').disabled = true;
}

function enableActionButtons() {
    document.getElementById('dealBtn').disabled = true;
    document.getElementById('foldBtn').disabled = false;
    document.getElementById('callBtn').disabled = false;
    document.getElementById('raiseBtn').disabled = false;
}

// Event Listeners
document.getElementById('dealBtn').addEventListener('click', () => {
    const betAmount = parseInt(document.getElementById('betAmount').value);
    
    if (betAmount < MIN_BET) {
        alert(`La apuesta mínima es ${MIN_BET}`);
        return;
    }
    
    if (betAmount > playerMoney) {
        alert('No hay suficiente dinero para esta apuesta');
        return;
    }
    
    // Iniciar nueva ronda
    createDeck();
    dealInitialCards();
    
    // Apuesta inicial
    playerMoney -= betAmount;
    pot = betAmount;
    currentBet = betAmount;
    
    gameInProgress = true;
    
    displayHands(false);
    updateDisplay();
    
    document.getElementById('playerResult').textContent = '';
    document.getElementById('gameMessage').textContent = '🎴 Tienes 5 cartas. Presiona Igualar para ver el Flop (3 PokéCartas)';
    
    enableActionButtons();
});

document.getElementById('foldBtn').addEventListener('click', () => {
    houseMoney += pot;
    pot = 0;
    
    document.getElementById('gameMessage').textContent = '😔 Te retiraste. La casa gana el bote.';
    displayHands();
    updateDisplay();
    
    gameInProgress = false;
    enableDealButton();
});

document.getElementById('callBtn').addEventListener('click', () => {
    if (gamePhase === 0) {
        // Pre-Flop: Repartir el Flop (3 PokéCartas)
        document.getElementById('gameMessage').textContent = '🎴 Repartiendo el FLOP (3 PokéCartas)...';
        setTimeout(() => {
            dealFlop();
            displayHands();
            document.getElementById('gameMessage').textContent = '🔥 FLOP: 3 PokéCartas reveladas. ¿Continuar al Turn?';
        }, 800);
    } else if (gamePhase === 1) {
        // Flop: Repartir el Turn (4ta PokéCarta)
        document.getElementById('gameMessage').textContent = '🎴 Repartiendo el TURN (4ta Pok��Carta)...';
        setTimeout(() => {
            dealTurn();
            displayHands();
            document.getElementById('gameMessage').textContent = '⚡ TURN: 4 PokéCartas reveladas. ¿Continuar al River?';
        }, 800);
    } else if (gamePhase === 2) {
        // Turn: Repartir el River (5ta PokéCarta)
        document.getElementById('gameMessage').textContent = '🎴 Repartiendo el RIVER (5ta PokéCarta)...';
        setTimeout(() => {
            dealRiver();
            displayHands();
            document.getElementById('gameMessage').textContent = '💎 RIVER: 5 PokéCartas completas. ¡Última decisión!';
        }, 800);
    } else if (gamePhase === 3) {
        // River: Determinar ganador
        document.getElementById('gameMessage').textContent = '🎴 Evaluando manos...';
        
        setTimeout(() => {
            determineWinner();
            gameInProgress = false;
            gamePhase = 0;
            enableDealButton();
        }, 1500);
    }
});

document.getElementById('raiseBtn').addEventListener('click', () => {
    const raiseAmount = currentBet;
    
    if (raiseAmount > playerMoney) {
        alert('No hay suficiente dinero para subir la apuesta');
        return;
    }
    
    playerMoney -= raiseAmount;
    pot += raiseAmount;
    
    updateDisplay();
    
    document.getElementById('gameMessage').textContent = `⬆️ Subiste ${raiseAmount}. Repartiendo...`;
    
    // Después de subir, continuar repartiendo cartas
    setTimeout(() => {
        if (gamePhase === 0) {
            dealFlop();
            displayHands();
            document.getElementById('gameMessage').textContent = '🔥 FLOP: 3 PokéCartas. ¿Continuar?';
        } else if (gamePhase === 1) {
            dealTurn();
            displayHands();
            document.getElementById('gameMessage').textContent = '⚡ TURN: 4 PokéCartas. ¿Continuar?';
        } else if (gamePhase === 2) {
            dealRiver();
            displayHands();
            document.getElementById('gameMessage').textContent = '💎 RIVER: 5 PokéCartas. ¡Última decisión!';
        } else if (gamePhase === 3) {
            setTimeout(() => {
                determineWinner();
                gameInProgress = false;
                gamePhase = 0;
                enableDealButton();
            }, 1500);
        }
    }, 1500);
});

// Control del Modal de Ranking de Manos
const modal = document.getElementById('rankingModal');
const helpBtn = document.getElementById('helpBtn');
const closeModal = document.querySelector('.close-modal');

helpBtn.addEventListener('click', () => {
    modal.classList.add('show');
});

closeModal.addEventListener('click', () => {
    modal.classList.remove('show');
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.classList.remove('show');
    }
});

// Control del Modal de Top 10
const top10Modal = document.getElementById('top10Modal');
const showFullRankingBtn = document.getElementById('showFullRankingBtn');
const closeTop10 = document.querySelector('.close-top10');

showFullRankingBtn.addEventListener('click', () => {
    showTop10();
    top10Modal.classList.add('show');
});

closeTop10.addEventListener('click', () => {
    top10Modal.classList.remove('show');
});

window.addEventListener('click', (event) => {
    if (event.target === top10Modal) {
        top10Modal.classList.remove('show');
    }
});

// Guardar puntuación
document.getElementById('saveScoreBtn').addEventListener('click', savePlayerScore);

// Permitir guardar con Enter
document.getElementById('playerNameInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        savePlayerScore();
    }
});

// Inicializar juego
updateDisplay();
updateRankingDisplay();
document.getElementById('gameMessage').textContent = 'Presiona "Repartir" para comenzar la partida';
