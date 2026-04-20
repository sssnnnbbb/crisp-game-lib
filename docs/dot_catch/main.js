title = "DOT CATCHER";
description = `
[Click/Tap]
Catch dot

Avoid them;
red dots
dots confrict
`;

characters = [
  // ドット
  `
llll
llll
llll
llll
`,
];

options = {
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 16,
};

let dots;
let level;
let levelDotCount;
let hasAvoidDot;

function update() {
  if (!ticks) {
    level = 1;
    levelDotCount = 3;
    startLevel();
  }

  // 青いドットがなくなったら次のレベルへ
  if (dots.filter(d => !d.isAvoid).length === 0 && (level < 4 || hasAvoidDot)) {
    level++;
    levelDotCount++;
    startLevel();
  }

  remove(dots, (d) => {
    d.pos.add(d.vel);
    if (d.pos.x < 0 || d.pos.x > 99) d.vel.x *= -1;
    if (d.pos.y < 0 || d.pos.y > 99) d.vel.y *= -1;
    color(d.isAvoid ? "red" : "cyan");
    char("a", d.pos);

    if (input.isJustPressed && d.pos.distanceTo(input.pos) < 6) {
      if (d.isAvoid) {
        play("explosion");
        end();
      } else {
        play("coin");
        addScore(10);
        return true; // 青いドットを削除する
      }
    }
    return false;
  });

  // ドット同士がぶつかったらゲームオーバー
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      if (dots[i].pos.distanceTo(dots[j].pos) < 3) {
        play("explosion");
        end();
      }
    }
  }

  color("black");
  text(`Level: ${level}`, 3, 10);
}

function startLevel() {
  dots = [];
  hasAvoidDot = level >= 4;
  for (let i = 0; i < levelDotCount; i++) {
    let newPos;
    let tooClose;
    do {
      newPos = vec(rnd(10, 90), rnd(10, 90));
      tooClose = dots.some(d => d.pos.distanceTo(newPos) < 10);
    } while (tooClose);
    dots.push({
      pos: newPos,
      vel: vec(rnd(0.1, 0.3)).rotate(rnd(PI * 2)),
      isAvoid: hasAvoidDot && rnd() < 0.5,
    });
  }
}
