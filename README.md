# BlockEditorImageFloat

a-blog cms のブロックエディターの画像ブロックに、テキストの回り込み（フロート）配置を追加するプラグイン（拡張アプリ）です。

## 概要

CKEditor 5 の画像スタイル「Images wrapped with text」（`float` で本文を回り込ませる `alignLeft` / `alignRight`）と同じ考え方で、画像を左右に寄せて本文を回り込ませます。
既存の「左・中央・右寄せ」（回り込まずに段落の間に置く配置。CKEditor 5 の「Images placed between the paragraphs」に相当）とは別のボタンとして追加され、コアの変更なしで動作します。

回り込みと既存の寄せは同じ配置（`align`）の別の値なので、**同時には使えません**（どれか 1 つを選びます）。CKEditor 5 も、画像スタイルは同時に 1 つしか適用できない仕様です。

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

[BlockEditorImageFloat.zip（最新版）](https://github.com/uidev1116/acms-block-editor-image-float/releases/latest/download/BlockEditorImageFloat.zip)

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
  width: 100%; /* 表示幅は figure のインライン max-width で決まる（エディターと同じ見た目にする） */
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

/* 見出しの前では回り込みを止める */
.acms-entry :is(h2, h3, h4, h5, h6) {
  clear: both;
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
- 回り込みは、画像より後ろの文章が画像の高さを超えるか、見出し（`h2`〜`h6`）が来ると止まります

### 回り込みを任意の位置で止める

見出し以外の位置で回り込みを止めたいときは、制作者側で用意します。グループブロックや区切り線（HR）ブロックにはクラスを付けられるので、そのクラスに CSS を指定します（クラス名は自由です。フロント側とエディター用の CSS の両方に追加してください）。本プラグインは、回り込みを止めるための専用のブロックや UI は用意しません。

#### 方法 1（おすすめ）: グループブロックに `display: flow-root` を指定する

回り込ませる画像と、その横に回り込ませたい本文を、**グループブロックの中にまとめ**、そのグループにクラスを付けます。グループの中で回り込みが完結するので、グループの外の文章は画像の横に回り込みません。

```css
.float-group {
  display: flow-root; /* グループの中で回り込みを閉じる */
}
```

設定の手順（グループブロックのクラスを、エディターのスタイルとして選べるようにします）：

1. 「管理画面 > コンフィグ > 編集画面 > ブロックエディター設定」の「グループブロック クラス」に、クラス `float-group`（ラベル・説明は自由。例：「回り込みをまとめる」）を追加して保存します
2. エントリー編集画面で、画像ブロックと回り込ませたい段落を範囲選択してグループ化します（画像ブロックはグループの中に入れられます）
3. グループを選択し、ツールバーの「スタイル」から「回り込みをまとめる」を選びます
4. フロント側の CSS（と、必要ならエディター用の CSS）に、上の `.float-group` を追加します

保存される HTML は `<div class="float-group" data-type="group">…</div>` の形です。

- 空の要素や区切り線を入れずに済み、「この画像とこの文章は 1 組」という構造がそのまま HTML に残ります
- `clear: both` のように、グループの外にある他の回り込み（別の画像など）まで巻き込んで止めることがありません
- 画像と本文を、グループの中に入れる手間があります

#### 方法 2: 区切り線（HR）やグループブロックに `clear: both` を指定する

止めたい位置に区切り線（HR）ブロックなどを置いてクラスを付け、そこから後ろの文章を画像の下に回します。

```css
.clear-float {
  clear: both; /* このブロックより後ろは、前の回り込みの下から始まる */
}
```

- 止めたい位置に 1 つ置くだけで済み、画像と本文をまとめ直す必要がありません
- 区切り線ブロックを使うと、区切り線が表示されます（線を出したくない場合は、線を消す CSS を足すか、方法 1 を使います）

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
npm run lint            # ESLint（typescript-eslint + eslint-config-prettier）
npm run format:check   # Prettier（整形は npm run format）
npm run check          # lint + format:check + typecheck + test をまとめて実行
npm test               # vitest
npm run test:coverage  # カバレッジ 90% 以上を要求
npm run build          # src/assets をビルド（コミットしない。.gitignore 済み）
```

`npm ci` で Husky が有効になり、コミット時に lint-staged（変更した `.ts` / `.css` / `.json` へ ESLint と Prettier）が自動で走ります。

PHP は Docker（`docker compose up -d`。ポートは `.env` の `ACMS_PORT`）で実行します。

```bash
docker compose exec acms bash -lc "cd /workspace && composer install && composer check"
docker compose exec acms bash -lc "cd /workspace && ACMS_ROOT=/var/www/html vendor/bin/acms-create-database && composer coverage"
```

### ビルド成果物とリリース

`src/assets/`（ビルド済みの JS / CSS）は Git に含めません。`v*` タグ（master 上のコミットのみ）を push すると `release.yml` が型チェック・テスト・ビルドを行い、配布用の zip にだけ含めます。ビルド成果物が無い（または開発ビルドの `.map` が残っている）と `scripts/package.php` は失敗し、実行時も `assets/index.js` と `index.css` が無ければ JS / CSS を読み込みません。ソースから使う場合（バックエンドの submodule など）は `npm ci && npm run build`（`npm run setup` も同じ）でビルドしてください。

### コア（a-blog cms / @ablogcms/*）更新時の確認事項

本プラグインは画像ブロックの `align` 属性に `float-left` / `float-right` を入れる方式です。コアを更新したら次を確認してください。

- `@ablogcms/*`（`package.json`）をコアと同じ版に上げ、`npm run build` で再ビルドする
- 保存 → 再読み込みで `data-align="float-left"` と幅が保持されること（コアが `align` の値を `left|center|right` に制限していないか）
- ツールバー（`blockMenu` の `scope: 'image'`）にボタンが出ること
- `npm test` が通ること（`tests/js/core-contract.test.ts` が、インストール済みの `@ablogcms/block-editor` の画像ブロックの形（`align` 属性、`data-align`、`data-type="imageBlock"` と直下の `<figure>`、`scope: 'image'` の順序など）を検査します。落ちたら CSS・拡張の追従が必要です）

### バージョン

プラグインのバージョンは `src/ServiceProvider.php` の `$version` と `package.json` の `version` を同じ値にします（JS の `register()` には `package.json` の値が渡されます）。`tests/js/version.test.ts` が CI で一致を検査し、`release.yml` もタグとの一致を確認します。

## ライセンス

MIT License
