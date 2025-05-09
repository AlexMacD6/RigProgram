'use client';

import { Document, Section, equipmentCategories, operationCategories } from '../types';
import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createEmptySection, importFromWordFile } from '../utils/document';
import { cn } from '../utils/ui';
import React from 'react';
import { CoreIcons } from './EditorIcons';
import { createResizableImageExtension } from './EditorExtensions';
import ResizableImageNode from './ResizableImageNode';

// Lazy load the Editor component to improve initial load time
const Editor = lazy(() => import('./Editor'));

interface DocumentEditorProps {
  document?: Document;
  onSave: (document: Document) => void;
  onCancel: () => void;
  className?: string;
}

const DocumentEditor = ({ document, onSave, onCancel, className }: DocumentEditorProps) => {
  const [title, setTitle] = useState<string>(document?.title || '');
  const [category, setCategory] = useState<string>(document?.category || '');
  const [isFeatured, setIsFeatured] = useState<boolean>(document?.isFeatured || false);
  const [sections, setSections] = useState<Section[]>(document?.sections || [createEmptySection()]);
  const [activeSection, setActiveSection] = useState<number>(0);
  const [equipmentTags, setEquipmentTags] = useState<string[]>(document?.equipmentTags || []);
  const [operationsTags, setOperationsTags] = useState<string[]>(document?.operationsTags || []);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [editorVisible, setEditorVisible] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [lastAutoSave, setLastAutoSave] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Suggested categories
  const categories = [
    "Master Drilling Program",
    "Best Practices",
  ];
  
  // Store draft document in local storage to prevent data loss
  const documentDraftKey = document?.id ? `draft_${document.id}` : 'draft_new_document';

  // Ensure at least one section exists
  useEffect(() => {
    if (sections.length === 0) {
      setSections([createEmptySection()]);
    }
  }, [sections]);

  // Show editor after initial render to improve performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setEditorVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Warn about unsaved changes when leaving the page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        // Standard way to show a confirmation dialog when leaving the page
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Track changes to document data to set unsaved changes flag
  useEffect(() => {
    // Don't set on initial load
    if (!document) return;
    
    setHasUnsavedChanges(true);
  }, [title, category, isFeatured, sections, equipmentTags, operationsTags]);

  // Autosave functionality
  useEffect(() => {
    // Skip initial load
    if (!hasUnsavedChanges) return;

    const autoSaveTimer = setTimeout(() => {
      const draftDocument = {
        title,
        category,
        isFeatured,
        sections,
        equipmentTags,
        operationsTags,
        timestamp: Date.now()
      };

      // Save to local storage
      if (typeof window !== 'undefined') {
        localStorage.setItem(documentDraftKey, JSON.stringify(draftDocument));
        setLastAutoSave(Date.now());
      }
    }, 10000); // Autosave every 10 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [title, category, isFeatured, sections, equipmentTags, operationsTags, hasUnsavedChanges, documentDraftKey]);

  // Load draft on initial render if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedDraft = localStorage.getItem(documentDraftKey);
        if (savedDraft) {
          const draftData = JSON.parse(savedDraft);
          
          // Check if draft is newer than the document
          if (!document || draftData.timestamp > document.lastModified) {
            const shouldRestore = window.confirm(
              `A more recent draft of this document was found (${new Date(draftData.timestamp).toLocaleTimeString()}). Would you like to restore it?`
            );
            
            if (shouldRestore) {
              setTitle(draftData.title);
              setCategory(draftData.category);
              setIsFeatured(draftData.isFeatured);
              setSections(draftData.sections);
              setEquipmentTags(draftData.equipmentTags);
              setOperationsTags(draftData.operationsTags);
              setLastAutoSave(draftData.timestamp);
            } else {
              // Delete the draft if user doesn't want to restore
              localStorage.removeItem(documentDraftKey);
            }
          }
        }
      } catch (error) {
        console.error('Error loading draft:', error);
        // If there's an error parsing the draft, remove it
        localStorage.removeItem(documentDraftKey);
      }
    }
  }, [document, documentDraftKey]);

  // Handle keyboard shortcuts for sections
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only if Control/Command key is pressed
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'S' || e.key === 's') {
          // Ctrl+S to save
          e.preventDefault();
          if (title && sections.length > 0) {
            // Call the save function directly here to avoid the circular reference
            if (typeof onSave === 'function') {
              const savedDocument: Document = {
                id: document?.id || uuidv4(),
                title: title || 'Untitled Document',
                category: category || 'Uncategorized',
                isFeatured,
                tags: [], // Empty array as we removed tags feature
                sections,
                lastModified: Date.now(),
                version: document?.version || 1,
                equipmentTags,
                operationsTags
              };
              
              // Clear the autosaved draft when successfully saved
              if (typeof window !== 'undefined') {
                localStorage.removeItem(documentDraftKey);
              }
              
              setHasUnsavedChanges(false);
              setLastAutoSave(null);
              onSave(savedDocument);
            }
          }
        } else if (e.key === 'n' || e.key === 'N') {
          // Ctrl+N to add new section
          e.preventDefault();
          addSection();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [title, sections, onSave, document, isFeatured, category, equipmentTags, operationsTags, documentDraftKey]);

  const handleWordUpload = async (file: File) => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      // Only process .docx or .doc files
      if (!file.name.match(/\.(docx|doc)$/i)) {
        alert('Please upload a valid Word document (.docx or .doc)');
        setIsUploading(false);
        return;
      }
      
      const importedDoc = await importFromWordFile(file);
      
      // Update form state with imported document data
      setTitle(importedDoc.title);
      setSections(importedDoc.sections);
      
      // If this is a new document (not editing an existing one), set category to Imported
      if (!document) {
        setCategory('Imported');
      }
      
      setIsUploading(false);
    } catch (error) {
      console.error('Error importing Word document:', error);
      alert('Failed to import Word document. Please try again.');
      setIsUploading(false);
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleWordUpload(file);
    }
    
    // Reset the input so the same file can be selected again
    if (e.target) {
      e.target.value = '';
    }
  };

  const addSection = () => {
    const newSection = createEmptySection();
    setSections([...sections, newSection]);
    // Switch to the new section
    setActiveSection(sections.length);

    // Set focus to the section title input after a short delay
    setTimeout(() => {
      const sectionTitleInput = window.document.getElementById('section-title');
      if (sectionTitleInput) {
        sectionTitleInput.focus();
      }
    }, 100);
  };

  const removeSection = (index: number) => {
    if (sections.length <= 1) {
      return; // Always keep at least one section
    }
    
    const newSections = [...sections];
    newSections.splice(index, 1);
    setSections(newSections);
    
    // Adjust active section if needed
    if (activeSection === index) {
      setActiveSection(Math.max(0, index - 1));
    } else if (activeSection > index) {
      setActiveSection(activeSection - 1);
    }
  };

  const updateSectionContent = (index: number, content: string) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], content };
    setSections(newSections);
  };

  const updateSectionTitle = (index: number, title: string) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], title };
    setSections(newSections);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === sections.length - 1)
    ) {
      return; // Can't move past the boundaries
    }
    
    const newSections = [...sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap the positions
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    
    setSections(newSections);
    setActiveSection(newIndex);
  };

  const toggleFeatured = () => {
    setIsFeatured(!isFeatured);
  };

  const toggleEquipmentTag = (tag: string) => {
    if (equipmentTags.includes(tag)) {
      setEquipmentTags(equipmentTags.filter(t => t !== tag));
    } else {
      setEquipmentTags([...equipmentTags, tag]);
    }
  };

  const toggleOperationTag = (tag: string) => {
    if (operationsTags.includes(tag)) {
      setOperationsTags(operationsTags.filter(t => t !== tag));
    } else {
      setOperationsTags([...operationsTags, tag]);
    }
  };

  const handleSave = () => {
    const savedDocument: Document = {
      id: document?.id || uuidv4(),
      title: title || 'Untitled Document',
      category: category || 'Uncategorized',
      isFeatured,
      tags: [], // Empty array as we removed tags feature
      sections,
      lastModified: Date.now(),
      version: document?.version || 1,
      equipmentTags,
      operationsTags
    };
    
    // Clear the autosaved draft when successfully saved
    if (typeof window !== 'undefined') {
      localStorage.removeItem(documentDraftKey);
    }
    
    setHasUnsavedChanges(false);
    setLastAutoSave(null);
    onSave(savedDocument);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmLeave) {
        return;
      }
    }
    onCancel();
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="bg-rc-fg border-b border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-rc-bg font-poppins">{document ? 'Edit Document' : 'Create Document'}</h1>
          
          <div className="flex items-center space-x-2">
            {/* Word Upload Button */}
            <button
              onClick={triggerFileUpload}
              disabled={isUploading}
              className={cn(
                "flex items-center px-4 py-2 rounded-md text-sm min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-rc-accent/50",
                isUploading
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-rc-bg text-rc-fg hover:bg-rc-bg/90"
              )}
              title="Import from Word Document"
              aria-label="Import from Word Document"
            >
              {isUploading ? (
                <>
                  <div className="mr-2 h-4 w-4 border-t-2 border-b-2 border-rc-fg rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <CoreIcons.FileSpreadsheet size={16} className="mr-2" />
                  Import Word
                </>
              )}
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".doc,.docx"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            {/* Featured Button */}
            <button 
              onClick={toggleFeatured}
              className={cn(
                "flex items-center px-4 py-2 rounded-md text-sm min-h-[44px] min-w-[44px] border focus:outline-none focus:ring-2 focus:ring-rc-accent/50",
                isFeatured 
                  ? "bg-rc-accent/10 border-rc-accent" 
                  : "border-gray-300 hover:bg-gray-50"
              )}
              title={isFeatured ? "Unmark as featured" : "Mark as featured"}
              aria-label={isFeatured ? "Unmark as featured" : "Mark as featured"}
              aria-pressed={isFeatured}
            >
              <CoreIcons.Star 
                size={16} 
                className={cn(
                  "mr-2",
                  isFeatured ? "fill-rc-accent text-rc-accent" : "text-gray-400"
                )}
              />
              {isFeatured ? "Featured" : "Feature"}
            </button>
            
            {/* Save indicator */}
            {hasUnsavedChanges && (
              <div className="px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm flex items-center">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
                <span>Unsaved changes</span>
                {lastAutoSave && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Autosaved: {new Date(lastAutoSave).toLocaleTimeString()})
                  </span>
                )}
              </div>
            )}
            
            <button 
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-rc-bg min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-rc-accent/50"
              aria-label="Cancel"
            >
              Cancel
            </button>
            
            <button 
              onClick={handleSave}
              className="px-4 py-2 bg-rc-accent hover:bg-rc-accent/90 text-rc-bg rounded-md font-medium min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-rc-accent/50 flex items-center"
              disabled={!title || sections.length === 0}
              aria-label="Save document"
              title="Save document (Ctrl+S)"
            >
              <span>Save</span>
              <span className="ml-2 text-xs bg-rc-bg/20 px-1.5 py-0.5 rounded">Ctrl+S</span>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="doc-title" className="block text-sm font-medium text-rc-bg mb-1">Title</label>
            <input
              id="doc-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rc-accent/50 focus:border-rc-accent"
              required
            />
          </div>
          
          <div>
            <label htmlFor="doc-category" className="block text-sm font-medium text-rc-bg mb-1">Category</label>
            <input
              id="doc-category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Enter or select a category"
              list="category-suggestions"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rc-accent/50 focus:border-rc-accent"
            />
            <datalist id="category-suggestions">
              {categories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-rc-bg mb-1">Equipment Tags</label>
            <div className="flex flex-wrap gap-2 border border-gray-300 rounded-md p-2 max-h-40 overflow-y-auto">
              {equipmentCategories.map(cat => (
                <div 
                  key={cat.id} 
                  onClick={() => toggleEquipmentTag(cat.id)}
                  className={cn(
                    "px-2 py-1 text-sm rounded-full cursor-pointer min-h-[28px] focus:outline-none focus:ring-2 focus:ring-rc-accent/50",
                    equipmentTags.includes(cat.id) 
                      ? "bg-rc-accent/20 text-rc-bg" 
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  )}
                  title={cat.description}
                  role="checkbox"
                  aria-checked={equipmentTags.includes(cat.id)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && toggleEquipmentTag(cat.id)}
                >
                  {cat.name}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-rc-bg mb-1">Operations Tags</label>
            <div className="flex flex-wrap gap-2 border border-gray-300 rounded-md p-2 max-h-40 overflow-y-auto">
              {operationCategories.map(cat => (
                <div 
                  key={cat.id} 
                  onClick={() => toggleOperationTag(cat.id)}
                  className={cn(
                    "px-2 py-1 text-sm rounded-full cursor-pointer min-h-[28px] focus:outline-none focus:ring-2 focus:ring-rc-accent/50",
                    operationsTags.includes(cat.id) 
                      ? "bg-rc-accent/20 text-rc-bg" 
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  )}
                  title={cat.description}
                  role="checkbox"
                  aria-checked={operationsTags.includes(cat.id)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && toggleOperationTag(cat.id)}
                >
                  {cat.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Section Navigation Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium font-poppins">Sections</h2>
            <div className="flex space-x-1">
              <button 
                onClick={addSection}
                className="p-1.5 bg-rc-accent text-rc-bg rounded hover:bg-rc-accent/90 min-h-[32px] min-w-[32px] focus:outline-none focus:ring-2 focus:ring-rc-accent/50 flex items-center"
                title="Add new section (Ctrl+N)"
                aria-label="Add new section"
              >
                <CoreIcons.Plus size={16} className="mr-1" />
                <span className="text-xs">New</span>
                <span className="ml-1 text-xs bg-rc-bg/20 px-1 py-0.5 rounded">Ctrl+N</span>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {sections.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p>No sections yet</p>
                <button 
                  onClick={addSection}
                  className="mt-2 text-rc-accent hover:underline"
                >
                  Add your first section
                </button>
              </div>
            ) : (
              <ul className="space-y-1">
                {sections.map((section, index) => (
                  <li key={section.id} className="relative group">
                    <button
                      onClick={() => setActiveSection(index)}
                      className={cn(
                        "w-full text-left pl-3 pr-10 py-2 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-rc-accent/50",
                        activeSection === index && "bg-rc-accent/10 font-medium text-rc-bg"
                      )}
                      aria-label={`Section: ${section.title || `Section ${index + 1}`}`}
                    >
                      <div className="flex items-center">
                        <span className="w-5 h-5 inline-flex items-center justify-center mr-2 bg-rc-accent/10 text-rc-bg rounded-full text-xs">
                          {index + 1}
                        </span>
                        <span className="truncate">
                          {section.title || `Section ${index + 1}`}
                        </span>
                      </div>
                    </button>
                    
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex space-x-1 mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {sections.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSection(index);
                          }}
                          className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                          title="Remove section"
                          aria-label="Remove section"
                        >
                          <CoreIcons.Trash2 size={14} />
                        </button>
                      )}
                      
                      {index > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(index, 'up');
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-rc-accent/50"
                          title="Move up"
                          aria-label="Move section up"
                        >
                          <CoreIcons.MoveUp size={14} />
                        </button>
                      )}
                      
                      {index < sections.length - 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSection(index, 'down');
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-rc-accent/50"
                          title="Move down"
                          aria-label="Move section down"
                        >
                          <CoreIcons.MoveDown size={14} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Content Editor Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {sections.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
              <div className="text-center max-w-md">
                <h3 className="text-lg font-medium mb-2">No sections to edit</h3>
                <p className="text-gray-500 mb-4">Add a section to start editing your document</p>
                <button
                  onClick={addSection}
                  className="px-4 py-2 bg-rc-accent text-rc-bg rounded-md hover:bg-rc-accent/90"
                >
                  Add Section
                </button>
              </div>
            </div>
          ) : sections[activeSection] ? (
            <>
              <div className="p-4 border-b border-gray-200 bg-rc-fg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label htmlFor="section-title" className="block text-sm font-medium text-rc-bg mb-1">Section Title</label>
                    <input
                      id="section-title"
                      type="text"
                      value={sections[activeSection].title}
                      onChange={(e) => updateSectionTitle(activeSection, e.target.value)}
                      placeholder="Section title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rc-accent/50 focus:border-rc-accent"
                    />
                  </div>
                  
                  <div className="ml-4 flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Section {activeSection + 1} of {sections.length}</span>
                    
                    <div className="flex space-x-1">
                      {activeSection > 0 && (
                        <button
                          onClick={() => setActiveSection(activeSection - 1)}
                          className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-rc-accent/50"
                          title="Previous section"
                        >
                          <CoreIcons.MoveUp size={18} />
                        </button>
                      )}
                      
                      {activeSection < sections.length - 1 && (
                        <button
                          onClick={() => setActiveSection(activeSection + 1)}
                          className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-rc-accent/50"
                          title="Next section"
                        >
                          <CoreIcons.MoveDown size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {editorVisible ? (
                  <Suspense fallback={<div className="p-4 text-center">Loading editor...</div>}>
                    <Editor 
                      initialContent={sections[activeSection].content || '<p>Add content here...</p>'} 
                      onChange={(html) => updateSectionContent(activeSection, html)}
                      readOnly={false} // Always editable in the DocumentEditor
                      className="min-h-[300px]"
                    />
                  </Suspense>
                ) : (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rc-accent mx-auto mb-2"></div>
                    <p>Loading editor...</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Select a section to edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor; 