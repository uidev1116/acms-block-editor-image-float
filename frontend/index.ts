import { register } from '@ablogcms/plugins';
import { createImageFloatExtension, FALLBACK_WIDTH } from './extension';
import { resources } from './i18n';
import './style.css';

export const PLUGIN_NAME = 'block-editor-image-float';

// 管理画面以外（公開側のページなど）には ACMS.plugins が無い。その場合は何もしない
if (typeof window !== 'undefined' && window.ACMS?.plugins) {
  register(PLUGIN_NAME, {
    version: '0.1.0',
    setup(ctx) {
      ctx.i18n.addResources('ja', resources.ja);
      ctx.i18n.addResources('en', resources.en);
      const defaultWidth = typeof ctx.config.defaultWidth === 'string' ? ctx.config.defaultWidth : FALLBACK_WIDTH;
      // Tiptap の値はファクトリの中でだけ使う（この時点ではまだ存在しない）
      ctx.blockEditor.registerExtension('imageFloat', (tiptap) => createImageFloatExtension(tiptap, { defaultWidth }));
    },
  });
}
