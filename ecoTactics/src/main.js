const MAX_ENVIRONMENT = 100;
const MAX_MONEY = 100000;
const MAX_HAPPINESS = 100;
const MIN_VALUE = 0;

const defaultValues = [50, 50, 50, 50, 50000, 50, 1, 10000];

let state = {
    environment: [defaultValues[0], defaultValues[1], defaultValues[2], defaultValues[3]],
    money: defaultValues[4],
    happiness: defaultValues[5],
    day: defaultValues[6],
    population: defaultValues[7],
    history: []
};

fetch('src/data/residents.json')
    .then(response => response.json())
    .then(data => {
        const wholePopulation = data.residents.length;
    });


let gameOver = false;
let actions = [];

fetch('src/data/actions.json')
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

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function applyAction(action) {
    for (let i = 0; i < state.environment.length; i++) {
        state.environment[i] = clamp(
            state.environment[i] + (Array.isArray(action.effects.environment) ? action.effects.environment[i] || 0 : action.effects.environment || 0),
            MIN_VALUE,
            MAX_ENVIRONMENT
        );
    }
    state.money = clamp(state.money + action.effects.money, MIN_VALUE, MAX_MONEY);
    state.happiness = clamp(state.happiness + action.effects.happiness, MIN_VALUE, MAX_HAPPINESS);
    log(`Tag ${state.day}: Aktion "${action.name}" ausgeführt. Effekte - Umwelt: ${action.effects.environment}, Geld: ${action.effects.money}, Zufriedenheit: ${action.effects.happiness}`);
    nextDay();
    checkGameOver();
    updateUI();
}

function updateUI() {
    const avgEnv = state.environment.reduce((a, b) => a + b, 0) / state.environment.length;
    document.querySelector('.envCounter').textContent = avgEnv.toFixed(0);
    document.querySelector('.moneyCounter').textContent = state.money;
    document.querySelector('.happinessCounter').textContent = state.happiness;
    document.querySelector('.day').textContent = "Tag " + state.day;
    document.querySelector('.envBar').style.width = avgEnv + '%';
    document.querySelector('.moneyBar').style.width = state.money / 1000 + '%';
    document.querySelector('.happinessBar').style.width = state.happiness + '%';
    document.querySelector('.population').textContent = state.population;
}

function checkGameOver() {
    if (state.money <= 0) {
        endGame('Bankrott! Dein Budget ist erschöpft. Spiel vorbei.');
    } else if (state.environment <= 0) {
        endGame('Ökologische Katastrophe! Die Umweltwerte sind zu niedrig. Spiel vorbei.');
    } else if (state.happiness <= 0) {
        endGame('Soziale Unruhe! Zufriedenheit zu niedrig. Spiel vorbei.');
    } else if (state.day >= 30) {
        endGame('Glückwunsch! 30 Tage überstanden — du hast gezeigt, dass Nachhaltigkeit möglich ist.');
    }
}

function nextDay() {
    state.day += 1;

    const rnd = Math.random();
    if (rnd < 0.15) {
        for (let i = 0; i < state.environment.length; i++) {
            state.environment[i] = clamp(state.environment[i] - 8, MIN_VALUE, MAX_ENVIRONMENT);
        }
        log(`Tag ${state.day - 1}: Regensturm beschädigt Infrastruktur (-8 Umwelt)`);
    } else if (rnd < 0.30) {
        state.money = clamp(state.money + 10, MIN_VALUE, MAX_MONEY);
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
        environment: [defaultValues[0], defaultValues[1], defaultValues[2], defaultValues[3]],
        money: defaultValues[4],
        happiness: defaultValues[5],
        day: defaultValues[6],
        population: defaultValues[7],
        history: []
    };
    gameOver = false;
    renderActions(actions);
    updateUI();
}

const resetButton = document.querySelector('.resetButton');
resetButton.addEventListener('click', resetGame);

document.querySelector('.logButton').addEventListener('mouseover', () => {
    document.querySelector('.logDropdown').style.display = 'block';
});

document.querySelector('.logDropdown').addEventListener('mouseleave', () => {
    document.querySelector('.logDropdown').style.display = 'none';
});

const envDropdown = document.createElement('div');
envDropdown.className = 'envDropdown';
document.body.appendChild(envDropdown);

function updateEnvDropdown() {
    envDropdown.innerHTML = `
        <strong>Umwelt-Zusammensetzung:</strong><br>
        Meeresspiegelanstieg: ${state.environment[0]}<br>
        Temperatur: ${state.environment[1]}<br>
        Wetterextreme: ${state.environment[2]}<br>
        Wasserverfügbarkeit: ${state.environment[3]}
    `;
}

document.querySelector('.envBar').addEventListener('mouseover', (e) => {
    updateEnvDropdown();
    const rect = e.target.getBoundingClientRect();
    envDropdown.style.left = rect.left + 'px';
    envDropdown.style.top = (rect.bottom + 5) + 'px';
    envDropdown.style.display = 'block';
});

document.querySelector('.envBar').addEventListener('mouseleave', () => {
    envDropdown.style.display = 'none';
});

let buildings = [];

fetch('src/data/buildings.json')
    .then(response => response.json())
    .then(data => {
        buildings = data.buildings;
    });


document.querySelector('.shop').addEventListener('click', () => {
    openShop();
});


document.getElementById('shopCloseBtn').addEventListener('click', () => {
    closeShop();
});


document.getElementById('shopModal').addEventListener('click', (e) => {
    if (e.target.id === 'shopModal') {
        closeShop();
    }
});

function openShop() {
    const shopModal = document.getElementById('shopModal');
    shopModal.classList.add('active');
    renderShopBuildings();
    updateShopResources();
}

function closeShop() {
    const shopModal = document.getElementById('shopModal');
    shopModal.classList.remove('active');
}

function renderShopBuildings() {
    const shopContent = document.getElementById('shopContent');
    shopContent.innerHTML = '';
    
    buildings.forEach(building => {
        const card = createBuildingCard(building);
        shopContent.appendChild(card);
    });
}

function createBuildingCard(building) {
    const card = document.createElement('div');
    card.className = 'building-card';

    const avgEnvChange = Array.isArray(building.effects.environment) 
        ? building.effects.environment.reduce((a, b) => a + b, 0) / building.effects.environment.length
        : building.effects.environment;

    const imageHTML = building.image 
        ? `<div class="building-image-placeholder" style="background: none; padding: 0;">
               <img src="${building.image}" alt="${building.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
           </div>`
        : `<div class="building-image-placeholder"></div>`;
    
    card.innerHTML = `
        ${imageHTML}
        <div class="building-name">${building.name}</div>
        <div class="building-desc">${building.desc}</div>
        <div class="building-costs">
            <div class="building-cost-title">Kosten & Effekte:</div>
            <div class="building-cost-item">
                <span>Geld:</span>
                <span class="${building.effects.money >= 0 ? 'cost-positive' : 'cost-negative'}">
                    ${building.effects.money >= 0 ? '+' : ''}${building.effects.money}
                </span>
            </div>
            <div class="building-cost-item">
                <span>Zufriedenheit:</span>
                <span class="${building.effects.happiness >= 0 ? 'cost-positive' : 'cost-negative'}">
                    ${building.effects.happiness >= 0 ? '+' : ''}${building.effects.happiness}
                </span>
            </div>
            <div class="building-cost-item">
                <span>Umwelt:</span>
                <span class="${avgEnvChange >= 0 ? 'cost-positive' : 'cost-negative'}">
                    ${avgEnvChange >= 0 ? '+' : ''}${avgEnvChange.toFixed(1)}
                </span>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => {
        purchaseBuilding(building);
    });
    
    return card;
}

function purchaseBuilding(building) {
    if (building.effects.money < 0 && state.money < Math.abs(building.effects.money)) {
        alert(`Nicht genug Geld! Du benötigst ${Math.abs(building.effects.money)} Geld, hast aber nur ${state.money}.`);
        return;
    }

    for (let i = 0; i < state.environment.length; i++) {
        state.environment[i] = clamp(
            state.environment[i] + (Array.isArray(building.effects.environment) ? building.effects.environment[i] || 0 : building.effects.environment || 0),
            MIN_VALUE,
            MAX_ENVIRONMENT
        );
    }
    state.money = clamp(state.money + building.effects.money, MIN_VALUE, MAX_MONEY);
    state.happiness = clamp(state.happiness + building.effects.happiness, MIN_VALUE, MAX_HAPPINESS);
    
    log(`Tag ${state.day}: Gebäude "${building.name}" gekauft! Kosten: ${building.effects.money} Geld`);
    
    updateUI();
    updateShopResources();
    checkGameOver();
}

function updateShopResources() {
    const avgEnv = state.environment.reduce((a, b) => a + b, 0) / state.environment.length;
    document.getElementById('shopMoneyValue').textContent = state.money;
    document.getElementById('shopHappinessValue').textContent = state.happiness;
    document.getElementById('shopEnvValue').textContent = avgEnv.toFixed(0);
}