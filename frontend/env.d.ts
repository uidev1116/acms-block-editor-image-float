import type {} from '@ablogcms/types/acms';
import type {} from '@ablogcms/plugins/acms';

/** package.json の version（vite の define で埋め込む。ServiceProvider::$version と同じ値にする） */
declare global {
  const __PLUGIN_VERSION__: string;
}

export {};
