import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createImageFloatExtension = vi.fn(() => 'EXTENSION');
vi.mock('../../frontend/extension', () => ({ createImageFloatExtension }));
vi.mock('../../frontend/style.css', () => ({}));

type Setup = (ctx: unknown) => void;
const register = vi.fn<(name: string, def: { version: string; setup: Setup }) => void>();
vi.mock('@ablogcms/plugins', () => ({ register }));

const makeCtx = (config: Record<string, unknown> = {}) => ({
  i18n: { addResources: vi.fn() },
  config,
  blockEditor: { registerExtension: vi.fn() },
});

const load = async () => {
  vi.resetModules();
  return import('../../frontend/index');
};

describe('entry point', () => {
  beforeEach(() => {
    register.mockClear();
    createImageFloatExtension.mockClear();
  });
  afterEach(() => {
    delete (window as unknown as { ACMS?: unknown }).ACMS;
  });

  it('does nothing when ACMS.plugins is missing (public pages)', async () => {
    await load();
    expect(register).not.toHaveBeenCalled();
  });

  it('registers the plugin when ACMS.plugins exists', async () => {
    (window as unknown as { ACMS: unknown }).ACMS = { plugins: {} };
    const mod = await load();
    expect(register).toHaveBeenCalledTimes(1);
    expect(register.mock.calls[0][0]).toBe(mod.PLUGIN_NAME);
    expect(mod.PLUGIN_NAME).toBe('block-editor-image-float');
  });

  it('setup adds i18n resources and registers the extension with the default width', async () => {
    (window as unknown as { ACMS: unknown }).ACMS = { plugins: {} };
    await load();
    const ctx = makeCtx();
    register.mock.calls[0][1].setup(ctx);
    expect(ctx.i18n.addResources).toHaveBeenCalledWith('ja', expect.any(Object));
    expect(ctx.i18n.addResources).toHaveBeenCalledWith('en', expect.any(Object));
    const [name, factory] = ctx.blockEditor.registerExtension.mock.calls[0] as [string, (t: unknown) => unknown];
    expect(name).toBe('imageFloat');
    const tiptap = {};
    expect(factory(tiptap)).toBe('EXTENSION');
    expect(createImageFloatExtension).toHaveBeenCalledWith(tiptap, { defaultWidth: '50%' });
  });

  it('uses ctx.config.defaultWidth when it is a string', async () => {
    (window as unknown as { ACMS: unknown }).ACMS = { plugins: {} };
    await load();
    const ctx = makeCtx({ defaultWidth: '40%' });
    register.mock.calls[0][1].setup(ctx);
    (ctx.blockEditor.registerExtension.mock.calls[0][1] as (t: unknown) => unknown)({});
    expect(createImageFloatExtension).toHaveBeenCalledWith({}, { defaultWidth: '40%' });
  });

  it('ignores a non-string defaultWidth', async () => {
    (window as unknown as { ACMS: unknown }).ACMS = { plugins: {} };
    await load();
    const ctx = makeCtx({ defaultWidth: 40 });
    register.mock.calls[0][1].setup(ctx);
    (ctx.blockEditor.registerExtension.mock.calls[0][1] as (t: unknown) => unknown)({});
    expect(createImageFloatExtension).toHaveBeenCalledWith({}, { defaultWidth: '50%' });
  });
});
