title = "壁の旅人";

description = `
[Hold] 障害物を下に動かす
左右キーで移動
`;

characters = [
  `
  ll
  l  l
 llll
l l  
  lll
 l 
`
];

options = {
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 3,
  theme: "pixel",
};

/** @type {Vector} */
let playerPos;
/** @type {{pos: Vector}[]} */
let obstacles;
/** @type {number} */
let holdTime;

function update() {
  if (!ticks) {
    playerPos = vec(50, 50);
    obstacles = times(5, () => {
      return {
        pos: vec(rnd(10, 90), rnd(-90, 0))
      };
    });
    holdTime = 0;
  }

  // 壁の描画
  color("light_blue");
  rect(0, 0, 100, 100);

  // プレイヤーの移動制御
  if (input.isPressed) {
    playerPos.x += input.pos.x > 50 ? 1 : -1;
    playerPos.x = clamp(playerPos.x, 10, 90);
    holdTime++;
    addScore(1); // ホールドされた時間に基づいてスコアを加算
  }

  // 障害物の描画
  color("purple");
  obstacles.forEach((obstacle) => {
    box(obstacle.pos, 5, 5);
  });

  // ホールドによる障害物の移動
  if (input.isPressed) {
    obstacles.forEach((obstacle) => {
      obstacle.pos.y += 1;
      if (obstacle.pos.y > 100) {
        obstacle.pos.y = rnd(-90, 0);
        obstacle.pos.x = rnd(10, 90);
      }
    });
  }

  // プレイヤーの描画
  color("black");
  char("a", playerPos);

  // プレイヤーと障害物の衝突判定
  const collision = char("a", playerPos).isColliding.rect.purple;
  if (collision) {
    play("explosion");
    end();
  }
}
