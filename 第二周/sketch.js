let fishes = [];
// 調整後的坐標：X 軸正向(右)為頭，數值關於 Y 軸對稱 (左右平衡)
let originalPoints = [
  [8, 0],   // 1. 魚頭 (最右側)
  [4, 2],   // 2. 上背
  [0, 4],   // 3. 背部最高點
  [-4, 2],  // 4. 後背
  [-6, 4],  // 5. 尾鰭上端
  [-5, 0],  // 6. 尾巴中心凹陷處
  [-6, -4], // 7. 尾鰭下端
  [-4, -2], // 8. 後腹
  [0, -4],  // 9. 腹部最低點
  [4, -2],  // 10. 下腹
];

function setup() {
  // 建立填滿視窗的畫布
  createCanvas(windowWidth, windowHeight);
  
  // 產生 12 條魚
  for (let i = 0; i < 12; i++) {
    fishes.push(new Fish(random(width), random(height)));
  }
}

function draw() {
  background(255, 255, 0); // 黃色背景

  for (let f of fishes) {
    f.update();
    f.display();
  }
}

// 當視窗大小改變時，自動調整畫布大小
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

class Fish {
  constructor(startX, startY) {
    this.pos = createVector(startX, startY);
    // 速度範圍，讓它們游動感不同
    this.vel = p5.Vector.random2D().mult(random(1.5, 4));
    
    // --- 修改點 1: 更大 ---
    // 增加 lengthstep 的數值，原本是 7，現在設為 15 到 25 之間的隨機值
    this.lengthstep = random(15, 25); 
    
    // --- 修改點 2: 不同的顏色 ---
    // 使用 colorMode(HSB) 可以更輕易地產生鮮豔、多元的顏色
    // 我們只設定色相 (Hue)，讓飽和度和亮度保持高值
    push();
    colorMode(HSB, 360, 100, 100);
    this.bodyColor = color(random(360), 80, 95); // 產生一個隨機、高飽和度的 HSB 顏色
    pop();
    
    // 設定邊框顏色，深灰色讓填滿效果更立體
    this.borderColor = color(50);
  }

  update() {
    this.pos.add(this.vel);

    // 邊界檢查：撞牆後速度反轉，角度也會隨之改變
    if (this.pos.x < 0 || this.pos.x > width) this.vel.x *= -1;
    if (this.pos.y < 0 || this.pos.y > height) this.vel.y *= -1;
  }

  display() {
    // 關鍵：計算速度向量的角度，讓頭朝前
    let angle = this.vel.heading();

    push();
    translate(this.pos.x, this.pos.y);
    rotate(angle); 

    // --- 修改點 3: 填滿 ---
    fill(this.bodyColor);        // 應用這條魚專屬的隨機填充顏色
    stroke(this.borderColor);     // 應用深色邊框
    strokeWeight(2);              // 邊框寬度
    strokeJoin(ROUND);            // 轉角變平滑

    // 使用 beginShape 畫出乾淨的一條線圖案
    beginShape();
    for (let p of originalPoints) {
      // 這裡使用了這條魚個別設定的 lengthstep (更大)
      vertex(p[0] * this.lengthstep, p[1] * this.lengthstep);
    }
    endShape(CLOSE); // 自動封閉路徑並填滿顏色

    pop();
  }
}