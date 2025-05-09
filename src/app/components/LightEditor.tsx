'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '../utils/ui';
import { StarterKit, Image, createResizableImageExtension } from './EditorExtensions';
import ResizableImageNode from './ResizableImageNode';
import React from 'react';
import { CoreIcons } from './EditorIcons';
import { getEditorStyles } from '../utils/editorStyles';
import { BaseEditorProps } from '../utils/editorTypes';

// Create a simplified toolbar component
const SimplifiedToolbar = ({ editor }: { editor: any }) => {
  if (!editor) return null;
  
  return (
    <div className="flex items-center border-b border-gray-300 p-2 gap-1 bg-gray-50">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          "p-1.5 rounded-md min-h-[32px] min-w-[32px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-rc-accent/50",
          editor.isActive('bold') ? "bg-rc-accent text-rc-bg" : "text-gray-600 hover:bg-gray-200"
        )}
        title="Bold"
        aria-label="Bold"
      >
        <CoreIcons.Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          "p-1.5 rounded-md min-h-[32px] min-w-[32px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-rc-accent/50",
          editor.isActive('italic') ? "bg-rc-accent text-rc-bg" : "text-gray-600 hover:bg-gray-200"
        )}
        title="Italic"
        aria-label="Italic"
      >
        <CoreIcons.Italic size={16} />
      </button>
      <div className="h-6 w-px bg-gray-300 mx-1" />
      <button
        onClick={() => import('./EditorToolbar').then(module => {
          // This will trigger the full editor toolbar to load
          const event = new CustomEvent('loadFullEditor');
          window.dispatchEvent(event);
        })}
        className="text-sm text-gray-600 hover:text-rc-accent px-2 py-1 rounded-md flex items-center min-h-[32px] focus:outline-none focus:ring-2 focus:ring-rc-accent/50"
        title="Load full editor"
        aria-label="Load full editor"
      >
        <CoreIcons.Plus size={14} className="mr-1" />
        Load full editor...
      </button>
    </div>
  );
};

const LightEditor = ({ initialContent, onChange, readOnly = false, className }: BaseEditorProps) => {
  const [fullEditorLoaded, setFullEditorLoaded] = useState<boolean>(false);
  const [FullEditor, setFullEditor] = useState<any>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Configure the ResizableImageExtension with our node
  const ResizableImageExtension = createResizableImageExtension(ResizableImageNode);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      ResizableImageExtension.configure({
        HTMLAttributes: {
          class: 'resizable-image',
        },
        allowBase64: true,
      }),
    ],
    content: initialContent || '<p>Add content here...</p>',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    parseOptions: {
      preserveWhitespace: 'full',
    },
  }, [initialContent]);

  // Listen for the full editor load request
  useEffect(() => {
    const handleLoadFullEditor = async () => {
      // Dynamically import the full editor
      const EditorModule = await import('./Editor');
      setFullEditor(() => EditorModule.default);
      setFullEditorLoaded(true);
    };

    window.addEventListener('loadFullEditor', handleLoadFullEditor);
    
    return () => {
      window.removeEventListener('loadFullEditor', handleLoadFullEditor);
    };
  }, []);

  // CSS styles for image resizing
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = getEditorStyles(readOnly);
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, [readOnly]);

  // If full editor is requested and loaded, use it
  if (fullEditorLoaded && FullEditor) {
    return (
      <FullEditor
        initialContent={editor ? editor.getHTML() : initialContent}
        onChange={onChange}
        readOnly={readOnly}
        className={className}
      />
    );
  }

  // Otherwise, use lightweight editor
  return (
    <div className={cn("border border-gray-300 rounded-md min-h-[350px] overflow-hidden", className)}>
      {!readOnly && <SimplifiedToolbar editor={editor} />}
      
      <div ref={editorRef} className="p-4 prose prose-sm max-w-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default LightEditor; 