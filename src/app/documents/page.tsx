'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '../components/Layout';
import { getDocuments } from '../utils/storage';
import { Document, equipmentCategories, operationCategories, CategoryDefinition } from '../types';
import { FileText, Star, Filter, X, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../utils/ui';

// Create a wrapper component that uses search params
function DocumentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get filter params from URL if they exist
  const equipmentParam = searchParams.get('equipment');
  const operationsParam = searchParams.get('operations');
  const categoryParam = searchParams.get('category');
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sortBy, setSortBy] = useState<string>('lastModified');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterText, setFilterText] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || '');
  const [selectedEquipmentTags, setSelectedEquipmentTags] = useState<string[]>(
    equipmentParam ? [equipmentParam] : []
  );
  const [selectedOperationsTags, setSelectedOperationsTags] = useState<string[]>(
    operationsParam ? [operationsParam] : []
  );
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [categories, setCategories] = useState<string[]>([]);
  
  useEffect(() => {
    // Fetch all documents
    const fetchDocuments = () => {
      const allDocuments = getDocuments();
      setDocuments(allDocuments);
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(allDocuments.map(doc => doc.category)));
      setCategories(uniqueCategories);
    };
    
    fetchDocuments();
    
    // Listen for document updates
    const handleDocumentUpdate = () => {
      fetchDocuments();
    };
    
    window.addEventListener('documentUpdated', handleDocumentUpdate);
    
    return () => {
      window.removeEventListener('documentUpdated', handleDocumentUpdate);
    };
  }, []);
  
  // Toggle an equipment tag selection
  const toggleEquipmentTag = (tagId: string) => {
    setSelectedEquipmentTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId) 
        : [...prev, tagId]
    );
  };
  
  // Toggle an operations tag selection
  const toggleOperationsTag = (tagId: string) => {
    setSelectedOperationsTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId) 
        : [...prev, tagId]
    );
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedEquipmentTags([]);
    setSelectedOperationsTags([]);
    setFilterText('');
  };
  
  // Sort and filter documents
  const filteredAndSortedDocuments = documents
    .filter(doc => {
      // Text filter
      const textMatch = !filterText || 
        doc.title.toLowerCase().includes(filterText.toLowerCase()) ||
        doc.category.toLowerCase().includes(filterText.toLowerCase()) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(filterText.toLowerCase()));
      
      // Category filter
      const categoryMatch = !selectedCategory || doc.category === selectedCategory;
      
      // Equipment tags filter
      const equipmentMatch = selectedEquipmentTags.length === 0 || 
        selectedEquipmentTags.some(tag => doc.equipmentTags?.includes(tag));
      
      // Operations tags filter
      const operationsMatch = selectedOperationsTags.length === 0 || 
        selectedOperationsTags.some(tag => doc.operationsTags?.includes(tag));
      
      return textMatch && categoryMatch && equipmentMatch && operationsMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'title') {
        return sortOrder === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      } else if (sortBy === 'category') {
        return sortOrder === 'asc'
          ? a.category.localeCompare(b.category)
          : b.category.localeCompare(a.category);
      } else {
        // Default: sort by lastModified
        return sortOrder === 'asc'
          ? a.lastModified - b.lastModified
          : b.lastModified - a.lastModified;
      }
    });
  
  // Toggle sort order or change sort field
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Toggle order if already sorting by this field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  // Get applied filters count for badge display
  const getAppliedFiltersCount = () => {
    let count = 0;
    if (selectedCategory) count++;
    count += selectedEquipmentTags.length;
    count += selectedOperationsTags.length;
    return count;
  };
  
  // Render tag with appropriate styling and enhanced tooltip
  const renderTag = (
    tag: CategoryDefinition, 
    isSelected: boolean, 
    toggleFn: (id: string) => void,
    type: 'equipment' | 'operations'
  ) => (
    <div 
      key={tag.id} 
      onClick={() => toggleFn(tag.id)}
      className={cn(
        "group relative px-3 py-1 text-sm rounded-full cursor-pointer transition-colors flex items-center gap-1",
        isSelected 
          ? type === 'equipment'
            ? "bg-blue-100 text-blue-800" 
            : "bg-green-100 text-green-800"
          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
      )}
    >
      {tag.name}
      {isSelected && <X size={14} />}
      
      {/* Info icon for longer descriptions */}
      {tag.description && (
        <span className="ml-1 text-gray-500 flex items-center">
          <Info size={12} />
        </span>
      )}
      
      {/* Enhanced tooltip */}
      <div className="absolute z-50 bottom-full left-0 mb-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200">
        <div className="bg-gray-900 text-white p-2 rounded shadow-lg text-xs leading-tight">
          {tag.description}
        </div>
        <div className="w-3 h-3 bg-gray-900 transform rotate-45 absolute -bottom-1 left-4"></div>
      </div>
    </div>
  );
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Documents</h1>
        
        <button
          onClick={() => router.push('/new')}
          className="px-4 py-2 bg-rc-accent text-rc-bg rounded-md hover:opacity-90 font-bold"
        >
          Create New Document
        </button>
      </div>
      
      {/* Main filter and sort controls */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:w-auto relative">
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search documents..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md pl-10"
            />
            <FileText size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50",
                showFilters && "bg-gray-100"
              )}
            >
              <Filter size={16} />
              <span>Filters</span>
              {getAppliedFiltersCount() > 0 && (
                <span className="bg-rc-accent text-rc-bg rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {getAppliedFiltersCount()}
                </span>
              )}
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span>Sort:</span>
              <button
                onClick={() => handleSort('lastModified')}
                className={`px-2 py-1 rounded ${
                  sortBy === 'lastModified' ? 'bg-rc-accent text-rc-bg' : 'hover:bg-gray-100'
                }`}
              >
                Date {sortBy === 'lastModified' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('title')}
                className={`px-2 py-1 rounded ${
                  sortBy === 'title' ? 'bg-rc-accent text-rc-bg' : 'hover:bg-gray-100'
                }`}
              >
                Title {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('category')}
                className={`px-2 py-1 rounded ${
                  sortBy === 'category' ? 'bg-rc-accent text-rc-bg' : 'hover:bg-gray-100'
                }`}
              >
                Category {sortBy === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>
        
        {/* Extended filters */}
        {showFilters && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">Filters</h3>
              {getAppliedFiltersCount() > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-rc-accent hover:underline font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
            
            {/* Categories */}
            <div className="mb-4">
              <h4 className="text-xs uppercase text-gray-500 mb-2">Category</h4>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <div
                    key={category}
                    onClick={() => setSelectedCategory(selectedCategory === category ? '' : category)}
                    className={cn(
                      "px-3 py-1 text-sm rounded-full cursor-pointer transition-colors flex items-center gap-1",
                      selectedCategory === category
                        ? "bg-rc-bg text-rc-fg"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    )}
                  >
                    {category}
                    {selectedCategory === category && <X size={14} />}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Equipment Tags */}
            <div className="mb-4">
              <h4 className="text-xs uppercase text-gray-500 mb-2">Equipment</h4>
              <div className="flex flex-wrap gap-2">
                {equipmentCategories.map(tag => 
                  renderTag(
                    tag, 
                    selectedEquipmentTags.includes(tag.id), 
                    toggleEquipmentTag,
                    'equipment'
                  )
                )}
              </div>
            </div>
            
            {/* Operations Tags */}
            <div>
              <h4 className="text-xs uppercase text-gray-500 mb-2">Operations</h4>
              <div className="flex flex-wrap gap-2">
                {operationCategories.map(tag => 
                  renderTag(
                    tag, 
                    selectedOperationsTags.includes(tag.id), 
                    toggleOperationsTag,
                    'operations'
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Results count */}
      <div className="mb-4 text-sm text-gray-500">
        {filteredAndSortedDocuments.length} {filteredAndSortedDocuments.length === 1 ? 'document' : 'documents'} found
      </div>
      
      {/* Document list */}
      {filteredAndSortedDocuments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedDocuments.map(doc => (
            <div 
              key={doc.id}
              onClick={() => router.push(`/document/${doc.id}`)}
              className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 text-rc-accent mr-3">
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900 truncate">{doc.title}</h2>
                    {doc.isFeatured && <Star size={16} className="text-rc-accent flex-shrink-0 ml-1" />}
                  </div>
                  
                  <p className="mt-1 text-sm text-gray-500">
                    {doc.category} • Updated {formatDistanceToNow(new Date(doc.lastModified), { addSuffix: true })}
                  </p>
                  
                  <div className="mt-3 flex flex-wrap gap-1">
                    {/* Equipment tags */}
                    {doc.equipmentTags?.map(tagId => {
                      const tag = equipmentCategories.find(cat => cat.id === tagId);
                      return tag ? (
                        <span 
                          key={tagId} 
                          className="group relative px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full cursor-help"
                          title={tag.name}
                        >
                          {tag.name}
                          {/* Tooltip for equipment tag description */}
                          <div className="absolute z-50 bottom-full left-0 mb-1 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200">
                            <div className="bg-gray-900 text-white p-2 rounded shadow-lg text-xs leading-tight">
                              {tag.description}
                            </div>
                            <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute -bottom-1 left-3"></div>
                          </div>
                        </span>
                      ) : null;
                    })}
                    
                    {/* Operations tags */}
                    {doc.operationsTags?.map(tagId => {
                      const tag = operationCategories.find(cat => cat.id === tagId);
                      return tag ? (
                        <span 
                          key={tagId} 
                          className="group relative px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full cursor-help"
                          title={tag.name}
                        >
                          {tag.name}
                          {/* Tooltip for operations tag description */}
                          <div className="absolute z-50 bottom-full left-0 mb-1 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200">
                            <div className="bg-gray-900 text-white p-2 rounded shadow-lg text-xs leading-tight">
                              {tag.description}
                            </div>
                            <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute -bottom-1 left-3"></div>
                          </div>
                        </span>
                      ) : null;
                    })}
                    
                    {/* Regular tags */}
                    {doc.tags?.map(tag => (
                      <span 
                        key={tag}
                        className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          {getAppliedFiltersCount() > 0 || filterText ? (
            <div>
              <h2 className="text-xl font-medium text-gray-900 mb-2">
                No documents match your filters
              </h2>
              <p className="text-gray-500 mb-4">Try adjusting your search criteria or clear the filters</p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-rc-accent text-rc-bg rounded-md hover:opacity-90 font-bold"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-medium text-gray-900 mb-2">No documents found</h2>
              <p className="text-gray-500 mb-4">Create a new document to get started.</p>
              <button
                onClick={() => router.push('/new')}
                className="px-4 py-2 bg-rc-accent text-rc-bg rounded-md hover:opacity-90 font-bold"
              >
                Create New Document
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main component with suspense boundary
export default function DocumentsPage() {
  return (
    <Layout>
      <Suspense fallback={<div className="p-6">Loading documents...</div>}>
        <DocumentsContent />
      </Suspense>
    </Layout>
  );
} 