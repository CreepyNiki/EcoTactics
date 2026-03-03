// Vollbild aktivieren für das volle Spielerlebnis
showRandomAvatar("Willkommen, Bürgermeister*in! Deine Aufgabe ist es, die Stadt nachhaltig zu gestalten und dabei Umwelt, Geld und Zufriedenheit der Bürger im Gleichgewicht zu halten.");

// Wertebereiche
const MAX_ENVIRONMENT = 100;
const MAX_MONEY = 100000;
const MAX_HAPPINESS = 100;
const MIN_VALUE = 0;

// Startwerte
const defaultValues = [50, 50, 50, 50, 50000, 50, 1, 10000];
let gameOver = false;
let actions;
let buildingsPerRound;

// Liste mit verschiedenen Werten
let state = {
    environment: [defaultValues[0], defaultValues[1], defaultValues[2], defaultValues[3]],
    money: defaultValues[4],
    happiness: defaultValues[5],
    day: defaultValues[6],
    population: defaultValues[7],
    history: []
};

// Einlesen der Einwohner aus JSON-File.
fetch('src/data/residents.json')
    .then(response => response.json())
    .then(data => {
        const residents = data.residents;
    });

// Einlesen der Aktionen aus JSON-File.
fetch('src/data/actions.json')
    .then(response => response.json())
    .then(data => {
        actions = data.actions;
        resetGame();
        renderActions(actions);
    });

// Hilfsfunktion, um Werte in bestimmten Bereichen zu halten.
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Hilfsfunktion, um den durchschnittlichen Umweltwert aus den verschiedenen Umweltkategorien zu berechnen.
function getMeanEnvironment(environment) {
    return environment.reduce((a, b) => a + b, 0) / environment.length;
}

// Hilfsfunktion, um die voraussichtlichen passiven Kosten für die nächste Runde zu predicten.
function getNextPassiveCosts() {
    return Math.round(4000 + state.population * 0.1);
}


// Methode mit der die Aktionen gerendert werden. Es werden immer 3 zufällige Aktionen aus der Liste angezeigt. Bei Klick auf eine Aktion wird diese angewendet und die Aktionsliste wird aktualisiert.
function renderActions(actions) {
    const actionsContainer = document.querySelector('.actions');
    actionsContainer.innerHTML = '';
    // random Reihenfolge der Aktionen
    const shuffledActions = actions.sort(() => Math.random() - 0.5);
    // nur die ersten 3 Aktionen aus der randomisierten Liste nehmen
    const todaysActions = shuffledActions.slice(0, 3);
    // für jede Aktion HTML Elemente gerendert
    todaysActions.forEach(action => {
        const button = document.createElement('button');
        button.className = 'action';
        button.innerHTML = `<div class="actionName">${action.name}</div><div class="actionDesc">${action.desc}</div>
        <div class="actionEffects">Effekt: Geld ${action.effects.money > 0 ? '+' : ''}${action.effects.money}, Zufriedenheit ${action.effects.happiness > 0 ? '+' : ''}${action.effects.happiness}, Umwelt ${getMeanEnvironment(action.effects.environment) > 0 ? '+' : ''}${getMeanEnvironment(action.effects.environment).toFixed(1)},</div>`;
        // EventListener bei Klick auf Aktion hinzugefügt
        button.addEventListener('click', () => {
            if (!gameOver) {
                applyAction(action);
                renderActions(actions);
            }
        });

        const actionEffectsElem = button.querySelector('.actionEffects');
        // Bei Hover über die Effekte der Aktion wird die Aufteilung der Umwelteffekte angezeigt.
        actionEffectsElem.addEventListener('mouseover', (e) => {
            // Methode mit der ein Dropdown für die Umwelteffekte aufgerufen wird.
            updateEnvDropdownForAction(action.effects.environment);
            const rect = e.target.getBoundingClientRect();
            envDropdown.style.left = rect.left + 'px';
            envDropdown.style.top = (rect.bottom + 5) + 'px';
            envDropdown.style.display = 'block';
        });

        // Entfernen des Dropdowns, wenn die Maus nicht mehr über die Effekte hovered.
        actionEffectsElem.addEventListener('mouseleave', () => {
            envDropdown.style.display = 'none';
        });
        
        actionsContainer.appendChild(button);
    });
}

// Funktion, um Nachrichten im LogDropdown anzuzeigen.
function log(message) {
    const logContainer = document.querySelector('.log');
    const entry = document.createElement('div');
    entry.textContent = message;
    logContainer.appendChild(entry);
}



// Methode zum Anwenden einer ausgewählten Aktion.
function applyAction(action) {
    for (let i = 0; i < state.environment.length; i++) {
        state.environment[i] = clamp(
            // Umweltwerte werden einzeln aktualisiert und in Wertebereich einsortiert, da sie in 4 verschiedenen Kategorien unterteilt siind.
            state.environment[i] + (Array.isArray(action.effects.environment) ? action.effects.environment[i] || 0 : action.effects.environment || 0),
            MIN_VALUE,
            MAX_ENVIRONMENT
        );
    }
    // Geld- und Zufriedenheitswerte werden aktualisiert und in Wertebereich einsortiert.
    state.money = clamp(state.money + action.effects.money, MIN_VALUE, MAX_MONEY);
    state.happiness = clamp(state.happiness + action.effects.happiness, MIN_VALUE, MAX_HAPPINESS);
    // Log Message mit den Auswirkungen der Aktion auf die verschiedenen Werte.
    log(`Tag ${state.day}: Aktion "${action.name}" ausgeführt. Effekte - Umwelt: ${action.effects.environment}, Geld: ${action.effects.money}, Zufriedenheit: ${action.effects.happiness}`);
    // Der nächste Tag wird gestartet.
    nextDay();
    // Ein Game Over Check wird durchgeführt.
    checkGameOver();
    // UI wird geupdated, um die aktuellen Werte anzuzeigen.
    updateUI();
}

// verschiedene UI Elemente werden nach einem Ereignis aktualisiert, um die aktuellen Werte anzuzeigen.
function updateUI() {
    // reduce-Logik von Copilot übernommen, um den durchschnittlichen Umweltwert aus den 4 Kategorien zu berechnen.
    const avgEnv = state.environment.reduce((a, b) => a + b, 0) / state.environment.length;
    document.querySelector('.envCounter').textContent = avgEnv.toFixed(0);
    document.querySelector('.moneyCounter').textContent = state.money;
    document.querySelector('.happinessCounter').textContent = state.happiness;
    document.querySelector('.day').textContent = "Tag " + state.day + " / 30";
    document.querySelector('.envBar').style.width = avgEnv + '%';
    document.querySelector('.moneyBar').style.width = state.money / 1000 + '%';
    document.querySelector('.happinessBar').style.width = state.happiness + '%';
    document.querySelector('.population').textContent = state.population;
    document.querySelector('.passiveCostsCounter').textContent = '-' + getNextPassiveCosts();
}

// verschiedene Game Over Bedingungen werden überprüft und je nach erfüllter Bedingung wird das Spiel mit einer entsprechenden Nachricht beendet.
function checkGameOver() {
    if (state.money <= 0) {
        endGame('Bankrott! Dein Budget ist erschöpft. Spiel vorbei.');
    } else if (state.environment.some(v => v <= 0)) {
        endGame('Ökologische Katastrophe! Die Umweltwerte sind zu niedrig. Spiel vorbei.');
    } else if (state.happiness <= 0) {
        endGame('Soziale Unruhe! Zufriedenheit zu niedrig. Spiel vorbei.');
    } else if (state.day > 30) {
        endGame('Glückwunsch! 30 Tage überstanden — du hast gezeigt, dass Nachhaltigkeit möglich ist.');
    }
}

// Methode, die die Auswirkungen des Tageswechsels auf die verschiedenen Werte berechnet.
function nextDay() {
    let newsLog = null;

    // Tag wird um 1 erhöht.
    state.day += 1;

    // passive Kosten werden berechnet und anschließend vom Geld abgezogen. Passive Kosten setzen sich zusammen aus einem Grundwert von 4000 und einem variablen Anteil, der von der Bevölkerungszahl abhängt.
    const passiveCosts = Math.round(4000 + state.population * 0.1);
    state.money = clamp(state.money - passiveCosts, MIN_VALUE, MAX_MONEY);
    // passive Kosten werden im UI angezeigt.
    const passiveCostCounter = document.querySelector('.passiveCostsCounter');
    passiveCostCounter.textContent = `- ${passiveCosts}`;

    // Bevölkerung wächst/ schrumpft basierend auf Zufriedenheit -> höher als 40 = Wachstum, niedriger als 40 = Schrumpfung
    let growthRate = (state.happiness - 40) / 100;
    // Bevölkerung kann sich in einer Runde nicht mehr als um 50% erhöhen oder verringern, um extreme Schwankungen zu vermeiden.
    growthRate = clamp(growthRate, -0.5, 0.5);

    // Bevölkerungswachstum wird angewandt.
    const deltaPopulation = Math.round(state.population * growthRate);
    state.population = clamp(state.population + deltaPopulation, MIN_VALUE, 1000000);

    // Basic Newstickernachricht wird nach dem ersten Tag ausgeblendet.
    if(state.day > 1){
        document.querySelector(".newsTicker").style.display = "none";
    }

    // Zufällige Events -> unterteilt in common (30% Chance), uncommon (10% Chance) und rare (2% Chance). Je seltener das Event, desto größer sind die Auswirkungen auf die Werte. Es gibt sowohl positive als auch negative Events.
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

    // Wahrscheinlichkeiten der verschiedenen Eventarten.
    if (rnd <= 0.02) {
        pool = rareEvents;
    } else if (rnd <= 0.10) {
        pool = uncommonEvents;
    } else if (rnd <= 0.30) {
        pool = commonEvents;
    }


    if (pool) {
        // Zufälliges Event aus der entsprechenden Kategorie wird ausgewählt.
        const event = pool[Math.floor(Math.random() * pool.length)];

        // Event wird auf die verschiedenen Werte angewandt.
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

        // Event-Nachricht wird im Log und im NewsTicker angezeigt.
        log(`Tag ${state.day - 1}: ${event.message}`);
        newsLog = event.message;
        newsTicker(newsLog);

        // Building-Limit pro Tag wird resettet.
        buildingsPerRound = 0;
    }
    checkGameOver();
    if(!gameOver){
        // Voraussetzungen für das Anzeigen von Avataren wird überprüft.
        checkValueAvatarRequirements();
    }
    updateUI();
}

let newsTickerTimeout = null;

// Funktion, die eine Nachricht im Newsticker anzeigt.
function newsTicker(newsLog) {
    const wrapper = document.querySelector('.newsTicker');

    // Wenn bereits eine Nachricht angezeigt wird, wird der Timer zurückgesetzt und die alte Nachricht entfernt, um die neue Nachricht anzuzeigen.
    if (newsTickerTimeout) {
        clearTimeout(newsTickerTimeout);
        newsTickerTimeout = null;
    }

    // Alte Nachricht wird entfernt, wenn vorhanden.
    const oldNews = wrapper.querySelector('.newsText');
    if (oldNews) oldNews.remove();

    // Neuer Marquee-Tag wird erstellt, um die Nachricht anzuzeigen.
    const marquee = document.createElement('marquee');
    marquee.className = 'newsText';
    marquee.setAttribute('behavior', 'scroll');
    marquee.setAttribute('direction', 'left');
    marquee.setAttribute('scrollamount', '8');
    marquee.textContent = 'Nachrichten: ' + newsLog;
    wrapper.appendChild(marquee);

    wrapper.style.display = 'block';

    // Timeout von 20 Sekunden, nach dem die Nachricht automatisch ausgeblendet wird.
    newsTickerTimeout = setTimeout(() => {
        wrapper.style.display = 'none';
        newsTickerTimeout = null;
    }, 20000);
}

// Funktion, die Avatare mit Nachrichten anzeigt, falls bestimmte Wertkonstellationen eintreffen.
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

// Funktion, die Avatare mit Nachrichten anzeigt, falls bestimmte Gebäude platziert werden. -> immer 50% Chance bei Bau eines Gebäudes.
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

// Funktion, die das Spielende einleitet.
function endGame(message) {
    gameOver = true;
    ErrorBox(message);
    resetGame()
}

// Funktion, die alle Werte und UI Elemente auf die Startwerte zurücksetzt, um ein neues Spiel zu starten.
function resetGame() {
    document.querySelector('.log').innerHTML = '';
    state = {
        environment: [defaultValues[0], defaultValues[1], defaultValues[2], defaultValues[3]],
        money: defaultValues[4],
        happiness: defaultValues[5],
        day: defaultValues[6],
        population: defaultValues[7],
        history: []
    };
    gameOver = false;

    // Alle Gebäude von der Karte entfernen.
    const map = document.querySelector('.mapContainer');
    if (map) {
        const buildings = map.querySelectorAll('.map-building');
        buildings.forEach(building => building.remove());
    }

    // belegte Tiles werden zurückgesetzt.
    occupiedTiles.clear();
    renderActions(actions);
    updateUI();
}

// Reset Button resettet das Spiel bei Klick.
const resetButton = document.querySelector('.resetButton');
resetButton.addEventListener('click', resetGame);

// Log Button blendet Dropdown ein bei Hover.
document.querySelector('.logButton').addEventListener('mouseover', () => {
    document.querySelector('.logDropdown').style.display = 'block';
});

// Dropdown wird ausgeblendet, wenn die Maus nicht mehr über das Dropdown hovered.
document.querySelector('.logDropdown').addEventListener('mouseleave', () => {
    document.querySelector('.logDropdown').style.display = 'none';
});


const envDropdown = document.createElement('div');
envDropdown.className = 'envDropdown';
document.body.appendChild(envDropdown);

// Event Listener für die Umwelt-Ressource Bar, um das Dropdown mit den aktuellen Umweltwerten anzuzeigen.
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

// Funktion, die die aktuellen Umweltwerte in einem Dropdown anzeigt -> für Ressource Bar
function updateEnvDropdown() {
    envDropdown.innerHTML = `
        <strong>Umwelt-Effekte:</strong><br>
        Meeresspiegelanstieg: ${state.environment[0]}<br>
        Temperatur: ${state.environment[1]}<br>
        Wetterextreme: ${state.environment[2]}<br>
        Wasserverfügbarkeit: ${state.environment[3]}
    `;
}

// Funktion, die die aktuellen Umweltwerte in einem Dropdown anzeigt -> für Aktionen
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

// Offscreen-Canvas wird erstellt, um die Pixelwerte des Hintergrundbildes auszulesen und zu überprüfen, ob ein Tile als Fluss-Tile erkannt werden kann.
// Idee und Basisstruktur des Codes von ChatGPT generiert -> Überarbeitung und Anpassung anschließend
const offscreen = document.createElement('canvas');
const dimension = offscreen.getContext('2d');
const realCanvas = document.querySelector('.backgroundImage');

initRiverDetection();

// Funktion die überprüft, ob die RGB-Werte eines Pixels innerhalb eines bestimmten Toleranzbereichs um einen Ziel-RGB-Wert liegen.
function colorMatches(r, g, b, target, tol = 25) {
    return Math.abs(r - target[0]) <= tol &&
        Math.abs(g - target[1]) <= tol &&
        Math.abs(b - target[2]) <= tol;
}

// Funktion, die die Werte des echten Hintergrundbildes auf den Offscreen-Canvas überträgt, damit die Pixelwerte später ausgelesen und für die Flusserkennung verwendet werden können.
function initRiverDetection() {
    // Werte von echtem Bild auf Offscreen-Canvas übertragen
    offscreen.width = realCanvas.naturalWidth;
    offscreen.height = realCanvas.naturalHeight;
    // echtes Bild auf Offscreen-Canvas zeichnen, um Pixelwerte auslesen zu können
    dimension.drawImage(realCanvas, 0, 0);
}

// Funktion, die bei der Platzierung von Gebäuden aufgerufen wird, um zu überprüfen, ob das Gebäude auf einem Fluss- oder Baum-Tile platziert wird.
function isTileRiver(gridX, gridY) {
    if (offscreen.width === 0) return false;

    const mapElem   = document.querySelector('.mapContainer');
    const mapRect   = mapElem.getBoundingClientRect();
    const imgRect   = realCanvas.getBoundingClientRect();

    // Offset des Hintergrundbildes relativ zum mapContainer.
    const imgOffsetX = imgRect.left - mapRect.left;
    const imgOffsetY = imgRect.top  - mapRect.top;

    // Skalierungsfaktor: natürliche Bildgröße -> angezeigte Bildgröße
    const scaleX = realCanvas.naturalWidth  / imgRect.width;
    const scaleY = realCanvas.naturalHeight / imgRect.height;

    // Mittelpunkt des Tiles -> auf echte Bildkoordinaten skalieren -> mit Claude generiert
    const tileCenterCssX = gridX * TILE_SIZE + TILE_SIZE / 2;
    const tileCenterCssY = gridY * TILE_SIZE + TILE_SIZE / 2;

    // Tile-Mittelpunkt in CSS-Pixeln relativ zum Bild
    const relCssX = tileCenterCssX - imgOffsetX;
    const relCssY = tileCenterCssY - imgOffsetY;

    // Umrechnung in natürliche Bildpixel
    const tileCenterImgX = relCssX * scaleX;
    const tileCenterImgY = relCssY * scaleY;

    // Halbe Tile-Größe in natürlichen Bildpixeln
    const halfW = (TILE_SIZE / 2) * scaleX;
    const halfH = (TILE_SIZE / 2) * scaleY;

    // 4x4 gleichmäßiges Sampling-Grid über das Tile -> Code von Claude generiert
    const GRID = 4;
    const samples = [];
    for (let row = 0; row < GRID; row++) {
        for (let col = 0; col < GRID; col++) {
            const sx = tileCenterImgX - halfW + halfW * 2 * (col + 0.5) / GRID;
            const sy = tileCenterImgY - halfH + halfH * 2 * (row + 0.5) / GRID;
            samples.push([sx, sy]);
        }
    }

    // Wasser: Blau klar dominant, mittlere Sättigung (Fluss-Blau des Kartenbildes)
    const isWater = (r, g, b) =>
        b > 110 && b > r + 35 && b > g - 20 && r < 140;

    // Nadelbäume: rgb(23,68,19) -> sehr dunkles Grün, r und b sehr niedrig
    const isConifer = (r, g, b) =>
        g > r + 20 && g > b + 20 && g < 100 && r < 50 && b < 50;

    // Laubbäume: rgb(107,158,10), rgb(74,130,45), rgb(56,115,39)
    // Zusammengefügte RGB
    const isLeafTree = (r, g, b) =>
        g > r + 20 && g > b + 60 && b < 60 && b >= 5 &&
        g >= 100 && g < 175 && r >= 40 && r < 125;

    let waterHits = 0;
    let treeHits  = 0;
    const totalSamples = samples.length;

    for (const [sampleX, sampleY] of samples) {
        const x = Math.floor(sampleX);
        const y = Math.floor(sampleY);
        if (x < 0 || y < 0 || x >= offscreen.width || y >= offscreen.height) continue;
        const [r, g, b] = dimension.getImageData(x, y, 1, 1).data;

        if (isWater(r, g, b))         waterHits++;
        else if (isConifer(r, g, b))  treeHits++;
        else if (isLeafTree(r, g, b)) treeHits++;
    }

    // Wasser: ≥2 von 16 Treffern reichen (Wasserfarbe ist sehr eindeutig)
    if (waterHits >= 2) return true;
    // Bäume: mindestens 15 % der Samples müssen Baum-Pixel sein
    if (treeHits >= Math.ceil(totalSamples * 0.15)) return true;
    return false;
}

// Event Listener für den Shop Button, um den Shop bei Klick zu öffnen.
document.querySelector('.shopButton').addEventListener('click', () => {
    openShop();
});

// Event Listener für den Close Button, um den Shop bei Klick zu schließen.
document.querySelector('.shop-close').addEventListener('click', () => {
    closeShop();
});

// Event Listener für den Shop Container, um den Shop zu schließen, wenn außerhalb des Shopfensters geklickt wird.
document.querySelector('.shop').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        closeShop();
    }
});

// Funktion, die die Ressourcenwerte im Shop aktualisiert
function updateShopResources() {
    document.getElementById('shopMoneyValue').textContent = state.money;
    document.getElementById('shopHappinessValue').textContent = state.happiness;
    document.getElementById('shopEnvValue').textContent = getMeanEnvironment(state.environment).toFixed(0);
}

// Funktion, die den Shop öffnet, die Gebäude rendert und die Ressourcen im Shop aktualisiert.
function openShop() {
    const shop = document.querySelector('.shop');
    shop.classList.add('active');
    renderShopBuildings();
    updateShopResources();
}

// Funktion, die den Shop schließt.
function closeShop() {
    const shop = document.querySelector('.shop');
    shop.classList.remove('active');
}

// Gebäude im Shop werden gerendert.
function renderShopBuildings() {
    const shopContent = document.querySelector('.shop-content');
    shopContent.innerHTML = '';

    // für jedes Gebäude wird ein Fenster erstellt und zum Shop-Content hinzugefügt.
    buildings.forEach(building => {
        const card = createBuildingCard(building);
        shopContent.appendChild(card);
    });
}

let buildings = [];

// Gebäude werden aus JSON-File eingelesen
fetch('src/data/buildings.json')
    .then(response => response.json())
    .then(data => {
        buildings = data.buildings;
    });

// Funktion, die für jedes Gebäude ein Fenster mit den entsprechenden Informationen und Effekten erstellt.
function createBuildingCard(building) {
    const card = document.createElement('div');
    card.className = 'building-card';

    // Durchschnittlichen Umwelteffekt berechnen. Wenn es sich um ein Array handelt, wird der Durchschnitt berechnet, ansonsten wird der einzelne Wert genommen.
    const avgEnvChange = Array.isArray(building.effects.environment) 
        ? building.effects.environment.reduce((a, b) => a + b, 0) / building.effects.environment.length
        : building.effects.environment;

    // Wenn ein Bild für das Gebäude vorhanden ist, wird dieses angezeigt, ansonsten wird ein Platzhalter angezeigt. -> Code von Claude übernommen
    const imageHTML = building.image
        ? `<div class="building-image-placeholder" style="background: none; padding: 0;">
               <img src="${building.image}" alt="${building.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
           </div>`
        : `<div class="building-image-placeholder"></div>`;

    // HTML-Struktur des Gebäude-Fensters, die den Namen, die Beschreibung und die Effekte des Gebäudes anzeigt. -> Code von Claude übernommen
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

    // bei Klick auf das Gebäude-Fenster wird das Gebäude gekauft.
    card.addEventListener('click', () => {
        card.classList.remove('selected');
        card.classList.add('selected');
        setTimeout(() => card.classList.remove('selected'), 500);
        purchaseBuilding(building);
    });

    // Dropdown für die Umwelteffekte wird angezeigt, wenn im Shop über den Umwelteffekt im Gebäude-Fenster gehovert wird.
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


// Startwerte für die Gebäudeplatzierung und die Überprüfung der belegten Tiles.

// Pixelgröße eines Tiles
const TILE_SIZE = 256;
let placementMode = false;
let selectedBuilding = null;
let ghostBuilding = null;

// speichert belegte Building-Tiles -> keine Gebäude können aufeinander oder auf Fluss-Tiles platziert werden.
let occupiedTiles = new Set();


// Funktion, die beim Kauf eines Gebäudes aufgerufen wird.
function purchaseBuilding(building) {

    // Gebäude-Limit pro Tag -> es kann nur ein Gebäude pro Tag gebaut werden.
    if(buildingsPerRound >= 1){
        ErrorBox(`Du kannst pro Tag nur ein Gebäude bauen! Bitte klicke auf "Nächster Tag", um weitere Gebäude bauen zu können.`);
        return;
    }

    // Überprüfen, ob genug Geld für das Gebäude vorhanden ist.
    if (building.effects.money < 0 && state.money < Math.abs(building.effects.money)) {
        ErrorBox(`Nicht genug Geld! Du benötigst ${Math.abs(building.effects.money)} Geld, hast aber nur ${state.money}.`);
        return;
    }

    // Überprüfen, ob die maximale Anzahl an platzierten Gebäuden dieser Art bereits erreicht wurde.
    if(state.history.includes(building.name)){
        if(state.history.filter(name => name === building.name).length >= building.limit){
        ErrorBox(`Du hast die maximale mögliche Anzahl der Gebäude bereits überschritten.`);
        return;
        }
    }

    // Wenn alle Vorraussetzungen erfüllt -> Shop wird geschlossen und ghostBuilding wird erstellt.
    selectedBuilding = building;
    placementMode = true;

    closeShop();
    createGhostBuilding(building);
}

// ghostBuilding wird erstellt, um dem Spieler eine Vorschau des Gebäudes zu geben, bevor es platziert wird. -> Idee und Basisstruktur des Codes von ChatGPT
function createGhostBuilding(building) {
    // bestehende ghostBuildings werden resettet
    if (ghostBuilding) {
        ghostBuilding.remove();
        ghostBuilding = null;
    }

    const map = document.querySelector('.mapContainer');

    // ghostBuilding wird erstellt
    ghostBuilding = document.createElement('div');
    ghostBuilding.className = 'ghost-building';
    ghostBuilding.style.position = 'absolute';
    ghostBuilding.style.pointerEvents = 'none';

    // Bild des Gebäudes wird zum ghostBuilding hinzugefügt.
    const img = document.createElement('img');
    img.src = building.image;
    img.className = `building_image`;

    // Overlay wird erstellt -> rot oder grün gefärbt.
    const overlay = document.createElement('div');
    overlay.className = 'ghost-overlay';

    ghostBuilding.appendChild(img);
    ghostBuilding.appendChild(overlay);
    map.appendChild(ghostBuilding);
}

// Funktion, um zu prüfen, ob das der Nutzer über ein belegtes oder unbelegtes Tile hovert.
function checkTileOccupation() {
    const mapElem = document.querySelector('.mapContainer');
    if (!mapElem) return;

    // Position des ghostBuildings wird bei Mausbewegung aktualisiert.
    mapElem.addEventListener('mousemove', (e) => {
        if (!placementMode || !ghostBuilding) return;

        const rect = mapElem.getBoundingClientRect();
        // Berechne Grid-Position basierend auf Mausposition -> Code teilweise übernommen von ChatGPT
        const gridX = Math.floor((e.clientX - rect.left) / TILE_SIZE);
        const gridY = Math.floor((e.clientY - rect.top) / TILE_SIZE);

        ghostBuilding.style.left = gridX * TILE_SIZE + 'px';
        ghostBuilding.style.top = gridY * TILE_SIZE + 'px';

        // Koordinaten werden gespeichert als "x,y"
        const tileKey = `${gridX},${gridY}`;
        const overlay = ghostBuilding.querySelector('.ghost-overlay');
        // Überprüfen, ob das Tile ein River Tile ist.
        const river = isTileRiver(gridX, gridY);

        // Wenn das Tile bereits belegt ist oder ein River Tile ist, wird das Overlay rot gefärbt, ansonsten grün.
        if (occupiedTiles.has(tileKey) || river) {
            overlay.style.background = 'rgba(255,0,0,0.45)';
            overlay.style.borderColor = 'red';
        } else {
            overlay.style.background = 'rgba(0,255,0,0.35)';
            overlay.style.borderColor = 'lime';
        }
    });

    // Bei Klick wird das Gebäude versucht zu platzieren. -> Code teilweise von ChatGPT
    mapElem.addEventListener('click', (e) => {
        if (!placementMode || !selectedBuilding) return;

        const rect = mapElem.getBoundingClientRect();
        const gridX = Math.floor((e.clientX - rect.left) / TILE_SIZE);
        const gridY = Math.floor((e.clientY - rect.top) / TILE_SIZE);

        const tileKey = `${gridX},${gridY}`;

        // Abbruchbedingungen bei Platzierung: wenn Tile bereits belegt ist oder ein River Tile ist.
        if (occupiedTiles.has(tileKey)) {
            ErrorBox('Dieser Platz ist bereits belegt! Wähle eine andere Position.');
            return;
        }
        if (isTileRiver(gridX, gridY)) {
            ErrorBox('Hier fließt ein Fluss! Gebäude können nicht auf Wasser gebaut werden.');
            return;
        }

        // Wenn alle Bedingungen erfüllt sind -> drei Methoden aufgerufen zur endgültigen Platzierung, Kaufabwicklung und Cleanup.
        placeBuildingOnMap(selectedBuilding, gridX, gridY);
        finalizePurchase(selectedBuilding);
        cleanupPlacement();
    });
}

// Check, ob Platzierung auf Tile möglich ist.
checkTileOccupation();

// Funktion, die das Gebäude endgültig auf der Karte platziert.
function placeBuildingOnMap(building, gridX, gridY) {
    const map = document.querySelector('.mapContainer');

    const tileKey = `${gridX},${gridY}`;
    
    // Tile zum Set hinzugefügt
    occupiedTiles.add(tileKey);

    // Gebäude als div-Element mit Bild zur Karte hinzugefügt
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

// Funktion, die die Auswirkungen des Kaufs eines Gebäudes auf die Werte anwendet.
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

    // Gebäude wird zur Historie hinzugefügt, um die Anzahl der gebauten Gebäude zu tracken.
    state.history.push(building.name);

    // Log-Eintrag für das gebaute Gebäude wird erstellt.
    log(`Tag ${state.day}: Gebäude "${building.name}" gebaut.`);

    // Anzahl der gebauten Gebäude pro Tag wird erhöht. -> nur ein Gebäude pro Tag erlaubt.
    buildingsPerRound++;

    updateUI();
    updateShopResources();
    checkGameOver();
    if(!gameOver){
        checkValueAvatarRequirements()
        checkBuildingAvatarRequirements(building)
    }
}

// Funktion, die ghostBuildings entfernt und aus dem Platzierungsmodus herausgeht.
function cleanupPlacement() {
    placementMode = false;
    selectedBuilding = null;

    if (ghostBuilding) {
        ghostBuilding.remove();
        ghostBuilding = null;
    }
}

// Escape als Abbruchtaste für die Gebäudeplatzierung
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && placementMode) {
        cleanupPlacement();
    }
});

// Rechtsklick als Abbruchtaste für die Gebäudeplatzierung -> https://stackoverflow.com/questions/44620877/eventlistener-for-right-click
document.addEventListener('mousedown', (e) => {
    if (e.button === 2 && placementMode) {
        cleanupPlacement();
    }
});

// Funktion, die eine Fehlermeldung in einem ErrorBox-Element anzeigt.
function ErrorBox(message) {

    const existing = document.querySelector('.errorBox');
    // Wenn bereits eine ErrorBox angezeigt wird, wird diese entfernt.
    if (existing) {
        existing.remove();
    }

    // Generieren der ErrorBox.
    const errorBox = document.createElement('div');
    const errorBoxPicture = document.createElement('img');
    const errorBoxText = document.createElement('p');
    errorBoxPicture.src = 'assets/ErrorBox.png';
    errorBoxPicture.className = 'errorBoxImage';
    errorBoxText.textContent = message;
    errorBoxText.className = 'errorBoxText';
    errorBox.appendChild(errorBoxText);
    errorBox.appendChild(errorBoxPicture);
    errorBox.className = 'errorBox';

    document.body.appendChild(errorBox);

    // Timeout von 5 Sekunden, nach dem die ErrorBox automatisch entfernt wird.
    setTimeout(() => {
        if (errorBox && errorBox.parentElement) errorBox.remove();
    }, 5000);
}

// Funktion, welche eine zufällige Avatar-Nachricht anzeigt, wenn bestimmte Bedingungen erfüllt sind.
    function showRandomAvatar(message) {
        // Generieren eines Containers für den Avatar und die Sprechblase.
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'avatarContainer';
        document.body.appendChild(avatarContainer);
        const avatarPictures = [
            'assets/Avatars/AchimNovak.png',
            'assets/Avatars/AndreasBruno.png',
            'assets/Avatars/EmilyPham.png',
            'assets/Avatars/TuanaFranke.png',
        ];

        // zufällige Auswahl eines Avatarbildes.
        const randomAvatar = avatarPictures[Math.floor(Math.random() * avatarPictures.length)];
        const img = document.createElement('img');

        // RegEx von Copilot mit dem Name aus dem Dateinamen extrahiert wird, um ihn die Sprechblase einzufügen.
        const avatarName = randomAvatar.match(/\/([^\/]+)\.png$/)[1].replace(/([A-Z])/g, ' $1').trim();
        img.src = randomAvatar;
        img.className = 'avatarImage';
        avatarContainer.appendChild(img);

        // Erstellen der Sprechblase mit der Nachricht.
        const SprechblaseWrapper = document.createElement('div');
        SprechblaseWrapper.className = 'SprechblaseWrapper';
        const Sprechblase = document.createElement('img');
        Sprechblase.src = 'assets/speechBubble.png';
        Sprechblase.className = 'Sprechblase';
        const bubbleText = document.createElement('p');
        bubbleText.innerHTML = `<span class="bubbleName">${avatarName}:</span><br>${message}`
        bubbleText.className = 'bubbleText';
        SprechblaseWrapper.appendChild(Sprechblase);
        SprechblaseWrapper.appendChild(bubbleText);
        avatarContainer.appendChild(SprechblaseWrapper);

        // Timeout von 7 Sekunden, nach dem der Avatar automatisch entfernt wird.
        setTimeout(() => {
            if (avatarContainer && avatarContainer.parentElement) avatarContainer.remove();
        }, 7000000);
    }

