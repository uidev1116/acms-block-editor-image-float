# acms-block-editor-image-float

ブロックエディターの画像ブロックに、テキストの**回り込み（フロート）配置**を追加する a-blog cms プラグイン。
CKEditor 5 の「Wrap text: Left / Right aligned image」と同じ操作で、既存の左・中央・右寄せとは別のトグルボタン（左に回り込み / 右に回り込み）として使えます。

- 画像ブロックを選択するとツールバーに 2 つのボタンが出る。押すと画像が寄り、後続の本文が反対側に回り込む。もう一度押すと解除（中央に戻る）。
- 表示幅は変えません。幅 100% の画像は回り込む余地が無く見た目が変わらないので、既存の画像ツールバーで幅を狭めてから使います。
- 保存形式は画像ブロックの `align` 属性（`float-left` / `float-right`）。プラグインを無効にしても保存済み HTML は壊れず、通常の画像として表示される。

設計は [docs/design.md](docs/design.md)、実機確認のスクリーンショットは [docs/screenshots/](docs/screenshots/) にあります。

## 動作環境

- a-blog cms 3.2 系（ブロックエディターのプラグイン拡張基盤 `ACMS.plugins` が必要）
- PHP 8.1 – 8.5

## インストール

1. このリポジトリの `src/` を `ablogcms/extension/plugins/BlockEditorImageFloat/` として配置する（リリースの zip を展開してもよい。バックエンドのリポジトリでは submodule + `npm run setup` がシンボリックリンクを作る）。
2. 管理画面の「拡張アプリ」で **BlockEditorImageFloat** をインストールする（インストールすると有効化される）。

管理画面（エントリー編集を含む）と、公開側でダイレクト編集が有効なときだけ JS / CSS を読み込みます（`Hook::afterBuild()`）。管理画面用の CSS はコアのエディターのルート（`.acms-admin-block-editor`）の内側に限定し、このプラグインが付けるクラス名は `acms-admin-` プレフィックスにします。

## 設定画面（機能のオン / オフ）

管理画面の「拡張アプリ」→ BlockEditorImageFloat の設定（`/admin/app_block_editor_image_float_index/`）で、「回り込みの配置を使う」をオフにして保存すると、そのブログではツールバーのボタンを出さず、JS / CSS も読み込みません（既定はオン）。保存済みの回り込みは通常の画像として表示されます。値はブログのコンフィグ（キー `block_editor_image_float_enabled`、`on` / `off`）に保存します。

## 公開側（フロントエンド）の CSS

保存される HTML は次の形です（`data-width` は画像の表示幅の設定値）。

```html
<div class="media-image-block align-float-left" data-type="imageBlock" data-align="float-left" data-width="50%">
  <figure style="max-width: 50%;">…</figure>
</div>
```

公開側（ヘッドレス配信のフロントエンドなど）には、本プラグインは CSS を出力しません。回り込ませるには、次の CSS を**フロント側の本文 CSS に追加**してください。本文コンテナのセレクター（`.entry-body`）はフロント側に合わせて変更します。600px 未満では回り込みを解除して全幅表示にします。

```css
.entry-body {
  display: flow-root; /* 回り込みがコンテナの外にはみ出さないようにする */
}

[data-type='imageBlock'][data-align^='float-'] > figure {
  margin-block: 0.25em 1em;
}

[data-type='imageBlock'][data-align^='float-'] img {
  max-width: 100%;
  height: auto;
}

[data-type='imageBlock'][data-align='float-left'] > figure {
  float: left;
  margin-inline: 0 1.5em;
}

[data-type='imageBlock'][data-align='float-right'] > figure {
  float: right;
  margin-inline: 1.5em 0;
}

@media (max-width: 599px) {
  [data-type='imageBlock'][data-align^='float-'] > figure {
    float: none;
    max-width: 100% !important; /* figure のインライン max-width を打ち消す */
    margin-inline: 0;
  }
}
```

幅（`max-width`）は `<figure>` のインラインスタイルなので、表示幅が 100% のままだと回り込む余地がなく、見た目は変わりません。

## 開発

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

`src/assets/`（ビルド成果物）は Git に含めません。リリース（`v*` タグの push）時に `release.yml` がビルドし、配布用の zip にだけ含めます。ソースから使う場合（バックエンドの submodule など）は `npm ci && npm run build`（`npm run setup` も同じ）でビルドしてください。

## 既知の制限

- 回り込み中は、コアの「配置」ボタン（左・中央・右寄せ）が未選択の表示（アイコンが空、`aria-label` が `配置: undefined`）になります。操作は可能で、寄せを選ぶと回り込みは解除されます（コア側の表示の都合で、プラグインからは変えられません）。
- 公開側の回り込みは、フロントに CSS を追加するまで反映されません（上記）。

## コア（a-blog cms / @ablogcms/*）更新時の確認事項

本プラグインは画像ブロックの `align` 属性に `float-left` / `float-right` を入れる方式です。コアを更新したら次を確認してください。

- `@ablogcms/*`（`package.json`）をコアと同じ版に上げ、`npm run build` で再ビルドする。
- 保存 → 再読み込みで `data-align="float-left"` と幅が保持されること（コアが `align` の値を `left|center|right` に制限していないか）。
- ツールバー（`blockMenu` の `scope: 'image'`）にボタンが出ること。

## ライセンス

MIT
