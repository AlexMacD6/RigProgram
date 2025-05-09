'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '../../components/Layout';
import { getDocuments } from '../../utils/storage';
import { Document, operationCategories } from '../../types';
import { FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function OperationsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categoryName, setCategoryName] = useState<string>('');
  const router = useRouter();
  const params = useParams();
  
  // Get operations tag ID from params
  const id = params.id as string;
  
  useEffect(() => {
    // Find the category name
    const category = operationCategories.find(cat => cat.id === id);
    if (category) {
      setCategoryName(category.name);
    }
    
    // Fetch documents with the selected operations tag
    const fetchDocuments = () => {
      const allDocuments = getDocuments();
      const filteredDocuments = allDocuments.filter(doc => doc.operationsTags?.includes(id));
      setDocuments(filteredDocuments);
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
  }, [id]);
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{categoryName}</h1>
            <p className="text-gray-500 mt-1">Operations Category</p>
          </div>
          
          <button
            onClick={() => router.push('/new')}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Create New Document
          </button>
        </div>
        
        {documents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map(doc => (
              <div 
                key={doc.id}
                onClick={() => router.push(`/document/${doc.id}`)}
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start">
                  <FileText className="text-blue-500 mr-3 mt-1" size={24} />
                  <div>
                    <h2 className="text-xl font-medium text-gray-900">{doc.title}</h2>
                    <p className="text-gray-500 text-sm mt-1">
                      {doc.category} • Updated {formatDistanceToNow(new Date(doc.lastModified), { addSuffix: true })}
                    </p>
                    
                    {/* Operations tags */}
                    {doc.operationsTags && doc.operationsTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {doc.operationsTags.map(tagId => {
                          const tag = operationCategories.find(cat => cat.id === tagId);
                          return tag ? (
                            <span 
                              key={tagId} 
                              className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                            >
                              {tag.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-2">No documents with this operations tag</h2>
            <p className="text-gray-500 mb-4">Create a new document with this operations tag to get started.</p>
            <button
              onClick={() => router.push('/new')}
              className="px-4 py-2 bg-rc-accent text-rc-fg rounded-md hover:bg-rc-accent/90 focus:outline-ring/50"
            >
              Create New Document
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
} 