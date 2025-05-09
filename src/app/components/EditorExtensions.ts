// This file centralizes and lazily loads TipTap extensions
// to reduce the number of imports and improve performance

import { ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';

// Basic required extensions - load immediately
export { StarterKit, Image };

// Factory function to create resizable image extension
export function createResizableImageExtension(ResizableImageNode: any) {
  return Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        width: {
          default: null,
          parseHTML: element => element.getAttribute('width'),
          renderHTML: attributes => {
            if (!attributes.width) return {};
            return { width: attributes.width };
          },
        },
        height: {
          default: null,
          parseHTML: element => element.getAttribute('height'),
          renderHTML: attributes => {
            if (!attributes.height) return {};
            return { height: attributes.height };
          },
        },
        align: {
          default: null,
          parseHTML: element => element.getAttribute('data-align'),
          renderHTML: attributes => {
            if (!attributes.align) return {};
            return { 'data-align': attributes.align };
          },
        },
      };
    },
    addNodeView() {
      return ReactNodeViewRenderer(ResizableImageNode);
    },
  });
}

// Lazy load less frequently used extensions
export const lazyLoadExtensions = async () => {
  const [
    Underline,
    Link,
    TextAlign,
    Table,
    TableRow,
    TableCell,
    TableHeader,
    TaskList,
    TaskItem,
    Placeholder
  ] = await Promise.all([
    import('@tiptap/extension-underline').then(m => m.default),
    import('@tiptap/extension-link').then(m => m.default),
    import('@tiptap/extension-text-align').then(m => m.default),
    import('@tiptap/extension-table').then(m => m.default),
    import('@tiptap/extension-table-row').then(m => m.default),
    import('@tiptap/extension-table-cell').then(m => m.default),
    import('@tiptap/extension-table-header').then(m => m.default),
    import('@tiptap/extension-task-list').then(m => m.default),
    import('@tiptap/extension-task-item').then(m => m.default),
    import('@tiptap/extension-placeholder').then(m => m.default)
  ]);

  return {
    Underline,
    Link: Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-500 underline cursor-pointer',
      },
    }),
    TextAlign: TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Table: Table.configure({
      resizable: false,
    }),
    TableRow,
    TableCell,
    TableHeader,
    TaskList,
    TaskItem,
    Placeholder: Placeholder.configure({
      placeholder: 'Start writing...',
    }),
  };
}; 