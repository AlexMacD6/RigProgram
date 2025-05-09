import React, { useRef, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

interface ResizableImageNodeProps {
  node: any;
  updateAttributes: (attrs: Record<string, any>) => void;
  selected: boolean;
  editor?: any;
}

export default function ResizableImageNode({ 
  node, 
  updateAttributes, 
  selected, 
  editor 
}: ResizableImageNodeProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const { src, width, height, alt, align } = node.attrs;
  const isEditable = editor ? editor.isEditable : true;

  useEffect(() => {
    // Don't set up resize handlers in read-only mode
    if (!isEditable) return;
    
    const img = imgRef.current;
    if (!img) return;
    
    // Initial aspect ratio
    let startX = 0;
    let startY = 0;
    let startWidth = 0; 
    let startHeight = 0;
    let aspectRatio = 1;
    let dragging = false;

    function onMouseDown(e: MouseEvent) {
      if (!(e.target instanceof HTMLElement) || e.target.className !== 'resize-handle') return;
      
      const currentImg = imgRef.current;
      if (!currentImg) return;
      
      e.preventDefault();
      dragging = true;
      
      // Store initial values
      startX = e.clientX;
      startY = e.clientY;
      startWidth = currentImg.offsetWidth;
      startHeight = currentImg.offsetHeight;
      
      // Calculate aspect ratio to maintain during resize
      aspectRatio = startHeight / startWidth;
      
      // Add event listeners for drag operations
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      
      // Visual feedback during resize
      document.body.style.cursor = 'nwse-resize';
    }
    
    function onMouseMove(e: MouseEvent) {
      if (!dragging || !img) return;
      
      // Calculate width based on mouse movement
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(50, startWidth + deltaX);
      
      // Maintain aspect ratio by calculating height
      const newHeight = Math.round(newWidth * aspectRatio);
      
      // Apply to the element
      img.style.width = `${newWidth}px`;
      img.style.height = `${newHeight}px`;
    }
    
    function onMouseUp(e: MouseEvent) {
      if (!dragging || !img) return;
      dragging = false;
      
      // Get final dimensions
      const finalWidth = parseInt(img.style.width, 10);
      const finalHeight = parseInt(img.style.height, 10);
      
      // Update the node attributes for persistence
      updateAttributes({ 
        width: finalWidth,
        height: finalHeight
      });
      
      // Clean up
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
    }
    
    // Add initial event listener
    if (img.parentElement) {
      img.parentElement.addEventListener('mousedown', onMouseDown);
    }
    
    // Clean up on component unmount
    return () => {
      const currentImg = imgRef.current;
      if (currentImg && currentImg.parentElement) {
        currentImg.parentElement.removeEventListener('mousedown', onMouseDown);
      }
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
    };
  }, [updateAttributes, isEditable]);

  return (
    <NodeViewWrapper className="resizable-image-node" data-align={align}>
      <img
        ref={imgRef}
        src={src}
        alt={alt || ''}
        style={{
          width: width ? `${width}px` : 'auto',
          height: height ? `${height}px` : 'auto',
          maxWidth: '100%',
          display: 'block',
        }}
        draggable={false}
        contentEditable={false}
      />
      {selected && isEditable && (
        <span
          className="resize-handle"
          style={{
            position: 'absolute',
            right: -4,
            bottom: -4,
            width: 16,
            height: 16,
            background: '#D4AF3D', // RC gold accent color
            border: '2px solid #000000', // RC black
            borderRadius: 4,
            cursor: 'nwse-resize',
            zIndex: 10,
            display: 'block',
            boxShadow: '0 0 3px rgba(0,0,0,0.5)',
          }}
        />
      )}
    </NodeViewWrapper>
  );
} 