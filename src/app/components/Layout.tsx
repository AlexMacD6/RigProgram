'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getDocuments, getRecentActivities } from '../utils/storage';
import { Document, equipmentCategories, operationCategories } from '../types';
import Search from './Search';
import { 
  ChevronRight, 
  FilePlus, 
  FolderOpen, 
  Star, 
  Clock, 
  Menu, 
  X, 
  Settings,
  FileText,
  Filter
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

const cn = (...inputs: any[]) => {
  return twMerge(clsx(inputs));
};

const Layout = ({ children }: LayoutProps) => {
  const pathname = usePathname();
  const router = useRouter();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<{
    [key: string]: boolean;
  }>({
    equipment: false,
    operations: false,
  });
  
  // Load data from localStorage
  useEffect(() => {
    const loadData = () => {
      const docs = getDocuments();
      const recentActivity = getRecentActivities();
      
      setDocuments(docs);
      setActivities(recentActivity);
    };
    
    // Initial load
    loadData();
    
    // Set up event listener for storage changes
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for internal updates
    window.addEventListener('documentUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('documentUpdated', handleStorageChange);
    };
  }, []);
  
  const toggleCategory = (category: string) => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category],
    });
  };
  
  const countDocumentsInCategory = (category: string) => {
    return documents.filter(doc => doc.category === category).length;
  };
  
  const countDocumentsWithTag = (tagType: 'equipmentTags' | 'operationsTags', tagId: string) => {
    return documents.filter(doc => doc[tagType]?.includes(tagId)).length;
  };

  // Get total count of documents with equipment tags
  const totalEquipmentDocuments = documents.filter(doc => doc.equipmentTags && doc.equipmentTags.length > 0).length;
  
  // Get total count of documents with operations tags
  const totalOperationsDocuments = documents.filter(doc => doc.operationsTags && doc.operationsTags.length > 0).length;
  
  // Get featured documents
  const featuredDocuments = documents.filter(doc => doc.isFeatured);
  
  // Group documents by category
  const documentsByCategory = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile menu toggle */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-rc-accent text-rc-bg rounded-md"
      >
        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      
      {/* Sidebar */}
      <div className={cn(
        "w-64 bg-rc-fg border-r border-gray-200 flex flex-col h-full overflow-hidden transform transition-transform",
        isMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo and app name */}
        <div className="p-4 border-b border-gray-200 flex items-center">
          <h1 className="text-xl font-bold text-rc-accent">RigProgram</h1>
        </div>
        
        {/* Sidebar navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-2 space-y-2">
            {/* New Document Button */}
            <button
              onClick={() => router.push('/new')}
              className="w-full flex items-center px-4 py-2 text-rc-bg bg-rc-accent hover:opacity-90 rounded-md font-bold"
            >
              <FilePlus size={18} className="mr-2" />
              <span>New Document</span>
            </button>
            
            {/* All Documents */}
            <div className="mt-6">
              <Link 
                href="/documents"
                className={cn(
                  "flex items-center px-4 py-2 text-sm rounded-md w-full",
                  pathname === '/documents' 
                    ? "bg-rc-accent text-rc-bg font-bold" 
                    : "text-gray-700 hover:bg-gray-100 hover:text-rc-accent"
                )}
              >
                <FileText size={16} className="mr-2" />
                <span>All Documents</span>
              </Link>
            </div>
            
            {/* Featured Documents */}
            <div className="mt-4">
              <h2 className="px-4 text-gray-500 text-sm font-medium uppercase tracking-wider">
                Featured
              </h2>
              <ul className="mt-2 space-y-1">
                {featuredDocuments.map(doc => (
                  <li key={doc.id}>
                    <Link 
                      href={`/document/${doc.id}`}
                      className={cn(
                        "flex items-center px-4 py-2 text-sm rounded-md",
                        pathname === `/document/${doc.id}` 
                          ? "bg-rc-accent text-rc-bg" 
                          : "text-gray-700 hover:bg-gray-100 hover:text-rc-accent"
                      )}
                    >
                      <Star size={16} className="mr-2 text-rc-accent" />
                      <span className="truncate">{doc.title}</span>
                    </Link>
                  </li>
                ))}
                {featuredDocuments.length === 0 && (
                  <li className="px-4 py-2 text-sm text-gray-500 italic">
                    No featured documents
                  </li>
                )}
              </ul>
            </div>
            
            {/* Categories */}
            <div className="mt-4">
              <h2 className="px-4 text-gray-500 text-sm font-medium uppercase tracking-wider">
                <span>Categories</span>
              </h2>
              <div className="mt-2 space-y-4">
                {Object.keys(documentsByCategory)
                  .sort()
                  .map(category => (
                    <div key={category} className="px-2">
                      <h3 className="flex items-center px-4 py-2 text-sm font-medium text-rc-bg bg-rc-accent rounded-md">
                        <FolderOpen size={16} className="mr-2" />
                        {category}
                        <span className="ml-auto text-xs bg-rc-bg text-rc-accent rounded-full px-2 py-1">
                          {documentsByCategory[category].length}
                        </span>
                      </h3>
                      <ul className="mt-1 pl-2 space-y-1 border-l-2 border-gray-200 ml-4">
                        {documentsByCategory[category].map(doc => (
                          <li key={doc.id}>
                            <Link 
                              href={`/document/${doc.id}`}
                              className={cn(
                                "flex items-center px-3 py-1 text-sm rounded-md",
                                pathname === `/document/${doc.id}` 
                                  ? "bg-gray-200 font-medium" 
                                  : "text-gray-700 hover:bg-gray-100 hover:text-rc-accent"
                              )}
                            >
                              <FileText size={14} className="mr-2 text-gray-500" />
                              <span className="truncate">{doc.title}</span>
                              {doc.isFeatured && (
                                <Star size={14} className="ml-1 text-rc-accent" />
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                {Object.keys(documentsByCategory).length === 0 && (
                  <div className="px-4 py-2 text-sm text-gray-500 italic">
                    No categories found
                  </div>
                )}
              </div>
            </div>
          </nav>
        </div>
        
        {/* Sidebar footer */}
        <div className="p-4 border-t border-gray-200">
          <Link 
            href="/settings"
            className="flex items-center px-4 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 hover:text-rc-accent"
          >
            <Settings size={16} className="mr-2" />
            <span>Settings</span>
          </Link>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-rc-fg shadow-lg">
        {/* Header */}
        <header className="bg-rc-fg border-b border-gray-200 p-4 flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link 
              href="/"
              className={cn(
                "text-gray-700 hover:text-rc-accent flex items-center px-3 py-1 rounded-md",
                pathname === '/' && "bg-gray-100"
              )}
            >
              <Clock size={18} className="mr-2" />
              <span>Dashboard</span>
            </Link>
            
            <Link 
              href="/documents"
              className={cn(
                "text-gray-700 hover:text-rc-accent flex items-center px-3 py-1 rounded-md",
                pathname === '/documents' && "bg-gray-100"
              )}
            >
              <FileText size={18} className="mr-2" />
              <span>Documents</span>
            </Link>
          </div>
          
          <Search />
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-rc-fg">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout; 