const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("scoreDisplay");
const startScreen = document.getElementById("startScreen");
const winScreen = document.getElementById("winScreen");

let ship = { x: canvas.width / 2 - 15, y: canvas.height - 40, width: 30, height: 30, speed: 5 };
let bullets = [];
let enemies = [];
let movingLeft = false;
let movingRight = false;
let firing = false;
let score = 0;
let playing = false;
let enemyMoveDownTimer = 0;

function createEnemies() {
    enemies = [];
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 6; j++) {
            enemies.push({ x: 30 + j * 50, y: 30 + i * 40, width: 30, height: 30 });
        }
    }
}

function update() {
    if (!playing) return;

    if (movingLeft && ship.x > 0) ship.x -= ship.speed;
    if (movingRight && ship.x + ship.width < canvas.width) ship.x += ship.speed;
    if (firing && bullets.length < 5) {
        bullets.push({ x: ship.x + ship.width / 2 - 2, y: ship.y, width: 4, height: 10 });
        firing = false;
    }

    bullets.forEach((b, i) => {
        b.y -= 7;
        if (b.y < 0) bullets.splice(i, 1);
    });

    bullets.forEach((b, i) => {
        enemies.forEach((e, j) => {
            if (b.x < e.x + e.width &&
                b.x + b.width > e.x &&
                b.y < e.y + e.height &&
                b.y + b.height > e.y) {
                enemies.splice(j, 1);
                bullets.splice(i, 1);
                score += 100;
                scoreDisplay.textContent = score;
            }
        });
    });

    enemyMoveDownTimer++;
    if (enemyMoveDownTimer > 30) {
        enemies.forEach(e => e.y += 2);
        enemyMoveDownTimer = 0;
    }

    if (enemies.length === 0) {
        playing = false;
        winScreen.style.display = "flex";
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
        ctx.fillStyle = "lime";
        ctx.fillRect(e.x, e.y, e.width, e.height);
    });
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

document.getElementById("leftBtn").addEventListener("touchstart", (e) => {
    e.preventDefault();
    movingLeft = true;
});
document.getElementById("leftBtn").addEventListener("touchend", (e) => {
    e.preventDefault();
    movingLeft = false;
});
document.getElementById("rightBtn").addEventListener("touchstart", (e) => {
    e.preventDefault();
    movingRight = true;
});
document.getElementById("rightBtn").addEventListener("touchend", (e) => {
    e.preventDefault();
    movingRight = false;
});
document.getElementById("fireBtn").addEventListener("touchstart", (e) => {
    e.preventDefault();
    firing = true;
});
document.getElementById("fireBtn").addEventListener("touchend", (e) => {
    e.preventDefault();
    firing = false;
});

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") movingLeft = true;
    if (e.key === "ArrowRight") movingRight = true;
    if (e.key === " ") firing = true;
});
document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") movingLeft = false;
    if (e.key === "ArrowRight") movingRight = false;
    if (e.key === " ") firing = false;
});

startScreen.addEventListener("click", () => {
    startScreen.classList.add("hide");
    setTimeout(() => {
        startScreen.style.display = "none";
        createEnemies();
        playing = true;
    }, 1000);
});

gameLoop();
