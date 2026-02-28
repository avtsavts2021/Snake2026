// 游戏常量
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
  null,
  '#FF0D72', // I
  '#0DC2FF', // J
  '#0DFF72', // L
  '#F538FF', // O
  '#FF8E0D', // S
  '#FFE138', // T
  '#3877FF'  // Z
];

// 游戏变量
let canvas, ctx, nextCanvas, nextCtx;
let board = [];
let score = 0;
let level = 1;
let lines = 0;
let gameOver = false;
let paused = false;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let player = {
  pos: { x: 0, y: 0 },
  matrix: null,
  score: 0
};

// 方块形状
const PIECES = [
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  [
    [2, 0, 0],
    [2, 2, 2],
    [0, 0, 0]
  ],
  [
    [0, 0, 3],
    [3, 3, 3],
    [0, 0, 0]
  ],
  [
    [4, 4],
    [4, 4]
  ],
  [
    [0, 5, 5],
    [5, 5, 0],
    [0, 0, 0]
  ],
  [
    [0, 6, 0],
    [6, 6, 6],
    [0, 0, 0]
  ],
  [
    [7, 7, 0],
    [0, 7, 7],
    [0, 0, 0]
  ]
];

// 初始化游戏板
function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

// 创建随机方块
function randomPiece() {
  const rand = Math.floor(Math.random() * PIECES.length);
  // 复制矩阵以避免引用问题
  const piece = JSON.parse(JSON.stringify(PIECES[rand]));
  return piece;
}

// 初始化游戏
function init() {
  canvas = document.getElementById('tetrisCanvas');
  ctx = canvas.getContext('2d');
  nextCanvas = document.getElementById('nextCanvas');
  nextCtx = nextCanvas.getContext('2d');

  // 设置画布尺寸
  canvas.width = COLS * BLOCK_SIZE;
  canvas.height = ROWS * BLOCK_SIZE;
  nextCanvas.width = 4 * BLOCK_SIZE;
  nextCanvas.height = 4 * BLOCK_SIZE;

  // 初始化游戏板
  board = createMatrix(COLS, ROWS);

  // 重置玩家
  resetPlayer();

  // 绑定事件
  bindEvents();

  // 开始游戏循环
  requestAnimationFrame(update);
}

// 重置玩家
function resetPlayer() {
  player.matrix = randomPiece();
  player.pos.y = 0;
  player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);
  
  // 如果新方块与现有方块重叠，则游戏结束
  if (collide()) {
    gameOver = true;
    alert('游戏结束！您的最终得分是：' + score);
    resetGame();
  }
  
  // 显示下一个方块
  drawNextPiece();
}

// 绘制下一个方块
function drawNextPiece() {
  nextCtx.fillStyle = '#111';
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  
  const nextPiece = randomPiece();
  const offsetX = (nextCanvas.width / BLOCK_SIZE - nextPiece[0].length) / 2;
  const offsetY = (nextCanvas.height / BLOCK_SIZE - nextPiece.length) / 2;
  
  nextPiece.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        nextCtx.fillStyle = COLORS[value];
        nextCtx.fillRect(
          (x + offsetX) * BLOCK_SIZE,
          (y + offsetY) * BLOCK_SIZE,
          BLOCK_SIZE - 1,
          BLOCK_SIZE - 1
        );
        
        // 添加3D效果
        nextCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        nextCtx.lineWidth = 2;
        nextCtx.strokeRect(
          (x + offsetX) * BLOCK_SIZE,
          (y + offsetY) * BLOCK_SIZE,
          BLOCK_SIZE - 1,
          BLOCK_SIZE - 1
        );
      }
    });
  });
}

// 绑定事件
function bindEvents() {
  document.addEventListener('keydown', event => {
    if (paused || gameOver) return;
    
    switch (event.keyCode) {
      case 37: // 左箭头
        playerMove(-1);
        break;
      case 39: // 右箭头
        playerMove(1);
        break;
      case 40: // 下箭头
        playerDrop();
        break;
      case 38: // 上箭头
        playerRotate();
        break;
      case 32: // 空格键
        playerHardDrop();
        break;
    }
  });

  // 触摸按钮事件
  document.getElementById('leftBtn').addEventListener('click', () => {
    if (!paused && !gameOver) playerMove(-1);
  });
  
  document.getElementById('rightBtn').addEventListener('click', () => {
    if (!paused && !gameOver) playerMove(1);
  });
  
  document.getElementById('rotateBtn').addEventListener('click', () => {
    if (!paused && !gameOver) playerRotate();
  });
  
  document.getElementById('downBtn').addEventListener('click', () => {
    if (!paused && !gameOver) playerDrop();
  });
  
  document.getElementById('dropBtn').addEventListener('click', () => {
    if (!paused && !gameOver) playerHardDrop();
  });

  // 游戏按钮事件
  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('pauseBtn').addEventListener('click', togglePause);
  document.getElementById('resetBtn').addEventListener('click', resetGame);
}

// 检测碰撞
function collide() {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 &&
          (board[y + o.y] &&
          board[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

// 旋转方块
function playerRotate() {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix);
  
  // 如果旋转后发生碰撞，尝试调整位置
  while (collide()) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix); // 恢复原始状态
      player.pos.x = pos;
      return;
    }
  }
}

// 旋转矩阵
function rotate(matrix) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  
  matrix.forEach(row => row.reverse());
}

// 移动方块
function playerMove(dir) {
  player.pos.x += dir;
  if (collide()) {
    player.pos.x -= dir;
  }
}

// 软降
function playerDrop() {
  player.pos.y++;
  if (collide()) {
    player.pos.y--;
    merge();
    resetPlayer();
    clearLines();
    updateScore();
  }
  dropCounter = 0;
}

// 硬降（瞬间下落）
function playerHardDrop() {
  while (!collide()) {
    player.pos.y++;
  }
  player.pos.y--;
  merge();
  resetPlayer();
  clearLines();
  updateScore();
}

// 合并方块到游戏板
function merge() {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        board[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

// 清除完整的行
function clearLines() {
  let linesCleared = 0;
  outer: for (let y = ROWS - 1; y >= 0; --y) {
    for (let x = 0; x < COLS; ++x) {
      if (board[y][x] === 0) {
        continue outer;
      }
    }

    // 移除完整行
    const row = board.splice(y, 1)[0].fill(0);
    board.unshift(row);
    ++linesCleared;
    ++y; // 检查新移下来的行
  }
  
  // 更新消除行数和等级
  if (linesCleared > 0) {
    lines += linesCleared;
    level = Math.floor(lines / 10) + 1;
    dropInterval = 1000 - (level - 1) * 100; // 随着等级提高，下落速度加快
    
    // 根据一次消除多行给予额外奖励
    switch (linesCleared) {
      case 1:
        score += 40 * level;
        break;
      case 2:
        score += 100 * level;
        break;
      case 3:
        score += 300 * level;
        break;
      case 4:
        score += 1200 * level; // 一次性消除4行（Tetris）是最大奖励
        break;
    }
    
    updateScore();
  }
}

// 更新分数显示
function updateScore() {
  document.getElementById('score').textContent = score;
  document.getElementById('level').textContent = level;
  document.getElementById('lines').textContent = lines;
}

// 绘制游戏画面
function draw() {
  // 清空画布
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 绘制游戏板
  drawMatrix(board, { x: 0, y: 0 });
  
  // 绘制当前方块
  drawMatrix(player.matrix, player.pos);
}

// 绘制矩阵
function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = COLORS[value];
        ctx.fillRect(
          (x + offset.x) * BLOCK_SIZE,
          (y + offset.y) * BLOCK_SIZE,
          BLOCK_SIZE - 1,
          BLOCK_SIZE - 1
        );
        
        // 添加3D效果
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          (x + offset.x) * BLOCK_SIZE,
          (y + offset.y) * BLOCK_SIZE,
          BLOCK_SIZE - 1,
          BLOCK_SIZE - 1
        );
      }
    });
  });
}

// 游戏主循环
function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;
  
  if (!paused && !gameOver) {
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
      playerDrop();
    }
  }
  
  draw();
  requestAnimationFrame(update);
}

// 开始游戏
function startGame() {
  if (gameOver) {
    resetGame();
  }
  paused = false;
}

// 暂停/继续游戏
function togglePause() {
  paused = !paused;
  document.getElementById('pauseBtn').textContent = paused ? '继续' : '暂停';
}

// 重置游戏
function resetGame() {
  // 重置游戏状态
  board = createMatrix(COLS, ROWS);
  score = 0;
  level = 1;
  lines = 0;
  gameOver = false;
  paused = false;
  dropInterval = 1000;
  
  // 更新UI
  document.getElementById('score').textContent = score;
  document.getElementById('level').textContent = level;
  document.getElementById('lines').textContent = lines;
  document.getElementById('pauseBtn').textContent = '暂停';
  
  // 重置玩家
  resetPlayer();
}

// 提交分数到排行榜
async function submitScore(name, score) {
  try {
    const response = await fetch('/api/rankings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, score })
    });
    
    if (response.ok) {
      const rankings = await response.json();
      updateRankingsDisplay(rankings);
    } else {
      console.error('提交分数失败:', response.statusText);
      // 如果网络请求失败，使用本地存储作为备用方案
      fallbackSubmitScore(name, score);
    }
  } catch (error) {
    console.error('提交分数时发生错误:', error);
    // 如果网络请求失败，使用本地存储作为备用方案
    fallbackSubmitScore(name, score);
  }
}

// 本地备选提交分数方法
function fallbackSubmitScore(name, score) {
  let rankings = JSON.parse(localStorage.getItem('tetrisRankings')) || [];
  rankings.push({ name, score, date: new Date().toLocaleDateString() });
  
  // 按分数排序，只保留前10名
  rankings.sort((a, b) => b.score - a.score);
  rankings = rankings.slice(0, 10);
  
  localStorage.setItem('tetrisRankings', JSON.stringify(rankings));
  updateRankings();
}

// 从服务器获取排行榜
async function loadRankings() {
  try {
    const response = await fetch('/api/rankings');
    if (response.ok) {
      const rankings = await response.json();
      updateRankingsDisplay(rankings);
    } else {
      console.error('获取排行榜失败:', response.statusText);
      // 如果网络请求失败，使用本地存储作为备用方案
      updateRankings();
    }
  } catch (error) {
    console.error('获取排行榜时发生错误:', error);
    // 如果网络请求失败，使用本地存储作为备用方案
    updateRankings();
  }
}

// 更新排行榜显示（服务器版本）
function updateRankingsDisplay(rankings) {
  const rankingList = document.getElementById('rankingList');
  rankingList.innerHTML = '';
  
  if (rankings.length === 0) {
    const li = document.createElement('li');
    li.textContent = '暂无记录';
    rankingList.appendChild(li);
    return;
  }
  
  rankings.forEach((entry, index) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${index + 1}. ${entry.name}</strong> - ${entry.score} 分 <em>(${entry.date})</em>`;
    rankingList.appendChild(li);
  });
}

// 更新排行榜显示（本地存储版本）
function updateRankings() {
  const rankings = JSON.parse(localStorage.getItem('tetrisRankings')) || [];
  const rankingList = document.getElementById('rankingList');
  rankingList.innerHTML = '';
  
  if (rankings.length === 0) {
    const li = document.createElement('li');
    li.textContent = '暂无记录';
    rankingList.appendChild(li);
    return;
  }

  rankings.forEach((entry, index) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${index + 1}. ${entry.name}</strong> - ${entry.score} 分 <em>(${entry.date})</em>`;
    rankingList.appendChild(li);
  });
}

// 页面加载完成后初始化游戏
window.onload = function() {
  init();
  loadRankings(); // 从服务器加载排行榜
};