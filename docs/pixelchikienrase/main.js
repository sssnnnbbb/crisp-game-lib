title = "Pixel Chicken";

description = `
[Click] Start
[Hold] Grow
[Release] Stop
`;

characters = [
  `
 ll
llll
llll
 ll
  `,
];

options = {
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 42,
};

let playerSize;
let targetSize;
let isGrowing;
let score;
let isGameStarted;
let isGameOver;

// BGM用のAudioオブジェクトを作成
let bgm = new Audio('path/to/your-bgm.mp3');  // MP3ファイルのパスを指定
bgm.loop = true;  // BGMをループ再生する

function update() {
  if (!ticks) {
    // 初期設定
    playerSize = 10;  // プレイヤーの初期サイズ
    targetSize = rnd(30, 60);  // ランダムな目標サイズ
    isGrowing = false;
    score = 0;
    isGameStarted = false;  // ゲームがまだ開始されていない状態
    isGameOver = false;     // ゲームオーバーフラグを初期化
    bgm.play();  // ゲームが開始されたらBGMを再生
  }

  // スタート画面でクリックを待つ
  if (!isGameStarted) {
    // 中央揃えでスタート画面を表示
    text("Click", 40, 40);
    text("to", 45, 50);
    text("Start", 35, 60);
    if (input.isJustPressed) {
      isGameStarted = true;  // クリックでゲーム開始
    }
    return;  // ゲームが開始されるまで何もせずに待つ
  }

  // ゲームオーバー時のスコア表示とリスタート処理
  if (isGameOver) {
    // 小さなサイズでゲームオーバー後のスコア表示
    color("black");
    text(`Score ${score}`, 30, 40);  // スコア表示をシンプルにし、画面内に収める
    text("Click", 40, 60);           // Click to Restartの単語ごとに改行
    text("to", 45, 70);
    text("Restart", 35, 80);
    
    if (input.isJustPressed) {
      // クリックでゲームをリスタート
      isGameStarted = false;  // スタート状態に戻す
      isGameOver = false;     // ゲームオーバーフラグをリセット
      playerSize = 10;        // プレイヤーサイズを初期化
      targetSize = rnd(30, 60);  // 新しい目標サイズを設定
      score = 0;              // スコアをリセット
    }
    return;
  }

  // プレイヤーがクリック中に成長
  if (input.isPressed) {
    isGrowing = true;
    playerSize += 0.5;  // プレイヤーキャラクターの成長速度
  } else if (isGrowing) {
    isGrowing = false;
    // スコアを計算
    const sizeDifference = abs(playerSize - targetSize);
    const maxScore = 100;
    score = maxScore - floor(sizeDifference * 2);  // スコアを整数に修正
    if (score < 0) score = 0;
    
    // スコアが表示された後、ゲーム終了に移行
    isGameOver = true;
    return;
  }

  // 目標サイズの描画
  color("light_blue");
  box(50, 50, targetSize);

  // プレイヤーキャラクターの描画
  color("black");
  box(50, 50, playerSize);

  // 現在のスコアを表示
  color("black");
  text(`Score: ${score}`, 3, 10);
}
