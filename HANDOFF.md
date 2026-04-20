# Handoff — crisp-game-lib × 音楽連動ワンクリック作品

このドキュメントは **Claude Code に引き継ぐための前提情報** です。
リポジトリ: `sssnnnbbb/crisp-game-lib`（`abagames/crisp-game-lib` v1.4.0 フォーク）
ローカルパス想定: `E:\GitHub\crisp-game-lib`

---

## 0. TL;DR — 今やること

1. `music.js` を `docs/lockon/music.js` として配置
2. `docs/_template` を `docs/lockon` にコピーし、`index.html` に `<script src="music.js"></script>` を追加
3. `docs/lockon/main.js` に **Lock-On Chain** を実装（本書 §5 参照）
4. `npm install && npm run watch_games` → `http://localhost:4000?lockon` で動作確認
5. 遊べる最小状態を作ったら、Bedの4インテンシティ遷移とビート発光を詰める

---

## 1. プロジェクトの狙い

**短期スパンでワンクリックゲーム＋自作音楽を量産する。** 最終目標は REZ のような、入力自体が演奏になり視覚と聴覚が同期するシナスタジア作品。第1作は「Lock-On Chain」。

### 美学・指針
- 音楽的瞬間は **プレイヤー操作から生まれる**（背景で鳴っているBGMに操作音を乗せるだけ、ではない）
- **視覚・音・触覚の三位一体**：ヒット時は同一フレームで音・フラッシュ・`navigator.vibrate` を発火
- 不協和音は即座に分かるように：ミスやコンボ切れで **Bed を薄くする／1段階下げる**（報酬の逆再生）
- crisp-game-lib らしいミニマル・ピクセル美を壊さない

---

## 2. 現状スナップショット

- リポジトリは `abagames/crisp-game-lib` v1.4.0 のフォーク。TypeScript 99.7%。
- **`CLAUDE.md` / `AGENTS.md` / `.agents/skills/developing-with-crisp-game-lib/`** が既に存在 → Claude Code 等のコーディングエージェントが自動で取り込む。crisp-game-lib API の使い方はそちらを参照。本書はそれに**重ねる**プロジェクト固有情報。
- 既存サンプルゲームは `docs/` 配下に多数（`pakupaku`, `timbertest`, `boxsnake`, `thunder` など）。新規ゲームもここに `docs/[name]/` として追加する。
- ビルド系: `npm run watch_games` でローカルサーバ＋ライブリロード。公開は `docs/` をそのまま Web に置くだけ。

---

## 3. 音声アーキテクチャ

3レイヤー構成。Web Audio 直を選択済み（REZ志向のため）。

```
┌────────────────────────────────────────────────────┐
│ Bed          │ sss.playMml() による MML ループ BGM │
│ (背景)       │ music.startBed(0..3) で強度切替    │
├────────────────────────────────────────────────────┤
│ Interactive  │ music.playNote / playChord / Arpeggio │
│ (操作音)     │ → AudioContext 直 (OscillatorNode)   │
├────────────────────────────────────────────────────┤
│ Reactive     │ コンボ・チェーン数・残機で           │
│ (反応層)     │ music.setBedIntensity() 呼び出し     │
└────────────────────────────────────────────────────┘
```

### なぜ sss だけに任せないか
- `sss.playSoundEffect()` は jsfx プリセット（Coin/Laser/Hit…）のみで音程制御ができない
- `sss.playMml()` は「再生を開始する」単位。クリック毎の即時インタラクティブ演奏には粒度が粗い
- Web Audio で薄い自前シンセを数十行足すだけで、スケール内のN番目の音を即時発火できる
- sss と独自 AudioContext は共存可能（互いに独立したグラフ）

### AudioContext とユーザジェスチャ
crisp-game-lib のタイトル画面から1クリックで本編が始まるため、その瞬間に `music.ensureCtx()` が呼ばれれば autoplay policy は解消される。`music.js` は **遅延初期化**で対応済み — 最初の `playNote` / `startBed` 呼び出しで自動生成・resume する。

---

## 4. `music.js` API チートシート

全メソッドは `window.music` に生える（グローバル）。

### セットアップ
```js
music.init({
  bpm: 120,                          // テンポ
  rootMidi: 60,                      // C4 を根音に
  scale: music.SCALES.minor,         // minor / major / pentMinor / ... 等
  bedPatterns: music.BED_PRESETS.minimal,  // Bedプリセット（4段階）
});
```

### Bed（BGM）
```js
music.startBed(0);                   // インテンシティ0で開始
music.setBedIntensity(2);            // 切替（同値なら no-op）
music.stopBed();                     // ゲームオーバー時
```

### インタラクティブ演奏
```js
music.playNote(0);                                    // 今すぐ、スケール0度（=根音）
music.playNote(3, { octave: 1, waveform: 'sawtooth' });
music.playNote(5, { quantize: true, quantizeDiv: 4 }); // 次の16分頭にクオンタイズ
music.playChord(0, 'triad', { octave: 1 });           // Cm のトライアド
music.playChord(0, 'add9');
music.playArpeggio([0, 2, 4, 6], { stepSec: 0.08 });   // 順次アルペジオ（Lock-On発射用）
music.playArpeggio([0, 2, 4, 6], {
  quantize: true, stepSec: 0.125,                     // クオンタイズ＆8分刻み
  waveform: 'square', volume: 0.18,
});
```

オプション: `octave`, `duration`（未使用、AR長は attack+release）, `waveform`（'sine'|'square'|'sawtooth'|'triangle'）, `volume`, `detune`, `attack`, `release`, `quantize`, `quantizeDiv`。

### 視覚・触覚同期ヘルパ
```js
music.tick();                        // 毎フレーム必須（update内で呼ぶ）
music.isOnBeatFrame();               // そのフレームが拍頭か
music.getBeatPhase();                // 0.0〜1.0 の拍内位相
music.getBarPhase(4);                // 4拍1小節のうちの位相
music.onBeat((beatIndex) => { /* 拍頭コールバック */ });
music.vibrate(10);                   // モバイルのみ動作
```

### スケール・コード定数
`SCALES`: `minor, major, pentMinor, pentMajor, dorian, phrygian, lydian, mixolydian, blues, wholeTone, chromatic`
`CHORDS`: `triad, seventh, sus2, sus4, add9, power`

### `scaleIndex` のオクターブ跨ぎ
スケール長を超えた値を渡すと自動でオクターブ繰り上げ。例（minor, 7音）:
- `playNote(0)`  → C4
- `playNote(7)`  → C5（自動で +12 半音）
- `playNote(14)` → C6
- `playNote(-1)` → B3

---

## 5. Lock-On Chain 仕様

### コアメカニクス
- 自機は画面下部中央に固定（アイコン: 小さな三角形）
- 敵（小さな矩形）が画面上から降ってくる。速度は`0.3〜0.8`程度、出現位置はランダムX
- **クリック保持中**: 自機からマウス／タッチ方向に「照準ビーム」が伸びる（線で可視化）。ビームに重なった敵を順次ロックオン（最大4体）。ロックオン済み敵は色を変え、小さなマーカーで番号を表示
- **クリック離す**: ロック済み全敵に自機から誘導弾が飛び、順にヒット。**ヒット毎にスケール度 `i*2` のノートが発射**（0→2→4→6 のアルペジオ＝Cm の iv 和音スケール上昇）
- ロックなしで離した場合は不発（無音 or 低音1音）
- ミスして敵が地面（画面下）に到達 → 残機-1、Bed インテンシティ-1

### 音楽マッピング
| イベント | 音 |
|---|---|
| ゲーム開始 | `music.startBed(1)` |
| ロックオン成立（1体目〜4体目） | `playNote(i*2, { octave: 0, waveform: 'sine', volume: 0.08 })` — 予感音 |
| 発射（離した瞬間） | `playArpeggio([0,2,4,6].slice(0, chain.length), { quantize: true, stepSec: 0.08, octave: 1, volume: 0.18 })` |
| 敵ヒット | 各ノート発火時に `music.vibrate(8)` ＋ 画面フラッシュ1フレーム |
| コンボ達成（連続成功4回） | `music.setBedIntensity(2)`, サクセス和音 `playChord(0, 'add9', { octave: 1 })` |
| 次段階（連続成功8回） | `music.setBedIntensity(3)` |
| 敵着地（ミス） | `playNote(-1, { waveform: 'sawtooth', volume: 0.1, octave: -1 })` ＋ `setBedIntensity(Math.max(0, currentIntensity-1))` |
| ゲームオーバー | `music.stopBed()` ＋ 終了SFX |

### 視覚同期
- 毎フレーム `music.tick()`
- `music.isOnBeatFrame()` のとき全画面に `color("light_black"); rect(0,0,100,100);` でうっすらフラッシュ
- 照準ビームの太さを `1 + music.getBeatPhase() * 0.5` で呼吸させる（REZの"生きてる感"）
- 敵の出現タイミングを拍頭に揃える（`onBeat(beatIdx => { if (beatIdx % 2 === 0) spawnEnemy(); })`）

### 難易度カーブ
- 0〜20秒: 敵速度 0.3、出現頻度 2拍毎
- 20〜60秒: 敵速度 0.5、出現頻度 1拍毎
- 60秒〜: 敵速度 0.8、出現頻度 0.5拍毎、2体同時出現あり

### 数値 / パラメータ（チューニング用・一箇所に集約）
```js
const CONFIG = {
  MAX_CHAIN: 4,
  BEAM_RANGE: 60,       // 照準ビーム到達距離
  ENEMY_SPEEDS: [0.3, 0.5, 0.8],
  SPAWN_INTERVAL_BEATS: [2, 1, 0.5],
  COMBO_TO_L2: 4,
  COMBO_TO_L3: 8,
  PLAYER_Y: 80,
};
```

### 実装アウトライン（擬似コード）
```js
title = "LOCK ON";
description = "HOLD to aim\nRELEASE to fire";
options = { theme: "simple", isPlayingBgm: false }; // Bed は music.js 経由で鳴らす

let enemies;
let chain;      // [{enemy, lockedAtTick}]
let combo;
let intensity;

function init() {
  music.init({ bpm: 120, rootMidi: 60,
               scale: music.SCALES.minor,
               bedPatterns: music.BED_PRESETS.minimal });
  music.onBeat(onBeatTick);
  enemies = []; chain = []; combo = 0; intensity = 1;
}

update = () => {
  if (!ticks) { init(); music.startBed(intensity); }
  music.tick();

  // ビート発光
  if (music.isOnBeatFrame()) { color("light_black"); rect(0,0,100,100); }

  // プレイヤー描画
  color("white"); char("a", 50, CONFIG.PLAYER_Y);

  // 敵更新 & 描画
  updateEnemies();

  // 入力
  if (input.isPressed) handleAim();
  if (input.isJustReleased) fireChain();

  // 照準ビーム描画（入力中）
  if (input.isPressed) drawBeam();
};

function onBeatTick(beatIdx) {
  const tier = Math.min(2, Math.floor(ticks / 60 / 20)); // 20秒毎に階層アップ
  const every = CONFIG.SPAWN_INTERVAL_BEATS[tier];
  if (beatIdx % every === 0) spawnEnemy(tier);
}

function fireChain() {
  if (chain.length === 0) {
    music.playNote(-1, { volume: 0.08, waveform: 'triangle' });
    return;
  }
  music.playArpeggio(
    chain.map((_, i) => i * 2),
    { quantize: true, stepSec: 0.08, octave: 1, volume: 0.18 }
  );
  chain.forEach((c, i) => {
    setTimeout(() => {
      c.enemy.dead = true;
      music.vibrate(8);
      particle(c.enemy.x, c.enemy.y, 6, 2, 0, Math.PI * 2);
      addScore(10, c.enemy.x, c.enemy.y);
    }, i * 80);
  });
  combo++;
  if (combo === CONFIG.COMBO_TO_L2) { intensity = 2; music.setBedIntensity(2); }
  if (combo === CONFIG.COMBO_TO_L3) { intensity = 3; music.setBedIntensity(3); }
  chain = [];
}
```

### エッジケース
- クリック中に画面外にカーソルが出た: `input.pos` が画面外になる可能性。`input.pos.x/y` はそのまま使える
- ロックオン済み敵がすでに倒されている: 発射前にフィルタリング
- 同一敵を何度もロックオン: `chain.some(c => c.enemy === e)` でスキップ
- BPM変更したい場合: 現状 `music.init` 時のみ。ランタイム変更は未対応（必要なら追加実装）

---

## 6. ファイルレイアウト（このタスク後の想定）

```
crisp-game-lib/
├ .agents/skills/developing-with-crisp-game-lib/   (既存)
├ CLAUDE.md                                         (既存・エージェント向け)
├ AGENTS.md                                         (既存)
├ crisp-game-lib-guide.md                           (既存)
├ HANDOFF.md                                        ← 本書（新規）
└ docs/
   ├ _template/                                     (既存)
   └ lockon/                                        ← 新規
      ├ index.html                                  (from _template, +music.js script)
      ├ main.js                                     (Lock-On Chain 本体)
      └ music.js                                    (共通音楽エンジン)
```

**量産フェーズに入ったら** `docs/_shared/music.js` に昇格させ、各ゲームの `index.html` から `<script src="../_shared/music.js"></script>` で参照する方針。それまでは co-located。

---

## 7. 開発コマンド

```bash
# 依存インストール（初回）
npm install

# 開発サーバ（ライブリロード）
npm run watch_games

# ブラウザで
# http://localhost:4000?lockon
```

テスト:
```bash
npm test        # Vitest
```

---

## 8. crisp-game-lib の癖・gotcha

（`.agents/skills/` に既に詳細があるはずだが、本プロジェクトで踏みがちなポイントのみ抜粋）

- `color("transparent")` で描画すると**当たり判定だけ取れる**（見えない弾・ヒットボックス）
- 当たり判定は**描画履歴ベース**。背景色で上書きしても判定は消えない
- `sss` の乱数シードは `title` と `description` 文字列から生成される。SFXを安定させたいなら `title`/`description` を最初に決めて、以降変更しない
- モバイル性能: `theme: "pixel"` / `"shape"` / `"crt"` は pixi.js 由来の post-effect で重い。`simple` か `dark` 推奨
- bar/line/arc は多数の矩形の合成なので**当たり判定負荷が大きい**。多用しない
- ワンボタン前提の入力推奨: `input.isJustPressed` / `input.isPressed` / `input.isJustReleased` / `input.pos`
- `update` 内の例外は crisp-game-lib が catch しないことがある → コンソールで確認

---

## 9. やってはいけないこと（music.js 固有）

- `music.tick()` を `update` 内で**呼び忘れる** → `isOnBeatFrame()` が常に false。`onBeat` コールバックも発火しない
- `music.isOnBeatFrame()` を**同フレーム内で複数回**呼ぶ → 最初のみ true、以降 false（内部フラグは `tick` でリセット）**ではなく、tickで再セットされる**ので実際は同フレーム内で何度呼んでもOK。ただしフラグの寿命は次の tick まで、と理解しておくのが安全
- 大量の `playNote` を同時発火（>20 同時）→ クリッピング。バースト時は volume を抑えるか `master.gain` を下げる
- `sss.playMml` を直接呼んで Bed を上書き → `music.setBedIntensity` 経由にする（状態管理が食い違う）

---

## 10. 次のステップ（Lock-On Chain 完成後）

1. **Lock-On Chain をブラッシュアップ**：BedプリセットをMML生成ツールで置き換え、音色を揃える
2. **`docs/_shared/music.js` に昇格**（量産フェーズ移行）
3. **2本目候補**: Pulse Shooter（縦STG・同エンジン流用で2日目安）
4. **3本目候補**: Wave Painter（抽象・音色進化演出の実験）
5. BPM可変・スケール動的切替など `music.js` 拡張タスクを Issue 化

---

## 11. このハンドオフをClaude Codeで使う際のメモ

このドキュメントと `music.js` をリポジトリにコミットすれば、Claude Code セッションで以下のように投げればOK:

> `HANDOFF.md` を読んで、§5 の仕様に沿って `docs/lockon/` に Lock-On Chain を実装してください。`music.js` は既に配置済みです。

`.agents/skills/` と `CLAUDE.md` が効くので crisp-game-lib 固有の API 知識は自動で補完されます。本書は**プロジェクト側の意図**（音楽連動・美学・仕様）の伝達に特化しています。
