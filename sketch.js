/**
 * Underwater World Hub
 * Integrating Seagrass (Class & Arrays), Custom Fish (Vertex), 
 * and Project Portals (Iframe Integration).
 */

let mainSeagrass; 
let bgSeagrasses = []; // 存儲背景的細水草
let fishes = [];
let portals = [];
let iframeContainer;
let closeBtn;

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 初始化主角：主水草高度與螢幕同高
  mainSeagrass = new Seagrass(width / 2, color(100, 255, 150), 18, height);

  // 初始化背景細水草：高度調高至約半個螢幕 (height * 0.4 ~ 0.6)
  for (let i = 0; i < 20; i++) { // 增加小水草數量到 20 珠
    let sideX = random(width);
    if (abs(sideX - width / 2) < 30) sideX += 50; // 避免擋住主水草
    bgSeagrasses.push(new Seagrass(sideX, color(30, 100, 60, 80), random(2, 5), random(height * 0.4, height * 0.6)));
  }

  // 初始化背景小魚
  for (let i = 0; i < 12; i++) {
    fishes.push(new Fish());
  }

  // 僅保留前三週的傳送門，佈局在同一螢幕內
  let weekLabels = ["第一週", "第二週", "第三週"];
  let urls = ["第一周/index.html", "第二周/index.html", "第三周/index.html"];
  
  for (let i = 0; i < weekLabels.length; i++) {
    // 平均分佈在螢幕高度內
    let yDist = 250 + (i * 200); 
    let side = (i % 2 === 0 ? -100 : 100); 
    portals.push(new Portal(yDist, weekLabels[i], urls[i], side));
  }

  // Create HTML Iframe container (hidden by default)
  setupIframeUI();
}

function draw() {
  background(5, 15, 30); 

  // 繪製不需要跟隨捲動的裝飾（如遠景魚群）
  for (let f of fishes) {
    f.update();
    f.display();
  }

  // 繪製背景細水草
  for (let bg of bgSeagrasses) {
    bg.display(); 
  }

  // 繪製主海草
  mainSeagrass.display();

  // 繪製傳送門，它們會根據主水草的動態位置來定位
  for (let p of portals) {
    p.display(mainSeagrass);
    p.updateHover(mainSeagrass);
  }
  
  // 提示操作
  fill(255, 150);
  noStroke();
  textAlign(LEFT);
  text("點擊氣泡探索每週作品", 20, height - 20);
}

function mousePressed() {
  for (let p of portals) {
    if (p.isClicked(mainSeagrass) && p.url !== "#") {
      showIframe(p.url);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// --- Classes ---

class Seagrass {
  constructor(x, col, weight, maxHeight) {
    this.x = x;
    this.color = col;
    this.weight = weight;
    this.maxHeight = maxHeight; // 儲存水草各自的高度
    this.offset = random(100);
  }

  // 取得特定高度在目前影格的擺動偏移量
  getSway(yFromBottom) {
    // 底部 (i=0) 不動，越往上擺動幅度越大
    return sin(frameCount * 0.02 + this.offset + yFromBottom * 0.02) * (yFromBottom / 12);
  }

  display() {
    stroke(this.color);
    strokeWeight(this.weight);
    noFill();
    beginShape();
    // 從畫面底部向上繪製到各自設定的高度
    for (let i = 0; i <= this.maxHeight; i += 20) {
      let sway = this.getSway(i);
      vertex(this.x + sway, height - i);
    }
    endShape();
  }
}

class Fish {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = random(-100, -50);
    this.y = random(100, height - 100);
    this.speed = random(1, 3);
    this.size = random(0.5, 1.2);
    this.color = color(random(200, 255), random(100, 200), 0);
  }

  update() {
    this.x += this.speed;
    if (this.x > width + 100) this.reset();
  }

  display() {
    push();
    translate(this.x, this.y + sin(frameCount * 0.05) * 10);
    // 如果向右游動，頭部朝右 (scale 保持 1，頂點定義頭在正方向)
    scale(this.size); 
    fill(this.color);
    noStroke();
    // 重新定義頂點：讓頭部(鼻尖)位於 70, 0 (向前)
    beginShape();
    vertex(70, 0); // 鼻尖 (頭部向前)
    bezierVertex(60, -20, 30, -20, 20, 0); // 上半身
    vertex(0, -20); // 魚尾上端
    vertex(10, 0);  // 魚尾中心
    vertex(0, 20);  // 魚尾下端
    vertex(20, 0);  // 回到身體
    bezierVertex(30, 20, 60, 20, 70, 0); // 下半身
    endShape(CLOSE);
    pop();
  }
}

class Portal {
  constructor(yFromBottom, label, url, sideOffset) {
    this.yFromBottom = yFromBottom;
    this.label = label;
    this.url = url;
    this.sideOffset = sideOffset; // 相對於水草中心線的左右偏移
    this.r = 70;
    this.angle = 0; // 用於儲存旋轉角度
    this.isHovered = false;
  }

  display(seagrass) {
    // 根據 yFromBottom 從水草獲取目前的動態 X 座標
    let sway = seagrass.getSway(this.yFromBottom);
    let px = seagrass.x + sway + this.sideOffset;
    let py = height - this.yFromBottom;
    
    push();
    // 繪製連接主水草的細莖，強化「綁定」感
    stroke(seagrass.color);
    strokeWeight(2);
    let floatingBase = sin(frameCount * 0.03 + this.yFromBottom) * 15;
    line(px, py + floatingBase, seagrass.x + sway, py);

    let floating = sin(frameCount * 0.03 + this.yFromBottom) * 15;
    translate(px, py + floating);
    
    if (this.isHovered) {
      this.angle += 0.05; // 當滑鼠碰到時，角度持續增加產生旋轉
      scale(1.1);
    }
    
    // 繪製花朵圖形
    push();
    rotate(this.angle); // 套用旋轉
    noStroke();
    
    // 根據懸停狀態決定花瓣顏色（海葵風格）
    let petalColor = this.isHovered ? color(255, 150, 150) : color(100, 200, 255, 180);
    fill(petalColor);
    
    // 繪製 6 片花瓣
    for (let i = 0; i < 6; i++) {
      push();
      rotate(i * TWO_PI / 6);
      ellipse(this.r * 0.5, 0, this.r * 0.8, this.r * 0.4);
      pop();
    }
    
    // 繪製花蕊（中心圓）
    fill(255, 255, 100);
    ellipse(0, 0, this.r * 0.5);
    pop();
    
    // 顯示文字標題（文字不跟隨旋轉，保持可讀性）
    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(14);
    textStyle(BOLD);
    text(this.label, 0, 0);
    pop();
  }

  // 更新懸停狀態
  updateHover(seagrass) {
    let sway = seagrass.getSway(this.yFromBottom);
    let px = seagrass.x + sway + this.sideOffset;
    let py = height - this.yFromBottom; 
    let floating = sin(frameCount * 0.03 + this.yFromBottom) * 15;
    
    let d = dist(mouseX, mouseY, px, py + floating);
    this.isHovered = d < this.r;
  }

  isClicked(seagrass) {
    let sway = seagrass.getSway(this.yFromBottom);
    let px = seagrass.x + sway + this.sideOffset;
    let py = height - this.yFromBottom;
    let floating = sin(frameCount * 0.03 + this.yFromBottom) * 15;
    return dist(mouseX, mouseY, px, py + floating) < this.r;
  }
}

// --- Iframe Handling ---

function setupIframeUI() {
  // Create a container for the iframe
  iframeContainer = createDiv('');
  iframeContainer.position(50, 50);
  iframeContainer.size(width - 100, height - 100);
  iframeContainer.style('background', 'white');
  iframeContainer.style('border', '5px solid #005588');
  iframeContainer.style('z-index', '1000');
  iframeContainer.style('display', 'none');
  iframeContainer.id('project-frame-container');

  // Close button
  closeBtn = createButton('關閉 (Close)');
  closeBtn.parent(iframeContainer);
  closeBtn.position(10, 10);
  closeBtn.mousePressed(() => {
    iframeContainer.style('display', 'none');
    // Clear the iframe to stop any sound/logic
    select('#project-iframe').attribute('src', '');
  });

  // The actual Iframe
  let frame = createElement('iframe');
  frame.parent(iframeContainer);
  frame.id('project-iframe');
  frame.style('width', '100%');
  frame.style('height', 'calc(100% - 40px)');
  frame.style('margin-top', '40px');
  frame.style('border', 'none');
}

function showIframe(url) {
  const container = select('#project-frame-container');
  const frame = select('#project-iframe');
  frame.attribute('src', url);
  container.style('display', 'block');
}
