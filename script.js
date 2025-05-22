const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("scoreDisplay");
const startScreen = document.getElementById("startScreen");
const winScreen = document.getElementById("winScreen");
const backgroundMusic = document.getElementById("backgroundMusic");

const shootSound = document.getElementById("shootSound");
const explodeSound = document.getElementById("explodeSound");

const enemyImage = new Image();
enemyImage.src = "enemy_idle.png";

const enemyHitImage = new Image();
enemyHitImage.src = "enemy_hit.png";

const strongEnemyImage = new Image();
strongEnemyImage.src = "enemy_strong.png";

const strongEnemyHitImage = new Image();
strongEnemyHitImage.src = "enemy_strong_hit.png";

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
[
  enemyImage, enemyHitImage, strongEnemyImage, strongEnemyHitImage,
  robotIdleImg, robotShootImg, bulletImg
].forEach(img => {
  img.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === 7) {
      startScreen.addEventListener("click", () => {
        startScreen.classList.add("hide");
        createEnemies();
        backgroundMusic.play();
        backgroundMusic.playbackRate = 1;
        playing = true;
      });
    }
  };
});

function createEnemies() {
  enemies = [];

  const strongSize = 60;
  const normalSize = 30;
  const paddingX = 10;
  const paddingY = 10;
  const columns = 6;
  const rows = 5;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      const isStrong = level >= 2 && Math.random() < 0.3;
      const width = isStrong ? strongSize : normalSize;
      const height = isStrong ? strongSize : normalSize;
      const x = 20 + j * (strongSize + paddingX);
      const y = 30 + i * (strongSize + paddingY);

      enemies.push({
        x,
        y,
        width,
        height,
        img: isStrong ? strongEnemyImage : enemyImage,
        hitImage: isStrong ? strongEnemyHitImage : enemyHitImage,
        dying: false,
        flashState: 0,
        remove: false,
        health: isStrong ? 2 : 1,
        isStrong
      });
    }
  }
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
    shootSound.cloneNode().play();
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
          e.img = e.hitImage;
          explodeSound.cloneNode().play();

          let flashCount = 0;
          const flashInterval = setInterval(() => {
            e.flashState = (e.flashState === 0) ? 1 : 0;
            flashCount++;
            if (flashCount >= 5) clearInterval(flashInterval);
          }, 100);

          setTimeout(() => {
            e.remove = true;
          }, 500);

          score++;
          totalKills++;
          scoreDisplay.textContent = score;

          if (totalKills >= 250) {
            playing = false;
            backgroundMusic.pause();
            winScreen.style.display = "flex";

            // Mostrar "REINTENTAR"
            winScreen.innerHTML = `
              <h1>¡Felicidades!</h1>
              <p>Has completado el nivel.</p>
              <p class="retro-retry blinking">REINTENTAR</p>
              <canvas id="confettiCanvas"></canvas>
            `;
            launchConfetti();

            winScreen.addEventListener("click", () => location.reload());
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

  let speedFactor = Math.max(3, (4 + enemies.length) / (level * 2));
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
      backgroundMusic.pause();
      winScreen.style.display = "flex";
      winScreen.innerHTML = `
        <h1>¡Has sido alcanzado!</h1>
        <p>Un enemigo llegó al robot.</p>
        <p class="retro-retry blinking">REINTENTAR</p>
      `;
      winScreen.addEventListener("click", () => location.reload());
    }
  });

  if (enemies.length === 0 && totalKills < 250) {
    level++;
    backgroundMusic.playbackRate = Math.min(1.5, 1 + Math.floor(level / 2) * 0.1);
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
