// =========================
// Global State
// =========================

let leftPokemon = null;
let rightPokemon = null;

let leftCurrentHp = 0;
let rightCurrentHp = 0;
let leftCurrentDefense = 0;
let rightCurrentDefense = 0;

let leftDefenseUsageCount = 3;
let rightDefenseUsageCount = 3;
let leftHpUsageCount = 3;
let rightHpUsageCount = 3;

// "player" (left side), "enemy" (right side), or null when battle ended
let currentTurn = null;

let isStartBattleMessage = false;

// Control if actions can occur (only when no logs are being shown)
let canAct = true;

// =========================
// Capitalize first letter
// =========================
function capitalizeFirstLetter(text) {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
}

// =========================
// Log color helpers
// =========================

function formatPlayerName(name) {
    return `<span class="log-player-name">${capitalizeFirstLetter(name)}</span>`;
}

function formatEnemyName(name) {
    return `<span class="log-enemy-name">${capitalizeFirstLetter(name)}</span>`;
}

function formatNameForSide(pokemon, isPlayer) {
    return isPlayer
        ? formatPlayerName(pokemon.name)
        : formatEnemyName(pokemon.name);
}

function formatActionAttack() {
    return `<span class="log-action-attack">Attack</span>`;
}

function formatActionDefense() {
    return `<span class="log-action-defense">Defense</span>`;
}

function formatActionHp() {
    return `<span class="log-action-hp">HP</span>`;
}

function formatRecoveryAmount(amount) {
    return `<span class="log-recovery-amount">+${amount}</span>`;
}

function formatRecoveryCount(count) {
    return `<span class="log-recovery-count">${count}</span>`;
}

// =========================
// Button Helpers
// =========================

function getBattleButtons() {
    return {
        btnAttack: document.getElementById("btnAttack"),
        btnRun: document.getElementById("btnRun"),
        btnHp: document.getElementById("btnHp"),
        btnDef: document.getElementById("btnDef"),
    };
}

// Attack / Run: hard state (use disabled)
function setButtonStateHard(button, enabled) {
    if (!button) return;
    button.disabled = !enabled;
    button.style.opacity = enabled ? "1" : "0.3";
    button.style.cursor = enabled ? "pointer" : "default";
}

// HP / DEF: soft state (click still works, only visual change)
function setButtonStateSoft(button, enabled) {
    if (!button) return;
    button.style.opacity = enabled ? "1" : "0.3";
    button.style.cursor = enabled ? "pointer" : "default";
}

function updatePlayerButtonsState() {
    const { btnAttack, btnRun, btnHp, btnDef } = getBattleButtons();

    // Se o botão Run já está em modo "Next battle", não mexer nele
    if (btnRun && btnRun.textContent === "Next battle") {
        btnRun.disabled = false;
        btnRun.style.opacity = "1";
        btnRun.style.cursor = "pointer";
        if (btnAttack) setButtonStateHard(btnAttack, false);
        if (btnHp) setButtonStateSoft(btnHp, false);
        if (btnDef) setButtonStateSoft(btnDef, false);
        return;
    }

    // If battle ended or Pokémon not loaded yet
    if (!leftPokemon || !rightPokemon || currentTurn === null) {
        setButtonStateHard(btnAttack, false);
        setButtonStateHard(btnRun, false);
        setButtonStateSoft(btnHp, false);
        setButtonStateSoft(btnDef, false);
        return;
    }

    const isPlayerTurn = currentTurn === "player";

    const actionAllowed = isPlayerTurn && canAct;

    // Attack and Run only on player's turn and when canAct
    setButtonStateHard(btnAttack, actionAllowed);
    setButtonStateHard(btnRun, actionAllowed);

    const isHpFull = leftCurrentHp >= leftPokemon.hp;
    const isDefenseFull = leftCurrentDefense >= leftPokemon.defense;

    const canUseHpVisual =
        actionAllowed &&
        !isHpFull &&
        leftHpUsageCount > 0 &&
        leftCurrentHp > 0 &&
        rightCurrentHp > 0;

    const canUseDefenseVisual =
        actionAllowed &&
        !isDefenseFull &&
        leftDefenseUsageCount > 0 &&
        leftCurrentDefense > 0 &&
        leftCurrentHp > 0 &&
        rightCurrentHp > 0;

    setButtonStateSoft(btnHp, canUseHpVisual);
    setButtonStateSoft(btnDef, canUseDefenseVisual);
}

// =========================
// API Helpers
// =========================

async function fetchPokemonById(id) {
    const API_URL = `https://pokeapi.co/api/v2/pokemon/${id}`;
    const response = await fetch(API_URL);

    if (!response.ok) {
        throw new Error(`Failed to fetch Pokémon with ID ${id}`);
    }

    const data = await response.json();
    return data;
}

function simplifyPokemon(rawPokemon) {
    const hpStat = rawPokemon.stats.find((stat) => stat.stat.name === "hp");
    const attackStat = rawPokemon.stats.find((stat) => stat.stat.name === "attack");
    const defenseStat = rawPokemon.stats.find((stat) => stat.stat.name === "defense");
    const speedStat = rawPokemon.stats.find((stat) => stat.stat.name === "speed");

    return {
        name: capitalizeFirstLetter(rawPokemon.name),
        id: rawPokemon.id,
        hp: hpStat ? hpStat.base_stat : 0,
        attack: attackStat ? attackStat.base_stat : 0,
        defense: defenseStat ? defenseStat.base_stat : 0,
        speed: speedStat ? speedStat.base_stat : 0,
        types: rawPokemon.types.map((t) => t.type.name),
        sprite:
            rawPokemon.sprites.front_default ||
            rawPokemon.sprites.other["official-artwork"].front_default,
    };
}

// =========================
// Fetch and Initialize
// =========================

async function fetchPokemons() {
    try {
        const randomId1 = Math.floor(Math.random() * 151) + 1;
        let randomId2 = Math.floor(Math.random() * 151) + 1;

        while (randomId2 === randomId1) {
            randomId2 = Math.floor(Math.random() * 151) + 1;
        }

        const rawPokemon1 = await fetchPokemonById(randomId1);
        const rawPokemon2 = await fetchPokemonById(randomId2);

        const pokemon1 = simplifyPokemon(rawPokemon1);
        const pokemon2 = simplifyPokemon(rawPokemon2);

        leftPokemon = pokemon1;
        rightPokemon = pokemon2;

        leftCurrentHp = pokemon1.hp;
        rightCurrentHp = pokemon2.hp;
        leftCurrentDefense = pokemon1.defense;
        rightCurrentDefense = pokemon2.defense;

        leftDefenseUsageCount = 3;
        rightDefenseUsageCount = 3;
        leftHpUsageCount = 3;
        rightHpUsageCount = 3;

        setPokemon(pokemon1, 1);
        setPokemon(pokemon2, 2);

        // Decide who goes first
        if (leftPokemon.speed > rightPokemon.speed) {
            currentTurn = "player";
            isStartBattleMessage = true;
            enqueueLog(
                `${formatPlayerName(leftPokemon.name)} is faster and starts!`
            );
        } else if (rightPokemon.speed > leftPokemon.speed) {
            currentTurn = "enemy";
            isStartBattleMessage = true;
            enqueueLog(
                `${formatEnemyName(rightPokemon.name)} is faster and starts!`
            );
        } else {
            currentTurn = Math.random() < 0.5 ? "player" : "enemy";
            const starter =
                currentTurn === "player"
                    ? formatPlayerName(leftPokemon.name)
                    : formatEnemyName(rightPokemon.name);
            enqueueLog(`Same speed! ${starter} starts!`);
        }

        updateTurnIndicator();
        updatePlayerButtonsState();
    } catch (error) {
        console.error("Error fetching Pokémon:", error);

        const fallback = {
            name: "pikachu",
            id: 25,
            hp: 35,
            attack: 55,
            defense: 40,
            speed: 90,
            types: ["electric"],
            sprite:
                "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
        };

        leftPokemon = fallback;
        rightPokemon = fallback;

        leftCurrentHp = fallback.hp;
        rightCurrentHp = fallback.hp;
        leftCurrentDefense = fallback.defense;
        rightCurrentDefense = fallback.defense;

        leftDefenseUsageCount = 3;
        rightDefenseUsageCount = 3;
        leftHpUsageCount = 3;
        rightHpUsageCount = 3;

        setPokemon(fallback, 1);
        setPokemon(fallback, 2);

        currentTurn = "player";
        updateTurnIndicator();
        updatePlayerButtonsState();
    }
}

// =========================
// UI Update
// =========================

function setPokemon(pokemon, index) {
    const nameElement = document.getElementById(`name${index}`);
    const hpElement = document.getElementById(`hp${index}`);
    const hpBarElement = document.getElementById(`hp-Bar${index}`);
    const defElement = document.getElementById(`def${index}`);
    const defBarElement = document.getElementById(`def-Bar${index}`);
    const imageElement = document.getElementById(`img${index}`);

    if (nameElement) {
        nameElement.textContent = capitalizeFirstLetter(pokemon.name);
    }

    const currentHp = index === 1 ? leftCurrentHp : rightCurrentHp;
    const maxHp = pokemon.hp;

    if (hpElement) {
        hpElement.textContent = `${currentHp} / ${maxHp}`;
    }

    if (hpBarElement) {
        const hpPercentage = (currentHp / maxHp) * 100;
        hpBarElement.style.width = `${hpPercentage}%`;

        if (hpPercentage > 50) {
            hpBarElement.style.background =
                "linear-gradient(90deg, #22c55e, #4ade80)";
        } else if (hpPercentage > 20) {
            hpBarElement.style.background =
                "linear-gradient(90deg, #facc15, #fde047)";
        } else {
            hpBarElement.style.background =
                "linear-gradient(90deg, #fb7185, #ef4444)";
        }
    }

    const currentDefense = index === 1 ? leftCurrentDefense : rightCurrentDefense;
    const maxDefense = pokemon.defense || 1;

    if (defElement) {
        defElement.textContent = `${currentDefense} / ${maxDefense}`;
    }

    if (defBarElement) {
        const defensePercentage = (currentDefense / maxDefense) * 100;
        defBarElement.style.width = `${defensePercentage}%`;
    }

    // Attack & Speed lines
    const atkElement = document.getElementById(`atk${index}`);
    const spdElement = document.getElementById(`spd${index}`);

    if (atkElement) {
        atkElement.textContent = pokemon.attack;
    }
    if (spdElement) {
        spdElement.textContent = pokemon.speed;
    }

    if (imageElement) {
        imageElement.src = pokemon.sprite;
        imageElement.alt = `Image of ${capitalizeFirstLetter(pokemon.name)}`;
        imageElement.style.position = "relative";
    }

    // Buttons and dialog only on player side (index 1)
    if (index === 1) {
        const dialogElement = document.getElementById("dialogText");
        if (dialogElement) {
            dialogElement.textContent = `What will ${capitalizeFirstLetter(pokemon.name)} do?`;
        }

        const { btnAttack, btnRun, btnHp, btnDef } = getBattleButtons();

        if (btnAttack) {
            btnAttack.onclick = () => {
                if (currentTurn !== "player" || !canAct) return;
                playerAttack();
            };
        }

        if (btnRun) {
            btnRun.onclick = () => {
                if (btnRun.textContent === "Next battle") {
                    window.location.reload();
                    return;
                }
                if (currentTurn !== "player" || !canAct) return;
                enqueueLog(
                    `${formatPlayerName(pokemon.name)} ran away safely!`
                );
                if (dialogElement) {
                    dialogElement.textContent = `${capitalizeFirstLetter(
                        pokemon.name,
                    )} ran away...`;
                }
                currentTurn = null;
                updateTurnIndicator();
                updatePlayerButtonsState();
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            };
        }

        if (btnHp) {
            btnHp.onclick = () => {
                if (!canAct) return;
                if (currentTurn === null || !leftPokemon || !rightPokemon) {
                    enqueueLog("The battle is already over!");
                    return;
                }
                if (currentTurn !== "player") {
                    enqueueLog("It's not your turn!");
                    return;
                }
                if (leftCurrentHp >= leftPokemon.hp) {
                    enqueueLog(
                        `${formatPlayerName(leftPokemon.name)}'s ${formatActionHp()} is already full!`
                    );
                    return;
                }
                if (leftHpUsageCount <= 0) {
                    enqueueLog(
                        `${formatPlayerName(leftPokemon.name)} has no ${formatActionHp()} recoveries left!`
                    );
                    return;
                }

                recoverStat("hp", "player");
            };
        }

        if (btnDef) {
            btnDef.onclick = () => {
                if (!canAct) return;
                if (currentTurn === null || !leftPokemon || !rightPokemon) {
                    enqueueLog("The battle is already over!");
                    return;
                }
                if (currentTurn !== "player") {
                    enqueueLog("It's not your turn!");
                    return;
                }
                if (leftCurrentDefense <= 0) {
                    enqueueLog(
                        `${formatPlayerName(leftPokemon.name)}'s ${formatActionDefense()} is already broken!`
                    );
                    return;
                }
                if (leftCurrentDefense >= leftPokemon.defense) {
                    enqueueLog(
                        `${formatPlayerName(leftPokemon.name)}'s ${formatActionDefense()} is already full!`
                    );
                    return;
                }
                if (leftDefenseUsageCount <= 0) {
                    enqueueLog(
                        `${formatPlayerName(leftPokemon.name)} has no ${formatActionDefense()} recoveries left!`
                    );
                    return;
                }

                recoverStat("defense", "player");
            };
        }

        updatePlayerButtonsState();
    }
}

function updateTurnIndicator() {
    const indicator = document.getElementById("turnIndicator");
    if (!indicator) return;

    if (currentTurn === "player") {
        indicator.textContent = "Turn: PLAYER";
    } else if (currentTurn === "enemy") {
        indicator.textContent = "Turn: ENEMY";
    } else {
        indicator.textContent = "Battle ended";
    }
}

// =========================
// Action Animation (move down)
// =========================

function animatePokemonAction(index) {
    const img = document.getElementById(`img${index}`);
    if (!img) return;

    img.classList.remove("pokemon-action-player");
    img.classList.remove("pokemon-action-enemy");
    void img.offsetWidth;

    if (index === 1) {
        img.classList.add("pokemon-action-player");
    } else if (index === 2) {
        img.classList.add("pokemon-action-enemy");
    }
}

// =========================
// Battle Flow Helpers
// =========================

function highlightNextBattleButton() {
    const { btnAttack, btnRun, btnHp, btnDef } = getBattleButtons();
    if (!btnRun) return;

    btnRun.disabled = false;
    btnRun.style.opacity = "1";
    btnRun.style.cursor = "pointer";
    btnRun.style.backgroundColor = "#004bc4";
    btnRun.style.color = "#fff";
    btnRun.style.border = "2px solid #0026ff";
    btnRun.style.transform = "scale(1.05)";
    btnRun.style.boxShadow = "0 0 12px rgba(1, 23, 150, 0.8)";
    btnRun.style.fontWeight = "700";
    btnRun.textContent = "Next battle";

    const fadeAndDisable = (button) => {
        if (!button) return;
        button.disabled = true;
        button.style.opacity = "0.3";
        button.style.cursor = "default";
        button.style.boxShadow = "none";
        button.style.transform = "none";
    };

    fadeAndDisable(btnAttack);
    fadeAndDisable(btnHp);
    fadeAndDisable(btnDef);

    btnRun.onclick = () => {
        window.location.reload();
    };
}

function checkBattleEnd() {
    if (rightCurrentHp <= 0) {
        enqueueLog(`${formatEnemyName(rightPokemon.name)} fainted!`);
        highlightNextBattleButton();
        currentTurn = null;
        updateTurnIndicator();
        return true;
    }

    if (leftCurrentHp <= 0) {
        enqueueLog(`${formatPlayerName(leftPokemon.name)} fainted!`);
        highlightNextBattleButton();
        currentTurn = null;
        updateTurnIndicator();
        return true;
    }

    return false;
}

function endPlayerTurn() {
    if (checkBattleEnd()) return;
    currentTurn = "enemy";
    updateTurnIndicator();
    updatePlayerButtonsState();
}

function endEnemyTurn() {
    if (checkBattleEnd()) return;
    currentTurn = "player";
    updateTurnIndicator();
    const dialogElement = document.getElementById("dialogText");
    if (dialogElement && leftPokemon) {
        dialogElement.textContent = `WHAT WILL ${leftPokemon.name.toUpperCase()} DO?`;
    }
    updatePlayerButtonsState();
}

// =========================
// Player Actions
// =========================

function playerAttack() {
    const attacker = leftPokemon;
    const defender = rightPokemon;

    if (!canAct) return;

    if (rightCurrentHp <= 0 || leftCurrentHp <= 0) {
        enqueueLog("The battle is already over!");
        return;
    }

    enqueueLog(
        `${formatPlayerName(attacker.name)} used ${formatActionAttack()} on ${formatEnemyName(defender.name)}!`
    );
    animatePokemonAction(1);

    let remainingAttack = attacker.attack;

    if (rightCurrentDefense > 0) {
        if (remainingAttack >= rightCurrentDefense) {
            remainingAttack -= rightCurrentDefense;
            rightCurrentDefense = 0;
            enqueueLog("Enemy defense was broken!");
        } else {
            rightCurrentDefense -= remainingAttack;
            remainingAttack = 0;
        }
    }

    if (remainingAttack > 0) {
        rightCurrentHp = Math.max(0, rightCurrentHp - remainingAttack);
    }

    setPokemon(leftPokemon, 1);
    setPokemon(rightPokemon, 2);
    updatePlayerButtonsState();

    endPlayerTurn();
}

// =========================
// Enemy Actions & AI
// =========================

function enemyTurn() {
    if (!canAct) return;
    if (currentTurn !== "enemy" || !rightPokemon) return;
    if (checkBattleEnd()) return;

    const canRecoverHp = rightCurrentHp < rightPokemon.hp && rightHpUsageCount > 0;
    const canRecoverDefense =
        rightCurrentDefense < rightPokemon.defense &&
        rightCurrentDefense > 0 &&
        rightDefenseUsageCount > 0;

    const possibleActions = [];
    possibleActions.push("attack");
    if (canRecoverHp) possibleActions.push("hp");
    if (canRecoverDefense) possibleActions.push("defense");

    const randomIndex = chooseAction(possibleActions, {
        hp: rightCurrentHp,
        maxHp: rightPokemon.hp,
        defense: rightCurrentDefense,
        maxDefense: rightPokemon.defense,
    });

    const action = possibleActions[randomIndex];

    if (action === "attack") {
        enemyAttack();
    } else if (action === "hp") {
        recoverStat("hp", "enemy");
    } else if (action === "defense") {
        recoverStat("defense", "enemy");
    }
}

function chooseAction(possibleActions, status) {
    const rand = Math.random();

    // Base weights: Attack = 40%, HP = 30%, DEF = 30%
    let pAttack = 0.4;
    let pHp = 0.3;
    let pDef = 0.3;

    const isLowHp = status.hp / status.maxHp <= 0.3;
    const isLowDefense = status.defense / status.maxDefense <= 0.3;

    if (isLowHp) {
        pAttack = 0.3;
        pHp = 0.4;
        pDef = 0.3;
    } else if (isLowDefense) {
        pAttack = 0.3;
        pHp = 0.3;
        pDef = 0.4;
    }

    let weightAttack = 0;
    let weightHp = 0;
    let weightDef = 0;

    if (possibleActions.includes("attack")) weightAttack = pAttack;
    if (possibleActions.includes("hp")) weightHp = pHp;
    if (possibleActions.includes("defense")) weightDef = pDef;

    const totalWeight = weightAttack + weightHp + weightDef || 1;

    weightAttack /= totalWeight;
    weightHp /= totalWeight;
    weightDef /= totalWeight;

    const r = rand;

    if (r < weightAttack) {
        return possibleActions.indexOf("attack");
    }
    if (r < weightAttack + weightHp) {
        return possibleActions.indexOf("hp");
    }
    return possibleActions.indexOf("defense");
}

function enemyAttack() {
    const attacker = rightPokemon;
    const defender = leftPokemon;

    if (!canAct) return;
    if (rightCurrentHp <= 0 || leftCurrentHp <= 0) {
        return;
    }

    enqueueLog(
        `${formatEnemyName(attacker.name)} used ${formatActionAttack()} on ${formatPlayerName(defender.name)}!`
    );
    animatePokemonAction(2);

    let remainingAttack = attacker.attack;

    if (leftCurrentDefense > 0) {
        if (remainingAttack >= leftCurrentDefense) {
            remainingAttack -= leftCurrentDefense;
            leftCurrentDefense = 0;
            enqueueLog("Your defense was broken!");
        } else {
            leftCurrentDefense -= remainingAttack;
            remainingAttack = 0;
        }
    }

    if (remainingAttack > 0) {
        leftCurrentHp = Math.max(0, leftCurrentHp - remainingAttack);
    }

    setPokemon(leftPokemon, 1);
    setPokemon(rightPokemon, 2);
    updatePlayerButtonsState();

    endEnemyTurn();
}

// =========================
// Recover Stats (HP / Defense)
// =========================

function recoverStat(action, actor) {
    const isPlayer = actor === "player";
    if (!canAct) return;

    const pokemon = isPlayer ? leftPokemon : rightPokemon;
    let currentHp = isPlayer ? leftCurrentHp : rightCurrentHp;
    let currentDefense = isPlayer ? leftCurrentDefense : rightCurrentDefense;
    let hpUsage = isPlayer ? leftHpUsageCount : rightHpUsageCount;
    let defenseUsage = isPlayer ? leftDefenseUsageCount : rightDefenseUsageCount;

    const base = action === "defense" ? pokemon.defense : pokemon.hp;
    const randomAmount = Math.round(Math.random() * base * 0.3 + 5);

    if (leftCurrentHp <= 0 || rightCurrentHp <= 0) {
        enqueueLog("The battle is already over!");
        return;
    }

    if (action === "defense" && defenseUsage <= 0) {
        enqueueLog(
            `${formatNameForSide(pokemon, isPlayer)} has no ${formatActionDefense()} recoveries left!`
        );
        if (isPlayer) {
            setPokemon(leftPokemon, 1);
            setPokemon(rightPokemon, 2);
            updatePlayerButtonsState();
            endPlayerTurn();
        } else {
            endEnemyTurn();
        }
        return;
    }

    if (action === "hp" && hpUsage <= 0) {
        enqueueLog(
            `${formatNameForSide(pokemon, isPlayer)} has no ${formatActionHp()} recoveries left!`
        );
        if (isPlayer) {
            setPokemon(leftPokemon, 1);
            setPokemon(rightPokemon, 2);
            updatePlayerButtonsState();
            endPlayerTurn();
        } else {
            endEnemyTurn();
        }
        return;
    }

    if (action === "defense") {
        if (currentDefense <= 0) {
            enqueueLog(
                `${formatNameForSide(pokemon, isPlayer)}'s ${formatActionDefense()} is already broken!`
            );
            if (isPlayer) {
                setPokemon(leftPokemon, 1);
                setPokemon(rightPokemon, 2);
                updatePlayerButtonsState();
                endPlayerTurn();
            } else {
                endEnemyTurn();
            }
            return;
        }

        if (currentDefense < pokemon.defense) {
            currentDefense = Math.min(currentDefense + randomAmount, pokemon.defense);
            currentDefense = Math.max(currentDefense, 0);
            defenseUsage--;
            enqueueLog(
                `${formatNameForSide(pokemon, isPlayer)}'s ${formatActionDefense()} increased by ${formatRecoveryAmount(
                    randomAmount,
                )}.<div class="log-recovery-center">Recoveries left: ${formatRecoveryCount(
                    defenseUsage,
                )}</div>`
            );
        } else {
            enqueueLog(
                `${formatNameForSide(pokemon, isPlayer)}'s ${formatActionDefense()} is already full!`
            );
            if (isPlayer) {
                setPokemon(leftPokemon, 1);
                setPokemon(rightPokemon, 2);
                updatePlayerButtonsState();
                endPlayerTurn();
            } else {
                endEnemyTurn();
            }
            return;
        }
    } else if (action === "hp") {
        if (currentHp < pokemon.hp) {
            currentHp = Math.min(currentHp + randomAmount, pokemon.hp);
            currentHp = Math.max(currentHp, 0);
            hpUsage--;
            enqueueLog(
                `${formatNameForSide(pokemon, isPlayer)}'s ${formatActionHp()} recovered by ${formatRecoveryAmount(
                    randomAmount,
                )}.<div class="log-recovery-center">Recoveries left: ${formatRecoveryCount(
                    hpUsage,
                )}</div>`
            );
        } else {
            enqueueLog(
                `${formatNameForSide(pokemon, isPlayer)}'s ${formatActionHp()} is already full!`
            );
            if (isPlayer) {
                setPokemon(leftPokemon, 1);
                setPokemon(rightPokemon, 2);
                updatePlayerButtonsState();
                endPlayerTurn();
            } else {
                endEnemyTurn();
            }
            return;
        }
    }

    animatePokemonAction(isPlayer ? 1 : 2);

    if (isPlayer) {
        leftCurrentHp = currentHp;
        leftCurrentDefense = currentDefense;
        leftHpUsageCount = hpUsage;
        leftDefenseUsageCount = defenseUsage;
    } else {
        rightCurrentHp = currentHp;
        rightCurrentDefense = currentDefense;
        rightHpUsageCount = hpUsage;
        rightDefenseUsageCount = defenseUsage;
    }

    setPokemon(leftPokemon, 1);
    setPokemon(rightPokemon, 2);
    updatePlayerButtonsState();

    if (isPlayer) {
        endPlayerTurn();
    } else {
        endEnemyTurn();
    }
}

// =========================
// Log Queue
// =========================

const logQueue = [];
let isShowingLog = false;

function enqueueLog(message) {
    logQueue.push(message);
    if (!isShowingLog) {
        showNextLog();
    }
}

function showNextLog() {
    const element = document.getElementById("log");
    if (!element) return;

    if (logQueue.length === 0) {
        isShowingLog = false;
        canAct = true;
        element.innerHTML = "";
        element.style.display = "none";
        updatePlayerButtonsState();

        // If it's enemy turn and no logs, enemy acts now
        if (currentTurn === "enemy") {
            setTimeout(() => {
                if (currentTurn === "enemy" && canAct) {
                    enemyTurn();
                }
            }, 50);
        }

        return;
    }

    isShowingLog = true;
    canAct = false;
    updatePlayerButtonsState();

    const message = logQueue.shift();

    element.style.display = "block";
    element.innerHTML = message;

    element.classList.remove("show");
    void element.offsetWidth;
    element.classList.add("show");

    setTimeout(() => {
        element.innerHTML = "";
        element.classList.remove("show");
        showNextLog();
    }, 1750);
}

// =========================
// Mobile viewport height fix (URL bar)
// =========================

function updateViewportHeightVariable() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
}

updateViewportHeightVariable();
window.addEventListener("resize", updateViewportHeightVariable);
window.addEventListener("orientationchange", updateViewportHeightVariable);

// =========================
// Init
// =========================

fetchPokemons();