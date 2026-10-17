import { register } from '@ablogcms/plugins';
import { createImageFloatExtension, FALLBACK_WIDTH } from './extension';
import { resources } from './i18n';
import './style.css';

export const PLUGIN_NAME = 'block-editor-image-float';

const POLL_INTERVAL_MS = 10;
const POLL_TIMEOUT_MS = 10_000;

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
 * ACMS.plugins がまだ無いことがある（実機で確認）。生成されるまで短い間隔で待ち、タイムアウトしたら
 * 何もしない（管理画面以外のページには ACMS.plugins が作られない）。
 */
const whenPluginsReady = (callback: () => void) => {
  if (typeof window === 'undefined') return;
  if (window.ACMS?.plugins) {
    callback();
    return;
  }
  const startedAt = Date.now();
  const timer = setInterval(() => {
    if (window.ACMS?.plugins) {
      clearInterval(timer);
      callback();
    } else if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
      clearInterval(timer);
    }
  }, POLL_INTERVAL_MS);
};

whenPluginsReady(registerPlugin);
