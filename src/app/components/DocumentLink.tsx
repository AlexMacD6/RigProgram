'use client';

import { Mark, mergeAttributes } from '@tiptap/core';

export const DocumentLinkExtension = Mark.create({
  name: 'documentLink',
  
  priority: 1000,
  
  inclusive: false,
  
  addOptions() {
    return {
      HTMLAttributes: {
        class: 'document-link',
      },
    };
  },
  
  addAttributes() {
    return {
      documentId: {
        default: null,
        parseHTML: element => element.getAttribute('data-document-id'),
        renderHTML: attributes => {
          if (!attributes.documentId) {
            return {};
          }

          return {
            'data-document-id': attributes.documentId,
          };
        },
      },
      documentTitle: {
        default: null,
        parseHTML: element => element.getAttribute('data-document-title'),
        renderHTML: attributes => {
          if (!attributes.documentTitle) {
            return {};
          }

          return {
            'data-document-title': attributes.documentTitle,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-document-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0, // This is the content hole, which is valid for marks
    ];
  },
}); 