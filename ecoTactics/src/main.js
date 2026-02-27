// Vollbild aktivieren für das volle Spielerlebnis
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

function getMeanEnvironment(environment) {
    return environment.reduce((a, b) => a + b, 0) / environment.length;
}

function getNextPassiveCosts() {
    return Math.round(4000 + state.population * 0.1);
}

fetch('src/data/residents.json')
    .then(response => response.json())
    .then(data => {
        const residents = data.residents;
    });


let gameOver = false;
let actions = [];
let buildingsPerRound = 0;

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
        <div class="actionEffects">Effekt: Geld ${action.effects.money > 0 ? '+' : ''}${action.effects.money}, Zufriedenheit ${action.effects.happiness > 0 ? '+' : ''}${action.effects.happiness}, Umwelt ${getMeanEnvironment(action.effects.environment) > 0 ? '+' : ''}${getMeanEnvironment(action.effects.environment).toFixed(1)},</div>`;
        button.addEventListener('click', () => {
            if (!gameOver) {
                applyAction(action);
                renderActions(actions);
            }
        });

        const actionEffectsElem = button.querySelector('.actionEffects');
        actionEffectsElem.addEventListener('mouseover', (e) => {
            updateEnvDropdownForAction(action.effects.environment);
            const rect = e.target.getBoundingClientRect();
            envDropdown.style.left = rect.left + 'px';
            envDropdown.style.top = (rect.bottom + 5) + 'px';
            envDropdown.style.display = 'block';
        });
        
        actionEffectsElem.addEventListener('mouseleave', () => {
            envDropdown.style.display = 'none';
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

// Methode zum Anwenden einer ausgewählten Aktion
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
    document.querySelector('.day').textContent = "Tag " + state.day + " / 30";
    document.querySelector('.envBar').style.width = avgEnv + '%';
    document.querySelector('.moneyBar').style.width = state.money / 1000 + '%';
    document.querySelector('.happinessBar').style.width = state.happiness + '%';
    document.querySelector('.population').textContent = state.population;
    document.querySelector('.passiveCostsCounter').textContent = '-' + getNextPassiveCosts().toLocaleString('de-DE');
}

function checkGameOver() {
    if (state.money <= 0) {
        endGame('Bankrott! Dein Budget ist erschöpft. Spiel vorbei.');
    } else if (state.environment.some(v => v <= 0)) {
        endGame('Ökologische Katastrophe! Die Umweltwerte sind zu niedrig. Spiel vorbei.');
    } else if (state.happiness <= 0) {
        endGame('Soziale Unruhe! Zufriedenheit zu niedrig. Spiel vorbei.');
    } else if (state.day >= 30) {
        endGame('Glückwunsch! 30 Tage überstanden — du hast gezeigt, dass Nachhaltigkeit möglich ist.');
    }
}

function nextDay() {
    let newsLog = null;

    state.day += 1;

    const passiveCosts = Math.round(4000 + state.population * 0.1);
    state.money = clamp(state.money - passiveCosts, MIN_VALUE, MAX_MONEY);
    const passiveCostCounter = document.querySelector('.passiveCostsCounter');
    passiveCostCounter.textContent = `- ${passiveCosts}`;

    // Bevölkerung wächst/ schrumpft basierend auf Zufriedenheit -> höher als 30 = Wachstum, niedriger als 30 = Schrumpfung
    let growthRate = (state.happiness - 30) / 100;
    growthRate = clamp(growthRate, -0.5, 0.5);

    const deltaPopulation = Math.round(state.population * growthRate);
    state.population = clamp(state.population + deltaPopulation, MIN_VALUE, 1000000);

    if(state.day > 1){
        document.querySelector(".newsTicker").style.display = "none";
    }

    const rareEvents = [
        { environment: -69, message: 'Nukleare Verseuchung. Die Bürger der Stadt sind in größter Gefahr (-69 Umwelt)' },
        { environment: -56, message: 'Ein Hurricane schockt die Stadt. (-56 Umwelt)' },
        { money: -46000, message: 'Weltwirtschaftskrise! Die Wirtschaft kollabiert. (-46000 Geld)' },
        { happiness: -50, message: 'Eine Pandemie bricht aus. Die Bevölkerung vereinsamt und verarmt. (-50 Zufriedenheit)' },
    ];
    const uncommonEvents = [
        { happiness: 15, message: 'Es gibt so viele Bildungsplätze, wie nie zuvor in der Stadt. (+15 Zufriedenheit)' },
        { environment: -15, message: 'Ein Rekordhitzesommer erschüttert die Tier- und Pflanzenwelt.  (-15 Umwelt)' },
        { money: 21000, message: 'Ein Investor sieht Potential in der Stadt und investiert viel Geld in diese. (+21000 Geld)' },
        { happiness: -24, message: 'Saurer Regen sorgt für erhebliche gesundheitliche Probleme. (-24 Zufriedenheit)' },
        { environment: 19, message: 'Ein neue KI-Technologie gegen den Klimawandel wurde erforscht. (+19 Umwelt)' },
        { environment: -23, message: 'Ein Hagelsturm verwüstet die Infrastruktur. (-23 Umwelt)' },
        { money: -29000, message: 'Aufgrund größerer Hochwassergefahr muss ein neuer Damm gebaut werden. (-29000 Geld)' },
        { happiness: -15, message: 'Aufgrund Probleme anderer Regionen bleiben die Supermarktregale leer. (-15 Zufriedenheit)' }
    ];
    const commonEvents = [
        { happiness: 5, message: 'Positive Stimmung in der Stadt. (+5 Zufriedenheit)' },
        { environment: -10, message: 'Starkregen sorgt für Beschädigungen. (-10 Umwelt)' },
        { money: 8000, message: 'Die Industrie hat einen besonders guten Monat .(+8000 Geld)' },
        { happiness: -7, message: 'Proteste gegen der/die Bürgermeister*in. (-7 Zufriedenheit)' },
        { environment: 4, message: 'Eine lang ausgestorbene Art wurde wiederentdeckt! (+4 Umwelt)' },
        { environment: -10, message: 'Eine Dürreperiode lässt die Umwelt leiden. (-10 Umwelt)' },
        { money: -9000, message: 'Die Stadt muss für Straßenschäden aufkommen. (-9000 Geld)' },
        { happiness: -8, message: 'Nachrichten über den Klimawandel beunruhigen die Bevölkerung. (-8 Zufriedenheit)' }
    ];

    const rnd = Math.random();

    let pool = null;
    if (rnd <= 0.02) {
        pool = rareEvents;
    } else if (rnd <= 0.20) {
        pool = uncommonEvents;
    } else if (rnd <= 0.40) {
        pool = commonEvents;
    }

    if (pool) {
        const event = pool[Math.floor(Math.random() * pool.length)];

        if (typeof event.happiness === 'number') {
            state.happiness = clamp(state.happiness + event.happiness, MIN_VALUE, MAX_HAPPINESS);
        }
        if (typeof event.environment === 'number') {
            for (let i = 0; i < state.environment.length; i++) {
                state.environment[i] = clamp(state.environment[i] + event.environment, MIN_VALUE, MAX_ENVIRONMENT);
            }
        }
        if (typeof event.money === 'number') {
            state.money = clamp(state.money + event.money, MIN_VALUE, MAX_MONEY);
        }

        log(`Tag ${state.day - 1}: ${event.message}`);
        newsLog = event.message;
        newsTicker(newsLog);
        buildingsPerRound = 0;
    }
    checkGameOver();
    if(!gameOver){
        checkValueAvatarRequirements();
    }
    updateUI();
}

let newsTickerTimeout = null;

function newsTicker(newsLog) {
    const wrapper = document.querySelector('.newsTicker');
    if (!wrapper) return;

    if (newsTickerTimeout) {
        clearTimeout(newsTickerTimeout);
        newsTickerTimeout = null;
    }

    const oldMarquee = wrapper.querySelector('.newsText');
    if (oldMarquee) oldMarquee.remove();

    const marquee = document.createElement('marquee');
    marquee.className = 'newsText';
    marquee.setAttribute('behavior', 'scroll');
    marquee.setAttribute('direction', 'left');
    marquee.setAttribute('scrollamount', '8');
    marquee.textContent = 'Nachrichten: ' + newsLog;
    wrapper.appendChild(marquee);

    wrapper.style.display = 'block';

    newsTickerTimeout = setTimeout(() => {
        wrapper.style.display = 'none';
        newsTickerTimeout = null;
    }, 20000);
}

function checkValueAvatarRequirements() {

    if (document.querySelector('.avatarContainer')) return;

    if(state.money < 10000){
        showRandomAvatar('Die Stadt steht kurz vor dem Bankrott! Kannst du eigentlich überhaupt mit Geld umgehen?');
    }
    if(state.happiness < 10){
        showRandomAvatar('Das geht nicht so weiter! Ich möchte ausziehen!');
    }
    if(state.environment[0] < 10){
        showRandomAvatar('Unsere Keller laufen voll! Tun sie endlich was!');
    }
    if(state.environment[1] < 10){
        showRandomAvatar('Es ist viel zu heiß in der Stadt! Das hält doch niemand aus!');
    }
    if(state.environment[2] < 10){
        showRandomAvatar('Schon wieder ein Sturm? Die Stadt ist doch nicht mehr bewohnbar!');
    }
    if(state.environment[3] < 10){
        showRandomAvatar('Es kommt kein Wasser mehr aus dem Hahn! Wie soll das weitergehen?');
    }
}

function checkBuildingAvatarRequirements(building) {

    if (document.querySelector('.avatarContainer')) return;

    let rnd;

    if(building.name === "Windpark"){
        rnd = Math.random();
        if (rnd < 0.5) {
            showRandomAvatar(`Endlich nutzen wir die Kraft des Windes! Das ist ein großer Schritt in Richtung Nachhaltigkeit!`);
        }
    }

    if(building.name === "Solarpark"){
        rnd = Math.random();
        if (rnd < 0.5) {
            showRandomAvatar(`Die Sonne als Stromquelle! Das ist nicht nur nachhaltig, sondern auch genial!`);
        }
    }

    if(building.name === "Recyclingzentrum"){
        rnd = Math.random();
        if (rnd < 0.5) {
            showRandomAvatar(`Es gibt doch nichts schöneres, als aus Alt Neu zu machen! Unser Recyclingzentrum ist ein echter Gewinn für die Umwelt!`);
        }
    }

    if(building.name === "Kohlekraftwerk"){
        rnd = Math.random();
        if (rnd < 0.5) {
            showRandomAvatar(`Warum bauen wir so ein umweltschädliches Kraftwerk? Wollen wir genauso weiter machen wie bisher? Das ist doch nicht mehr zeitgemäß!`);
        }
    }

    if(building.name === "Stadtwald"){
        rnd = Math.random();
        if (rnd < 0.5) {
            showRandomAvatar(`Ich liebe es im Wald spazieren zu gehen! Unser neuer Stadtwald ist dafür bestens geeignet!`);
        }
    }

    if(building.name === "Öko-Wohnkomplex"){
        rnd = Math.random();
        if (rnd < 0.5) {
            showRandomAvatar(`Ich möchte unbedingt in den neuen Öko-Wohnkomplex ziehen! Endlich umweltfreundlich und modern wohnen!`);
        }
    }

    if(building.name === "Botanischer Garten"){
        rnd = Math.random();
        if (rnd < 0.5) {
            showRandomAvatar(`Der neue Botanische Garten ist so schön geworden! Es ist toll, dass wir jetzt so viel mehr Grünflächen in der Stadt haben!`);
        }
    }

    if(building.name === "Fahrrad-Station"){
        rnd = Math.random();
        if (rnd < 0.5) {
            showRandomAvatar(`Mit der Eröffnung der neuen Fahrrad-Station werde ich auch einmal mit dem Fahrrad zur Arbeit fahren!`);
        }
    }

    if(building.name === "Umwelt-Bildungszentrum"){
        rnd = Math.random();
        if (rnd < 0.5) {
            showRandomAvatar(`Die Veranstaltungen des neuen Umwelt-Bildungszentrums sind so spannend! Ich konnte so viel über unsere Natur lernen!`);
        }
    }

    if(building.name === "Straßenbahn-Netz"){
        rnd = Math.random();
        if (rnd < 0.5) {
            showRandomAvatar(`Wow! Endlich haben wir eine neue Straßenbahn! Die stellt die KVB sowas von in den Schatten!`);
        }
    }

    if(building.name === "Umweltmuseum"){
        rnd = Math.random();
        if (rnd < 0.5) {
            showRandomAvatar(`Ich war gestern im neuen Umweltmuseum und es war so beeindruckend! Ich werde jetzt zum Superhelden für die Umwelt!`);
        }
    }

    if(building.name === "Repair-Cafés"){
        rnd = Math.random();
        if (rnd < 0.5) {
            showRandomAvatar(`Sachen zu reparieren macht doch viel mehr Spaß, als sie wegzuwerfen! Das neue Repair-Café ist eine tolle Idee!`);
        }
    }

    if(building.name === "Ölraffinerie"){
        rnd = Math.random();
        if (rnd < 0.5) {
            showRandomAvatar(`Warum fördern wir denn jetzt auch noch Öl? Das ist doch total rückständig und umweltschädlich!`);
        }
    }

    if(building.name === "Mega-Einkaufszentrum"){
        rnd = Math.random();
        if (rnd < 0.5) {
            showRandomAvatar(`Ich liebe es shoppen zu gehen! Da ist mir die Umwelt doch egal!`);
        }
    }

    if(building.name === "Flughafen"){
        rnd = Math.random();
        if (rnd < 0.5) {
            showRandomAvatar(`Ich fliege jetzt auf Malle! Jedes Wochenende! Saufen statt Umweltschutz!`);
        }
    }

    if(building.name === "Fast-Fashion-Fabrik"){
        rnd = Math.random();
        if (rnd < 0.5) {
            showRandomAvatar(`Die armen Leute, die in der neuen Fast-Fashion-Fabrik arbeiten müssen! Aber Hauptsache wir können billig einkaufen!`);
        }
    }

    if(building.name === "Luxus-Hotel"){
        rnd = Math.random();
        if (rnd < 0.5) {
            showRandomAvatar(`Brauchen wir denn wirklich ein Luxushotel? Diese nervigen Touristen, die dann hier rumlaufen? Das ist doch total überflüssig!`);
        }
    }

    if(building.name === "Golf-Resort"){
        rnd = Math.random();
        if (rnd < 0.5) {
            showRandomAvatar(`Ich habe gestern mein Handicap verbessert! Das neue Golf-Resort ist echt super! Wir haben doch genug Wasser!`);
        }
    }

    if(building.name === "Müllverbrennungsanlage"){
        rnd = Math.random();
        if (rnd < 0.5) {
            showRandomAvatar(`Müll verbrennen? Das klingt doch total umweltschädlich! Warum können wir den Müll nicht einfach recyceln oder so?`);
        }
    }
    if(building.name === "Rechenzentrum"){
        rnd = Math.random();
        if (rnd < 0.5) {
            showRandomAvatar(`Der KI wird die Zukunft gehören! Unser neues Rechenzentrum ist da genau das Richtige, um für die Zukunft gerüstet zu sein! Aber woher kommen denn die neuen Stromausfälle?`);
        }
    }
    if(building.name === "Wasserpark"){
        rnd = Math.random();
        if (rnd < 0.5) {
            showRandomAvatar(`Platsch Platsch! Der neue Wasserpark ist so toll! Eine tolle Abkühlung bei den immer wärmeren Sommern!`);
        }
    }
}

function endGame(message) {
    gameOver = true;
    ErrorBox(message);
    resetGame()
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

    const map = document.querySelector('.mapContainer');
    if (map) {
        const buildings = map.querySelectorAll('.map-building');
        buildings.forEach(building => building.remove());
    }

    occupiedTiles.clear();
    
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
        <strong>Umwelt-Effekte:</strong><br>
        Meeresspiegelanstieg: ${state.environment[0]}<br>
        Temperatur: ${state.environment[1]}<br>
        Wetterextreme: ${state.environment[2]}<br>
        Wasserverfügbarkeit: ${state.environment[3]}
    `;
}

function updateEnvDropdownForAction(environmentEffects) {
    const effectsArray = Array.isArray(environmentEffects) ? environmentEffects : [environmentEffects, environmentEffects, environmentEffects, environmentEffects];
    envDropdown.innerHTML = `
        <strong>Umwelt-Effekte:</strong><br>
        Meeresspiegelanstieg: ${effectsArray[0] > 0 ? '+' : ''}${effectsArray[0]}<br>
        Temperatur: ${effectsArray[1] > 0 ? '+' : ''}${effectsArray[1]}<br>
        Wetterextreme: ${effectsArray[2] > 0 ? '+' : ''}${effectsArray[2]}<br>
        Wasserverfügbarkeit: ${effectsArray[3] > 0 ? '+' : ''}${effectsArray[3]}
    `;
}

document.querySelector('.bar.env').addEventListener('mouseover', (e) => {
    updateEnvDropdown();
    const rect = e.target.getBoundingClientRect();
    envDropdown.style.left = rect.left + 'px';
    envDropdown.style.top = (rect.bottom + 5) + 'px';
    envDropdown.style.display = 'block';
});

document.querySelector('.bar.env').addEventListener('mouseleave', () => {
    envDropdown.style.display = 'none';
});

const offscreen = document.createElement('canvas');
const dimension = offscreen.getContext('2d');
const realCanvas = document.querySelector('.backgroundImage');

function initRiverDetection() {
    // Werte von echtem Bild auf Offscreen-Canvas übertragen
    offscreen.width = realCanvas.naturalWidth;
    offscreen.height = realCanvas.naturalHeight;
    dimension.drawImage(realCanvas, 0, 0);
}

if (realCanvas.complete) {
    initRiverDetection();
}

function isTileRiver(gridX, gridY) {
    if (offscreen.width === 0) return false;
    const imgRect = realCanvas.getBoundingClientRect();

    // Skalierungsfaktor berechnen, da Bild auf unterschiedlichen Bildschirmgrößen unterschiedlich skaliert wird
    const scaleX = realCanvas.naturalWidth  / imgRect.width;
    const scaleY = realCanvas.naturalHeight / imgRect.height;

    // Mittelpunkt des Tiles -> auf echte Bildkoordinaten skalieren -> mit Claude generiert
    const tileCenterX = (gridX * TILE_SIZE + TILE_SIZE / 2) * scaleX;
    const tileCenterY = (gridY * TILE_SIZE + TILE_SIZE / 2) * scaleY;

    // Mehrere Punkte rund um Bildmitte gesammelt
    const samples = [
        [tileCenterX, tileCenterY],
        [tileCenterX - TILE_SIZE * scaleX * 0.25, tileCenterY],
        [tileCenterX + TILE_SIZE * scaleX * 0.25, tileCenterY],
        [tileCenterX, tileCenterY - TILE_SIZE * scaleY * 0.25],
        [tileCenterX, tileCenterY + TILE_SIZE * scaleY * 0.25],
    ];

    let riverCount = 0;
    for (const [sampleX, sampleY] of samples) {
        // abrunden auf ganze Pixelkoordinaten
        const x = Math.floor(sampleX);
        const y = Math.floor(sampleY);
        // wenn Pixel außerhalb des Bildes liegt, ignorieren
        if (x < 0 || y < 0 || x >= offscreen.width || y >= offscreen.height) continue;
        const [r, g, b] = dimension.getImageData(x, y, 1, 1).data;
        // Flusswasser: blau als dominante Farbe
        if (b > 120 && r < 120 && g < 160) riverCount++;
    }
    // Mindestens 1 von 5 Samples müssen Wasser sein
    return riverCount >= 2;
}

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
                <span class="${avgEnvChange >= 0 ? 'cost-positive env' : 'cost-negative env'}">
                    ${avgEnvChange >= 0 ? '+' : ''}${avgEnvChange.toFixed(1)}
                </span>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => {
        card.classList.remove('selected');
        void card.offsetWidth;
        card.classList.add('selected');
        setTimeout(() => card.classList.remove('selected'), 500);
        purchaseBuilding(building);
    });

    const envSpan = card.querySelector('.env');
    if (envSpan) {
        envSpan.addEventListener('mouseover', (e) => {
            updateEnvDropdownForAction(building.effects.environment);
            const rect = e.target.getBoundingClientRect();
            envDropdown.style.left = rect.left + 'px';
            envDropdown.style.top = (rect.bottom + 5) + 'px';
            envDropdown.style.display = 'block';
        });
        
        envSpan.addEventListener('mouseleave', () => {
            envDropdown.style.display = 'none';
        });
    }
    
    return card;
}


const TILE_SIZE = 256;
let placementMode = false;
let selectedBuilding = null;
let ghostBuilding = null;
// speichert belegte Building-Tiles
let occupiedTiles = new Set();

function purchaseBuilding(building) {

    if(buildingsPerRound >= 1){
        ErrorBox(`Du kannst pro Tag nur ein Gebäude bauen! Bitte klicke auf "Nächster Tag", um weitere Gebäude bauen zu können.`);
        return;
    }

    if (building.effects.money < 0 && state.money < Math.abs(building.effects.money)) {
        ErrorBox(`Nicht genug Geld! Du benötigst ${Math.abs(building.effects.money)} Geld, hast aber nur ${state.money}.`);
        return;
    }

    if(state.history.includes(building.name)){
        if(state.history.filter(name => name === building.name).length >= building.limit){
        ErrorBox(`Du hast die maximale mögliche Anzahl der Gebäude bereits überschritten.`);
        return;
        }
    }

    selectedBuilding = building;
    placementMode = true;

    closeShop();
    createGhostBuilding(building);
}

function createGhostBuilding(building) {
    if (ghostBuilding) {
        ghostBuilding.remove();
        ghostBuilding = null;
    }

    const map = document.querySelector('.mapContainer');

    ghostBuilding = document.createElement('div');
    ghostBuilding.className = 'ghost-building';
    ghostBuilding.style.position = 'absolute';
    ghostBuilding.style.pointerEvents = 'none';

    const img = document.createElement('img');
    img.src = building.image;
    img.className = `building_image`;

    const overlay = document.createElement('div');
    overlay.className = 'ghost-overlay';

    ghostBuilding.appendChild(img);
    ghostBuilding.appendChild(overlay);
    map.appendChild(ghostBuilding);
}


function checkTileOccupation() {
    const mapElem = document.querySelector('.mapContainer');

    mapElem.addEventListener('mousemove', (e) => {

        if (!placementMode || !ghostBuilding) {
            return;
        }

        const rect = mapElem.getBoundingClientRect();
        // Berechne Grid-Position basierend auf Mausposition -> Code teilweise übernommen von ChatGPT
        const gridX = Math.floor((e.clientX - rect.left) / TILE_SIZE);
        const gridY = Math.floor((e.clientY - rect.top) / TILE_SIZE);

        ghostBuilding.style.left = gridX * TILE_SIZE + 'px';
        ghostBuilding.style.top = gridY * TILE_SIZE + 'px';

        // Koordinaten werden gespeichert als "x,y"
        const tileKey = `${gridX},${gridY}`;
        const overlay = ghostBuilding.querySelector('.ghost-overlay');
        const river = isTileRiver(gridX, gridY);

        if (occupiedTiles.has(tileKey) || river) {
            overlay.style.background = 'rgba(255,0,0,0.45)';
            overlay.style.borderColor = 'red';
        } else {
            overlay.style.background = 'rgba(0,255,0,0.35)';
            overlay.style.borderColor = 'lime';
        }
    });

    mapElem.addEventListener('click', (e) => {
        if (!placementMode) return;

        const rect = mapElem.getBoundingClientRect();
        const gridX = Math.floor((e.clientX - rect.left) / TILE_SIZE);
        const gridY = Math.floor((e.clientY - rect.top) / TILE_SIZE);

        const tileKey = `${gridX},${gridY}`;

        if (occupiedTiles.has(tileKey)) {
            ErrorBox('Dieser Platz ist bereits belegt! Wähle eine andere Position.');
            return;
        }
        if (isTileRiver(gridX, gridY)) {
            ErrorBox('Hier fließt ein Fluss! Gebäude können nicht auf Wasser gebaut werden.');
            return;
        }

        placeBuildingOnMap(selectedBuilding, gridX, gridY);
        finalizePurchase(selectedBuilding);
        cleanupPlacement();
    });
}

checkTileOccupation();

function placeBuildingOnMap(building, gridX, gridY) {
    const map = document.querySelector('.mapContainer');

    const tileKey = `${gridX},${gridY}`;
    
    // Tile zum Set hinzugefügt
    occupiedTiles.add(tileKey);

    const buildingElem = document.createElement('div');
    buildingElem.className = 'map-building';
    buildingElem.style.left = gridX * TILE_SIZE + 'px';
    buildingElem.style.top = gridY * TILE_SIZE + 'px';
    buildingElem.dataset.tileX = gridX;
    buildingElem.dataset.tileY = gridY;

    const img = document.createElement('img');
    img.src = building.image;
    img.className = 'placed-building-image';

    buildingElem.appendChild(img);
    map.appendChild(buildingElem);
}

function finalizePurchase(building) {
    for (let i = 0; i < state.environment.length; i++) {
        state.environment[i] = clamp(
            state.environment[i] +
            (Array.isArray(building.effects.environment)
                ? building.effects.environment[i] || 0
                : building.effects.environment || 0),
            MIN_VALUE,
            MAX_ENVIRONMENT
        );
    }

    state.money = clamp(state.money + building.effects.money, MIN_VALUE, MAX_MONEY);
    state.happiness = clamp(state.happiness + building.effects.happiness, MIN_VALUE, MAX_HAPPINESS);

    state.history.push(building.name);

    log(`Tag ${state.day}: Gebäude "${building.name}" gebaut.`);

    buildingsPerRound++;

    updateUI();
    updateShopResources();
    checkGameOver();
    if(!gameOver){
        checkValueAvatarRequirements()
        checkBuildingAvatarRequirements(building)
    }
}


function cleanupPlacement() {
    placementMode = false;
    selectedBuilding = null;

    if (ghostBuilding) {
        ghostBuilding.remove();
        ghostBuilding = null;
    }
}


document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && placementMode) {
        cleanupPlacement();
    }
});

function updateShopResources() {
    document.getElementById('shopMoneyValue').textContent = state.money;
    document.getElementById('shopHappinessValue').textContent = state.happiness;
    document.getElementById('shopEnvValue').textContent = getMeanEnvironment(state.environment).toFixed(0);
}

function ErrorBox(message) {

    const existing = document.querySelector('.errorBox');
    if (existing){
        existing.remove();
    }

    const errorBox = document.createElement('div');
    const errorBoxPicture = document.createElement('img');
    const errorBoxText = document.createElement('p');
    errorBoxPicture.src = 'assets/warning.png';
    errorBoxPicture.className = 'errorBoxImage';
    errorBoxText.textContent = message;
    errorBoxText.className = 'errorBoxText';
    errorBox.appendChild(errorBoxText);
    errorBox.appendChild(errorBoxPicture);
    errorBox.className = 'errorBox';

    document.body.appendChild(errorBox);

    setTimeout(() => {
        if (errorBox && errorBox.parentElement) errorBox.remove();
    }, 5000);
}

function showRandomAvatar(message) {
    const avatarContainer = document.createElement('div');
    avatarContainer.className = 'avatarContainer';
    document.body.appendChild(avatarContainer);
    const avatarPictures = [
        'assets/Avatars/AchimNovak.png',
        'assets/Avatars/AndreasBruno.png',
        'assets/Avatars/EmilyPham.png',
        'assets/Avatars/TuanaFranke.png',
    ];
    const randomAvatar = avatarPictures[Math.floor(Math.random() * avatarPictures.length)];
    const img = document.createElement('img');
    // RegEx von Copilot
    const avatarName = randomAvatar.match(/\/([^\/]+)\.png$/)[1].replace(/([A-Z])/g, ' $1').trim();
    img.src = randomAvatar;
    img.className = 'avatarImage';
    avatarContainer.appendChild(img);

    const SprechblaseWrapper = document.createElement('div');
    SprechblaseWrapper.className = 'SprechblaseWrapper';
    const Sprechblase = document.createElement('img');
    Sprechblase.src = 'assets/Sprechblase.png';
    Sprechblase.className = 'Sprechblase';
    const bubbleText = document.createElement('p');
    bubbleText.innerHTML = `<span class="bubbleName">${avatarName}:</span><br>${message}`
    bubbleText.className = 'bubbleText';
    SprechblaseWrapper.appendChild(Sprechblase);
    SprechblaseWrapper.appendChild(bubbleText);
    avatarContainer.appendChild(SprechblaseWrapper);

    setTimeout(() => {
        if (avatarContainer && avatarContainer.parentElement) avatarContainer.remove();
    }, 7000);
}

