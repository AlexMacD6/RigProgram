'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FileText } from 'lucide-react';
import { getDocumentById } from '../utils/storage';

const DocumentLinkRenderer = () => {
  const router = useRouter();

  useEffect(() => {
    // Helper function to check if an element is inside an editor
    const isElementInEditor = (element: HTMLElement): boolean => {
      let current: HTMLElement | null = element;
      
      while (current) {
        // Check for TipTap editor or its content area
        if (
          current.classList.contains('ProseMirror') || 
          current.classList.contains('tiptap-editor') ||
          current.classList.contains('EditorContent') ||
          current.getAttribute('data-editor-id') ||
          current.classList.contains('editor-container')
        ) {
          return true;
        }
        current = current.parentElement;
      }
      
      return false;
    };

    // Attach click handler to document links
    const handleDocumentLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Ignore clicks inside editors
      if (isElementInEditor(target)) {
        return;
      }
      
      // Check if the click was on a document link or its child element
      let current = target;
      let documentLinkElement: HTMLElement | null = null;

      // Traverse up the DOM to find if we clicked on a document link or its child
      while (current && !documentLinkElement) {
        if (current.hasAttribute('data-document-id')) {
          documentLinkElement = current;
        } else {
          current = current.parentElement as HTMLElement;
          if (!current || isElementInEditor(current)) {
            // Stop traversing if we reach an editor
            break;
          }
        }
      }

      if (documentLinkElement) {
        event.preventDefault();
        const documentId = documentLinkElement.getAttribute('data-document-id');
        if (documentId) {
          // Find the closest parent that has a data-source-document-id or use the current page URL
          const currentPath = window.location.pathname;
          let sourceDocumentId = '';
          
          // Check if we're already on a document page
          const documentPathMatch = currentPath.match(/\/document\/([^\/]+)/);
          if (documentPathMatch && documentPathMatch[1]) {
            sourceDocumentId = documentPathMatch[1];
          }
          
          // Navigate to the document with source document reference
          router.push(`/document/${documentId}?from=${sourceDocumentId}`);
        }
      }
    };

    // Observe DOM to add styling to document links
    const addDocumentLinkStyles = () => {
      // Get all active editor elements so we can exclude them
      const editorElements = Array.from(document.querySelectorAll('.ProseMirror, .EditorContent, [data-editor-id]'));
      
      // Find document links that are not inside editors
      document.querySelectorAll('span.document-link').forEach(element => {
        // Skip links inside editors
        if (editorElements.some(editor => editor.contains(element))) {
          return;
        }
        
        // Skip if the element itself is inside an editor
        if (isElementInEditor(element as HTMLElement)) {
          return;
        }
        
        const documentId = element.getAttribute('data-document-id');
        const documentTitle = element.getAttribute('data-document-title') || 'Document';
        
        if (documentId) {
          const docData = getDocumentById(documentId);
          
          // Only style if not already styled
          if (!element.classList.contains('document-link-styled')) {
            element.classList.add('document-link-styled');
            
            // Style the link with gold background
            element.classList.add(
              'inline-flex', 
              'items-center', 
              'px-2', 
              'py-1', 
              'rounded', 
              'bg-rc-accent', 
              'text-rc-bg', 
              'text-sm', 
              'cursor-pointer',
              'hover:opacity-90',
              'transition-opacity'
            );
            
            // If document not found, show warning styling
            if (!docData) {
              element.classList.remove('bg-rc-accent', 'text-rc-bg');
              element.classList.add('bg-gray-100', 'text-gray-700');
            }
            
            // Replace inner content with styled link
            const existingText = element.textContent || '';
            element.innerHTML = '';

            const icon = window.document.createElement('span');
            icon.className = 'mr-1 ' + (docData ? 'text-rc-bg' : 'text-gray-500');
            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
            
            // Use the text that was already in the span, or fallback to document title if available
            const text = window.document.createElement('span');
            text.textContent = existingText || (docData ? docData.title : 'Document not found');
            
            element.appendChild(icon);
            element.appendChild(text);
          }
        }
      });
    };

    // Add handlers
    document.addEventListener('click', handleDocumentLinkClick);
    
    // Run initial styling
    addDocumentLinkStyles();

    // Setup mutation observer to handle newly added document links
    const observer = new MutationObserver(mutations => {
      let shouldStyle = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          // Skip mutations inside editors
          if (isElementInEditor(mutation.target as HTMLElement)) {
            return;
          }
          
          // Find any editor nodes that we should completely skip
          const editorNodes = Array.from(document.querySelectorAll('.ProseMirror, .EditorContent, [data-editor-id]'));
          
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              
              // Skip if node is or contains an editor
              if (element.classList && (
                  element.classList.contains('ProseMirror') ||
                  element.classList.contains('EditorContent') ||
                  element.getAttribute('data-editor-id')
              )) {
                return;
              }
              
              // Skip if node is inside an editor
              if (editorNodes.some(editor => editor.contains(element))) {
                return;
              }
              
              // Only look for document links in non-editor elements
              if (!isElementInEditor(element) && (
                element.querySelector('.document-link') || 
                (element.classList && element.classList.contains('document-link'))
              )) {
                shouldStyle = true;
              }
            }
          });
        }
      });
      
      if (shouldStyle) {
        // Use a short timeout to avoid interfering with editor focus
        setTimeout(addDocumentLinkStyles, 100);
      }
    });
    
    // Observe the document body but exclude editor areas
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    return () => {
      document.removeEventListener('click', handleDocumentLinkClick);
      observer.disconnect();
    };
  }, [router]);

  // This component doesn't render anything, it just attaches event handlers
  return null;
};

export default DocumentLinkRenderer; 