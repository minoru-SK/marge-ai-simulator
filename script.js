const size = 4;
let tiles = []; // { id, value, r, c }
let nextId = 1;

let startX = 0;
let startY = 0;
let isSwiping = false;

const game = document.getElementById("game");

game.addEventListener("touchstart", e => {
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    isSwiping = true;
}, { passive: true });

game.addEventListener("touchmove", e => {
    if (!isSwiping) return;

    // ★ 盤面上のスワイプは画面スクロールを止める
    e.preventDefault();
}, { passive: false });

game.addEventListener("touchend", e => {
    if (!isSwiping) return;
    isSwiping = false;

    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30) move("right");
        else if (dx < -30) move("left");
    } else {
        if (dy > 30) move("down");
        else if (dy < -30) move("up");
    }
});

function initBoard() {
    const game = document.getElementById("game");
    game.innerHTML = "";
    game.style.position = "relative";

    for (let i = 0; i < size * size; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.index = i;
        cell.addEventListener("click", onCellClick);
        game.appendChild(cell);
    }

    tiles = [];
    nextId = 1;
    draw();
    clearArrows();
    setAIMessage("AI 推奨手：未計算");
}


function onCellClick(e) {
    const index = Number(e.currentTarget.dataset.index);
    const r = Math.floor(index / size);
    const c = index % size;

    const input = prompt("配置する数字を入力してください（1〜4、空にする場合は空欄）", "1");
    if (input === null) return;

    const trimmed = input.trim();
    if (trimmed === "") {
        tiles = tiles.filter(t => !(t.r === r && t.c === c));
        draw();
        clearArrows();
        showBestMove();
        setAIMessage("AI 推奨手：自動計算しました");
        return;
    }

    const v = Number(trimmed);
    if (![1, 2, 3, 4].includes(v)) {
        alert("1〜4 の数字を入力してください。");
        return;
    }

    tiles = tiles.filter(t => !(t.r === r && t.c === c));
    tiles.push({ id: nextId++, value: v, r, c });
    draw();
    clearArrows();
    setAIMessage("AI 推奨手：盤面変更のため再計算してください");
}

function draw() {
    const game = document.getElementById("game");
    document.querySelectorAll(".tile").forEach(t => t.remove());

    const cells = document.querySelectorAll(".cell");
    const gameRect = game.getBoundingClientRect();

    tiles.forEach(tileObj => {
        const tile = document.createElement("div");
        tile.classList.add("tile", "tile-" + tileObj.value);
        tile.textContent = tileObj.value;
        tile.dataset.id = tileObj.id;

        const index = tileObj.r * size + tileObj.c;
        const rect = cells[index].getBoundingClientRect();

        tile.style.top = (rect.top - gameRect.top) + "px";
        tile.style.left = (rect.left - gameRect.left) + "px";

        game.appendChild(tile);
    });
}

function slideRow(rowTiles) {
    let result = [];
    let skip = false;

    for (let i = 0; i < rowTiles.length; i++) {
        if (skip) {
            skip = false;
            continue;
        }
        if (i < rowTiles.length - 1 && rowTiles[i].value === rowTiles[i + 1].value) {
            result.push({
                id: rowTiles[i].id,
                value: rowTiles[i].value + 1
            });
            skip = true;
        } else {
            result.push({
                id: rowTiles[i].id,
                value: rowTiles[i].value
            });
        }
    }
    return result;
}

function applyMove(dir, tilesInput) {
    let newTiles = JSON.parse(JSON.stringify(tilesInput));

    if (dir === "left") {
        for (let r = 0; r < size; r++) {
            let row = newTiles.filter(t => t.r === r).sort((a, b) => a.c - b.c);
            let compact = slideRow(row);
            compact.forEach((t, i) => {
                t.r = r;
                t.c = i;
            });
            newTiles = newTiles.filter(t => t.r !== r);
            newTiles.push(...compact);
        }
    } else if (dir === "right") {
        for (let r = 0; r < size; r++) {
            let row = newTiles.filter(t => t.r === r).sort((a, b) => b.c - a.c);
            let compact = slideRow(row);
            compact.forEach((t, i) => {
                t.r = r;
                t.c = size - 1 - i;
            });
            newTiles = newTiles.filter(t => t.r !== r);
            newTiles.push(...compact);
        }
    } else if (dir === "up") {
        for (let c = 0; c < size; c++) {
            let col = newTiles.filter(t => t.c === c).sort((a, b) => a.r - b.r);
            let compact = slideRow(col);
            compact.forEach((t, i) => {
                t.r = i;
                t.c = c;
            });
            newTiles = newTiles.filter(t => t.c !== c);
            newTiles.push(...compact);
        }
    } else if (dir === "down") {
        for (let c = 0; c < size; c++) {
            let col = newTiles.filter(t => t.c === c).sort((a, b) => b.r - a.r);
            let compact = slideRow(col);
            compact.forEach((t, i) => {
                t.r = size - 1 - i;
                t.c = c;
            });
            newTiles = newTiles.filter(t => t.c !== c);
            newTiles.push(...compact);
        }
    }

    return newTiles;
}

function tilesEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let t of a) {
        const m = b.find(x => x.r === t.r && x.c === t.c && x.value === t.value);
        if (!m) return false;
    }
    return true;
}

function move(dir) {
    const newTiles = applyMove(dir, tiles);
    if (tilesEqual(tiles, newTiles)) return;
    tiles = newTiles;
    draw();
    clearArrows();
    setAIMessage("AI 推奨手：盤面変更のため再計算してください");
    showBestMove();
}

function clearBoard() {
    tiles = [];
    nextId = 1;
    draw();
    clearArrows();
    setAIMessage("AI 推奨手：未計算");
}

function clearArrows() {
    ["arrowUp", "arrowDown", "arrowLeft", "arrowRight"].forEach(id => {
        document.getElementById(id).classList.remove("active");
    });
}

function setAIMessage(msg) {
    document.getElementById("aiMessage").textContent = msg;
}

function showBestMove() {
    const best = getBestMove(tiles, size);
    clearArrows();

    if (!best) {
        setAIMessage("AI 推奨手：有効な手がありません");
        return;
    }

    if (best === "up") document.getElementById("arrowUp").classList.add("active");
    if (best === "down") document.getElementById("arrowDown").classList.add("active");
    if (best === "left") document.getElementById("arrowLeft").classList.add("active");
    if (best === "right") document.getElementById("arrowRight").classList.add("active");

    setAIMessage("AI 推奨手：" + best.toUpperCase());
}

window.addEventListener("load", () => {
    initBoard();

    document.getElementById("moveUpBtn").onclick = () => move("up");
    document.getElementById("moveDownBtn").onclick = () => move("down");
    document.getElementById("moveLeftBtn").onclick = () => move("left");
    document.getElementById("moveRightBtn").onclick = () => move("right");
    document.getElementById("resetBtn").onclick = () => initBoard();
    document.getElementById("clearBtn").onclick = () => clearBoard();
    document.getElementById("aiSuggestBtn").onclick = () => showBestMove();
});
