// main.js - 负责全局控制和事件

// 获取 DOM 元素
const canvas = document.getElementById('chessBoard');
const ctx = canvas.getContext('2d');
const statusText = document.getElementById('statusText');
const modeSelect = document.getElementById('modeSelect');

// 全局配置
const gridSize = 30;
const padding = 15;
const boardSize = 15;

let board = [];
let isBlackTurn = true;
let gameOver = false;
let gameMode = 'pve';

// 初始化
function initBoard() {
    board = [];
    for (let i = 0; i < boardSize; i++) {
        board[i] = new Array(boardSize).fill(0);
    }
}

// 胜负判断
function checkWin(x, y, role) {
    const directions = [
        [[0, 1], [0, -1]], [[1, 0], [-1, 0]],
        [[1, 1], [-1, -1]], [[1, -1], [-1, 1]]
    ];
    for (let axis of directions) {
        let count = 1;
        for (let dir of axis) {
            let nx = x + dir[0], ny = y + dir[1];
            while (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize && board[nx][ny] === role) {
                count++;
                nx += dir[0];
                ny += dir[1];
            }
        }
        if (count >= 5) return true;
    }
    return false;
}

// 执行落子
function doMove(i, j, role) {
    board[i][j] = role;
    drawPiece(i, j, role); // 调用 ui.js 里的函数

    if (checkWin(i, j, role)) {
        setTimeout(() => {
            let winner = role === 1 ? "黑棋" : "白棋";
            alert(winner + " 获胜！🎉");
        }, 10);
        gameOver = true;
        statusText.innerText = "游戏结束";
        return;
    }

    isBlackTurn = !isBlackTurn;
    updateStatus(); // 调用 ui.js 里的函数

    if (gameMode === 'pve' && !isBlackTurn && !gameOver) {
        statusText.innerText = "电脑思考中...";
        setTimeout(computerPlay, 300); // 调用 ai.js 里的函数
    }
}

// 玩家点击事件
canvas.onclick = function (e) {
    if (gameOver) return;
    if (gameMode === 'pve' && !isBlackTurn) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const i = Math.round((x - padding) / gridSize);
    const j = Math.round((y - padding) / gridSize);

    if (i < 0 || i >= boardSize || j < 0 || j >= boardSize || board[i][j] !== 0) return;

    let role = 1;
    if (gameMode === 'pvp') role = isBlackTurn ? 1 : 2;
    doMove(i, j, role);
};

// 重新开始
function restartGame() {
    gameMode = modeSelect.value;
    initBoard();
    isBlackTurn = true;
    gameOver = false;
    drawBoard(); // 调用 ui.js
    updateStatus(); // 调用 ui.js
}

// 启动游戏
restartGame();