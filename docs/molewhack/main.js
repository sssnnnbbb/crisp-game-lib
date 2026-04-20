title = "MOLE WHACK";
description = `
[Tap] Hit
`;

characters = [
  // モグラ
  `
llllll
llllll
llllll
 llll
  ll
  `,
  // 爆弾モグラ
  `
pppppp
pppppp
pppppp
 pppp
  pp
  `
];

options = {
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 16,
  theme: "pixel"
};

let moles;
let nextMoleTicks;
let speedModifier;

function update() {
  if (!ticks) {
    moles = [];
    nextMoleTicks = 0;
    speedModifier = 1;
  }

  // スコアに応じてスピードを増加
  if (score > 0 && score % 50 === 0) {
    speedModifier = 1 + floor(score / 50) * 0.5;
  }

  nextMoleTicks--;
  if (nextMoleTicks < 0) {
    const posX = rnd(10, 90);
    const posY = rnd(10, 90);
    const isBomb = rnd() < 0.1;
    moles.push({ pos: vec(posX, posY), isBomb, hit: false });
    nextMoleTicks = rnd(30, 60) / speedModifier; // スピード修正を適用
  }

  color("black");
  box(input.pos, 5); // ハンマーの表示

  remove(moles, (m) => {
    color(m.isBomb ? "red" : "black");
    const moleChar = char(m.isBomb ? "b" : "a", m.pos);
    if (moleChar.isColliding.rect.black && input.isJustPressed) {
      m.hit = true;
      if (m.isBomb) {
        play("explosion");
        end();
      } else {
        play("coin");
        addScore(10, m.pos);
      }
    }
    return m.hit;
  });

  // モグラの数を表示
  color("black");
  text(`Moles: ${moles.length}/30`, 3, 10);

  // モグラが30匹以上いたらゲームオーバー
  if (moles.length > 30) {
    end();
  }
}
