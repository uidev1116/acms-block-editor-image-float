import * as core from '@tiptap/core';
import { UndoRedo } from '@tiptap/extensions';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Tiptap } from '@ablogcms/block-editor/tiptap';
import {
  createImageFloatExtension,
  FLOAT_ALIGN,
  floatSideOf,
  isFloatAlign,
} from '../../frontend/extension';

vi.mock('@ablogcms/i18n', () => ({ t: (key: string) => `t(${key})` }));

const tiptap = { core } as unknown as Tiptap;

// コア（@ablogcms/block-editor の ImageBlock）の保存・読み込みを最小限に再現したノード。
// 実コアそのものではない（コア更新時の検知は README の確認項目と実機確認で行う）が、
// align / displayWidth が data-align / data-width として往復する点はコアと同じ形にしてある。
const ImageBlock = core.Node.create({
  name: 'imageBlock',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      align: { default: 'center', renderHTML: (attrs) => ({ 'data-align': attrs.align }) },
      displayWidth: { default: '100%', renderHTML: (attrs) => ({ 'data-width': attrs.displayWidth }) },
    };
  },
  parseHTML: () => [
    {
      tag: 'figure',
      getAttrs: (el) => {
        const parent = (el as HTMLElement).closest('[data-type="imageBlock"]');
        return {
          align: parent?.getAttribute('data-align') || 'center',
          displayWidth: parent?.getAttribute('data-width'),
        };
      },
    },
  ],
  renderHTML: ({ HTMLAttributes }) => ['div', { 'data-type': 'imageBlock', ...HTMLAttributes }, ['figure']],
});
const Doc = core.Node.create({ name: 'doc', topNode: true, content: 'block+' });
const Paragraph = core.Node.create({
  name: 'paragraph',
  group: 'block',
  content: 'inline*',
  renderHTML: () => ['p', 0],
});
const Text = core.Node.create({ name: 'text', group: 'inline' });

const createEditor = (attrs: Record<string, unknown> = {}) => {
  const editor = new core.Editor({
    extensions: [Doc, Paragraph, Text, ImageBlock, UndoRedo, createImageFloatExtension(tiptap)],
    content: {
      type: 'doc',
      content: [
        { type: 'imageBlock', attrs },
        { type: 'paragraph', content: [{ type: 'text', text: 'body' }] },
      ],
    },
  });
  editor.commands.setNodeSelection(0);
  return editor;
};

const imageAttrs = (editor: core.Editor) => editor.getAttributes('imageBlock');

describe('pure helpers', () => {
  it('floatSideOf maps align values', () => {
    expect(floatSideOf('float-left')).toBe('left');
    expect(floatSideOf('float-right')).toBe('right');
    expect(floatSideOf('left')).toBeNull();
    expect(floatSideOf('center')).toBeNull();
    expect(floatSideOf(undefined)).toBeNull();
  });

  it('isFloatAlign recognises only float values', () => {
    expect(isFloatAlign(FLOAT_ALIGN.left)).toBe(true);
    expect(isFloatAlign(FLOAT_ALIGN.right)).toBe(true);
    expect(isFloatAlign('right')).toBe(false);
    expect(isFloatAlign(null)).toBe(false);
  });
});

describe('commands', () => {
  let editor: core.Editor;
  afterEach(() => editor.destroy());

  it('setImageFloat sets align only and never touches the display width', () => {
    editor = createEditor();
    expect(editor.commands.setImageFloat('left')).toBe(true);
    expect(imageAttrs(editor)).toMatchObject({ align: 'float-left', displayWidth: '100%' });
  });

  it.each(['30%', '50%', '320px'])('keeps the existing width %s', (displayWidth) => {
    editor = createEditor({ displayWidth });
    editor.commands.setImageFloat('right');
    expect(imageAttrs(editor)).toMatchObject({ align: 'float-right', displayWidth });
  });

  it('unsetImageFloat returns to center and keeps the width', () => {
    editor = createEditor({ align: 'float-left', displayWidth: '50%' });
    editor.commands.unsetImageFloat();
    expect(imageAttrs(editor)).toMatchObject({ align: 'center', displayWidth: '50%' });
  });

  it('unsetImageFloat leaves a non-float alignment untouched', () => {
    editor = createEditor({ align: 'right', displayWidth: '50%' });
    expect(editor.commands.unsetImageFloat()).toBe(false);
    expect(imageAttrs(editor).align).toBe('right');
  });

  it('does nothing when no image block is selected', () => {
    editor = createEditor();
    editor.commands.setTextSelection(editor.state.doc.child(0).nodeSize + 2);
    expect(editor.commands.setImageFloat('left')).toBe(false);
    expect(editor.commands.toggleImageFloat('right')).toBe(false);
    expect(editor.state.doc.child(0).attrs.align).toBe('center');
  });

  it('toggleImageFloat toggles on, off, and switches sides', () => {
    editor = createEditor();
    editor.commands.toggleImageFloat('left');
    expect(imageAttrs(editor).align).toBe('float-left');
    editor.commands.toggleImageFloat('right');
    expect(imageAttrs(editor).align).toBe('float-right');
    editor.commands.toggleImageFloat('right');
    expect(imageAttrs(editor).align).toBe('center');
  });

  it('undo / redo revert a float change in one step', () => {
    editor = createEditor();
    editor.commands.toggleImageFloat('left');
    expect(imageAttrs(editor).align).toBe('float-left');
    editor.commands.undo();
    expect(imageAttrs(editor).align).toBe('center');
    editor.commands.redo();
    expect(imageAttrs(editor).align).toBe('float-left');
  });

  it('round-trips float-left through HTML', () => {
    editor = createEditor();
    editor.commands.toggleImageFloat('left');
    const html = editor.getHTML();
    expect(html).toContain('data-align="float-left"');
    expect(html).toContain('data-width="100%"');
    editor.commands.setContent(html);
    editor.commands.setNodeSelection(0);
    expect(imageAttrs(editor)).toMatchObject({ align: 'float-left', displayWidth: '100%' });
  });
});

describe('block menu', () => {
  let editor: core.Editor;
  beforeEach(() => {
    editor = createEditor();
  });
  afterEach(() => editor.destroy());

  const items = () => {
    const ext = editor.extensionManager.extensions.find((e) => e.name === 'imageFloat')!;
    return ext.options.blockMenu as Array<{
      scope: string;
      order: number;
      icon: string;
      tooltip: string;
      isActive: (e: core.Editor) => boolean;
      onSelect: (e: core.Editor) => void;
    }>;
  };

  it('declares two image-scope buttons after the core section', () => {
    const [left, right] = items();
    expect(left).toMatchObject({ scope: 'image', icon: 'format_image_left', tooltip: 't(block-editor-image-float:wrap.left)' });
    expect(right).toMatchObject({ scope: 'image', icon: 'format_image_right', tooltip: 't(block-editor-image-float:wrap.right)' });
    expect(left.order).toBeGreaterThan(-100);
    expect(right.order).toBeGreaterThan(left.order);
  });

  it('reflects the pressed state and toggles on select', () => {
    const [left, right] = items();
    expect(left.isActive(editor)).toBe(false);
    left.onSelect(editor);
    expect(left.isActive(editor)).toBe(true);
    expect(right.isActive(editor)).toBe(false);
    right.onSelect(editor);
    expect(left.isActive(editor)).toBe(false);
    expect(right.isActive(editor)).toBe(true);
    right.onSelect(editor);
    expect(right.isActive(editor)).toBe(false);
  });
});
