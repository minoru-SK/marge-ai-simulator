function evaluateBoard(tiles, size) {
    const occupied = tiles.length;
    const empty = size * size - occupied;

    let mergesPotential = 0;

    const grid = Array.from({ length: size }, () => Array(size).fill(null));
    tiles.forEach(t => {
        grid[t.r][t.c] = t.value;
    });

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const v = grid[r][c];
            if (v === null) continue;
            if (c + 1 < size && grid[r][c + 1] === v) mergesPotential++;
            if (r + 1 < size && grid[r + 1][c] === v) mergesPotential++;
        }
    }

    return mergesPotential * 10 + empty;
}

function getBestMove(tiles, size) {
    const dirs = ["up", "down", "left", "right"];
    let bestDir = null;
    let bestScore = -Infinity;

    for (let dir of dirs) {
        const newTiles = applyMove(dir, tiles);
        if (tilesEqual(tiles, newTiles)) continue;

        const score = evaluateBoard(newTiles, size);
        if (score > bestScore) {
            bestScore = score;
            bestDir = dir;
        }
    }

    return bestDir;
}
