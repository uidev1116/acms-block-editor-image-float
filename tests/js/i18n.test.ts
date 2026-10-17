import { describe, expect, it } from 'vitest';
import { resources } from '../../frontend/i18n';

describe('i18n resources', () => {
  it('has wrap.left / wrap.right in ja and en', () => {
    for (const lng of ['ja', 'en'] as const) {
      expect(resources[lng].wrap.left).toBeTruthy();
      expect(resources[lng].wrap.right).toBeTruthy();
    }
    expect(resources.ja.wrap.left).toBe('左に回り込み');
  });
});
