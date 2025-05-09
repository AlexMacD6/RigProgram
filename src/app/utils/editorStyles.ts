/**
 * This file centralizes editor CSS styles to avoid duplication
 * and maintain consistency across editor components
 */

export const getEditorStyles = (readOnly: boolean = false): string => {
  return `
    .ProseMirror .resizable-image-node {
      position: relative;
      display: inline-block;
      max-width: 100%;
    }
    
    .ProseMirror .resize-handle {
      position: absolute;
      right: -4px;
      bottom: -4px;
      width: 16px;
      height: 16px;
      background: #D4AF3D;
      border: 2px solid #000000;
      border-radius: 4px;
      cursor: nwse-resize;
      z-index: 10;
    }
    
    /* Read-only editor styles */
    .ProseMirror[contenteditable=false] .resize-handle {
      display: none !important;
    }
    
    /* Image alignment styles */
    .ProseMirror .resizable-image-node[data-align="left"] {
      float: left;
      margin-right: 1em;
      margin-bottom: 0.5em;
    }
    
    .ProseMirror .resizable-image-node[data-align="center"] {
      display: block;
      margin-left: auto;
      margin-right: auto;
      margin-bottom: 0.5em;
    }
    
    .ProseMirror .resizable-image-node[data-align="right"] {
      float: right;
      margin-left: 1em;
      margin-bottom: 0.5em;
    }
  `;
}; 