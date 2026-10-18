# acms-block-editor-image-float

ブロックエディターの画像ブロックに、テキストの**回り込み（フロート）配置**を追加する a-blog cms プラグイン。
CKEditor 5 の「Wrap text: Left / Right aligned image」と同じ操作で、既存の左・中央・右寄せとは別のトグルボタン（左に回り込み / 右に回り込み）として使えます。

- 画像ブロックを選択するとツールバーに 2 つのボタンが出る。押すと画像が寄り、後続の本文が反対側に回り込む。もう一度押すと解除（中央に戻る）。
- 表示幅が 100%（未設定）の画像に適用すると、表示幅を 50% にする（すでに 30% などの場合は変えない）。
- 保存形式は画像ブロックの `align` 属性（`float-left` / `float-right`）。プラグインを無効にしても保存済み HTML は壊れず、通常の画像として表示される。

設計は [docs/design.md](docs/design.md)、実機確認のスクリーンショットは [docs/screenshots/](docs/screenshots/) にあります。

## 動作環境

- a-blog cms 3.2 系（ブロックエディターのプラグイン拡張基盤 `ACMS.plugins` が必要）
- PHP 8.1 – 8.5

## インストール

1. このリポジトリの `src/` を `ablogcms/extension/plugins/BlockEditorImageFloat/` として配置する（リリースの zip を展開してもよい。バックエンドのリポジトリでは submodule + `npm run setup` がシンボリックリンクを作る）。
2. 管理画面の「拡張アプリ」で **BlockEditorImageFloat** をインストールする（インストールすると有効化される）。

管理画面（エントリー編集を含む）でだけ JS / CSS を読み込みます（`Hook::afterBuild()`）。

## 公開側（フロントエンド）の CSS

保存される HTML は `<div class="media-image-block align-float-left" data-align="float-left" data-width="50%"><figure style="max-width: 50%;">…</figure></div>` です。
公開側でも回り込ませるには、[public-css/image-float.css](public-css/image-float.css) の内容を**フロント側の本文 CSS に追加**してください（ヘッドレス配信の場合はフロントのリポジトリ。本プラグインは公開側に CSS を出力しません）。
本文コンテナのセレクター（`.entry-body`）はフロント側に合わせて変更してください。600px 未満では回り込みを解除して全幅表示にします。

## 設定

`ctx.config.defaultWidth`（文字列。例 `'40%'`）で、回り込み適用時の既定の表示幅を変えられます。未設定なら `50%`（PHP から `ACMS.Config` に値を渡す方法は未実装のため、現状は既定値で動作します）。

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
