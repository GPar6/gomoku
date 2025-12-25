// ui.js - 负责界面渲染

// 绘制棋盘背景
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#555";

    for (let i = 0; i < boardSize; i++) {
        ctx.beginPath();
        ctx.moveTo(padding, padding + i * gridSize);
        ctx.lineTo(padding + (boardSize - 1) * gridSize, padding + i * gridSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(padding + i * gridSize, padding);
        ctx.lineTo(padding + i * gridSize, padding + (boardSize - 1) * gridSize);
        ctx.stroke();
    }
}

// 绘制棋子
function drawPiece(x, y, role) { // role: 1黑 2白
    ctx.beginPath();
    let centerX = padding + x * gridSize;
    let centerY = padding + y * gridSize;
    ctx.arc(centerX, centerY, 13, 0, 2 * Math.PI);

    let gradient = ctx.createRadialGradient(centerX - 2, centerY - 2, 0, centerX, centerY, 13);
    if (role === 1) {
        gradient.addColorStop(0, "#666");
        gradient.addColorStop(1, "#000");
    } else {
        gradient.addColorStop(0, "#fff");
        gradient.addColorStop(1, "#ddd");
    }

    ctx.fillStyle = gradient;
    ctx.fill();

    // 标记最后一手
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
    ctx.fillStyle = role === 1 ? "red" : "blue";
    ctx.fill();
}

// 更新状态文字
function updateStatus() {
    if (gameOver) return;
    if (gameMode === 'pve') {
        statusText.innerText = isBlackTurn ? "轮到你 (黑)" : "电脑思考中...";
    } else {
        statusText.innerText = isBlackTurn ? "轮到黑棋" : "轮到白棋";
        statusText.style.color = isBlackTurn ? "#000" : "#999";
    }
}