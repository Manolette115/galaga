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
strongEnemyImage.src = "enemy_strong.png"; // Placeholder

const strongEnemyHitImage = new Image();
strongEnemyHitImage.src = "enemy_strong_hit.png"; // Placeholder

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
[enemyImage, enemyHitImage, robotIdleImg, robotShootImg, bulletImg, strongEnemyImage, strongEnemyHitImage].forEach(img => {
  img.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === 7) {
      startScreen.addEventListener("click", () => {
        startScreen.classList.add("hide");
        createEnemies();
        playing = true;
        backgroundMusic.play();
        backgroundMusic.playbackRate = 1;
      });
    }
  };
});

function createEnemies() {
  enemies = [];
  const total = 30;
  const strongCount = Math.min(level + 2, 10); // max 10 fuertes

  let positions = [];
  while (positions.length < strongCount) {
    let rand = Math.floor(Math.random() * total);
    if (!positions.includes(rand)) {
      positions.push(rand);
    }
  }

  let i = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 6; col++) {
      const isStrong = positions.includes(i);
      enemies.push({
        x: 30 + col * 50,
        y: 30 + row * 40,
        width: isStrong ? 35 : 30,
        height: isStrong ? 35 : 30,
        img: isStrong ? strongEnemyImage : enemyImage,
        hitImg: isStrong ? strongEnemyHitImage : enemyHitImage,
        health: isStrong ? 2 : 1,
        dying: false,
        flashState: 0,
        remove: false
      });
      i++;
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

        if (e.health <= 0) {
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

          score++;
          totalKills++;
          scoreDisplay.textContent = score;

          if (totalKills >= 250) {
            endGame("win");
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
      endGame("lose");
    }
  });

  if (enemies.length === 0 && totalKills < 250) {
    level++;
    createEnemies();

    // Ajustar velocidad de música cada 2 niveles, máx. 1.5x
    if (level % 2 === 0) {
      backgroundMusic.playbackRate = Math.min(1.5, backgroundMusic.playbackRate + 0.1);
    }
  }
}

function endGame(result) {
  playing = false;
  backgroundMusic.pause();

  const screen = result === "win" ? winScreen : deathScreen;
  screen.style.display = "flex";

  if (!screen.querySelector(".retry-text")) {
    const retry = document.createElement("p");
    retry.className = "blinking retro-retry retry-text";
    retry.textContent = "REINTENTAR?";
    screen.appendChild(retry);
  }

  screen.addEventListener("click", () => location.reload());
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(ship.img, ship.x, ship.y, ship.width, ship.height);

  bullets.forEach(b => {
    ctx.drawImage(bulletImg, b.x, b.y, b.width, b.height);
  });

  enemies.forEach(e => {
    ctx.globalAlpha = e.flashState === 1 ? 0.5 : 1.0;
    ctx.drawImage(e.img, e.x, e.y, e.width, e.height);
    ctx.globalAlpha = 1.0;
  });
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();

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

const deathScreen = document.createElement("div");
deathScreen.className = "overlay";
deathScreen.style.display = "none";
document.body.appendChild(deathScreen);
