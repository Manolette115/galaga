const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("scoreDisplay");
const startScreen = document.getElementById("startScreen");
const winScreen = document.getElementById("winScreen");

const deathScreen = document.createElement("div");
deathScreen.className = "overlay";
deathScreen.innerHTML = `
  <h1 style="color: red;">¡Has sido alcanzado!</h1>
  <p>Un enemigo llegó hasta el robot.</p>
  <button onclick="location.reload()">Reintentar</button>
`;
deathScreen.style.display = "none";
document.body.appendChild(deathScreen);

const shootSound = document.getElementById("shootSound");
const explodeSound = document.getElementById("explodeSound");
const backgroundMusic = document.getElementById("backgroundMusic");
backgroundMusic.volume = 0.3;

const enemyImage = new Image();
enemyImage.src = "enemy_idle.png";

const enemyHitImage = new Image();
enemyHitImage.src = "enemy_hit.png";

const strongEnemyImage = new Image();
strongEnemyImage.src = "strong_enemy_placeholder.png";

const strongEnemyHitImage = new Image();
strongEnemyHitImage.src = "strong_enemy_hit_placeholder.png";

const robotIdleImg = new Image();
robotIdleImg.src = "robot_idle.png";

const robotShootImg = new Image();
robotShootImg.src = "robot_shoot.png";

const bulletImg = new Image();
bulletImg.src = "bullet.png";

let ship = {
  x: canvas.width / 2 - 15,
  y: canvas.height - 50,
  width: 30,
  height: 30,
  speed: 5,
  img: robotIdleImg
};

let bullets = [];
let enemies = [];
let movingLeft = false;
let movingRight = false;
let firing = false;
let canFire = true;
let score = 0;
let totalKills = 0;
let playing = false;
let enemyMoveTimer = 0;
let enemyDropTimer = 0;
let enemyDirection = 1;
let level = 1;

let imagesLoaded = 0;
const totalImages = 7;

function checkStartReady() {
  imagesLoaded++;
  if (imagesLoaded === totalImages) {
    startScreen.addEventListener("click", () => {
      startScreen.classList.add("hide");
      createEnemies();
      playing = true;

      backgroundMusic.play();
      backgroundMusic.playbackRate = 1;
    });
  }
}

[
  enemyImage,
  enemyHitImage,
  strongEnemyImage,
  strongEnemyHitImage,
  robotIdleImg,
  robotShootImg,
  bulletImg
].forEach(img => {
  img.onload = checkStartReady;
  img.onerror = checkStartReady;
});

function createEnemies() {
  enemies = [];
  const positions = [];

  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 6; j++) {
      const xPos = 30 + j * 50;
      const yPos = 30 + i * 40;
      positions.push({ x: xPos, y: yPos });
    }
  }

  const strongEnemyCount = Math.min(level, positions.length);
  const shuffled = positions.sort(() => Math.random() - 0.5);
  const strongPositions = shuffled.slice(0, strongEnemyCount);
  const strongSet = new Set(strongPositions.map(pos => `${pos.x},${pos.y}`));

  positions.forEach(pos => {
    const isStrong = strongSet.has(`${pos.x},${pos.y}`);
    enemies.push({
      x: pos.x,
      y: pos.y,
      width: isStrong ? 45 : 30,
      height: isStrong ? 45 : 30,
      img: isStrong ? strongEnemyImage : enemyImage,
      dying: false,
      flashState: 0,
      remove: false,
      health: isStrong ? 2 : 1,
      hitImg: isStrong ? strongEnemyHitImage : enemyHitImage
    });
  });
}

function update() {
  if (!playing) return;

  if (movingLeft && ship.x > 0) ship.x -= ship.speed;
  if (movingRight && ship.x + ship.width < canvas.width) ship.x += ship.speed;

  if (firing && canFire) {
    bullets.push({
      x: ship.x + ship.width / 2 - 5,
      y: ship.y,
      width: 10,
      height: 10
    });
    let sound = shootSound.cloneNode();
    sound.play();
    canFire = false;
    ship.img = robotShootImg;
    setTimeout(() => {
      ship.img = robotIdleImg;
      canFire = true;
    }, 200);
  }

  bullets.forEach((b, i) => {
    b.y -= 7;
    if (b.y < 0) bullets.splice(i, 1);
  });

  bullets.forEach((b, bi) => {
    enemies.forEach((e) => {
      if (!e.dying && b.x < e.x + e.width && b.x + b.width > e.x &&
          b.y < e.y + e.height && b.y + b.height > e.y) {
        e.health--;

        if (e.health <= 0 && !e.dying) {
          e.dying = true;
          e.img = e.hitImg;
          let explode = explodeSound.cloneNode();
          explode.play();

          let flashCount = 0;
          const flashInterval = setInterval(() => {
            e.flashState = (e.flashState === 0) ? 1 : 0;
            flashCount++;
            if (flashCount >= 5) clearInterval(flashInterval);
          }, 100);

          setTimeout(() => {
            e.remove = true;
          }, 500);

          score += 1;
          totalKills += 1;
          scoreDisplay.textContent = score;

          if (totalKills >= 250) {
            playing = false;
            winScreen.style.display = "flex";
            launchConfetti();
          }
        }

        bullets.splice(bi, 1);
      }
    });
  });

  enemies = enemies.filter(e => !e.remove);

  enemyDropTimer++;
  if (enemyDropTimer >= 60) {
    enemies.forEach(e => e.y += 5);
    enemyDropTimer = 0;
  }

  let levelMultiplier = level;
  let speedFactor = Math.max(3, (4 + enemies.length) / (levelMultiplier * 2));

  enemyMoveTimer++;
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

  enemies.forEach(e => {
    if (!e.dying && e.y + e.height >= ship.y) {
      playing = false;
      deathScreen.style.display = "flex";
    }
  });

  if (enemies.length === 0 && totalKills < 250) {
    level++;

    // Música: velocidad cada 2 niveles, máximo 1.5
    const newRate = Math.min(1.5, 1 + Math.floor((level - 1) / 2) * 0.1);
    backgroundMusic.playbackRate = newRate;

    createEnemies();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(ship.img, ship.x, ship.y, ship.width, ship.height);

  bullets.forEach(b => {
    ctx.drawImage(bulletImg, b.x, b.y, b.width, b.height);
  });

  enemies.forEach(e => {
    ctx.globalAlpha = (e.flashState === 1) ? 0.5 : 1.0;
    ctx.drawImage(e.img, e.x, e.y, e.width, e.height);
    ctx.globalAlpha = 1.0;
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

// Controles móviles
document.getElementById("leftBtn").addEventListener("touchstart", e => { e.preventDefault(); movingLeft = true; });
document.getElementById("leftBtn").addEventListener("touchend", e => { e.preventDefault(); movingLeft = false; });
document.getElementById("rightBtn").addEventListener("touchstart", e => { e.preventDefault(); movingRight = true; });
document.getElementById("rightBtn").addEventListener("touchend", e => { e.preventDefault(); movingRight = false; });
document.getElementById("fireBtn").addEventListener("touchstart", e => { e.preventDefault(); firing = true; });
document.getElementById("fireBtn").addEventListener("touchend", e => { e.preventDefault(); firing = false; });

// Teclado
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

gameLoop();
