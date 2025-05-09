'use client';

import { useEffect, useState } from 'react';
import { getDocuments, getRecentActivities, getRecentlyViewedDocuments } from './utils/storage';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Layout from './components/Layout';
import { Document, RecentActivity, equipmentCategories, operationCategories } from './types';
import { 
  Clock, 
  FileText, 
  Star, 
  BarChart3, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  Users,
  PieChart,
  Drill,
  Activity,
  Building2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function Home() {
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [featuredDocuments, setFeaturedDocuments] = useState<Document[]>([]);
  const [totalDocuments, setTotalDocuments] = useState<number>(0);
  const [equipmentStats, setEquipmentStats] = useState<{id: string, name: string, count: number}[]>([]);
  const [operationsStats, setOperationsStats] = useState<{id: string, name: string, count: number}[]>([]);
  const [upcomingCompletions, setUpcomingCompletions] = useState<{title: string, date: Date}[]>([
    { title: "South Pad Well 12 - Surface Drilling", date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
    { title: "North Pad Well 8 - Intermediate Rig Down", date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
    { title: "Central Pad Well 3 - Production Drilling", date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
  ]);
  const router = useRouter();
  
  useEffect(() => {
    // Load data from localStorage
    const loadData = () => {
      const activities = getRecentActivities();
      const recentDocs = getRecentlyViewedDocuments();
      const allDocs = getDocuments();
      const featured = allDocs.filter(doc => doc.isFeatured);
      
      setRecentActivities(activities.slice(0, 10)); // Limit to 10 activities
      setRecentDocuments(recentDocs.slice(0, 6)); // Limit to 6 recent documents
      setFeaturedDocuments(featured.slice(0, 4)); // Limit to 4 featured documents
      setTotalDocuments(allDocs.length);
      
      // Calculate equipment tag statistics
      const equipStats = equipmentCategories.map(category => {
        const count = allDocs.filter(doc => 
          doc.equipmentTags && doc.equipmentTags.includes(category.id)
        ).length;
        return { id: category.id, name: category.name, count };
      }).sort((a, b) => b.count - a.count).slice(0, 5);
      
      setEquipmentStats(equipStats);
      
      // Calculate operations tag statistics
      const opsStats = operationCategories.map(category => {
        const count = allDocs.filter(doc => 
          doc.operationsTags && doc.operationsTags.includes(category.id)
        ).length;
        return { id: category.id, name: category.name, count };
      }).sort((a, b) => b.count - a.count).slice(0, 5);
      
      setOperationsStats(opsStats);
    };
    
    loadData();
    
    // Set up event listener for storage changes
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('documentUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('documentUpdated', handleStorageChange);
    };
  }, []);
  
  // Summary metrics
  const metrics = [
    { title: "Total Documents", value: totalDocuments, icon: FileText, href: "/documents" },
    { title: "Equipment Docs", value: equipmentStats.reduce((acc, curr) => acc + curr.count, 0), icon: Building2, href: "/documents?filter=equipment" },
    { title: "Operations Docs", value: operationsStats.reduce((acc, curr) => acc + curr.count, 0), icon: Drill, href: "/documents?filter=operations" }
  ];
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header with logo */}
        <div className="flex items-center mb-8">
          <div className="mr-3">
            <Image 
              src="/Emblem/Asset 5@4x-8.png" 
              alt="RigProgram Emblem" 
              width={60} 
              height={60} 
              className="h-16 w-auto" 
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-rc-bg">Welcome to RigProgram</h1>
            <p className="text-gray-600">Document management system for drilling operations</p>
          </div>
        </div>
        
        {/* Summary metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {metrics.map((metric, i) => (
            <Link
              key={i}
              href={metric.href}
              className="flex items-center bg-rc-accent text-rc-bg p-6 rounded-lg shadow hover:opacity-90 transition-opacity"
            >
              <div className="mr-4 bg-rc-bg text-rc-accent p-3 rounded-full">
                <metric.icon size={24} />
              </div>
              <div>
                <div className="text-4xl font-bold">{metric.value}</div>
                <div className="text-sm opacity-90">{metric.title}</div>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Recent Documents */}
          <div className="md:col-span-2 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Recent Documents</h2>
              <Link 
                href="/documents"
                className="text-rc-accent hover:underline text-sm font-medium"
              >
                View all
              </Link>
            </div>
            
            <div className="p-6">
              {recentDocuments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recentDocuments.map(doc => (
                    <div 
                      key={doc.id}
                      onClick={() => router.push(`/document/${doc.id}`)}
                      className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-start">
                        <FileText className="text-rc-accent mr-3 mt-1" size={18} />
                        <div>
                          <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                          <p className="text-gray-500 text-sm mt-1">
                            {doc.category} • Updated {formatDistanceToNow(new Date(doc.lastModified), { addSuffix: true })}
                          </p>
                          {/* Display tags if available */}
                          {(doc.equipmentTags?.length || doc.operationsTags?.length) && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {doc.equipmentTags?.slice(0, 2).map(tag => {
                                const equipment = equipmentCategories.find(e => e.id === tag);
                                return equipment ? (
                                  <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-800">
                                    {equipment.name}
                                  </span>
                                ) : null;
                              })}
                              {doc.operationsTags?.slice(0, 2).map(tag => {
                                const operation = operationCategories.find(o => o.id === tag);
                                return operation ? (
                                  <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-800">
                                    {operation.name}
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
                <div className="text-gray-500 text-center py-8">
                  <p>No recently viewed documents</p>
                  <button
                    onClick={() => router.push('/new')}
                    className="mt-2 px-4 py-2 bg-rc-accent text-rc-bg rounded-md hover:opacity-90 font-medium"
                  >
                    Create New Document
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Upcoming Completions - New RigProgram-specific feature */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Upcoming Completions</h2>
            </div>
            
            <div>
              <ul className="divide-y divide-gray-200">
                {upcomingCompletions.map((completion, index) => (
                  <li key={index} className="px-6 py-4">
                    <div className="flex items-start">
                      <Calendar className="text-rc-accent mr-3 mt-1" size={16} />
                      <div>
                        <p className="text-gray-700 font-medium">{completion.title}</p>
                        <p className="text-gray-500 text-sm mt-1">
                          Due {format(completion.date, 'MMM d, yyyy')} ({formatDistanceToNow(completion.date, { addSuffix: true })})
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="px-6 py-3 border-t border-gray-200">
                <button 
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                >
                  View All Schedules
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tag Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Equipment Tag Stats */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Equipment Categories</h2>
            </div>
            
            <div className="p-6">
              {equipmentStats.length > 0 ? (
                <div className="space-y-4">
                  {equipmentStats.map(stat => (
                    <div key={stat.id} className="flex items-center">
                      <div className="w-36 truncate text-sm font-medium">{stat.name}</div>
                      <div className="flex-1 ml-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-rc-accent h-2.5 rounded-full" 
                            style={{ width: `${Math.min(100, (stat.count / totalDocuments) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="ml-2 text-sm text-gray-600 w-10 text-right">{stat.count}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-6">
                  <p>No equipment statistics available</p>
                </div>
              )}
              <div className="mt-4">
                <Link 
                  href="/documents?filter=equipment" 
                  className="text-rc-accent hover:underline text-sm font-medium"
                >
                  View all equipment documents →
                </Link>
              </div>
            </div>
          </div>
          
          {/* Operations Tag Stats */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Operations Categories</h2>
            </div>
            
            <div className="p-6">
              {operationsStats.length > 0 ? (
                <div className="space-y-4">
                  {operationsStats.map(stat => (
                    <div key={stat.id} className="flex items-center">
                      <div className="w-36 truncate text-sm font-medium">{stat.name}</div>
                      <div className="flex-1 ml-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-rc-accent h-2.5 rounded-full" 
                            style={{ width: `${Math.min(100, (stat.count / totalDocuments) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="ml-2 text-sm text-gray-600 w-10 text-right">{stat.count}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-6">
                  <p>No operations statistics available</p>
                </div>
              )}
              <div className="mt-4">
                <Link 
                  href="/documents?filter=operations" 
                  className="text-rc-accent hover:underline text-sm font-medium"
                >
                  View all operations documents →
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Featured Documents - styled with brand elements */}
        {featuredDocuments.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center mb-4">
              <Star className="text-rc-accent mr-2" size={20} />
              <h2 className="text-xl font-semibold">Featured Documents</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {featuredDocuments.map(doc => (
                <div 
                  key={doc.id}
                  onClick={() => router.push(`/document/${doc.id}`)}
                  className="bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                >
                  <div className="bg-rc-accent py-2 px-4 flex items-center">
                    <Star className="text-rc-bg mr-2" size={14} />
                    <span className="text-xs font-medium text-rc-bg">Featured</span>
                  </div>
                  <div className="px-4 py-5">
                    <h3 className="text-lg font-medium text-gray-900 truncate">{doc.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{doc.category}</p>
                    <p className="mt-3 text-sm text-gray-500">
                      {doc.sections.length} {doc.sections.length === 1 ? 'section' : 'sections'}
                    </p>
                    {/* Show the first tag of each type if available */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {doc.equipmentTags?.[0] && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-800">
                          {equipmentCategories.find(e => e.id === doc.equipmentTags?.[0])?.name || doc.equipmentTags[0]}
                        </span>
                      )}
                      {doc.operationsTags?.[0] && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-800">
                          {operationCategories.find(o => o.id === doc.operationsTags?.[0])?.name || doc.operationsTags[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Recent Activity - now with styling */}
        <div className="mt-8">
          <div className="flex items-center mb-4">
            <Activity className="text-rc-accent mr-2" size={20} />
            <h2 className="text-xl font-semibold">Recent Activity</h2>
          </div>
          
          <div className="bg-white rounded-lg shadow">
            {recentActivities.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {recentActivities.map((activity, index) => (
                  <li key={index} className="px-6 py-4">
                    <div className="flex items-start">
                      <Clock className="text-rc-accent mr-3 mt-1" size={16} />
                      <div>
                        <p className="text-gray-700">{activity.message}</p>
                        <p className="text-gray-500 text-sm mt-1">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500 text-center py-8">
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer with brand image */}
        <div className="mt-16 flex justify-center">
          <Image 
            src="/brand/logo.png" 
            alt="RigProgram Logo" 
            width={180} 
            height={60} 
            className="h-12 w-auto opacity-75" 
          />
        </div>
      </div>
    </Layout>
  );
}
