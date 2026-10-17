import * as core from '@tiptap/core';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let outDir = '';
let code = '';

beforeAll(async () => {
  outDir = mkdtempSync(join(tmpdir(), 'image-float-bundle-'));
  await build({ logLevel: 'silent', build: { outDir, emptyOutDir: true, write: true } });
  code = readFileSync(join(outDir, 'index.js'), 'utf8');
});

afterAll(() => rmSync(outDir, { recursive: true, force: true }));

type Factory = (tiptap: unknown) => unknown;
type Win = { ACMS?: unknown };

const run = (acms: unknown) => {
  (window as unknown as Win).ACMS = acms;
  // eslint-disable-next-line no-new-func
  new Function(code)();
};

describe('built bundle', () => {
  it('contains no react / tiptap / prosemirror implementation', () => {
    expect(code.length).toBeLessThan(5 * 1024);
    expect(code).not.toMatch(/prosemirror/i);
    expect(code).not.toMatch(/__SECRET_INTERNALS|react\.element|react\.transitional/);
    expect(code).not.toContain('Extension.create=');
  });

  it('does nothing (and does not throw) without ACMS.plugins', () => {
    expect(() => run(undefined)).not.toThrow();
    expect(() => run({})).not.toThrow();
  });

  it('registers at load without touching Tiptap, and the factory builds an extension later', () => {
    const registered: Array<{ name: string; def: { setup: (ctx: unknown) => void } }> = [];
    const factories: Record<string, Factory> = {};
    // ファクトリ実行前に Tiptap へ触ると例外になる、ホストの遅延 Proxy を再現する
    const lazyTiptap = new Proxy({}, { get() { throw new Error('tiptap accessed before the factory ran'); } });
    run({
      Library: { tiptap: lazyTiptap },
      plugins: { register: (name: string, def: { setup: (ctx: unknown) => void }) => registered.push({ name, def }) },
    });
    expect(registered).toHaveLength(1);
    expect(registered[0].name).toBe('block-editor-image-float');

    registered[0].def.setup({
      i18n: { addResources: () => {} },
      config: {},
      blockEditor: { registerExtension: (n: string, f: Factory) => (factories[n] = f) },
    });
    const ext = factories.imageFloat({ core }) as { name: string };
    expect(ext.name).toBe('imageFloat');
  });
});
