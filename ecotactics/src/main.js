const defaultValues = [50, 50, 50, 1]; // Umwelt, Geld, Zufriedenheit, Tag

let state = {
    environment: defaultValues[0],
    money: defaultValues[1],
    happiness: defaultValues[2],
    day: defaultValues[3],
    history: []
};

let gameOver = false;
let actions = [];

fetch('actions.json')
    .then(response => response.json())
    .then(data => {
        actions = data.actions;
        resetGame();
        renderActions(actions);
    });

function renderActions(actions) {
    const actionsContainer = document.querySelector('.actions');
    actionsContainer.innerHTML = '';
    const shuffledActions = actions.sort(() => Math.random() - 0.5);
    const todaysActions = shuffledActions.slice(0, 3);
    todaysActions.forEach(action => {
        const button = document.createElement('button');
        button.className = 'action';
        button.innerHTML = `<div class="actionName">${action.name}</div><div class="actionDesc">${action.desc}</div>
        <div class="actionEffects">Effekt: Umwelt ${action.effects.environment > 0 ? '+' : ''}${action.effects.environment}, Geld ${action.effects.money > 0 ? '+' : ''}${action.effects.money}, Zufriedenheit ${action.effects.happiness > 0 ? '+' : ''}${action.effects.happiness}</div>`;
        button.addEventListener('click', () => {
            if (!gameOver) {
                applyAction(action);
                renderActions(actions);
            }
        });
        actionsContainer.appendChild(button);
    });
}

function log(message) {
    const logContainer = document.getElementById('log');
    const entry = document.createElement('div');
    entry.textContent = message;
    logContainer.prepend(entry);
}

function applyAction(action) {

    state.environment = state.environment + action.effects.environment;
    state.money = state.money + action.effects.money;
    state.happiness = state.happiness + action.effects.happiness;
    log(`Tag ${state.day}: Aktion "${action.name}" ausgeführt. Effekte - Umwelt: ${action.effects.environment}, Geld: ${action.effects.money}, Zufriedenheit: ${action.effects.happiness}`);
    nextDay();
    checkGameOver();
    updateUI();
}

function updateUI() {
    document.querySelector('.envCounter').textContent = state.environment;
    document.querySelector('.moneyCounter').textContent = state.money;
    document.querySelector('.happinessCounter').textContent = state.happiness;
    document.querySelector('.day').textContent = "Tag " + state.day;
    document.querySelector('.realEnvBar').style.width = state.environment + '%';
    document.querySelector('.realMoneybar').style.width = state.money + '%';
    document.querySelector('.realHappinessBar').style.width = state.happiness + '%';
}

function checkGameOver() {
    if (state.money <= 0) {
        endGame('Bankrott! Dein Budget ist erschöpft. Spiel vorbei.');
    } else if (state.environment <= 5) {
        endGame('Ökologische Katastrophe! Die Umweltwerte sind zu niedrig. Spiel vorbei.');
    } else if (state.happiness <= 5) {
        endGame('Soziale Unruhe! Zufriedenheit zu niedrig. Spiel vorbei.');
    } else if (state.day >= 30) {
        endGame('Glückwunsch! 30 Tage überstanden — du hast gezeigt, dass Nachhaltigkeit möglich ist.');
    }
}

function nextDay() {
    state.day += 1;

    const rnd = Math.random();
    if (rnd < 0.15) {
        state.environment = state.environment - 8;
        log(`Tag ${state.day - 1}: Regensturm beschädigt Infrastruktur (-8 Umwelt)`);
    } else if (rnd < 0.30) {
        state.money = state.money + 10;
        log(`Tag ${state.day - 1}: Wirtschaftswachstum bringt Einnahmen (+10 Geld)`);
    } else {
    }
    checkGameOver();
    updateUI();
}

function endGame(message) {
    gameOver = true;
    alert(message);
}

function resetGame() {
    document.getElementById('log').innerHTML = '';
    state = {
        environment: defaultValues[0],
        money: defaultValues[1],
        happiness: defaultValues[2],
        day: defaultValues[3],
    };
    gameOver = false;
    renderActions(actions)
    updateUI();
}

const resetButton = document.querySelector('.resetButton');
resetButton.addEventListener('click', resetGame);