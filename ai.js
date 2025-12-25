// ai.js - 负责人工智能逻辑

// 🤖 电脑 AI 入口
function computerPlay() {
    if (gameOver) return;

    let maxScore = 0;
    let bestPoints = [];

    // 遍历棋盘
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j] === 0) {
                let score = evaluatePoint(i, j);
                if (score > maxScore) {
                    maxScore = score;
                    bestPoints = [{ x: i, y: j }];
                } else if (score === maxScore) {
                    bestPoints.push({ x: i, y: j });
                }
            }
        }
    }

    let move = bestPoints[Math.floor(Math.random() * bestPoints.length)];
    if (!move && board[7][7] === 0) move = { x: 7, y: 7 };

    if (move) {
        doMove(move.x, move.y, 2); // 注意：doMove 在 main.js 里，但这里可以直接调用
    }
}

// 评分函数
function evaluatePoint(x, y) {
    let score = 0;
    score += calculateDirectionScore(x, y, 2); // 进攻
    score += calculateDirectionScore(x, y, 1); // 防守
    return score;
}

// 核心评分逻辑
function calculateDirectionScore(x, y, role) {
    let totalScore = 0;
    const directions = [
        [[0, 1], [0, -1]], [[1, 0], [-1, 0]],
        [[1, 1], [-1, -1]], [[1, -1], [-1, 1]]
    ];

    for (let axis of directions) {
        let count = 1;
        let emptySide = 0;

        for (let dir of axis) {
            let nx = x + dir[0], ny = y + dir[1];
            while (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize && board[nx][ny] === role) {
                count++;
                nx += dir[0];
                ny += dir[1];
            }
            if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize && board[nx][ny] === 0) {
                emptySide++;
            }
        }

        if (count >= 5) totalScore += 100000;
        else if (count === 4 && emptySide === 2) totalScore += 10000;
        else if (count === 4 && emptySide === 1) totalScore += 1000;
        else if (count === 3 && emptySide === 2) totalScore += 1000;
        else if (count === 3 && emptySide === 1) totalScore += 100;
        else if (count === 2 && emptySide === 2) totalScore += 50;
    }
    return totalScore;
}