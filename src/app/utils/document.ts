import { Document as DocInterface, Section } from '../types';
import mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';

// Create a new empty document
export const createEmptyDocument = (title: string = 'Untitled Document', category: string = 'Uncategorized'): DocInterface => {
  return {
    id: uuidv4(),
    title,
    category,
    sections: [createEmptySection('Introduction')],
    lastModified: Date.now(),
    version: 1,
    tags: []
  };
};

// Create a new empty section
export const createEmptySection = (title: string = 'Untitled Section'): Section => {
  return {
    id: uuidv4(),
    title,
    content: '<p>Add content here...</p>'
  };
};

/**
 * Process images from a Word document converting them to base64 data URLs
 */
const processImages = (
  htmlString: string,
  imageBuffers: { [key: string]: ArrayBuffer }
): string => {
  if (typeof window === 'undefined') return htmlString;
  
  const tempElement = window.document.createElement('div');
  tempElement.innerHTML = htmlString;
  
  // Find all images
  const images = tempElement.querySelectorAll('img');
  
  images.forEach(img => {
    const src = img.getAttribute('src');
    if (src && src.startsWith('word/media/')) {
      const mediaId = src.replace(/^word\/media\//, '');
      if (imageBuffers[mediaId]) {
        // Convert ArrayBuffer to base64
        const base64 = arrayBufferToBase64(imageBuffers[mediaId]);
        const mimeType = getMimeTypeFromImageName(mediaId);
        const dataUrl = `data:${mimeType};base64,${base64}`;
        
        // Set the src to the data URL
        img.setAttribute('src', dataUrl);
        
        // Make images resizable with TipTap
        img.classList.add('max-w-full', 'rounded-md');
        img.setAttribute('draggable', 'true');
        img.style.cursor = 'pointer';
      }
    }
  });
  
  return tempElement.innerHTML;
};

/**
 * Convert an ArrayBuffer to a base64 string
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return typeof window !== 'undefined' ? window.btoa(binary) : '';
};

/**
 * Get MIME type based on image filename
 */
const getMimeTypeFromImageName = (name: string): string => {
  const extension = name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg'; // Default to JPEG
  }
};

// Import document from Word file
export const importFromWordFile = async (file: File): Promise<DocInterface> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract images separately
    const imageBuffers: { [key: string]: ArrayBuffer } = {};
    
    // Configure mammoth with image extraction
    const options = {
      arrayBuffer,
      convertImage: (element: any, callback: any) => {
        // Store image in our buffer
        const imageId = element.src.value; // This is usually like 'word/media/image1.png'
        const mediaId = imageId.replace(/^word\/media\//, '');
        
        element.read('binary').then((imageBinary: ArrayBuffer) => {
          imageBuffers[mediaId] = imageBinary;
          
          // Return the original src for now; we'll replace it later
          return callback(null, { src: imageId });
        });
      }
    };
    
    const result = await mammoth.convertToHtml(options);
    
    // Process the HTML to replace image references with data URLs
    const processedHtml = processImages(result.value, imageBuffers);
    
    // Ensure the HTML is properly formatted for TipTap
    const sanitizedHtml = sanitizeHtml(processedHtml);
    
    // Extract file name without extension for the document title
    const title = file.name.replace(/\.[^/.]+$/, '');
    
    // Create a single section with all content
    const section: Section = {
      id: uuidv4(),
      title: "Document Content",
      content: sanitizedHtml
    };
    
    // Create document structure
    const document: DocInterface = {
      id: uuidv4(),
      title,
      category: 'Imported',
      lastModified: Date.now(),
      version: 1,
      sections: [section],
      tags: [],
      equipmentTags: [],
      operationsTags: []
    };
    
    return document;
  } catch (error) {
    console.error('Error importing Word document:', error);
    throw new Error('Failed to import Word document');
  }
};

/**
 * Sanitize HTML to ensure it's properly formatted for TipTap editor
 */
const sanitizeHtml = (html: string): string => {
  if (typeof window === 'undefined' || !html) return html || '';
  
  try {
    // Create a temporary element
    const tempElement = window.document.createElement('div');
    tempElement.innerHTML = html;
    
    // If the HTML is empty or only contains whitespace, return a paragraph
    if (!tempElement.textContent?.trim()) {
      return '<p>Add content here...</p>';
    }
    
    // Remove any script tags for security
    const scripts = tempElement.querySelectorAll('script');
    scripts.forEach((script) => script.remove());
    
    // Make sure block-level content is wrapped in appropriate tags
    // This helps with TipTap's content model expectations
    const directTextNodes = Array.from(tempElement.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
    
    directTextNodes.forEach((textNode) => {
      if (textNode.textContent?.trim()) {
        const p = window.document.createElement('p');
        p.textContent = textNode.textContent;
        textNode.parentNode?.replaceChild(p, textNode);
      }
    });
    
    return tempElement.innerHTML;
  } catch (e) {
    console.error('Error sanitizing HTML:', e);
    return html || '<p>Add content here...</p>';
  }
};

// Split HTML content by headings (h1, h2)
export const splitHtmlByHeadings = (html: string): Section[] => {
  if (typeof window === 'undefined') return [{ id: uuidv4(), title: 'Main Content', content: html }];
  
  // Create a temporary element to work with the HTML
  const tempElement = window.document.createElement('div');
  tempElement.innerHTML = html;
  
  // Find all heading elements
  const headings = Array.from(tempElement.querySelectorAll('h1, h2'));
  
  if (headings.length === 0) {
    // If no headings found, return a single section with the entire content
    return [{
      id: uuidv4(),
      title: 'Main Content',
      content: html
    }];
  }
  
  const sections: Section[] = [];
  
  // Find the content before the first heading (introduction)
  if (headings[0].previousSibling) {
    let introContent = '';
    let currentNode = tempElement.firstChild;
    
    // Gather all content before the first heading
    while (currentNode && currentNode !== headings[0]) {
      const tempDiv = window.document.createElement('div');
      tempDiv.appendChild(currentNode.cloneNode(true));
      introContent += tempDiv.innerHTML;
      currentNode = currentNode.nextSibling;
    }
    
    if (introContent.trim()) {
      sections.push({
        id: uuidv4(),
        title: 'Introduction',
        content: introContent
      });
    }
  }
  
  // Process each heading and its following content
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const nextHeading = i < headings.length - 1 ? headings[i + 1] : null;
    const sectionTitle = heading.textContent?.trim() || `Section ${i + 1}`;
    
    // Create a container for this section's content
    const sectionContainer = window.document.createElement('div');
    
    // Start with the heading itself
    sectionContainer.appendChild(heading.cloneNode(true));
    
    // Get all elements between this heading and the next
    let currentNode = heading.nextSibling;
    
    while (currentNode && currentNode !== nextHeading) {
      sectionContainer.appendChild(currentNode.cloneNode(true));
      currentNode = currentNode.nextSibling;
    }
    
    // Create the section
    sections.push({
      id: uuidv4(),
      title: sectionTitle,
      content: sectionContainer.innerHTML
    });
  }
  
  return sections;
};

// Merge sections together
export const mergeSections = (document: DocInterface, sectionIndices: number[]): DocInterface => {
  if (typeof window === 'undefined' || sectionIndices.length < 2) return document;
  
  // Sort indices to ensure we're merging in order
  const sortedIndices = [...sectionIndices].sort((a, b) => a - b);
  
  // Create a copy of the document to work with
  const newDocument = { ...document, sections: [...document.sections] };
  
  // Get the first section to merge into
  const targetSectionIndex = sortedIndices[0];
  const targetSection = { ...newDocument.sections[targetSectionIndex] };
  
  // Create a div to hold merged content
  const mergedContent = window.document.createElement('div');
  mergedContent.innerHTML = targetSection.content;
  
  // Get the sections to merge and add their content
  for (let i = 1; i < sortedIndices.length; i++) {
    const sectionIndex = sortedIndices[i];
    const section = newDocument.sections[sectionIndex];
    
    const sectionDiv = window.document.createElement('div');
    sectionDiv.innerHTML = section.content;
    
    // Add a divider between sections
    const divider = window.document.createElement('hr');
    mergedContent.appendChild(divider);
    
    // Add the section content
    while (sectionDiv.firstChild) {
      mergedContent.appendChild(sectionDiv.firstChild);
    }
  }
  
  // Update the target section with merged content
  targetSection.content = mergedContent.innerHTML;
  newDocument.sections[targetSectionIndex] = targetSection;
  
  // Remove the merged sections (in reverse order to avoid index shifting)
  for (let i = sortedIndices.length - 1; i > 0; i--) {
    newDocument.sections.splice(sortedIndices[i], 1);
  }
  
  return newDocument;
};

// Split a section at a specific offset
export const splitSection = (document: DocInterface, sectionIndex: number, splitOffset: number, newTitle: string): DocInterface => {
  if (typeof window === 'undefined') return document;
  
  // Create a copy of the document
  const newDocument = { ...document, sections: [...document.sections] };
  
  // Get the section to split
  const section = { ...newDocument.sections[sectionIndex] };
  
  // Create a temporary element to manipulate the content
  const tempElement = window.document.createElement('div');
  tempElement.innerHTML = section.content;
  
  // Split the content at the given offset
  const firstHalf = window.document.createElement('div');
  const secondHalf = window.document.createElement('div');
  
  let currentNode = tempElement.firstChild;
  let currentOffset = 0;
  let splitFound = false;
  
  while (currentNode && !splitFound) {
    const nodeLength = currentNode.textContent?.length || 0;
    
    if (currentOffset + nodeLength >= splitOffset) {
      // This node contains the split point
      if (currentNode.nodeType === Node.TEXT_NODE && currentNode.textContent) {
        // Split text node
        const beforeText = currentNode.textContent.substring(0, splitOffset - currentOffset);
        const afterText = currentNode.textContent.substring(splitOffset - currentOffset);
        
        firstHalf.appendChild(window.document.createTextNode(beforeText));
        secondHalf.appendChild(window.document.createTextNode(afterText));
        splitFound = true;
      } else {
        // Clone the node for both halves
        firstHalf.appendChild(currentNode.cloneNode(true));
        secondHalf.appendChild(currentNode.cloneNode(true));
        splitFound = true;
      }
    } else {
      // Add the entire node to the first half
      firstHalf.appendChild(currentNode.cloneNode(true));
      currentOffset += nodeLength;
    }
    
    currentNode = currentNode.nextSibling;
  }
  
  // Add remaining nodes to the second half
  while (currentNode) {
    secondHalf.appendChild(currentNode.cloneNode(true));
    currentNode = currentNode.nextSibling;
  }
  
  // Update the original section with the first half
  section.content = firstHalf.innerHTML;
  newDocument.sections[sectionIndex] = section;
  
  // Create a new section with the second half
  const newSection: Section = {
    id: uuidv4(),
    title: newTitle,
    content: secondHalf.innerHTML
  };
  
  // Insert the new section after the original
  newDocument.sections.splice(sectionIndex + 1, 0, newSection);
  
  return newDocument;
}; 