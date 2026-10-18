import { register } from '@ablogcms/plugins';
import { createImageFloatExtension, FALLBACK_WIDTH } from './extension';
import { resources } from './i18n';
import './style.css';

export const PLUGIN_NAME = 'block-editor-image-float';

const registerPlugin = () =>
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

/**
 * コアの admin.js は async で読み込まれるため、type="module" のこのスクリプトの方が先に実行されて
 * ACMS.plugins がまだ無いことがある（実機で確認）。その場合は ACMS.adminReady（admin.js が
 * ACMS.plugins を作った後に発火する管理画面版の ACMS.Ready）まで待つ。管理画面以外のページ
 * （ACMS.plugins も adminReady も無い）では何もしない。
 */
const whenPluginsReady = (callback: () => void) => {
  if (typeof window === 'undefined') return;
  if (window.ACMS?.plugins) {
    callback();
  } else {
    window.ACMS?.adminReady?.(() => {
      if (window.ACMS.plugins) callback();
    });
  }
};

whenPluginsReady(registerPlugin);
