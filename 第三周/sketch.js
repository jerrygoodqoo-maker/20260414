// 遊戲狀態：WAITING (等待), PLAYING (遊戲中), FAILED (失敗), SUCCESS (成功)
let gameState = 'WAITING';

// 用於儲存軌道頂點的陣列
let upperPath = [];
let lowerPath = [];

// 軌道生成的參數
const pathSegments = 20; // 軌道的頂點數量
const pathGap = 60;      // 軌道的寬度 (安全區)
const playerRadius = 8;  // 玩家球體的半徑
let collisionPoint = null; // 紀錄碰撞點座標

// 開始與結束區域的物件
let startZone;
let endZone;

function setup() {
  createCanvas(windowWidth, windowHeight); // 使用全螢幕

  // 定義開始與結束區域
  startZone = { x: 60, y: height / 2, r: 50 };
  endZone = { x: width - 60, y: 0, w: 60, h: height };

  // 產生初始軌道
  generateTrack();
}

/**
 * 產生隨機的軌道路徑
 */
function generateTrack() {
  upperPath = [];
  lowerPath = [];
  
  const startY = height / 2;
  
  // 根據畫布寬度動態計算軌道每段的水平距離
  const trackStartX = 100;
  const trackWidth = width - trackStartX - 100; // 軌道左右留出邊距
  const pathStep = trackWidth / (pathSegments - 1);
  
  // 循環生成軌道的各個頂點
  for (let i = 0; i < pathSegments; i++) {
    const x = i * pathStep + trackStartX;
    // 使用 Perlin noise 產生平滑的隨機 Y 座標偏移
    const yOffset = (noise(i * 0.4, frameCount * 0.01) - 0.5) * (height * 0.6);
    let y = startY + yOffset;
    
    // 限制 Y 座標，確保軌道不會超出畫布
    y = constrain(y, pathGap, height - pathGap);

    // 建立上、下邊界的頂點向量
    upperPath.push(createVector(x, y - pathGap / 2));
    lowerPath.push(createVector(x, y + pathGap / 2));
  }

  // 為了讓 curveVertex 能畫出從頭到尾的完整曲線，
  // 必須在陣列的開頭和結尾各複製一個點作為控制點。
  upperPath.unshift(upperPath[0]);
  upperPath.push(upperPath[upperPath.length - 1]);
  lowerPath.unshift(lowerPath[0]);
  lowerPath.push(lowerPath[lowerPath.length - 1]);
  
  // 將開始按鈕的 Y 座標對齊軌道的起點
  startZone.y = (upperPath[1].y + lowerPath[1].y) / 2;
}

/**
 * 當瀏覽器視窗大小改變時，自動呼叫此函式
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 更新結束區域的定義
  endZone.x = width - 60;
  endZone.h = height;
  generateTrack(); // 重新生成軌道以適應新尺寸
  gameState = 'WAITING'; // 重置遊戲
  collisionPoint = null;
}

function draw() {
  background(10, 20, 30); // 深色背景

  drawTrack();
  drawUI();
  
  // 繪製玩家球體
  drawPlayer();

  // 只在 PLAYING 狀態下檢查碰撞和成功條件
  if (gameState === 'PLAYING') {
    checkCollision();
    checkSuccess();
  } else if (gameState === 'FAILED' && collisionPoint) {
    // 失敗時顯示電擊特效
    drawElectricShock();
  }
}

/**
 * 繪製軌道
 */
function drawTrack() {
  // 透過繪製多次、不同粗細和透明度的線條來製造發光效果
  stroke(0, 150, 255, 50);
  strokeWeight(15);
  drawPath(upperPath);
  drawPath(lowerPath);

  stroke(0, 200, 255, 100);
  strokeWeight(8);
  drawPath(upperPath);
  drawPath(lowerPath);

  // 繪製主要的軌道線
  stroke(255);
  strokeWeight(2);
  drawPath(upperPath);
  drawPath(lowerPath);
}

/**
 * 輔助函式：根據給定的路徑點繪製一條曲線
 * @param {p5.Vector[]} path - 包含頂點的陣列
 */
function drawPath(path) {
  noFill();
  beginShape();
  for (const p of path) {
    curveVertex(p.x, p.y);
  }
  endShape();
}

/**
 * 繪製玩家球體
 */
function drawPlayer() {
  noStroke();
  
  // 根據狀態改變顏色
  if (gameState === 'FAILED') {
    fill(255, 50, 50);
  } else if (gameState === 'SUCCESS') {
    fill(50, 255, 50);
  } else {
    fill(0, 255, 255);
  }
  
  // 發光效果 (使用原生 Canvas API)
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = color(0, 255, 255);
  ellipse(mouseX, mouseY, playerRadius * 2);
  drawingContext.shadowBlur = 0; // 重置
  
  // 核心
  fill(255);
  ellipse(mouseX, mouseY, playerRadius);
}

/**
 * 繪製電擊特效
 */
function drawElectricShock() {
  stroke(255, 255, 0);
  strokeWeight(2);
  noFill();
  
  // 產生隨機的閃電線條連接球體與碰撞點
  const segments = 5;
  beginShape();
  vertex(mouseX, mouseY);
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const x = lerp(mouseX, collisionPoint.x, t);
    const y = lerp(mouseY, collisionPoint.y, t);
    // 加入隨機抖動
    vertex(x + random(-10, 10), y + random(-10, 10));
  }
  vertex(collisionPoint.x, collisionPoint.y);
  endShape();
  
  // 碰撞點火花
  fill(255, 200, 0);
  noStroke();
  for(let i=0; i<5; i++) {
    ellipse(collisionPoint.x + random(-10, 10), collisionPoint.y + random(-10, 10), random(2, 6));
  }
}

/**
 * 繪製使用者介面 (UI)
 */
function drawUI() {
  // 繪製開始區域的圓形按鈕
  if (gameState === 'WAITING' || gameState === 'FAILED') {
    const d = dist(mouseX, mouseY, startZone.x, startZone.y);
    if (d < startZone.r / 2) {
      fill(0, 255, 150); // 滑鼠懸停時變亮
    } else {
      fill(0, 200, 100);
    }
    noStroke();
    ellipse(startZone.x, startZone.y, startZone.r);
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(16);
    text('Start', startZone.x, startZone.y);
  }

  // 繪製結束區域
  noStroke();
  fill(0, 255, 0, 30);
  rect(endZone.x, endZone.y, endZone.w, endZone.h);
  fill(0, 255, 0);
  textAlign(CENTER, CENTER);
  textSize(16);
  text('GOAL', endZone.x + endZone.w/2, height/2);

  // 根據遊戲狀態顯示不同的文字
  let statusText = '';
  let statusColor = color(255);
  textSize(18);
  textAlign(CENTER, TOP);

  switch (gameState) {
    case 'WAITING':
      statusText = '點擊 Start 按鈕開始遊戲';
      break;
    case 'PLAYING':
      statusText = '遊戲進行中... 請將滑鼠保持在軌道內！';
      break;
    case 'FAILED':
      statusText = '遊戲失敗！點擊任意處重新開始。';
      statusColor = color(255, 80, 80);
      break;
    case 'SUCCESS':
      statusText = '恭喜過關！點擊任意處再玩一次。';
      statusColor = color(80, 255, 80);
      break;
  }
  
  noStroke();
  fill(statusColor);
  text(statusText, width / 2, 15);
}

/**
 * 檢查滑鼠是否與軌道邊界碰撞
 */
function checkCollision() {
  // --- 碰撞偵測說明 ---
  // 為了判斷滑鼠是否碰到曲線邊界，我們不能直接比較滑鼠與儲存的頂點 (vertices)。
  // 因為 curveVertex 會在這些頂點之間產生平滑的曲線，滑鼠可能碰到曲線本身，而不是頂點。
  //
  // 正確的作法是：
  // 1. 根據滑鼠的 X 座標 (mouseX)，找出它在哪兩個路徑頂點之間。
  // 2. 使用 p5.js 的 curvePoint() 函式，計算出在該 mouseX 位置上，「上邊界」與「下邊界」曲線實際的 Y 座標。
  //    curvePoint() 需要四個連續的點 (p1, p2, p3, p4) 和一個 0 到 1 之間的 t 值來計算曲線上的點。
  //    - p2 和 p3 是當前線段的起點和終點。
  //    - p1 和 p4 是前後的控制點。
  //    - t 值是 mouseX 在 p2.x 和 p3.x 之間的比例位置。
  // 3. 最後，比較滑鼠的 Y 座標 (mouseY) 是否在上、下邊界的 Y 座標範圍之外。
  //    - 如果 mouseY < 上邊界Y 或 mouseY > 下邊界Y，就代表發生了碰撞。

  const firstPathX = upperPath[1].x;
  const lastPathX = upperPath[upperPath.length - 2].x;

  // 狀況1：滑鼠在軌道主要路徑的左邊
  if (mouseX < firstPathX) {
    // 檢查是否在 Start 按鈕圓形範圍內
    const d = dist(mouseX, mouseY, startZone.x, startZone.y);
    if (d <= startZone.r / 2) {
      return; // 安全，在按鈕內
    }

    // 檢查是否在按鈕與軌道之間的過渡區域 (避免一出按鈕就死)
    // 允許滑鼠在按鈕右側 (mouseX > startZone.x) 且高度在軌道入口範圍內
    if (mouseX > startZone.x) {
      const startUpperY = upperPath[1].y;
      const startLowerY = lowerPath[1].y;
      // 檢查球的上下邊緣是否都在安全區內
      if (mouseY - playerRadius > startUpperY && mouseY + playerRadius < startLowerY) {
        return; // 安全，在過渡區
      }
    }

    // 否則判定失敗
    gameState = 'FAILED';
    // 在過渡區失敗時，碰撞點設為最近的邊界 (簡單估算)
    collisionPoint = {x: mouseX, y: mouseY < height/2 ? upperPath[1].y : lowerPath[1].y};
    return; 
  }

  // 狀況2：滑鼠在軌道主要路徑的右邊 (朝終點前進)
  if (mouseX > lastPathX) {
    // 檢查滑鼠是否維持在軌道終點的垂直安全範圍內
    const endUpperY = upperPath[upperPath.length - 2].y;
    const endLowerY = lowerPath[lowerPath.length - 2].y;
    if (mouseY - playerRadius < endUpperY || mouseY + playerRadius > endLowerY) {
      gameState = 'FAILED';
      collisionPoint = {x: mouseX, y: mouseY < height/2 ? endUpperY : endLowerY};
    }
    return; // 不進行後續檢查
  }

  // 狀況3：滑鼠在軌道主要路徑的水平範圍內，進行精確的曲線碰撞偵測
  // 1. 找出滑鼠所在的線段索引
  let segmentIndex = -1;
  // 從索引 1 開始，因為 curveVertex 的第一個點是控制點
  for (let i = 1; i < upperPath.length - 2; i++) {
    if (mouseX >= upperPath[i].x && mouseX <= upperPath[i + 1].x) {
      segmentIndex = i;
      break;
    }
  }

  if (segmentIndex !== -1) {
    // 2. 取得計算 curvePoint 所需的四個點
    const p1_upper = upperPath[segmentIndex - 1];
    const p2_upper = upperPath[segmentIndex];
    const p3_upper = upperPath[segmentIndex + 1];
    const p4_upper = upperPath[segmentIndex + 2];

    const p1_lower = lowerPath[segmentIndex - 1];
    const p2_lower = lowerPath[segmentIndex];
    const p3_lower = lowerPath[segmentIndex + 1];
    const p4_lower = lowerPath[segmentIndex + 2];

    // 計算 t 值 (mouseX 在當前線段的 X 軸上的比例)
    const t = (mouseX - p2_upper.x) / (p3_upper.x - p2_upper.x);

    // 3. 使用 curvePoint() 計算在 mouseX 位置上，曲線的精確 Y 座標
    const upperBoundaryY = curvePoint(p1_upper.y, p2_upper.y, p3_upper.y, p4_upper.y, t);
    const lowerBoundaryY = curvePoint(p1_lower.y, p2_lower.y, p3_lower.y, p4_lower.y, t);

    // 4. 比較 mouseY 是否在安全範圍內
    // 考慮球的半徑
    if (mouseY - playerRadius < upperBoundaryY) {
      gameState = 'FAILED';
      collisionPoint = {x: mouseX, y: upperBoundaryY};
    } else if (mouseY + playerRadius > lowerBoundaryY) {
      gameState = 'FAILED';
      collisionPoint = {x: mouseX, y: lowerBoundaryY};
    }
  } else {
    // 理論上，如果滑鼠在軌道範圍內，總能找到一個線段。
    // 如果找不到（例如浮點數精度問題），為求安全也判定為失敗。
    gameState = 'FAILED';
  }
}

/**
 * 檢查是否到達終點
 */
function checkSuccess() {
  if (mouseX > endZone.x) {
    gameState = 'SUCCESS';
  }
}

/**
 * 處理滑鼠點擊事件
 */
function mousePressed() {
  if (gameState === 'WAITING') {
    const d = dist(mouseX, mouseY, startZone.x, startZone.y);
    if (d < startZone.r / 2) {
      gameState = 'PLAYING';
    }
  } else if (gameState === 'FAILED' || gameState === 'SUCCESS') {
    // 如果遊戲失敗或成功，點擊任意處即可重置遊戲
    gameState = 'WAITING';
    collisionPoint = null;
    generateTrack(); // 產生一條新的軌道
  }
}
