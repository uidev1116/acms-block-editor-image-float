import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as IndexModule from '../../frontend/index';

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
    delete (window as unknown as { ACMS?: unknown }).ACMS;
  });

  it('does nothing when ACMS is missing (public pages)', async () => {
    await load();
    expect(register).not.toHaveBeenCalled();
  });

  it('does nothing when ACMS has no adminReady (and no plugins)', async () => {
    (window as unknown as { ACMS: unknown }).ACMS = {};
    await load();
    expect(register).not.toHaveBeenCalled();
  });

  it('waits for ACMS.adminReady when admin.js runs after this script (async race)', async () => {
    const listeners: Array<() => void> = [];
    const acms: { plugins?: unknown; adminReady: (l: () => void) => void } = {
      adminReady: (l) => listeners.push(l),
    };
    (window as unknown as { ACMS: unknown }).ACMS = acms;
    await load();
    expect(register).not.toHaveBeenCalled();
    expect(listeners).toHaveLength(1);
    acms.plugins = {};
    listeners[0]();
    expect(register).toHaveBeenCalledTimes(1);
  });

  it('ignores adminReady when plugins still does not exist', async () => {
    const listeners: Array<() => void> = [];
    (window as unknown as { ACMS: unknown }).ACMS = { adminReady: (l: () => void) => listeners.push(l) };
    await load();
    listeners[0]();
    expect(register).not.toHaveBeenCalled();
  });

  it('registers immediately, without adminReady, when plugins already exists', async () => {
    const adminReady = vi.fn();
    (window as unknown as { ACMS: unknown }).ACMS = { plugins: {}, adminReady };
    await load();
    expect(register).toHaveBeenCalledTimes(1);
    expect(adminReady).not.toHaveBeenCalled();
  });

  it('registers the plugin when ACMS.plugins exists', async () => {
    (window as unknown as { ACMS: unknown }).ACMS = { plugins: {} };
    const mod = await load();
    expect(register).toHaveBeenCalledTimes(1);
    expect(register.mock.calls[0][0]).toBe(mod.PLUGIN_NAME);
    expect(mod.PLUGIN_NAME).toBe('block-editor-image-float');
  });

  it('setup adds i18n resources and registers the extension factory', async () => {
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
    expect(createImageFloatExtension).toHaveBeenCalledWith(tiptap);
  });
});
