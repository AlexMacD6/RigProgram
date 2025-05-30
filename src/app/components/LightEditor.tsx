'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '../utils/ui';
import { StarterKit, Image, createResizableImageExtension, lazyLoadExtensions } from './EditorExtensions';
import ResizableImageNode from './ResizableImageNode';
import React from 'react';
import { CoreIcons } from './EditorIcons';
import { getEditorStyles } from '../utils/editorStyles';
import { BaseEditorProps } from '../utils/editorTypes';
import { DocumentLinkExtension } from './DocumentLink';

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
  const [extendedExtensions, setExtendedExtensions] = useState<any>(null);
  const lastFocusTimeRef = useRef<number>(0);
  const lastCursorPositionRef = useRef<number | null>(null);
  
  // Configure the ResizableImageExtension with our node
  const ResizableImageExtension = createResizableImageExtension(ResizableImageNode);
  
  // Load extended extensions when component mounts
  useEffect(() => {
    lazyLoadExtensions().then(extensions => {
      setExtendedExtensions(extensions);
    });
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      ...(extendedExtensions ? [
        extendedExtensions.Table,
        extendedExtensions.TableRow,
        extendedExtensions.TableCell,
        extendedExtensions.TableHeader,
      ] : []),
      ResizableImageExtension.configure({
        HTMLAttributes: {
          class: 'resizable-image',
        },
        allowBase64: true,
      }),
      DocumentLinkExtension,
    ],
    content: initialContent || '<p>Add content here...</p>',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      // Save the current selection state
      const { from } = editor.state.selection;
      const wasEditorFocused = editor.isFocused;
      
      // Update last focus time and cursor position
      if (wasEditorFocused) {
        lastFocusTimeRef.current = Date.now();
        lastCursorPositionRef.current = from;
      }

      // Debounce content updates to prevent focus loss
      const html = editor.getHTML();
      clearTimeout((window as any).lightEditorUpdateTimeout);
      (window as any).lightEditorUpdateTimeout = setTimeout(() => {
        onChange(html);
        
        // After the state update completes, restore focus and selection if needed
        if (wasEditorFocused) {
          setTimeout(() => {
            editor.commands.focus();
            // Try to restore cursor position
            try {
              // Handle both selection and single cursor position
              editor.commands.setTextSelection(from);
            } catch (e) {
              // If restoration fails, at least ensure editor is focused
              editor.commands.focus();
            }
          }, 0);
        }
      }, 300); // Reduced from 500ms to make it feel more responsive
    },
    parseOptions: {
      preserveWhitespace: 'full',
    },
  }, [initialContent, extendedExtensions]);

  // Focus recovery mechanism
  useEffect(() => {
    if (!editor || readOnly) return;

    // Track focus related events
    const handleEditorFocus = () => {
      lastFocusTimeRef.current = Date.now();
    };

    const handleEditorBlur = () => {
      // Store the position before blur happens
      if (editor.state) {
        lastCursorPositionRef.current = editor.state.selection.from;
      }
    };

    // Add event listeners for tracking focus
    if (editorRef.current) {
      const editorElement = editorRef.current.querySelector('.ProseMirror');
      if (editorElement) {
        editorElement.addEventListener('focus', handleEditorFocus);
        editorElement.addEventListener('blur', handleEditorBlur);
      }
    }

    // Create a focus recovery interval
    // This will periodically check if the editor should have focus but doesn't
    const focusRecoveryInterval = setInterval(() => {
      // Only attempt recovery if:
      // 1. The editor exists and isn't currently focused
      // 2. The user was actively editing recently (within the last 5 seconds)
      // 3. The document/window still has focus (we don't want to steal focus if user switched apps)
      const timeSinceLastFocus = Date.now() - lastFocusTimeRef.current;
      const recentlyActive = timeSinceLastFocus < 5000; // 5 seconds
      
      if (editor && !editor.isFocused && recentlyActive && document.hasFocus()) {
        editor.commands.focus();
        
        // Restore cursor position if we have it
        if (lastCursorPositionRef.current !== null) {
          try {
            editor.commands.setTextSelection(lastCursorPositionRef.current);
          } catch (e) {
            // Silently fail if position is no longer valid
          }
        }
      }
    }, 1000); // Check every second for focus loss

    // Cleanup event listeners and intervals
    return () => {
      clearInterval(focusRecoveryInterval);
      
      if (editorRef.current) {
        const editorElement = editorRef.current.querySelector('.ProseMirror');
        if (editorElement) {
          editorElement.removeEventListener('focus', handleEditorFocus);
          editorElement.removeEventListener('blur', handleEditorBlur);
        }
      }
    };
  }, [editor, readOnly]);

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