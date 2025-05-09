'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/Layout';
import DocumentEditor from '../components/DocumentEditor';
import { saveDocument } from '../utils/storage';
import { Document } from '../types';

export default function NewDocumentPage() {
  const router = useRouter();
  
  const handleSave = (document: Document) => {
    saveDocument(document);
    
    // Dispatch a custom event to notify other components about the update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('documentUpdated'));
    }
    
    // Redirect to the document view page
    router.push(`/document/${document.id}`);
  };
  
  const handleCancel = () => {
    router.back();
  };
  
  return (
    <Layout>
      <div className="h-full">
        <DocumentEditor onSave={handleSave} onCancel={handleCancel} />
      </div>
    </Layout>
  );
} 