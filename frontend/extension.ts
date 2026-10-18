import type { Tiptap } from '@ablogcms/block-editor/tiptap';
import type { BlockMenuToolbarItem } from '@ablogcms/block-editor/types';
import { t } from '@ablogcms/i18n';

export type FloatSide = 'left' | 'right';
export const FLOAT_ALIGN = { left: 'float-left', right: 'float-right' } as const satisfies Record<FloatSide, string>;
const DEFAULT_ALIGN = 'center'; // コアの imageBlock.align の既定値
const NODE_NAME = 'imageBlock';

/** align の値からフロートの向きを得る。回り込みの判定はここに集約する（コアが align の値を制限した場合の影響範囲を絞る） */
export const floatSideOf = (align: unknown): FloatSide | null =>
  align === FLOAT_ALIGN.left ? 'left' : align === FLOAT_ALIGN.right ? 'right' : null;

export const isFloatAlign = (align: unknown): boolean => floatSideOf(align) !== null;

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageFloat: {
      setImageFloat: (side: FloatSide) => ReturnType;
      unsetImageFloat: () => ReturnType;
      toggleImageFloat: (side: FloatSide) => ReturnType;
    };
  }
}

interface ImageFloatOptions {
  blockMenu: BlockMenuToolbarItem[];
}

export function createImageFloatExtension({ core }: Tiptap) {
  return core.Extension.create<ImageFloatOptions>({
    name: 'imageFloat',
    addOptions() {
      const button = (side: FloatSide, order: number): BlockMenuToolbarItem => ({
        scope: 'image',
        order, // コアの画像セクション（-100）の直後
        icon: side === 'left' ? 'format_image_left' : 'format_image_right',
        tooltip: t(`block-editor-image-float:wrap.${side}`),
        isActive: (editor) => floatSideOf(editor.getAttributes(NODE_NAME).align) === side,
        onSelect: (editor) => {
          editor.chain().focus(undefined, { scrollIntoView: false }).toggleImageFloat(side).run();
        },
      });
      return { blockMenu: [button('left', -90), button('right', -89)] };
    },
    addCommands() {
      return {
        setImageFloat:
          (side) =>
          ({ commands }) =>
            // 幅は変えない（幅は既存の画像ツールバーで変更する）
            commands.updateAttributes(NODE_NAME, { align: FLOAT_ALIGN[side] }),
        unsetImageFloat:
          () =>
          ({ editor, commands }) =>
            isFloatAlign(editor.getAttributes(NODE_NAME).align)
              ? commands.updateAttributes(NODE_NAME, { align: DEFAULT_ALIGN })
              : false,
        toggleImageFloat:
          (side) =>
          ({ editor, commands }) =>
            floatSideOf(editor.getAttributes(NODE_NAME).align) === side
              ? commands.unsetImageFloat()
              : commands.setImageFloat(side),
      };
    },
  });
}
