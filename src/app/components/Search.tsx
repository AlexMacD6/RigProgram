'use client';

import { useState, useEffect, useRef } from 'react';
import { searchDocuments } from '../utils/storage';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon, X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

interface SearchProps {
  className?: string;
}

const cn = (...inputs: any[]) => {
  return twMerge(clsx(inputs));
};

const Search = ({ className }: SearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{
    document: any;
    section: number;
    matchText: string;
  }>>([]);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchDocuments(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      const firstResult = searchResults[0];
      navigateToResult(firstResult);
    }
  };

  const navigateToResult = (result: { document: any; section: number }) => {
    // Close search
    setIsSearchOpen(false);
    setSearchQuery('');
    
    // Navigate to document, optionally with section
    const url = `/document/${result.document.id}${result.section >= 0 ? `?section=${result.section}` : ''}`;
    router.push(url);
  };

  return (
    <div className={cn('relative', className)} ref={searchRef}>
      {/* Search trigger button */}
      {!isSearchOpen && (
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <SearchIcon size={16} className="mr-2" />
          <span>Search</span>
        </button>
      )}
      
      {/* Search input and results */}
      {isSearchOpen && (
        <div className="absolute right-0 top-0 w-80 bg-white rounded-md shadow-lg z-10 border border-gray-200">
          <form onSubmit={handleSearch} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-10 pr-10 py-2 rounded-md border-b border-gray-200 focus:outline-none"
            />
            <SearchIcon size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </form>
          
          {searchResults.length > 0 && (
            <div className="max-h-80 overflow-y-auto py-2">
              {searchResults.map((result, index) => (
                <button
                  key={`${result.document.id}-${result.section}-${index}`}
                  onClick={() => navigateToResult(result)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 block"
                >
                  <div className="font-medium text-blue-600 truncate">
                    {result.document.title}
                    {result.section >= 0 && (
                      <span className="text-gray-600 font-normal">
                        {' > '}
                        {result.document.sections[result.section].title}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {result.matchText}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {searchQuery && searchResults.length === 0 && (
            <div className="px-4 py-3 text-gray-500 text-center">
              No results found for "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search; 