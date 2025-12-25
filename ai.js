/**
 * ai.js - 宗师级 (深度6 + 杀手直觉 + 极速剪枝)
 * 当前浏览器环境下 JS 性能的极限
 */

const ROLE = {
    EMPTY: 0,
    BLACK: 1, // 玩家
    WHITE: 2  // 电脑
};

// --- 极限参数 ---
// 深度 6：可以看到 3 个完整回合后的局面
const SEARCH_DEPTH = 6;
// 极窄搜索：因为深度太深，每层我们只敢看最明显的 4 步棋，否则浏览器会崩
const MAX_BRANCHES = 4;

function computerPlay() {
    if (gameOver) return;

    // 1. 【杀手直觉】 紧急检查：是否有必杀或必救点？
    // 如果有，直接下，不进递归！省下 99% 的计算量。
    let urgentMove = checkUrgentMoves();
    if (urgentMove) {
        console.log("AI 触发杀手直觉，秒杀/秒防");
        doMove(urgentMove.x, urgentMove.y, ROLE.WHITE);
        return;
    }

    // 2. 如果没有紧急情况，进行深度 6 的战略思考
    let move = getBestMove();
    if (!move) move = getRandomMove();
    if (move) doMove(move.x, move.y, ROLE.WHITE);
}

/**
 * 杀手直觉：快速扫描是否存在“一步定胜负”的关键点
 */
function checkUrgentMoves() {
    let bestDefense = null;
    let maxDefenseScore = 0;

    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j] === ROLE.EMPTY && hasNeighbor(i, j)) {

                // 1. 检查自己能否赢 (连五)
                let myScore = evaluatePoint(i, j, ROLE.WHITE);
                if (myScore >= 100000) return { x: i, y: j }; // 绝杀，直接下

                // 2. 检查对手能否赢 (连五 或 活四)
                // 注意：活四如果不堵，下一步就是连五，所以也是必救
                let enemyScore = evaluatePoint(i, j, ROLE.BLACK);
                if (enemyScore >= 100000) return { x: i, y: j }; // 必输，必须堵

                // 3. 记录最危险的防守点 (比如冲四、活三)
                if (enemyScore > maxDefenseScore) {
                    maxDefenseScore = enemyScore;
                    bestDefense = { x: i, y: j };
                }
            }
        }
    }

    // 如果对手有活四 (分数接近连五) 或者双活三，必须立刻堵，不进递归
    if (maxDefenseScore >= 20000) {
        return bestDefense;
    }

    return null; // 没有紧急情况，进入 Minimax 慢想
}

function getBestMove() {
    let bestScore = -Infinity;
    let candidates = [];

    let points = getOrderedPoints(ROLE.WHITE).slice(0, MAX_BRANCHES);
    if (points.length === 0 && board[7][7] === ROLE.EMPTY) return { x: 7, y: 7 };
    if (points.length === 0) return null;

    for (let point of points) {
        board[point.x][point.y] = ROLE.WHITE;
        // 开启 6 层递归
        let score = minimax(SEARCH_DEPTH - 1, -Infinity, Infinity, false);
        board[point.x][point.y] = ROLE.EMPTY;

        if (score > bestScore) {
            bestScore = score;
            candidates = [point];
        } else if (score === bestScore) {
            candidates.push(point);
        }
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
}

function minimax(depth, alpha, beta, isMax) {
    let boardScore = evaluateBoard();
    if (depth === 0 || Math.abs(boardScore) > 80000) return boardScore;

    let points = getOrderedPoints(isMax ? ROLE.WHITE : ROLE.BLACK).slice(0, MAX_BRANCHES);
    if (points.length === 0) return boardScore;

    if (isMax) {
        let maxEval = -Infinity;
        for (let p of points) {
            board[p.x][p.y] = ROLE.WHITE;
            let evalValue = minimax(depth - 1, alpha, beta, false);
            board[p.x][p.y] = ROLE.EMPTY;
            maxEval = Math.max(maxEval, evalValue);
            alpha = Math.max(alpha, evalValue);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let p of points) {
            board[p.x][p.y] = ROLE.BLACK;
            let evalValue = minimax(depth - 1, alpha, beta, true);
            board[p.x][p.y] = ROLE.EMPTY;
            minEval = Math.min(minEval, evalValue);
            beta = Math.min(beta, evalValue);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function getOrderedPoints(role) {
    let points = [];
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j] === ROLE.EMPTY && hasNeighbor(i, j)) {

                let attack = evaluatePoint(i, j, ROLE.WHITE);
                let defense = evaluatePoint(i, j, ROLE.BLACK);

                // 动态防御：如果对手很强，权重 x 2.0
                let score = attack + defense * (defense > 1000 ? 2.0 : 1.5);
                points.push({ x: i, y: j, score: score });
            }
        }
    }
    return points.sort((a, b) => b.score - a.score);
}

function evaluateBoard() {
    let whiteScore = 0;
    let blackScore = 0;
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j] === ROLE.WHITE) whiteScore += evaluatePoint(i, j, ROLE.WHITE);
            else if (board[i][j] === ROLE.BLACK) blackScore += evaluatePoint(i, j, ROLE.BLACK);
        }
    }
    return whiteScore - blackScore;
}

// 极其严格的评分标准
function evaluatePoint(x, y, role) {
    let totalScore = 0;
    const directions = [[[0, 1], [0, -1]], [[1, 0], [-1, 0]], [[1, 1], [-1, -1]], [[1, -1], [-1, 1]]];

    for (let axis of directions) {
        let count = 1, emptySide = 0;
        for (let dir of axis) {
            let nx = x + dir[0], ny = y + dir[1];
            while (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize && board[nx][ny] === role) {
                count++; nx += dir[0]; ny += dir[1];
            }
            if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize && board[nx][ny] === ROLE.EMPTY) emptySide++;
        }

        if (count >= 5) totalScore += 200000;         // 连五
        else if (count === 4 && emptySide === 2) totalScore += 50000; // 活四
        else if (count === 4 && emptySide === 1) totalScore += 10000; // 冲四
        else if (count === 3 && emptySide === 2) totalScore += 10000; // 活三 (威胁等同冲四)
        else if (count === 3 && emptySide === 1) totalScore += 1000;  // 死三
        else if (count === 2 && emptySide === 2) totalScore += 500;   // 活二
    }
    return totalScore;
}

function hasNeighbor(x, y) {
    const range = 1;
    for (let i = x - range; i <= x + range; i++) {
        for (let j = y - range; j <= y + range; j++) {
            if (i >= 0 && i < boardSize && j >= 0 && j < boardSize) {
                if (board[i][j] !== ROLE.EMPTY) return true;
            }
        }
    }
    return false;
}

function getRandomMove() {
    for (let i = 7; i < boardSize; i++) {
        for (let j = 7; j < boardSize; j++) {
            if (board[i][j] === ROLE.EMPTY) return { x: i, y: j };
        }
    }
    return null;
}