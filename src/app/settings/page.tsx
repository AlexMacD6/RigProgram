'use client';

import { useState } from 'react';
import Layout from '../components/Layout';
import { AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  const handleClearStorage = () => {
    if (typeof window !== 'undefined') {
      // Clear all application data from localStorage
      localStorage.removeItem('documents');
      localStorage.removeItem('recentActivity');
      localStorage.removeItem('recentlyViewed');
      
      // Clear all document revisions
      const keys = Object.keys(localStorage);
      const revisionKeys = keys.filter(key => key.startsWith('documentRevisions-'));
      revisionKeys.forEach(key => localStorage.removeItem(key));
      
      // Trigger update event
      window.dispatchEvent(new Event('documentUpdated'));
      
      // Close the confirmation dialog
      setIsConfirmOpen(false);
      
      // Show confirmation message
      alert('All application data has been cleared.');
    }
  };
  
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Application Settings</h2>
          </div>
          
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Data Management</h3>
            
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
              <p className="text-gray-700 mb-4">
                RigProgram stores all your documents and settings in your browser's local storage. 
                This data remains on your device and is not sent to any server.
              </p>
              
              <button
                onClick={() => setIsConfirmOpen(true)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Clear All Data
              </button>
            </div>
            
            <h3 className="text-lg font-medium mb-4">About RigProgram</h3>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700 mb-2">
                <strong>Version:</strong> 1.0.0
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Built with:</strong> Next.js, TipTap, Tailwind CSS
              </p>
              <p className="text-gray-700">
                RigProgram is a document management application specifically designed for oil and gas drilling operations.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      {isConfirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <div className="flex items-center mb-4 text-red-500">
              <AlertTriangle className="mr-2" size={24} />
              <h3 className="text-lg font-medium">Warning</h3>
            </div>
            
            <p className="text-gray-700 mb-4">
              This will permanently delete all documents, settings, and activity history. 
              This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleClearStorage}
                className="px-4 py-2 bg-red-500 text-white rounded-md text-sm"
              >
                Delete All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
} 