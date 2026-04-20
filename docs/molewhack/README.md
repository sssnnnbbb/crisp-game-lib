# MOLE WHACK

サンプルゲーム「MOLE WHACK」は [crisp-game-lib](https://github.com/abagames/crisp-game-lib) を用いて作成されたシンプルなモグラたたきゲームです。

## 遊び方
- 画面をタップ/クリックしてハンマーを振り、モグラを叩きます。
- 爆弾モグラを叩くと即ゲームオーバーになります。
- モグラを叩くと10点獲得し、50点ごとにモグラの出現速度が上昇します。
- 画面上にモグラが30匹を超えるとゲームオーバーになります。

## 起動方法
1. ローカルで開発する場合
   ```bash
   npm run watch_games
   ```
   ブラウザで `http://localhost:3000/?molewhack` を開いてください。
2. GitHub Pages 版は以下でプレイできます。
   https://sssnnnbbb.github.io/cglgame/?molewhack

## ファイル構成
- `main.js`: ゲーム本体のスクリプト。
- `jsconfig.json`: エディタ向け設定。
