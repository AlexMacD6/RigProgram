'use client';

import { Document } from '../types';
import { useState } from 'react';
import LightEditor from './LightEditor';
import { addToRecentlyViewed } from '../utils/storage';
import { cn } from '../utils/ui';
import { CoreIcons } from './EditorIcons';

interface DocumentViewerProps {
  document: Document;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

const DocumentViewer = ({ document, onEdit, onDelete, className }: DocumentViewerProps) => {
  const [activeSection, setActiveSection] = useState<number>(0);
  
  // Track that this document was viewed
  if (typeof window !== 'undefined') {
    addToRecentlyViewed(document.id);
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="bg-rc-fg border-b border-gray-200 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-rc-bg font-poppins">{document.title}</h1>
          <div className="flex gap-2 items-center mt-1">
            <span className="px-2 py-1 bg-gray-100 text-rc-bg text-xs rounded-full">
              {document.category}
            </span>
            {document.isFeatured && (
              <span className="px-2 py-1 bg-rc-accent/10 text-rc-bg text-xs rounded-full flex items-center">
                <CoreIcons.Star size={12} className="fill-rc-accent text-rc-accent mr-1" />
                Featured
              </span>
            )}
            
            {/* Equipment Tags */}
            {document.equipmentTags && document.equipmentTags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {document.equipmentTags.map((tag) => (
                  <span 
                    key={tag} 
                    className="px-2 py-1 bg-gray-100 text-rc-bg text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* Operations Tags */}
            {document.operationsTags && document.operationsTags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {document.operationsTags.map((tag) => (
                  <span 
                    key={tag} 
                    className="px-2 py-1 bg-gray-100 text-rc-bg text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-2 text-gray-500 text-sm">
            <span>Version {document.version}</span>
            <span className="mx-2">•</span>
            <span>Updated {new Date(document.lastModified).toLocaleString()}</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {onEdit && (
            <button 
              onClick={onEdit}
              className="px-4 py-2 bg-rc-accent hover:bg-rc-accent/90 text-rc-bg rounded-md min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-rc-accent/50"
            >
              Edit
            </button>
          )}
          
          {onDelete && (
            <button 
              onClick={() => {
                if (confirm('Are you sure you want to delete this document?')) {
                  onDelete();
                }
              }}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              Delete
            </button>
          )}
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Section Navigation Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
          <h2 className="text-lg font-medium mb-4 font-poppins">Sections</h2>
          <ul className="space-y-1">
            {document.sections.map((section, index) => (
              <li key={section.id}>
                <button
                  onClick={() => setActiveSection(index)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-rc-accent/50",
                    activeSection === index ? "bg-rc-accent/10 text-rc-bg font-medium" : "text-gray-700"
                  )}
                >
                  {section.title || `Section ${index + 1}`}
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {document.sections[activeSection] && (
            <>
              <h2 className="text-xl font-bold mb-4 font-poppins">{document.sections[activeSection].title || `Section ${activeSection + 1}`}</h2>
              <LightEditor 
                initialContent={document.sections[activeSection].content || '<p>No content</p>'} 
                onChange={() => {}} 
                readOnly={true} 
                className="prose max-w-none"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer; 