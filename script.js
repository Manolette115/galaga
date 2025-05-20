const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("scoreDisplay");
const startScreen = document.getElementById("startScreen");
const winScreen = document.getElementById("winScreen");
const shootSound = document.getElementById("shootSound");
const explodeSound = document.getElementById("explodeSound");

const enemyImage = new Image();
enemyImage.src = "enemy_idle.png";

const enemyHitImage = new Image();
enemyHitImage.src = "enemy_hit.png";

let ship = { x: canvas.width / 2 - 15, y: canvas.height - 50, width: 30, height: 30, speed: 5 };
let bullets = [];
let enemies = [];
let movingLeft = false;
let movingRight = false;
let firing = false;
let canFire = true;
let score = 0;
let playing = false;
let enemyMoveTimer = 0;
let enemyDirection = 1;

function createEnemies() {
  enemies = [];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 6; j++) {
      enemies.push({
        x: 30 + j * 50,
        y: 30 + i * 40,
        width: 30,
        height: 30,
        img: enemyImage,
        dying: false
      });
    }
  }
}

function update() {
  if (!playing) return;

  if (movingLeft && ship.x > 0) ship.x -= ship.speed;
  if (movingRight && ship.x + ship.width < canvas.width) ship.x += ship.speed;

  if (firing && canFire) {
    bullets.push({ x: ship.x + ship.width / 2 - 2, y: ship.y, width: 4, height: 10 });
    let sound = shootSound.cloneNode();
    sound.play();
    canFire = false;
    setTimeout(() => canFire = true, 200);
  }

  bullets.forEach((b, i) => {
    b.y -= 7;
    if (b.y < 0) bullets.splice(i, 1);
  });

  bullets.forEach((b, bi) => {
    enemies.forEach((e, ei) => {
      if (!e.dying && b.x < e.x + e.width && b.x + b.width > e.x &&
          b.y < e.y + e.height && b.y + b.height > e.y) {
        e.dying = true;
        e.img = enemyHitImage;
        let explode = explodeSound.cloneNode();
        explode.play();
        setTimeout(() => enemies.splice(ei, 1), 150);
        bullets.splice(bi, 1);
        score += 100;
        scoreDisplay.textContent = score;
      }
    });
  });

  // Zigzag movement + progressive difficulty
  enemyMoveTimer++;
  let speedFactor = Math.max(5, 35 - enemies.length); // difficulty increases as enemies decrease
  if (enemyMoveTimer >= speedFactor) {
    let shift = 10 * enemyDirection;
    let edgeHit = enemies.some(e => e.x + shift < 0 || e.x + shift + e.width > canvas.width);
    if (edgeHit) {
      enemyDirection *= -1;
      enemies.forEach(e => e.y += 10);
    } else {
      enemies.forEach(e => e.x += shift);
    }
    enemyMoveTimer = 0;
  }

  if (enemies.length === 0) {
    playing = false;
    winScreen.style.display = "flex";
    launchConfetti();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.fillRect(ship.x, ship.y, ship.width, ship.height);

  bullets.forEach(b => {
    ctx.fillStyle = "red";
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });

  enemies.forEach(e => {
    ctx.drawImage(e.img, e.x, e.y, e.width, e.height);
  });
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function launchConfetti() {
  const confettiCanvas = document.getElementById("confettiCanvas");
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  const ctx = confettiCanvas.getContext("2d");

  let confetti = Array.from({ length: 100 }, () => ({
    x: Math.random() * confettiCanvas.width,
    y: Math.random() * confettiCanvas.height - confettiCanvas.height,
    r: Math.random() * 4 + 2,
    dx: Math.random() * 2 - 1,
    dy: Math.random() * 3 + 2,
    color: `hsl(${Math.random() * 360}, 100%, 50%)`
  }));

  function drawConfetti() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    for (let c of confetti) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.fill();
      c.x += c.dx;
      c.y += c.dy;
      if (c.y > confettiCanvas.height) {
        c.y = 0;
        c.x = Math.random() * confettiCanvas.width;
      }
    }
    requestAnimationFrame(drawConfetti);
  }

  drawConfetti();
}

document.getElementById("leftBtn").addEventListener("touchstart", e => { e.preventDefault(); movingLeft = true; });
document.getElementById("leftBtn").addEventListener("touchend", e => { e.preventDefault(); movingLeft = false; });
document.getElementById("rightBtn").addEventListener("touchstart", e => { e.preventDefault(); movingRight = true; });
document.getElementById("rightBtn").addEventListener("touchend", e => { e.preventDefault(); movingRight = false; });
document.getElementById("fireBtn").addEventListener("touchstart", e => { e.preventDefault(); firing = true; });
document.getElementById("fireBtn").addEventListener("touchend", e => { e.preventDefault(); firing = false; });

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") movingLeft = true;
  if (e.key === "ArrowRight") movingRight = true;
  if (e.key === " ") firing = true;
});
document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft") movingLeft = false;
  if (e.key === "ArrowRight") movingRight = false;
  if (e.key === " ") firing = false;
});

startScreen.addEventListener("click", () => {
  startScreen.classList.add("hide");
  createEnemies();
  playing = true;
});

gameLoop();
