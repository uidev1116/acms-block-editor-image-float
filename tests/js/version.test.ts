import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../frontend/style.css', () => ({}));
const register = vi.fn();
vi.mock('@ablogcms/plugins', () => ({ register }));

const read = (path: string) => readFileSync(join(__dirname, '../..', path), 'utf8');
const packageVersion = (JSON.parse(read('package.json')) as { version: string }).version;
const providerVersion = /\$version\s*=\s*'([\d.]+)'/.exec(read('src/ServiceProvider.php'))?.[1];

describe('version single source', () => {
  it('package.json and ServiceProvider::$version agree', () => {
    expect(providerVersion).toBe(packageVersion);
  });

  it('the version passed to register() comes from package.json', async () => {
    (window as unknown as { ACMS: unknown }).ACMS = { plugins: {} };
    vi.resetModules();
    await import('../../frontend/index');
    expect(register.mock.calls[0][1].version).toBe(packageVersion);
    delete (window as unknown as { ACMS?: unknown }).ACMS;
  });

  it('frontend/index.ts has no hard-coded version literal', () => {
    expect(read('frontend/index.ts')).not.toMatch(/version:\s*['"]\d/);
  });
});
