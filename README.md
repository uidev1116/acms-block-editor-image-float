# BlockEditorImageFloat

a-blog cms のブロックエディターの画像ブロックに、テキストの回り込み（フロート）配置を追加するプラグイン（拡張アプリ）です。

## 概要

CKEditor 5 の「Wrap text: Left / Right aligned image」と同じ操作で、画像を左右に寄せて本文を回り込ませます。
既存の「左・中央・右寄せ」（回り込まずに段落を分ける配置）とは別のボタンとして追加され、コアの変更なしで動作します。

## 主要機能

- **回り込みボタン**: 画像ブロックを選択するとツールバーに「左に回り込み」「右に回り込み」が表示されます
- **トグル操作**: 1 クリックで適用し、もう一度押すと解除（中央配置に戻る）します
- **既存の配置と排他**: 左・中央・右寄せを選ぶと回り込みは解除されます（逆も同様）
- **表示幅は変更しない**: 幅は既存の画像ツールバー（表示幅）で調整します
- **機能のオン / オフ**: プラグインの設定画面で、回り込みの配置を使うかどうかを切り替えられます
- **無効化しても壊れない**: 保存済みの HTML は、プラグインを無効にしても通常の画像として表示されます

## 動作環境

- **a-blog cms**: >= Ver.3.2.36（ブロックエディターのプラグイン拡張基盤 `ACMS.plugins` が必要。`@ablogcms/*` 3.2.37 で開発）。この版より古い場合、インストール時の環境チェックで弾かれます
- **PHP**: >= 8.1、8.5 まで（8.1〜8.5 でテスト済み。**PHP 8.6 以降は未テスト**です）

## ダウンロード

[BlockEditorImageFloat](https://github.com/uidev1116/acms-block-editor-image-float/releases/latest)

## インストール方法

プラグイン（拡張アプリ）をダウンロード後、zip ファイルを解凍して `extension/plugins/` に設置します。

設置が完了すると、「管理画面 > 拡張アプリ」に `BlockEditorImageFloat` という名前で本プラグイン（拡張アプリ）が表示されるので、インストールをクリックしインストールします。

## 使用方法

### 1. 画像に回り込みを設定する

1. エントリー編集画面で、ブロックエディターの画像ブロックをクリックして選択します
2. ツールバーの「左に回り込み」または「右に回り込み」をクリックします
3. 画像が左（右）に寄り、後続の段落・見出し・リストが反対側に回り込みます
4. もう一度同じボタンを押すと解除されます

⚠️ **注意**: 表示幅が 100% の画像は、回り込む余地がないため見た目が変わりません。ツールバーの表示幅で画像を狭めてから使ってください。

### 2. 機能のオン / オフを切り替える

「管理画面 > 拡張アプリ > BlockEditorImageFloat」の設定画面（`/admin/app_block_editor_image_float_index/`）で、「回り込みの配置を使う」のチェックを外して保存すると、そのブログではツールバーのボタンを表示せず、JS / CSS も読み込みません（既定はオン）。

## 挙動

- 回り込みは、画像ブロックの `align` 属性に `float-left` / `float-right` として保存されます
- 保存 → 再読み込みしても回り込みと表示幅は保持されます
- Undo / Redo で回り込みの適用・解除を 1 ステップで戻せます
- キャプション・リンク・拡大表示（Lightbox）・メディアの差し替えは、回り込み中も使えます
- 管理画面（エントリー編集画面を含む）と、公開側でダイレクト編集が有効なときだけ JS / CSS を読み込みます
- 設定画面の値はブログのコンフィグ（キー `block_editor_image_float_enabled`、`on` / `off`）に保存されます

### 保存される HTML

```html
<div class="media-image-block align-float-left" data-type="imageBlock" data-align="float-left" data-width="50%">
  <figure style="max-width: 50%;">…</figure>
</div>
```

`data-width` は画像の表示幅の設定値です。

## Tips

### 公開側（フロントエンド）でも回り込ませる

本プラグインは公開側に CSS を出力しません。ヘッドレス配信のフロントエンドなど、公開側でも回り込ませるには、次の CSS を**フロント側の本文 CSS に追加**してください。

画像ブロックへのスタイルは、本文の基準となるクラス `.acms-entry` の内側に限定し、`[data-type='imageBlock']` に当てています。

```css
.acms-entry {
  display: flow-root; /* 回り込みが本文コンテナの外にはみ出さないようにする */
}

.acms-entry [data-type='imageBlock'][data-align^='float-'] > figure {
  margin-block: 0.25em 1em;
}

.acms-entry [data-type='imageBlock'][data-align^='float-'] img {
  max-width: 100%;
  height: auto;
}

.acms-entry [data-type='imageBlock'][data-align='float-left'] > figure {
  float: left;
  margin-inline: 0 1.5em;
}

.acms-entry [data-type='imageBlock'][data-align='float-right'] > figure {
  float: right;
  margin-inline: 1.5em 0;
}

@media (max-width: 599px) {
  .acms-entry [data-type='imageBlock'][data-align^='float-'] > figure {
    float: none;
    max-width: 100% !important; /* figure のインライン max-width を打ち消す */
    margin-inline: 0;
  }
}
```

- `.acms-entry` は本文の基準となるクラスです。**どのクラスが本文の基準になるかは、テーマ（フロント）によって異なる**ので、自分のテーマの本文コンテナのクラス名に読み替えてください
- 600px 未満では回り込みを解除して全幅表示にします
- 幅（`max-width`）は `<figure>` のインラインスタイルのため、狭い画面で全幅に戻すには `!important` が必要です

### 管理画面のスタイルについて

管理画面（エディター内）の CSS は、コアのエディターのルート（`.acms-admin-block-editor`）の内側に限定しています。このプラグインが付けるクラス名は `acms-admin-` プレフィックスにします。

## トラブルシューティング

### よくある問題

**Q: ツールバーに「左に回り込み」「右に回り込み」が表示されない**
- 画像ブロックを選択しているか確認（テキストブロックでは表示されません）
- 「拡張アプリ」でプラグインがインストール・有効化されているか確認
- 設定画面で「回り込みの配置を使う」がオンになっているか確認
- ブラウザのコンソールにエラーが出ていないか確認

**Q: ボタンを押しても画像の見た目が変わらない**
- 表示幅が 100% の画像は回り込む余地がありません。ツールバーの表示幅で狭めてください

**Q: 管理画面では回り込むが、公開側のページでは回り込まない**
- 公開側のフロントに、上記「公開側（フロントエンド）でも回り込ませる」の CSS を追加してください

**Q: 回り込み中、ツールバーの「配置」ボタンのアイコンが空になる**
- コア側の表示の都合です（`align` の値が `float-left` / `float-right` のため）。操作は可能で、左・中央・右寄せを選ぶと回り込みは解除されます

## 開発者向け情報

### ドキュメント

- [仕様書](docs/specification.md)

### 開発

```bash
npm ci
npm run dev            # vite build --watch（src/assets に出力）
npm run typecheck
npm test               # vitest
npm run test:coverage  # カバレッジ 90% 以上を要求
npm run build          # src/assets をビルド（コミットしない。.gitignore 済み）
```

PHP は Docker（`docker compose up -d`。ポートは `.env` の `ACMS_PORT`）で実行します。

```bash
docker compose exec acms bash -lc "cd /workspace && composer install && composer check"
docker compose exec acms bash -lc "cd /workspace && ACMS_ROOT=/var/www/html vendor/bin/acms-create-database && composer coverage"
```

### ビルド成果物とリリース

`src/assets/`（ビルド済みの JS / CSS）は Git に含めません。`v*` タグを push すると `release.yml` がビルドし、配布用の zip にだけ含めます。ソースから使う場合（バックエンドの submodule など）は `npm ci && npm run build`（`npm run setup` も同じ）でビルドしてください。

### コア（a-blog cms / @ablogcms/*）更新時の確認事項

本プラグインは画像ブロックの `align` 属性に `float-left` / `float-right` を入れる方式です。コアを更新したら次を確認してください。

- `@ablogcms/*`（`package.json`）をコアと同じ版に上げ、`npm run build` で再ビルドする
- 保存 → 再読み込みで `data-align="float-left"` と幅が保持されること（コアが `align` の値を `left|center|right` に制限していないか）
- ツールバー（`blockMenu` の `scope: 'image'`）にボタンが出ること

## ライセンス

MIT License
