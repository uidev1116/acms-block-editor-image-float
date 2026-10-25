import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const style = readFileSync(join(__dirname, '../../frontend/style.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

describe('editor stylesheet', () => {
  it('does not stop the wrap on headings (no clear on non-image elements)', () => {
    expect(style).not.toMatch(/clear\s*:/);
    expect(style).not.toMatch(/\bh[1-6]\b/);
  });

  it('only floats the figure inside an image block, scoped to the editor root', () => {
    for (const selector of style.match(/[^{}]+(?=\{)/g) ?? []) {
      expect(selector.trim()).toMatch(/^\.acms-admin-block-editor /);
    }
    expect(style).toMatch(/float:\s*left/);
    expect(style).toMatch(/float:\s*right/);
  });
});
