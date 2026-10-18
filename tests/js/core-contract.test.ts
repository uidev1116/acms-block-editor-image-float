import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// このプラグインが依存しているコア（@ablogcms/block-editor）の非公開な形が、インストール済みの版にあるか確認する。
// コアを更新して画像ブロックの実装が変わると、ここが先に落ちる（README「コア更新時の確認事項」の機械化できる部分）。
const dist = join(__dirname, '../../node_modules/@ablogcms/block-editor/dist');
const core = readdirSync(dist)
  .filter((f) => f.endsWith('.mjs'))
  .map((f) => readFileSync(join(dist, f), 'utf8'))
  .join('\n');
const style = readFileSync(join(__dirname, '../../frontend/style.css'), 'utf8');

describe('core imageBlock contract', () => {
  it('imageBlock node keeps the align attribute with the default "center"', () => {
    expect(core).toMatch(/align:\s*\{\s*default:\s*"center"/);
  });

  it('align is rendered and restored through data-align', () => {
    expect(core).toContain('"data-align": attributes.align');
    expect(core).toContain('parent?.getAttribute("data-align")');
  });

  it('the node view root has data-type="imageBlock" and a direct <figure> child', () => {
    expect(core).toMatch(/"data-type": "imageBlock",\s*"data-align": align \|\| "left"/);
    expect(core).toMatch(/children: \/\* @__PURE__ \*\/ jsxs?\d*\(\s*"figure"/);
  });

  it('the core aligns images with updateAttributes("imageBlock", { align }) and has no align whitelist', () => {
    expect(core).toContain('commands.updateAttributes("imageBlock", { align })');
    expect(core).not.toMatch(/align:\s*\{[^}]*(isRequired|validate)/);
  });

  it('the image block menu section is declared with scope "image" and order -100', () => {
    expect(core).toMatch(/CORE_BLOCK_MENU_SECTION_ORDER\s*=\s*-100/);
    expect(core).toMatch(/scope:\s*"image",\s*order:\s*CORE_BLOCK_MENU_SECTION_ORDER/);
  });

  it('the editor root class used by the stylesheet exists in the core', () => {
    expect(style).toContain('.acms-admin-block-editor');
    expect(core).toContain('acms-admin-block-editor');
  });
});
