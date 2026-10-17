import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as IndexModule from '../../frontend/index';

const createImageFloatExtension = vi.fn(() => 'EXTENSION');
vi.mock('../../frontend/extension', () => ({ createImageFloatExtension, FALLBACK_WIDTH: '50%' }));
vi.mock('../../frontend/style.css', () => ({}));

type Setup = (ctx: unknown) => void;
const register = vi.fn<(name: string, def: { version: string; setup: Setup }) => void>();
vi.mock('@ablogcms/plugins', () => ({ register }));

const makeCtx = (config: Record<string, unknown> = {}) => ({
  i18n: { addResources: vi.fn() },
  config,
  blockEditor: { registerExtension: vi.fn() },
});

const load = async (): Promise<typeof IndexModule> => {
  vi.resetModules();
  return import('../../frontend/index');
};

describe('entry point', () => {
  beforeEach(() => {
    register.mockClear();
    createImageFloatExtension.mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
    delete (window as unknown as { ACMS?: unknown }).ACMS;
  });

  it('does nothing, and stops waiting, when ACMS.plugins never appears (public pages)', async () => {
    vi.useFakeTimers();
    await load();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(register).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('waits for ACMS.plugins when admin.js runs after this script (async race)', async () => {
    vi.useFakeTimers();
    await load();
    await vi.advanceTimersByTimeAsync(100);
    expect(register).not.toHaveBeenCalled();
    (window as unknown as { ACMS: unknown }).ACMS = { plugins: {} };
    await vi.advanceTimersByTimeAsync(20);
    expect(register).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(register).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('waits when window.ACMS exists but plugins is not created yet', async () => {
    vi.useFakeTimers();
    (window as unknown as { ACMS: unknown }).ACMS = {};
    await load();
    expect(register).not.toHaveBeenCalled();
    (window as unknown as { ACMS: { plugins: unknown } }).ACMS.plugins = {};
    await vi.advanceTimersByTimeAsync(20);
    expect(register).toHaveBeenCalledTimes(1);
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
