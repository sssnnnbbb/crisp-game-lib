title = "HUNGRY MONSTER";
description = `
[Tap] Open mouth
`;

characters = [
  // モンスターのキャラクター
  `
  ll
 llll
llllll
llllll
ll  ll
  `,
  // 食べ物のキャラクター
  `
  yy
 yyy
yyyyy
yyyyy
  `,
  // ボーナスアイテムのキャラクター
  `
  rr
 rrr
rrrrr
rrrrr
  `,
  // 爆弾のキャラクター
  `
  pp
 ppp
ppppp
ppppp
  `
];

options = {
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 16
};

// ゲーム内の変数を初期化
let monster;
let foods;
let bonusItems;
let bomb;

function update() {
  if (!ticks) {
    // ゲーム開始時の初期化
    monster = { pos: vec(50, 50), isOpen: false };
    foods = [];
    bonusItems = [];
    bomb = [];
  }


  // モンスターの操作
  monster.isOpen = input.isPressed;
  color("black");
  char("a", monster.pos, { mirror: { x: monster.isOpen ? -1 : 1 } });

  // 食べ物の生成と移動
  if (ticks % 60 === 0) {
    const posX = rnd(0, 100);
    const posY = rnd(0, 100);
    // 食べ物の速度を遅くする
    foods.push({ pos: vec(posX, posY), speed: rnd(0.5, 1) });
  }
  foods.forEach((f) => {
    f.pos.x += f.speed;
    color("yellow");
    const collision = char("b", f.pos).isColliding.char.a;
    if (collision && monster.isOpen) {
      addScore(10, f.pos);
      play("coin");
      return true;
    }
    return f.pos.x > 100 || f.pos.x < 0;
  });
  foods = foods.filter((f) => !f);

  // ボーナスアイテムの生成と移動
  if (ticks % 150 === 0) {
    const posX = rnd(0, 100);
    const posY = rnd(0, 100);
    // ボーナスアイテムの速度を遅くする
    bonusItems.push({ pos: vec(posX, posY), speed: rnd(1, 1.5) });
  }
  bonusItems.forEach((b) => {
    b.pos.x += b.speed;
    color("red");
    const collision = char("c", b.pos).isColliding.char.a;
    if (collision && monster.isOpen) {
      addScore(50, b.pos);
      play("powerUp");
      return true;
    }
    return b.pos.x > 100 || b.pos.x < 0;
  });
  bonusItems = bonusItems.filter((b) => !b);

  // 爆弾の生成と移動
  if (ticks % 200 === 0) {
    const posX = rnd(0, 100);
    const posY = rnd(0, 100);
    // 爆弾の速度を遅くする
    bomb.push({ pos: vec(posX, posY), speed: rnd(0.5, 1) });
  }
  bomb.forEach((b) => {
    b.pos.x += b.speed;
    color("purple");
    const collision = char("d", b.pos).isColliding.char.a;
    if (collision) {
      play("explosion");
      end();
      return true;
    }
    return b.pos.x > 100 || b.pos.x < 0;
  });
  bomb = bomb.filter((b) => !b);
}
