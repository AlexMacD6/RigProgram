'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Layout from '../../components/Layout';
import DocumentViewer from '../../components/DocumentViewer';
import { getDocumentById, deleteDocument } from '../../utils/storage';
import { Document } from '../../types';

export default function DocumentPage() {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  // Get document ID from params
  const id = params.id as string;
  
  // Get section index from query parameter (if any)
  const sectionParam = searchParams.get('section');
  const initialSectionIndex = sectionParam ? parseInt(sectionParam, 10) : undefined;
  
  useEffect(() => {
    // Fetch document data
    const fetchDocument = () => {
      try {
        const doc = getDocumentById(id);
        
        if (doc) {
          setDocument(doc);
        } else {
          setError('Document not found');
        }
      } catch (err) {
        setError('Failed to load document');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocument();
    
    // Listen for document updates
    const handleDocumentUpdate = () => {
      fetchDocument();
    };
    
    window.addEventListener('documentUpdated', handleDocumentUpdate);
    
    return () => {
      window.removeEventListener('documentUpdated', handleDocumentUpdate);
    };
  }, [id]);
  
  const handleEdit = () => {
    router.push(`/document/${id}/edit`);
  };
  
  const handleDelete = () => {
    if (document) {
      deleteDocument(document.id);
      
      // Dispatch a custom event to notify other components about the update
      window.dispatchEvent(new Event('documentUpdated'));
      
      // Navigate back to home
      router.push('/');
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }
  
  if (error || !document) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-2xl font-bold text-red-500 mb-4">{error || 'Document not found'}</h2>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Return to Home
          </button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="h-full">
        <DocumentViewer 
          document={document} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
        />
      </div>
    </Layout>
  );
} 