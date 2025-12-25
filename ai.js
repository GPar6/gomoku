/**
 * ai.js - 五子棋 AI 核心算法 (修复版)
 * 包含：Minimax + Alpha-Beta 剪枝 + 启发式评估 + 防卡死机制
 */

// 1. 定义角色常量 (必须与 main.js 逻辑一致: 0空, 1黑, 2白)
const ROLE = {
    EMPTY: 0,
    BLACK: 1, // 玩家
    WHITE: 2  // 电脑
};

// 2. 算法配置
const SEARCH_DEPTH = 3;  // 搜索深度 (建议 2-4，太深会卡)
const MAX_BRANCHES = 8;  // 分支裁剪 (每层只算分数最高的8个点，数值越小速度越快)

/**
 * 🤖 电脑 AI 决策入口
 */
function computerPlay() {
    if (gameOver) return;

    // 尝试获取最优解
    let move = getBestMove();

    // 【保底机制】如果算法因为某种原因没找到点（防止卡死），就随便找个空位
    if (!move) {
        console.warn("AI 启用保底策略");
        move = getRandomMove();
    }

    if (move) {
        // 调用 main.js 的落子函数
        doMove(move.x, move.y, ROLE.WHITE);
    }
}

/**
 * 随便找个空位 (保底用)
 */
function getRandomMove() {
    let empties = [];
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j] === ROLE.EMPTY) {
                empties.push({ x: i, y: j });
            }
        }
    }
    if (empties.length > 0) {
        // 优先选靠近中间的，稍微聪明点
        return empties[Math.floor(empties.length / 2)];
    }
    return null;
}

/**
 * 获取最优落子点
 */
function getBestMove() {
    let bestScore = -Infinity;
    let candidates = [];

    // 获取经过启发式评分排序的候选位置
    // 关键优化：先进行一次粗略评分，把好点排前面，利于剪枝
    let points = getOrderedPoints(ROLE.WHITE).slice(0, MAX_BRANCHES);

    // 如果盘面还是空的（电脑先手或第一步），直接下天元附近
    if (points.length === 0 && board[7][7] === ROLE.EMPTY) return { x: 7, y: 7 };
    if (points.length === 0) return null; // 交给保底机制

    // 遍历每一个高分候选点
    for (let point of points) {
        board[point.x][point.y] = ROLE.WHITE;

        // 递归搜索：下一步轮到玩家(Min层)
        let score = minimax(SEARCH_DEPTH - 1, -Infinity, Infinity, false);

        board[point.x][point.y] = ROLE.EMPTY; // 回溯

        if (score > bestScore) {
            bestScore = score;
            candidates = [point];
        } else if (score === bestScore) {
            candidates.push(point);
        }
    }

    // 从并列最高分的点中随机选一个
    if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)];
    }
    return null;
}

/**
 * Minimax + Alpha-Beta 剪枝
 */
function minimax(depth, alpha, beta, isMax) {
    let boardScore = evaluateBoard();

    // 递归终点：达到深度 或 某方已胜 (分值极大)
    if (depth === 0 || Math.abs(boardScore) > 50000) {
        return boardScore;
    }

    let points = getOrderedPoints(isMax ? ROLE.WHITE : ROLE.BLACK).slice(0, MAX_BRANCHES);
    if (points.length === 0) return boardScore;

    if (isMax) { // 电脑层（找最大分）
        let maxEval = -Infinity;
        for (let p of points) {
            board[p.x][p.y] = ROLE.WHITE;
            let evalValue = minimax(depth - 1, alpha, beta, false);
            board[p.x][p.y] = ROLE.EMPTY;

            maxEval = Math.max(maxEval, evalValue);
            alpha = Math.max(alpha, evalValue);
            if (beta <= alpha) break; // 剪枝
        }
        return maxEval;
    } else { // 玩家层（找最小分，假设玩家最聪明）
        let minEval = Infinity;
        for (let p of points) {
            board[p.x][p.y] = ROLE.BLACK;
            let evalValue = minimax(depth - 1, alpha, beta, true);
            board[p.x][p.y] = ROLE.EMPTY;

            minEval = Math.min(minEval, evalValue);
            beta = Math.min(beta, evalValue);
            if (beta <= alpha) break; // 剪枝
        }
        return minEval;
    }
}

/**
 * 启发式评分排序：只针对有邻居的空格进行评分
 */
function getOrderedPoints(role) {
    let points = [];
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j] === ROLE.EMPTY) {
                // 性能优化：只考虑已有棋子周围的点
                if (hasNeighbor(i, j)) {
                    // 进攻分 + 防守分
                    let score = evaluatePoint(i, j, ROLE.WHITE) + evaluatePoint(i, j, ROLE.BLACK) * 1.5;                    points.push({ x: i, y: j, score: score });
                }
            }
        }
    }
    // 降序排序
    return points.sort((a, b) => b.score - a.score);
}

/**
 * 评估整个棋盘 (白棋优势 - 黑棋优势)
 */
function evaluateBoard() {
    let whiteScore = 0;
    let blackScore = 0;
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j] === ROLE.WHITE) {
                whiteScore += evaluatePoint(i, j, ROLE.WHITE);
            } else if (board[i][j] === ROLE.BLACK) {
                blackScore += evaluatePoint(i, j, ROLE.BLACK);
            }
        }
    }
    return whiteScore - blackScore;
}

/**
 * 单点评分 (权重表)
 */
/**
 * 优化后的评分体系：大幅提升防守权重
 */
function evaluatePoint(x, y, role) {
    let totalScore = 0;
    const directions = [
        [[0, 1], [0, -1]],  // 横
        [[1, 0], [-1, 0]],  // 竖
        [[1, 1], [-1, -1]], // 撇
        [[1, -1], [-1, 1]]  // 捺
    ];

    for (let axis of directions) {
        let count = 1;
        let emptySide = 0;

        for (let dir of axis) {
            let nx = x + dir[0];
            let ny = y + dir[1];
            while (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize && board[nx][ny] === role) {
                count++;
                nx += dir[0];
                ny += dir[1];
            }
            if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize && board[nx][ny] === ROLE.EMPTY) {
                emptySide++;
            }
        }

        // --- 核心修改：大幅调整权重 ---

        // 1. 必杀：连五
        if (count >= 5) totalScore += 200000;

        // 2. 致命威胁：活四 (两头空的四子，必胜)
        else if (count === 4 && emptySide === 2) totalScore += 50000;

        // 3. 严重威胁：冲四 (一头堵的四子) 或 活三 (两头空的三子)
        // 注意：活三和冲四是同级别的威胁，下一步都能成五
        else if (count === 4 && emptySide === 1) totalScore += 10000;
        else if (count === 3 && emptySide === 2) totalScore += 10000;

        // 4. 一般威胁
        else if (count === 3 && emptySide === 1) totalScore += 1000; // 死三
        else if (count === 2 && emptySide === 2) totalScore += 1000; // 活二
        else if (count === 2 && emptySide === 1) totalScore += 100;  // 死二
    }
    return totalScore;
}

/**
 * 邻居检查 (修复版)
 * 检查 (x,y) 周围 1 格范围内是否有棋子
 */
function hasNeighbor(x, y) {
    const range = 1;
    for (let i = x - range; i <= x + range; i++) {
        for (let j = y - range; j <= y + range; j++) {
            // 排除越界情况
            if (i >= 0 && i < boardSize && j >= 0 && j < boardSize) {
                // 排除自己
                if (i === x && j === y) continue;
                // 修复点：之前写成了 board[i][i]，导致只检查对角线
                if (board[i][j] !== ROLE.EMPTY) return true;
            }
        }
    }
    return false;
}