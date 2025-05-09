'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '../../../components/Layout';
import DocumentEditor from '../../../components/DocumentEditor';
import { getDocumentById, saveDocument } from '../../../utils/storage';
import { Document } from '../../../types';

export default function EditDocumentPage() {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  
  // Get document ID from params
  const id = params.id as string;
  
  useEffect(() => {
    // Fetch document data
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
  }, [id]);
  
  const handleSave = (updatedDocument: Document) => {
    saveDocument(updatedDocument);
    
    // Dispatch a custom event to notify other components about the update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('documentUpdated'));
    }
    
    // Redirect to the document view page
    router.push(`/document/${updatedDocument.id}`);
  };
  
  const handleCancel = () => {
    router.back();
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
        <DocumentEditor 
          document={document} 
          onSave={handleSave} 
          onCancel={handleCancel} 
        />
      </div>
    </Layout>
  );
} 