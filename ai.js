// ===============================
// 評価関数（5要素）
// ===============================

// ① 単調性（大→小 or 小→大 の並びが良い）
function monotonicity(grid, size) {
    let score = 0;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size - 1; c++) {
            if (grid[r][c] !== null && grid[r][c + 1] !== null) {
                if (grid[r][c] <= grid[r][c + 1]) score += 1;
                if (grid[r][c] >= grid[r][c + 1]) score += 1;
            }
        }
    }

    for (let c = 0; c < size; c++) {
        for (let r = 0; r < size - 1; r++) {
            if (grid[r][c] !== null && grid[r + 1][c] !== null) {
                if (grid[r][c] <= grid[r + 1][c]) score += 1;
                if (grid[r][c] >= grid[r + 1][c]) score += 1;
            }
        }
    }

    return score;
}

// ② 滑らかさ（隣との差が小さいほど良い）
function smoothness(grid, size) {
    let score = 0;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size - 1; c++) {
            if (grid[r][c] !== null && grid[r][c + 1] !== null) {
                score -= Math.abs(grid[r][c] - grid[r][c + 1]);
            }
        }
    }

    for (let c = 0; c < size; c++) {
        for (let r = 0; r < size - 1; r++) {
            if (grid[r][c] !== null && grid[r + 1][c] !== null) {
                score -= Math.abs(grid[r][c] - grid[r + 1][c]);
            }
        }
    }

    return score;
}

// ③ 最大タイルが隅にあるほど良い
function cornerBonus(grid, size) {
    let maxTile = 0;
    let maxPos = [0, 0];

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (grid[r][c] !== null && grid[r][c] > maxTile) {
                maxTile = grid[r][c];
                maxPos = [r, c];
            }
        }
    }

    const corners = [
        [0, 0], [0, size - 1],
        [size - 1, 0], [size - 1, size - 1]
    ];

    for (let [cr, cc] of corners) {
        if (maxPos[0] === cr && maxPos[1] === cc) return maxTile * 5;
    }

    return 0;
}

// ④ 空きマス数
function emptyCells(grid, size) {
    let count = 0;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (grid[r][c] === null) count++;
        }
    }
    return count * 3;
}

// ⑤ クラスターペナルティ（バラバラだと減点）
function clusterPenalty(grid, size) {
    let penalty = 0;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (grid[r][c] === null) continue;

            let neighbors = [];
            if (r > 0) neighbors.push(grid[r - 1][c]);
            if (r < size - 1) neighbors.push(grid[r + 1][c]);
            if (c > 0) neighbors.push(grid[r][c - 1]);
            if (c < size - 1) neighbors.push(grid[r][c + 1]);

            for (let n of neighbors) {
                if (n !== null) penalty += Math.abs(grid[r][c] - n);
            }
        }
    }

    return -penalty;
}

// ===============================
// 総合評価関数
// ===============================
function evaluateBoard(tiles, size) {
    const grid = Array.from({ length: size }, () => Array(size).fill(null));
    tiles.forEach(t => grid[t.r][t.c] = t.value);

    return (
        1.0 * monotonicity(grid, size) +
        1.0 * smoothness(grid, size) +
        2.0 * cornerBonus(grid, size) +
        2.0 * emptyCells(grid, size) +
        1.0 * clusterPenalty(grid, size)
    );
}

// ===============================
// Expectimax（2手先）
// ===============================
function expectimax(tiles, size, depth) {
    if (depth === 0) return evaluateBoard(tiles, size);

    // プレイヤーの手（上・下・左・右）
    const dirs = ["up", "down", "left", "right"];
    let best = -Infinity;

    for (let dir of dirs) {
        const newTiles = applyMove(dir, tiles);
        if (tilesEqual(tiles, newTiles)) continue;

        // ランダム出現タイル（1〜4）
        let sum = 0;
        let count = 0;

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (!newTiles.find(t => t.r === r && t.c === c)) {
                    for (let v = 1; v <= 4; v++) {
                        const t2 = JSON.parse(JSON.stringify(newTiles));
                        t2.push({ id: 9999, value: v, r, c });
                        sum += expectimax(t2, size, depth - 1);
                        count++;
                    }
                }
            }
        }

        if (count === 0) continue;

        const expected = sum / count;
        if (expected > best) best = expected;
    }

    return best;
}

// ===============================
// 最善手を返す
// ===============================
function getBestMove(tiles, size) {
    const dirs = ["up", "down", "left", "right"];
    let bestDir = null;
    let bestScore = -Infinity;

    for (let dir of dirs) {
        const newTiles = applyMove(dir, tiles);
        if (tilesEqual(tiles, newTiles)) continue;

        const score = expectimax(newTiles, size, 1); // ← 2手先
        if (score > bestScore) {
            bestScore = score;
            bestDir = dir;
        }
    }

    return bestDir;
}
