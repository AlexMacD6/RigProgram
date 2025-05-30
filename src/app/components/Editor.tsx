'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '../utils/ui';
import EditorToolbar from './EditorToolbar';
import { 
  StarterKit, 
  Image, 
  createResizableImageExtension,
  lazyLoadExtensions 
} from './EditorExtensions';
import ResizableImageNode from './ResizableImageNode';
import { getEditorStyles } from '../utils/editorStyles';
import { BaseEditorProps } from '../utils/editorTypes';
import { DocumentLinkExtension } from './DocumentLink';

const Editor = ({ initialContent, onChange, readOnly = false, className }: BaseEditorProps) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [showImagePopup, setShowImagePopup] = useState<boolean>(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
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
        extendedExtensions.Underline,
        extendedExtensions.Link,
        extendedExtensions.TextAlign,
        extendedExtensions.TaskList,
        extendedExtensions.TaskItem,
        extendedExtensions.Table,
        extendedExtensions.TableRow,
        extendedExtensions.TableCell,
        extendedExtensions.TableHeader,
        extendedExtensions.Placeholder,
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
      clearTimeout((window as any).editorUpdateTimeout);
      (window as any).editorUpdateTimeout = setTimeout(() => {
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

  // Add CSS for the resizable images
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = getEditorStyles(readOnly);
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, [readOnly]);

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

  const addImage = useCallback(() => {
    setShowImagePopup(true);
  }, []);

  const addImageByUrl = useCallback(() => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ 
        src: imageUrl,
        align: null // Default alignment
      } as any).run();
      setImageUrl('');
      setShowImagePopup(false);
    }
  }, [imageUrl, editor]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        editor.chain().focus().setImage({ 
          src: dataUrl,
          align: null // Default alignment
        } as any).run();
        setShowImagePopup(false);
        // Reset file input
        if (e.target) e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  }, [editor]);

  const triggerFileUpload = useCallback(() => {
    if (imageFileInputRef.current) {
      imageFileInputRef.current.click();
    }
  }, []);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("border border-gray-300 rounded-md min-h-[350px] overflow-hidden", className)}>
      {!readOnly && <EditorToolbar editor={editor} onAddImage={addImage} />}
      
      <div ref={editorRef} className="p-4 prose prose-sm max-w-none">
        <EditorContent editor={editor} />
        
        <input
          ref={imageFileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        {showImagePopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-96">
              <h3 className="text-lg font-medium mb-4">Insert Image</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL:</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div className="mb-4">
                <span className="block text-sm font-medium text-gray-700 mb-1">Or upload:</span>
                <button
                  onClick={triggerFileUpload}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm"
                >
                  Choose Image File
                </button>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowImagePopup(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={addImageByUrl}
                  disabled={!imageUrl}
                  className="px-4 py-2 bg-rc-accent text-rc-bg rounded-md text-sm disabled:opacity-50"
                >
                  Insert
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor; 