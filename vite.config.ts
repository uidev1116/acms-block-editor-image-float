import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

const TIPTAP_PM = [
  'state',
  'model',
  'view',
  'transform',
  'commands',
  'keymap',
  'inputrules',
  'changeset',
  'dropcursor',
  'gapcursor',
  'history',
  'schema-list',
  'tables',
] as const;
const camel = (s: string) => s.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());

// externals: import source -> global exposed by the host (a-blog cms admin.js)
const globals: Record<string, string> = {
  react: 'ACMS.Library.React',
  'react/jsx-runtime': 'ACMS.Library.ReactJsxRuntime',
  '@tiptap/core': 'ACMS.Library.tiptap.core',
  '@tiptap/react': 'ACMS.Library.tiptap.react',
  '@tiptap/suggestion': 'ACMS.Library.tiptap.suggestion',
  ...Object.fromEntries(TIPTAP_PM.map((p) => [`@tiptap/pm/${p}`, `ACMS.Library.tiptap.pm.${camel(p)}`])),
};

export default defineConfig(({ mode }) => ({
  define: { __PLUGIN_VERSION__: JSON.stringify(version) },
  publicDir: false,
  build: {
    outDir: 'src/assets',
    emptyOutDir: true,
    sourcemap: mode === 'development',
    minify: mode !== 'development',
    lib: {
      entry: 'frontend/index.ts',
      formats: ['iife'],
      name: 'AcmsBlockEditorImageFloat',
      fileName: () => 'index.js',
      cssFileName: 'index',
    },
    rolldownOptions: {
      external: (id: string) => id in globals,
      output: { globals },
    },
  },
}));
