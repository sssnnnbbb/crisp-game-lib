title = "PLATE SPINNER";
description = `
[Hold] Spin plate
`;

characters = [
  // 皿
  `
  ll
 llll
llllll
 llll
  ll
`,
  // 棒
  `
  ll
  ll
  ll
  ll
  ll
`
];

options = {
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 3,
};

/** @type {{ pos: Vector, speed: number, plate: { pos: Vector, angle: number } }} */
let sticks;
let selectedStickIndex;
let nextStickTicks;

function update() {
  if (!ticks) {
    sticks = times(3, (i) => {
      const stickX = 20 + i * 30;
      return {
        pos: vec(stickX, 90),
        speed: 0,
        plate: { pos: vec(stickX, 70), angle: 0 }
      };
    });
    selectedStickIndex = 0;
    nextStickTicks = 100;
  }

  sticks.forEach((stick, i) => {
    stick.speed *= 0.99;
    stick.plate.angle += stick.speed;
    color("black");
    char("b", stick.pos);
    color("cyan");
    stick.plate.pos.y = stick.pos.y - 20 + sin(stick.plate.angle) * 10;
    char("a", stick.plate.pos, { rotation: stick.plate.angle });
  });

  if (input.isPressed) {
    sticks[selectedStickIndex].speed += 0.1;
  }

  nextStickTicks--;
  if (nextStickTicks < 0) {
    selectedStickIndex = (selectedStickIndex + 1) % sticks.length;
    nextStickTicks = 100;
  }

  // ゲームオーバーの条件：皿が棒の底（90ピクセル）より低くなったら
  sticks.forEach((stick) => {
    if (stick.plate.pos.y > stick.pos.y) {
      play("explosion");
      end();
    }
  });
}
