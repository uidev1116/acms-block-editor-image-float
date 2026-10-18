# BlockEditorImageFloat 仕様書

a-blog cms のブロックエディターの画像ブロックに、テキストの回り込み（フロート）配置を追加するプラグイン（拡張アプリ）の仕様。

## 1. 概要

CKEditor 5 の画像スタイル「Images wrapped with text」（`float` を使う `alignLeft` / `alignRight`）と同じ**回り込み配置**を、画像ブロックに追加する。既存の「左・中央・右寄せ」（`float` を使わず段落の間に置く配置。CKEditor 5 の「Images placed between the paragraphs」に相当）とは別のボタンにする。

回り込みと既存の寄せは、同じ `align` 属性の別の値なので排他的（同時には使えない）。CKEditor 5 も、画像スタイルは同時に 1 つしか適用できない（公式ドキュメント「Image styles」：複数のスタイル（クラス）を同時に適用することはできない）。

原則：

- a-blog cms コア（`ablogcms/js`、`php` など）は**変更しない**。拡張は公開されている拡張基盤 `ACMS.plugins` 経由で行う。
- Tiptap / ProseMirror / React は**ホスト（コア）と同じインスタンスを使う**。プラグインに同梱すると ProseMirror が二重化し、`instanceof` 判定やスキーマの互換が壊れる。
- 保存される HTML は、プラグインを無効にしても壊れず、ヘッドレス配信のフロントでもそのまま扱える形にする。

## 2. 動作環境

- a-blog cms **3.2.36 以上**（`ACMS.plugins` が必要）。`ServiceProvider::checkRequirements()` で確認し、古いとインストールできない（`Services\Requirements`）。
- PHP 8.1〜8.5（CI でテスト）。PHP 8.6 以降は未テスト。
- 開発時の Node は 24.22.0（`.node-version`。Vite 8 は Node 20.19 以上が必要）。

## 3. 機能仕様

- **F-1** 画像ブロックを選択すると、ツールバーに「左に回り込み」「右に回り込み」の 2 つのトグルボタン（アイコン `format_image_left` / `format_image_right`）が出る。テキストブロック選択時には出ない。
- **F-2** 押すと画像が左（右）に寄り、後続の段落・見出し・リストが反対側に回り込む。エディター上でも保存後の表示でも同じ見た目になる。
- **F-3** 押下中のボタンをもう一度押すと解除され、中央配置（`center`）に戻る。既存の左・中央・右寄せを選ぶとフロートは解除される（排他）。
- **F-4** 表示幅は変えない。幅は既存の画像ツールバー（表示幅）で調整する。幅 100% のままだと回り込む余地がなく、見た目は変わらない。
- **F-9** 回り込みは、画像より後ろの文章が画像の高さを超えるか、見出し（`h2`〜`h6`）が来ると止まる（CSS の `clear: both`）。任意の位置で止めたい場合は、制作者がグループブロックや区切り線（HR）ブロックにクラスを付けて CSS を指定する（README に記載。おすすめは、画像と本文をグループブロックにまとめ、そのグループに `display: flow-root` を指定する方法。次点が、HR などに `clear: both` を指定する方法）。専用のブロックや UI は用意しない。CKEditor 5 でも、回り込みを止める仕組みは公式ドキュメントに記述がなく、統合する側の CSS の責任になっている。
- **F-5** 公開側では、狭い画面（600px 未満）でフロントの CSS が回り込みを解除し、全幅表示にする（CSS は README に掲載）。
- **F-6** プラグインを無効化しても、保存済み HTML は壊れず、通常の画像として表示される。
- **F-7** 設定画面で、機能のオン / オフを切り替えられる（既定はオン）。オフのブログでは JS / CSS を読み込まず、ボタンも出ない。
- **F-8** Undo / Redo で、回り込みの適用・解除が 1 ステップで戻る。キャプション・リンク・拡大表示・メディア差し替えは回り込み中も使える。

## 4. データモデル

コアの画像ブロック（`imageBlock` ノード）の `align` 属性に、`float-left` / `float-right` を入れる。追加の属性やスキーマ変更はない。

- コアの `align` 属性は文字列で、既定値は `center`。値の検証はない。
- 保存 HTML（`renderHTML`）は外側の要素に `class="media-image-block align-${align}"` と `data-align="${align}"` を出力し、`parseHTML` は外側の要素の `data-align` を読み戻す。エディター内の NodeView も同じ属性を付ける。

```html
<div class="media-image-block align-float-left" data-type="imageBlock" data-align="float-left" data-width="50%">
  <figure style="max-width: 50%;">…</figure>
</div>
```

| 検討した案 | 判断 | 理由 |
|---|---|---|
| `align` に `float-*` を入れる | 採用 | コア変更なしで、エディター表示・保存・再読み込みが往復する。既存の左・中央・右寄せと自然に排他になる。無効化時は未知のクラスになるだけで、通常の画像として表示される。 |
| グローバル属性 `float` を追加し、figure の `class` に混ぜる | 不採用 | 再読み込み時に `class` がユーザーのカスタムクラスに混入し、ブロックメニューの class 判定も狂う。 |
| `imageBlock` を `extend` して同名で差し替える | 不採用 | 同名拡張の優先順位に依存し、コア更新で壊れやすい。 |
| 回り込み専用の新ノード | 不採用 | 画像メニュー・メディア差し替えなどコアの機能との統合が切れる。 |

**リスクと対策**：将来コアが `align` の値を `left|center|right` に制限すると動かなくなる。回り込みの判定は `isFloatAlign()` / `floatSideOf()` に集約してある。コア更新後は、保存 → 再読み込みで `data-align="float-left"` が残ることを確認する（README に記載）。コアの画像ブロックの形への依存は `tests/js/core-contract.test.ts` が、インストール済みの `@ablogcms/block-editor` に対して検査する。

## 5. 構成

```text
acms-block-editor-image-float/        GitHub: uidev1116/acms-block-editor-image-float
├── frontend/                        JS / TS・CSS のソース（zip には入らない）
│   ├── index.ts                     register() の入口
│   ├── extension.ts                 createImageFloatExtension(tiptap)
│   ├── i18n.ts                      ja / en リソース
│   └── style.css                    エディター内の CSS
├── src/                             プラグイン本体（extension/plugins/BlockEditorImageFloat/）
│   ├── ServiceProvider.php          メタ情報・環境チェック・設定画面の登録
│   ├── Hook.php                     afterBuild() → AssetRegistrar
│   ├── Services/                    AssetRegistrar / Settings / Requirements
│   ├── template/admin/              設定画面（main.html・topicpath.html）
│   └── assets/                      vite build の出力（Git に含めない）
├── tests/js/                        vitest
├── tests/phpunit/Unit/              PHPUnit
├── scripts/                         zip 作成・バージョン管理（スケルトン由来）
└── .github/workflows/               test.yml・release.yml
```

### 5.1 @ablogcms パッケージの採否

| パッケージ | 採否 | 用途 |
|---|---|---|
| `@ablogcms/plugins` | 実行時 | 入口。`register(name, { setup(ctx) })`。`ctx.blockEditor.registerExtension` / `ctx.i18n` を使う。 |
| `@ablogcms/i18n` | 実行時 | ツールチップの翻訳（`t('block-editor-image-float:wrap.left')`）。 |
| `@ablogcms/block-editor` | 型だけ | `Tiptap` 型（ファクトリ引数）、`BlockMenuToolbarItem`。値は import しない（本体が丸ごと同梱される）。 |
| `@ablogcms/types` | 型だけ | アイコン名（`MaterialSymbol`）などの型。 |
| `@ablogcms/components` ほか | 使わない | ツールバーのボタンはデータだけの宣言（`BlockMenuButtonItem`）で、描画はホストが行う。 |

`@ablogcms/*` は、インストール済みのコアと同じ版に固定する。

### 5.2 読み込みの仕組み

1. PHP の `Hook::afterBuild()` が、管理画面（エントリー編集を含む）と、公開側でダイレクト編集が有効なとき（`Entry::isDirectEditEnabled()`）に、アセット API で JS（`type="module"`）と CSS を登録する。設定でオフのブログでは登録しない。
2. コアの `admin.js` が `ACMS.plugins` を作る。`admin.js` は `async` で読み込まれるため、プラグインの JS が先に実行されることがある。その場合は `ACMS.adminReady`（`admin.js` が `ACMS.plugins` を作った後に発火する管理画面版の `ACMS.Ready`）で待ってから `register()` する。`ACMS.plugins` も `adminReady` も無いページでは何もしない。
3. `setup()` の中で `ctx.blockEditor.registerExtension('imageFloat', factory)` を登録する。**Tiptap の値はファクトリの中（`factory(tiptap)`）でだけ使う**（`setup()` の時点では Tiptap はまだ存在しない）。
4. ブロックエディター本体が読み込まれると、コアがファクトリを呼び、`core.Extension.create` で作った拡張を受け取る。

### 5.3 ビルド

Vite 8 のライブラリモード、出力は IIFE（`src/assets/index.js` と `index.css`）。`react`・`react/jsx-runtime`・`@tiptap/*` は external とし、ホストのグローバル（`ACMS.Library.*`）を参照する（誤って値を import してもバンドルに入らない安全網）。バンドルに react / tiptap / prosemirror の実装は含まれない（目安 5KB 未満）。

`src/assets/` は **Git に含めない**。`release.yml` が `v*` タグでビルドし、配布用 zip にだけ含める（`scripts/package.php` は未ビルドだと失敗する）。ソースから使う場合は `npm run build`（`npm run setup` も同じ）。バックエンドのデプロイがプラグインの `src/` を rsync する場合は、プラグインをビルドする工程か、リリース zip の利用が必要。

### 5.4 CI・リリース

- `test.yml`：`quality`（phpcs・PHPStan・PHPUnit カバレッジ）、`frontend`（typecheck・`npm run test:coverage`・build・出力の存在確認）、`phpunit`（PHP 8.1〜8.5 × a-blog cms 3.2）。集約ジョブ `test` が全部を要求する。
- `release.yml`：`v*` タグで、ビルド → zip 作成 → GitHub Release。タグと `ServiceProvider::$version` の一致を確認する。
- カバレッジは vitest・PHP ともに 90% 以上を目標にする（強制しているのは vitest のしきい値のみ。PHP は `composer coverage` のレポートで確認する）。
- `release.yml` は、タグが master 上のコミットであること、型チェックとテストが通ること、タグ・`ServiceProvider::$version`・`package.json` の `version` が一致することを確認してから zip を作る。
- バージョンは `ServiceProvider::$version` と `package.json` の `version` の 2 か所（JS の `register()` には `package.json` の値を vite の `define` で渡す）。`tests/js/version.test.ts` で一致を検査する。

## 6. 実装仕様

### 6.1 フロント（`frontend/extension.ts`）

- `FLOAT_ALIGN = { left: 'float-left', right: 'float-right' }`、中央の値は `center`（コアの既定値）。
- `floatSideOf(align)` / `isFloatAlign(align)`：回り込みの判定を 1 か所に集約する。
- コマンド（`imageFloat`）：
  - `setImageFloat(side)`：`align` だけを更新する（幅には触らない）。
  - `unsetImageFloat()`：フロート中のときだけ `align` を `center` に戻す（それ以外は何もしない）。
  - `toggleImageFloat(side)`：同じ向きなら解除、そうでなければ適用。
- `addOptions().blockMenu`：`scope: 'image'`、`order` はコアの画像セクション（`-100`）の直後（`-90`・`-89`）。`isActive` で押下状態を反映し、`onSelect` で `toggleImageFloat` を呼ぶ。
- ノードの操作はコアの `setImageBlockAlign` と同じ `updateAttributes('imageBlock', …)` を使う。画像ブロックが選択されていないときは何もしない（`false`）。

### 6.2 PHP

- `ServiceProvider`：`$menu = 'block_editor_image_float_index'`。`init()` で Hook を登録し、設定画面のページ（`ADMIN === 'app_block_editor_image_float_index'`）では `admin-main` / `admin-topicpath` にテンプレートを注入する。
- `Hook::afterBuild(&$res)`：`AssetRegistrar::register(ADMIN, DIR_OFFSET, ダイレクト編集が有効か, 設定がオンか, アセットのディレクトリ)` を呼ぶだけにする。ダイレクト編集の判定と設定の読み込みはクロージャーで渡し、必要なときだけ評価する（管理画面ではダイレクト編集を、ブロックエディターが存在しない公開ページでは設定を読まない）。`assets/index.js` と `index.css` が無いとき（ビルドなしでデプロイされたとき）は何も登録しない。
- `Services\AssetRegistrar`：読み込むかどうかの判定（`shouldRegister`）とパスの組み立て（`basePath`。`'/' . DIR_OFFSET` から始めるとローカルファイルとして扱われ、更新日時のクエリが自動で付く）を行う。アセット API の呼び出しはコンストラクターで差し替えられる（単体テスト用）。ハンドル名は `block-editor-image-float`（CSS は `-style` を付ける）。
- `Services\Settings`：設定キー `block_editor_image_float_enabled`（`on` / `off`。既定オン。明示的な `off` のときだけ無効）。ブログのコンフィグから `Config::loadBlogConfig()` で読む（コンフィグセットを使うブログでは `config()` に見えないため）。
- `Services\Requirements`：最小の a-blog cms バージョン（3.2.36）の判定。

### 6.3 設定画面

拡張アプリの設定画面（`/admin/app_block_editor_image_float_index/`）。コアの設定画面と同じ標準マークアップ（`Admin_Config`、`adminTable`、`<!--T-->`、保存通知・エラー通知のアラート、`acms-admin-form-checkbox`）を使う。「回り込みの配置を使う」のチェックで `block_editor_image_float_enabled` を `on` / `off` として、ブログのコンフィグに保存する。未保存のときもオンとして表示する。

### 6.4 CSS

- エディター用（`frontend/style.css`）：コアのエディターのルート `.acms-admin-block-editor` の内側に限定する。画像ブロックには `.media-image-block` のクラスではなく `[data-type="imageBlock"]` で当てる。**外側のラッパーではなく、内側の `<figure>` を `float` させる**（外側を float させると幅が shrink-to-fit になり、`figure` のインライン `max-width`（%）が効かなくなる）。float させた `<figure>` には `width: 100%` を付け、表示幅はインライン `max-width` で決める（README の公開側 CSS も同じ）。`.ProseMirror` に `display: flow-root` を付け、float が下にはみ出さないようにする。見出し（`h2`〜`h6`）には `clear: both` を付ける。
- このプラグインが独自に付ける管理画面のクラス名は `acms-admin-` プレフィックスにする（現在は独自クラスなし）。
- 公開側用の CSS はプラグインに同梱せず、README に掲載する（フロントエンドの責務）。本文の基準となるクラス `.acms-entry` の内側に限定し、画像ブロックには `[data-type="imageBlock"]` で当てる。本文の基準クラスはテーマによって異なるため、README に「テーマに合わせて読み替える」と明記する。

## 7. 受け入れ条件

- [ ] 画像ブロックを選択するとツールバーに 2 つのボタンが出て、テキストブロック選択時には出ない。
- [ ] 左回り込みを押すと、エディター上で後続の段落が画像の右側に回り込む（右も同様）。
- [ ] 押下状態がボタンに反映され、もう一度押すと中央配置に戻る。
- [ ] 回り込み中に既存の左・中央・右寄せを選ぶとフロートが解除される。逆も同様。
- [ ] 回り込みの適用・解除で表示幅は変わらない。
- [ ] 画像の後ろの見出しは、画像の横に入り込まず、画像の下に回る。
- [ ] 保存 → 再読み込みで `data-align="float-left"` と幅が保持され、表示も同じ。
- [ ] 保存 HTML の figure の `class`（カスタムクラス）に余計なクラスが混ざらない。
- [ ] 画像のキャプション・リンク・拡大表示・メディア差し替えが回り込み状態でも動く。
- [ ] Undo / Redo で回り込みの適用・解除が 1 ステップで戻る。
- [ ] プラグインを無効化しても、エディターでエラーが出ず通常の画像として表示される。
- [ ] 設定画面でオフにして保存すると、エディターにボタンが出ず、JS / CSS が読み込まれない。オンに戻すと復活する。
- [ ] 公開側でダイレクト編集が有効なときも、ボタンが出る。
- [ ] バンドルに react / tiptap / prosemirror の実装が含まれていない。
- [ ] コア更新後は、上記を再確認する（README の確認事項）。
