import { Document, DocumentRevision, RecentActivity } from '../types';

// Get all documents from local storage
export const getDocuments = (): Document[] => {
  if (typeof window === 'undefined') return [];
  const storedDocs = localStorage.getItem('documents');
  return storedDocs ? JSON.parse(storedDocs) : [];
};

// Save all documents to local storage
export const saveDocuments = (documents: Document[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('documents', JSON.stringify(documents));
};

// Get a single document by ID
export const getDocumentById = (id: string): Document | null => {
  const documents = getDocuments();
  return documents.find(doc => doc.id === id) || null;
};

// Save a single document (add or update)
export const saveDocument = (document: Document): void => {
  const documents = getDocuments();
  const existingIndex = documents.findIndex(doc => doc.id === document.id);
  
  if (existingIndex >= 0) {
    // Update existing document
    documents[existingIndex] = {
      ...document,
      lastModified: Date.now(),
      version: documents[existingIndex].version + 1
    };
  } else {
    // Add new document
    documents.push({
      ...document,
      lastModified: Date.now(),
      version: 1
    });
  }
  
  saveDocuments(documents);
  
  // Save to revision history
  saveDocumentRevision(document);
  
  // Log the activity
  logActivity(`Document "${document.title}" was ${existingIndex >= 0 ? 'updated' : 'created'}`);
};

// Delete a document by ID
export const deleteDocument = (id: string): void => {
  const documents = getDocuments();
  const documentToDelete = documents.find(doc => doc.id === id);
  
  if (documentToDelete) {
    const newDocuments = documents.filter(doc => doc.id !== id);
    saveDocuments(newDocuments);
    logActivity(`Document "${documentToDelete.title}" was deleted`);
  }
};

// Save document revision to history
export const saveDocumentRevision = (document: Document): void => {
  if (typeof window === 'undefined') return;
  
  const revisionKey = `documentRevisions-${document.id}`;
  const storedRevisions = localStorage.getItem(revisionKey);
  const revisions: DocumentRevision[] = storedRevisions ? JSON.parse(storedRevisions) : [];
  
  // Create new revision
  const newRevision: DocumentRevision = {
    id: crypto.randomUUID(),
    documentId: document.id,
    timestamp: Date.now(),
    version: document.version,
    documentData: { ...document }
  };
  
  // Add to revisions array (limit to last 10 revisions)
  revisions.push(newRevision);
  if (revisions.length > 10) {
    revisions.shift(); // Remove oldest revision
  }
  
  localStorage.setItem(revisionKey, JSON.stringify(revisions));
};

// Get document revisions by document ID
export const getDocumentRevisions = (documentId: string): DocumentRevision[] => {
  if (typeof window === 'undefined') return [];
  
  const revisionKey = `documentRevisions-${documentId}`;
  const storedRevisions = localStorage.getItem(revisionKey);
  return storedRevisions ? JSON.parse(storedRevisions) : [];
};

// Log user activity
export const logActivity = (message: string, user?: string): void => {
  if (typeof window === 'undefined') return;
  
  const activity: RecentActivity = {
    message,
    timestamp: Date.now(),
    user
  };
  
  const storedActivities = localStorage.getItem('recentActivity');
  const activities: RecentActivity[] = storedActivities ? JSON.parse(storedActivities) : [];
  
  // Add new activity at the beginning
  activities.unshift(activity);
  
  // Limit to 50 most recent activities
  if (activities.length > 50) {
    activities.pop();
  }
  
  localStorage.setItem('recentActivity', JSON.stringify(activities));
};

// Get recent activities
export const getRecentActivities = (): RecentActivity[] => {
  if (typeof window === 'undefined') return [];
  
  const storedActivities = localStorage.getItem('recentActivity');
  return storedActivities ? JSON.parse(storedActivities) : [];
};

// Track recently viewed documents
export const addToRecentlyViewed = (documentId: string): void => {
  if (typeof window === 'undefined') return;
  
  const storedRecent = localStorage.getItem('recentlyViewed');
  const recentIds: string[] = storedRecent ? JSON.parse(storedRecent) : [];
  
  // Remove if already exists
  const updatedRecent = recentIds.filter(id => id !== documentId);
  
  // Add to beginning
  updatedRecent.unshift(documentId);
  
  // Limit to 10
  if (updatedRecent.length > 10) {
    updatedRecent.pop();
  }
  
  localStorage.setItem('recentlyViewed', JSON.stringify(updatedRecent));
};

// Get recently viewed documents
export const getRecentlyViewedDocuments = (): Document[] => {
  if (typeof window === 'undefined') return [];
  
  const storedRecent = localStorage.getItem('recentlyViewed');
  const recentIds: string[] = storedRecent ? JSON.parse(storedRecent) : [];
  
  const allDocuments = getDocuments();
  
  // Map IDs to actual documents
  return recentIds
    .map(id => allDocuments.find(doc => doc.id === id))
    .filter((doc): doc is Document => doc !== undefined);
};

// Full-text search across documents
export const searchDocuments = (query: string): Array<{document: Document, section: number, matchText: string}> => {
  if (!query || query.trim() === '') return [];
  
  const documents = getDocuments();
  const results: Array<{document: Document, section: number, matchText: string}> = [];
  
  const lowerQuery = query.toLowerCase();
  
  documents.forEach(document => {
    // Search in title
    if (document.title.toLowerCase().includes(lowerQuery)) {
      results.push({
        document,
        section: -1, // -1 indicates match in title
        matchText: document.title
      });
    }
    
    // Search in sections
    document.sections.forEach((section, index) => {
      if (section.title.toLowerCase().includes(lowerQuery)) {
        results.push({
          document,
          section: index,
          matchText: section.title
        });
      }
      
      // Search in content
      if (section.content.toLowerCase().includes(lowerQuery)) {
        // Extract context around match
        const contentText = stripHtml(section.content);
        const matchIndex = contentText.toLowerCase().indexOf(lowerQuery);
        const start = Math.max(0, matchIndex - 50);
        const end = Math.min(contentText.length, matchIndex + query.length + 50);
        const matchContext = contentText.substring(start, end);
        
        results.push({
          document,
          section: index,
          matchText: matchContext
        });
      }
    });
  });
  
  return results;
};

// Helper to strip HTML for search excerpt
const stripHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}; 