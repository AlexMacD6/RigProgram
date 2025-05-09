'use client';

import { Editor } from '@tiptap/react';
import { useState, useEffect } from 'react';
import { cn } from '../utils/ui';
import { CoreIcons, loadExtendedIcons } from './EditorIcons';
import { ToolbarButtonProps } from '../utils/editorTypes';

interface EditorToolbarProps {
  editor: Editor;
  onAddImage: () => void;
}

const EditorToolbar = ({ editor, onAddImage }: EditorToolbarProps) => {
  const [showLinkPopup, setShowLinkPopup] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showImageAlignmentControls, setShowImageAlignmentControls] = useState(false);
  const [extendedIcons, setExtendedIcons] = useState<any>(null);

  // Load extended icons when component mounts
  useEffect(() => {
    loadExtendedIcons().then(icons => {
      setExtendedIcons(icons);
    });
  }, []);

  if (!editor) {
    return null;
  }

  // Check if an image is selected
  const isImageSelected = () => {
    const { state } = editor;
    const { from, to } = state.selection;
    let isImage = false;

    state.doc.nodesBetween(from, to, node => {
      if (node.type.name === 'image') {
        isImage = true;
        return false; // stop traversal
      }
      return true;
    });

    return isImage;
  };

  // Set image alignment
  const setImageAlignment = (align: 'left' | 'center' | 'right' | null) => {
    const { state, view } = editor;
    const { from, to } = state.selection;
    
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type.name === 'image') {
        const { tr } = state;
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          align
        });
        view.dispatch(tr);
        return false; // stop traversal
      }
      return true;
    });
  };

  const toggleLink = () => {
    // Get selected text
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      ' '
    );

    // If we have selected text, show the link popup
    if (selectedText) {
      setShowLinkPopup(true);
    } else {
      // If link exists at cursor position, unset it
      if (editor.isActive('link')) {
        editor.chain().focus().unsetLink().run();
      } else {
        // Otherwise prompt user to select text first
        alert('Please select some text first');
      }
    }
  };

  const applyLink = () => {
    if (linkUrl) {
      let url = linkUrl;
      // Add https:// prefix if not present and not a relative link
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/') && !url.startsWith('#')) {
        url = `https://${url}`;
      }
      
      editor
        .chain()
        .focus()
        .setLink({ href: url })
        .run();
      
      // Reset state
      setLinkUrl('');
      setShowLinkPopup(false);
    }
  };

  const addTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  // Show image alignment controls only when an image is selected and editor is editable
  const imageSelected = isImageSelected();
  const isEditable = editor.isEditable;

  // Only show image alignment controls if editor is editable and an image is selected
  const shouldShowAlignmentControls = isEditable && imageSelected;

  // Check current image alignment
  const getImageAlignment = () => {
    const { state } = editor;
    const { from, to } = state.selection;
    let currentAlign = null;
    
    state.doc.nodesBetween(from, to, node => {
      if (node.type.name === 'image') {
        currentAlign = node.attrs.align;
        return false;
      }
      return true;
    });
    
    return currentAlign;
  };
  
  const currentImageAlign = getImageAlignment();

  // Only render extended buttons if icons are loaded
  const renderExtendedButtons = extendedIcons !== null;

  return (
    <div className="flex flex-wrap items-center border-b border-gray-300 p-2 gap-1 bg-gray-50">
      {renderExtendedButtons && (
        <>
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <extendedIcons.Heading1 size={18} />
          </ToolbarButton>
          
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <extendedIcons.Heading2 size={18} />
          </ToolbarButton>
        </>
      )}
      
      <ToolbarDivider />
      
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold"
      >
        <CoreIcons.Bold size={18} />
      </ToolbarButton>
      
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic"
      >
        <CoreIcons.Italic size={18} />
      </ToolbarButton>
      
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline"
      >
        <CoreIcons.Underline size={18} />
      </ToolbarButton>
      
      <ToolbarDivider />
      
      <ToolbarButton 
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="Align text left"
      >
        <CoreIcons.AlignLeft size={18} />
      </ToolbarButton>
      
      <ToolbarButton 
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="Align text center"
      >
        <CoreIcons.AlignCenter size={18} />
      </ToolbarButton>
      
      <ToolbarButton 
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="Align text right"
      >
        <CoreIcons.AlignRight size={18} />
      </ToolbarButton>
      
      <ToolbarDivider />
      
      {renderExtendedButtons && (
        <>
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet list"
          >
            <extendedIcons.List size={18} />
          </ToolbarButton>
          
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Ordered list"
          >
            <extendedIcons.ListOrdered size={18} />
          </ToolbarButton>
          
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive('taskList')}
            title="Task list"
          >
            <extendedIcons.CheckSquare size={18} />
          </ToolbarButton>
          
          <ToolbarDivider />
          
          <ToolbarButton 
            onClick={toggleLink}
            isActive={editor.isActive('link')}
            title="Add link"
          >
            <extendedIcons.Link size={18} />
          </ToolbarButton>
          
          <ToolbarButton 
            onClick={onAddImage}
            title="Add image"
          >
            <extendedIcons.Image size={18} />
          </ToolbarButton>
          
          <ToolbarButton 
            onClick={addTable}
            title="Insert table"
          >
            <extendedIcons.Table size={18} />
          </ToolbarButton>
        </>
      )}
      
      {/* Show image alignment controls when an image is selected */}
      {shouldShowAlignmentControls && (
        <>
          <ToolbarDivider />
          <div className="flex items-center">
            <span className="text-xs text-gray-500 mr-1">Image align:</span>
            <ToolbarButton 
              onClick={() => setImageAlignment('left')}
              isActive={currentImageAlign === 'left'}
              title="Align image left"
            >
              <CoreIcons.AlignLeft size={16} />
            </ToolbarButton>
            <ToolbarButton 
              onClick={() => setImageAlignment('center')}
              isActive={currentImageAlign === 'center'}
              title="Align image center"
            >
              <CoreIcons.AlignCenter size={16} />
            </ToolbarButton>
            <ToolbarButton 
              onClick={() => setImageAlignment('right')}
              isActive={currentImageAlign === 'right'}
              title="Align image right"
            >
              <CoreIcons.AlignRight size={16} />
            </ToolbarButton>
          </div>
        </>
      )}
      
      {/* Link URL popup */}
      {showLinkPopup && (
        <div className="absolute top-0 left-0 right-0 flex items-center bg-white p-2 shadow-md z-50">
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Enter URL"
            className="flex-grow p-1 border rounded mr-2"
            autoFocus
          />
          <button 
            onClick={applyLink}
            className="bg-rc-accent text-white px-3 py-1 rounded"
          >
            Apply
          </button>
          <button 
            onClick={() => setShowLinkPopup(false)}
            className="ml-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

const ToolbarButton = ({ onClick, isActive = false, title, children }: ToolbarButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-1.5 rounded-md min-h-[32px] min-w-[32px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-rc-accent/50",
        isActive ? "bg-rc-accent text-rc-bg" : "text-gray-600 hover:bg-gray-200"
      )}
      title={title}
      aria-label={title}
    >
      {children}
    </button>
  );
};

const ToolbarDivider = () => {
  return <div className="h-6 w-px bg-gray-300 mx-1" />;
};

export default EditorToolbar; 