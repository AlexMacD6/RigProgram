'use client';

import { useState, useEffect } from 'react';
import { getDocuments } from '../utils/storage';
import { Document } from '../types';
import { FolderOpen, Search, X } from 'lucide-react';
import { cn } from '../utils/ui';

interface DocumentSelectorPopupProps {
  onSelect: (documentId: string) => void;
  onCancel: () => void;
}

const DocumentSelectorPopup = ({ onSelect, onCancel }: DocumentSelectorPopupProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  
  // Load documents on mount
  useEffect(() => {
    const docs = getDocuments();
    setDocuments(docs);
    setFilteredDocuments(docs);
  }, []);
  
  // Filter documents when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDocuments(documents);
      return;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = documents.filter(doc => 
      doc.title.toLowerCase().includes(lowerSearchTerm) || 
      doc.category.toLowerCase().includes(lowerSearchTerm)
    );
    
    setFilteredDocuments(filtered);
  }, [searchTerm, documents]);
  
  // Group documents by category
  const documentsByCategory = filteredDocuments.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);
  
  const handleConfirm = () => {
    if (selectedDocumentId) {
      onSelect(selectedDocumentId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-rc-bg">Link to Document</h2>
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-rc-bg"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search documents by title or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rc-accent/50 focus:border-rc-accent"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {Object.keys(documentsByCategory).length > 0 ? (
            Object.keys(documentsByCategory)
              .sort()
              .map(category => (
                <div key={category} className="mb-6">
                  <h3 className="flex items-center text-sm font-medium text-rc-bg bg-gray-100 p-2 rounded-md mb-2">
                    <FolderOpen size={16} className="mr-2 text-rc-accent" />
                    {category}
                  </h3>
                  <ul className="space-y-1 pl-2">
                    {documentsByCategory[category].map(doc => (
                      <li key={doc.id}>
                        <button
                          onClick={() => setSelectedDocumentId(doc.id)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md text-sm",
                            selectedDocumentId === doc.id
                              ? "bg-rc-accent text-rc-bg font-medium"
                              : "text-gray-700 hover:bg-gray-100 hover:text-rc-accent"
                          )}
                        >
                          {doc.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
          ) : (
            <div className="text-center text-gray-500 py-10">
              {searchTerm ? 'No documents match your search.' : 'No documents found.'}
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 border-t border-gray-200 p-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 min-h-[44px] min-w-[80px] focus:outline-none focus:ring-2 focus:ring-rc-accent/50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedDocumentId}
            className={cn(
              "px-4 py-2 bg-rc-accent text-rc-bg rounded-md min-h-[44px] min-w-[80px] focus:outline-none focus:ring-2 focus:ring-rc-accent/50",
              !selectedDocumentId && "opacity-50 cursor-not-allowed"
            )}
          >
            Link Document
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentSelectorPopup; 