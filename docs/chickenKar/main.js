title = "chickenKar";
description = `
[Click/Tap] Start/Stop
`;

characters = [
  // 車
  `
  ll
 llll
llllll
llllll
llllll
`,
  // 障害物
  `
llllll
llllll
llllll
llllll
`
];

options = {
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 9,
};

let car;
let obstacle;
let obstacleSpeed;
let isMoving;
let hasStopped;
let highScore;
let currentScore;
let clickCount;

function update() {
  if (!ticks) {
    resetGame();
  }

  if (input.isJustPressed || input.isJustClicked) {
    clickCount++;
    if (hasStopped) {
      resetGame();
    } else if (clickCount == 1) {
      isMoving = true;
    } else if (clickCount == 2) {
      isMoving = false;
    }
  }

  if (isMoving) {
    obstacle.pos.x -= obstacleSpeed;
    const distance = Math.abs(car.pos.x - obstacle.pos.x);
    currentScore = Math.min(100000000000000000, Math.pow(Math.max(0, 20 - distance), 6));
  } else if (clickCount == 2 && !hasStopped) {
    score += currentScore;
    hasStopped = true;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("highScore", highScore);
    }
  }

  color("cyan");
  char("a", car.pos);

  color("black");
  char("b", obstacle.pos);

  if (obstacle.pos.x < car.pos.x + 6 && obstacle.pos.x > car.pos.x - 6) {
    play("explosion");
    end();
  }

  color("black");
  text(`Score: ${currentScore}`, 3, 20);
  text(`HighScore: ${highScore}`, 3, 10);
}

function resetGame() {
  car = { pos: vec(50, 70) };
  obstacle = { pos: vec(100, 70) };
  obstacleSpeed = 1;
  isMoving = false;
  hasStopped = false;
  currentScore = 0;
  clickCount = 0;
}
