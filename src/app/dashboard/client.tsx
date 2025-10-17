'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileText, 
    MessageSquare, 
    Plus, 
    Loader2, 
    LayoutGrid, 
    List, 
    Search,
    Star,
    Tag,
    Filter,
    X,
    Download,
    Share2,
    ChevronsRight,
    ArrowUpDown,
    Calendar,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TranslatedText } from "@/components/TranslatedText";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

// --- TYPE DEFINITIONS ---
interface Document {
  id: string;
  originalFileName: string;
  createdAt: string;
  documentType: 'RENTAL_AGREEMENT' | 'LOAN_CONTRACT' | 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'EMPLOYMENT_CONTRACT' | 'FREELANCE_CONTRACT' | 'PURCHASE_AGREEMENT' | 'NDA' | 'PARTNERSHIP_AGREEMENT' | 'INSURANCE_POLICY' | 'OTHER';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  // Optional fields that may not exist in DB yet
  tags?: string[];
  category?: string;
  isFavorite?: boolean;
}

// --- MOCK DATA (for demonstration purposes) ---
const mockDocuments: Document[] = [
  { id: '1', originalFileName: 'Employment Contract Q4.pdf', createdAt: new Date(2025, 8, 15).toISOString(), documentType: 'EMPLOYMENT_CONTRACT', category: 'Legal', tags: ['contract', 'urgent'], riskLevel: 'HIGH', isFavorite: true },
  { id: '2', originalFileName: 'Investment Portfolio Report.docx', createdAt: new Date(2025, 8, 12).toISOString(), documentType: 'OTHER', category: 'Financial', tags: ['investing', 'q3-report'], riskLevel: 'MEDIUM', isFavorite: false },
  { id: '3', originalFileName: 'Personal Will and Testament.pdf', createdAt: new Date(2025, 7, 20).toISOString(), documentType: 'OTHER', category: 'Personal', tags: ['estate'], riskLevel: 'LOW', isFavorite: false },
  { id: '4', originalFileName: 'Project Alpha Spec.docx', createdAt: new Date(2025, 8, 18).toISOString(), documentType: 'OTHER', category: 'Work', tags: ['specs', 'project-alpha'], riskLevel: 'LOW', isFavorite: true },
  { id: '5', originalFileName: 'Rental Agreement - Apt 4B.pdf', createdAt: new Date(2025, 6, 5).toISOString(), documentType: 'RENTAL_AGREEMENT', category: 'Legal', tags: ['lease', 'housing'], riskLevel: 'MEDIUM', isFavorite: false },
  { id: '6', originalFileName: '2024 Tax Returns.pdf', createdAt: new Date(2025, 3, 10).toISOString(), documentType: 'OTHER', category: 'Financial', tags: ['taxes'], riskLevel: 'HIGH', isFavorite: false },
  { id: '7', originalFileName: 'Project Phoenix Proposal.pdf', createdAt: new Date(2025, 8, 1).toISOString(), documentType: 'OTHER', category: 'Work', tags: ['proposal', 'new-biz'], riskLevel: 'MEDIUM', isFavorite: false },
  { id: '8', originalFileName: 'Medical Records Summary.docx', createdAt: new Date(2025, 5, 22).toISOString(), documentType: 'OTHER', category: 'Personal', tags: ['health'], riskLevel: 'LOW', isFavorite: false },
];

const categories = ['Legal', 'Financial', 'Personal', 'Work'];
const allTags = ['contract', 'urgent', 'investing', 'q3-report', 'estate', 'specs', 'project-alpha', 'lease', 'housing', 'taxes', 'proposal', 'new-biz', 'health'];

const getCategoryFromDocType = (docType: string) => {
  const categoryMap: Record<string, string> = {
    'RENTAL_AGREEMENT': 'Personal',
    'LOAN_CONTRACT': 'Financial',
    'TERMS_OF_SERVICE': 'Legal',
    'PRIVACY_POLICY': 'Legal',
    'EMPLOYMENT_CONTRACT': 'Work',
    'FREELANCE_CONTRACT': 'Work',
    'PURCHASE_AGREEMENT': 'Legal',
    'NDA': 'Legal',
    'PARTNERSHIP_AGREEMENT': 'Legal',
    'INSURANCE_POLICY': 'Financial',
    'OTHER': 'Work'
  };
  return categoryMap[docType] || 'Work';
};


// --- MAIN DASHBOARD COMPONENT ---
export function DashboardClient() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'risk'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRiskLevels, setSelectedRiskLevels] = useState<string[]>([]);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();

    useEffect(() => {
    const fetchDocuments = async () => {
      if (!session) return;

      try {
        const response = await fetch('/api/documents');
        if (response.ok) {
          const data = await response.json();
          setDocuments(data);
        }
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [session]);


  const handleTagClick = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleRiskLevelToggle = (riskLevel: string) => {
    setSelectedRiskLevels(prev =>
      prev.includes(riskLevel) ? prev.filter(r => r !== riskLevel) : [...prev, riskLevel]
    );
  };

  const filteredDocuments = useMemo(() => {
    let filtered = documents.filter(doc => {
      // Search filter
      const searchMatch = searchQuery === '' || 
        doc.originalFileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
      
      // Category filter
      const docCategory = doc.category || getCategoryFromDocType(doc.documentType);
      const categoryMatch = activeCategory === 'All' || docCategory === activeCategory;
      
      // Tags filter
      const docTags = doc.tags || [];
      const tagMatch = selectedTags.length === 0 || selectedTags.every(tag => docTags.includes(tag));
      
      // Favorites filter
      const favoriteMatch = !showFavorites || (doc.isFavorite || false);
      
      // Risk level filter
      const docRiskLevel = doc.riskLevel || 'LOW';
      const riskMatch = selectedRiskLevels.length === 0 || selectedRiskLevels.includes(docRiskLevel);
      
      return searchMatch && categoryMatch && tagMatch && favoriteMatch && riskMatch;
    });

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'name':
          comparison = a.originalFileName.localeCompare(b.originalFileName);
          break;
        case 'risk':
          const riskOrder = { LOW: 1, MEDIUM: 2, HIGH: 3 };
          const aRisk = a.riskLevel || 'LOW';
          const bRisk = b.riskLevel || 'LOW';
          comparison = riskOrder[aRisk as keyof typeof riskOrder] - riskOrder[bRisk as keyof typeof riskOrder];
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [documents, activeCategory, selectedTags, showFavorites, searchQuery, sortBy, sortOrder, selectedRiskLevels]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    visible: { y: 0, opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 100 } },
  };

  return (
    <div className="min-h-screen bg-warm-gray dark:bg-charcoal text-gray-800 dark:text-gray-200 flex">
      {/* --- Sidebar --- */}
      <Sidebar 
        activeCategory={activeCategory} 
        setActiveCategory={setActiveCategory}
        selectedTags={selectedTags}
        handleTagClick={handleTagClick}
        showFavorites={showFavorites}
        setShowFavorites={setShowFavorites}
        selectedRiskLevels={selectedRiskLevels}
        handleRiskLevelToggle={handleRiskLevelToggle}
        isExpanded={isSidebarExpanded}
        setIsExpanded={setIsSidebarExpanded}
      />

      {/* --- Main Content --- */}
      <main className={cn(
        "flex-1 p-6 lg:p-8 transition-all duration-500 ease-in-out",
        isSidebarExpanded ? "ml-0 md:ml-72 lg:ml-72" : "ml-0 md:ml-20 lg:ml-20"
      )}>
        {/* --- Sticky Header --- */}
        <Header 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />

        <AnimatePresence>
          {isLoading ? (
            <motion.div
              key="loader"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8"
            >
              {[...Array(8)].map((_, i) => (
                <motion.div key={i} variants={itemVariants}>
                  <Skeleton className="h-48 rounded-2xl" />
                </motion.div>
              ))}
            </motion.div>
          ) : filteredDocuments.length > 0 ? (
            <motion.div
              key="documents"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8"
            >
              {filteredDocuments.map((doc) => (
                <DocumentCard 
                  key={doc.id} 
                  doc={doc} 
                  variants={itemVariants} 
                  onCardClick={() => setSelectedDocument(doc)}
                />
              ))}
            </motion.div>
          ) : (
             <EmptyState />
          )}
        </AnimatePresence>
      </main>

      {/* --- Document Detail Drawer --- */}
      <AnimatePresence>
        {selectedDocument && (
          <DocumentDetailDrawer 
            document={selectedDocument}
            onClose={() => setSelectedDocument(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


// --- SUB-COMPONENTS ---

const Sidebar = ({ activeCategory, setActiveCategory, selectedTags, handleTagClick, showFavorites, setShowFavorites, selectedRiskLevels, handleRiskLevelToggle, isExpanded, setIsExpanded }: any) => {
    const toggleSidebar = () => setIsExpanded(!isExpanded);

    const sectionIcons = {
        favorites: <Star className="h-5 w-5" />,
        categories: <Tag className="h-5 w-5" />,
        riskLevels: <AlertCircle className="h-5 w-5" />,
        tags: <Filter className="h-5 w-5" />
    };

    return (
        <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className={cn(
                "fixed top-0 left-0 h-full z-40 bg-gradient-to-b from-white/80 via-white/60 to-white/40 dark:from-gray-900/80 dark:via-gray-900/60 dark:to-gray-900/40 backdrop-blur-2xl border-r border-white/30 dark:border-gray-700/50 shadow-2xl transition-all duration-500 ease-in-out overflow-hidden",
                isExpanded ? "w-72" : "w-20"
            )}
        >
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="relative mt-12 p-6 border-b border-white/20 dark:border-gray-700/30">
                    <div className="flex items-center justify-between">
                        <motion.div
                            initial={false}
                            animate={{ opacity: isExpanded ? 1 : 0, scale: isExpanded ? 1 : 0.8 }}
                            transition={{ duration: 0.3 }}
                            className={cn("overflow-hidden", !isExpanded && "w-0")}
                        >
                            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-teal-400  whitespace-nowrap">
                                <TranslatedText text="Legalease" />
                            </h2>
                        </motion.div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleSidebar}
                            className="relative z-10 h-10 w-10 rounded-full bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/30 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110"
                        >
                            <motion.div
                                animate={{ rotate: isExpanded ? 0 : 180 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ChevronsRight className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                            </motion.div>
                        </Button>
                    </div>

                    {/* Decorative gradient bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    <div className="p-4 space-y-8">
                        {/* Favorites Section */}
                        <motion.div
                            initial={false}
                            animate={{ opacity: isExpanded ? 1 : 0 }}
                            transition={{ duration: 0.3, delay: isExpanded ? 0.1 : 0 }}
                            className={cn("space-y-3", !isExpanded && "pointer-events-none")}
                        >
                            <div className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200/50 dark:border-yellow-700/30",
                                !isExpanded && "justify-center"
                            )}>
                                <div className="text-yellow-600 dark:text-yellow-400">
                                    {sectionIcons.favorites}
                                </div>
                                {isExpanded && (
                                    <h3 className="font-semibold text-sm text-yellow-700 dark:text-yellow-300 uppercase tracking-wide">
                                        <TranslatedText text="Favorites" />
                                    </h3>
                                )}
                            </div>

                            {isExpanded && (
                                <motion.ul
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-1"
                                >
                                    <SidebarItem
                                        icon={<Star className="h-4 w-4" />}
                                        text="Favorites"
                                        isActive={showFavorites}
                                        onClick={() => setShowFavorites(!showFavorites)}
                                        isExpanded={isExpanded}
                                    />
                                </motion.ul>
                            )}
                        </motion.div>

                        <div className="border-t border-white/10 dark:border-gray-700/30 my-4" />

                        {/* Categories Section */}
                        <motion.div
                            initial={false}
                            animate={{ opacity: isExpanded ? 1 : 0 }}
                            transition={{ duration: 0.3, delay: isExpanded ? 0.15 : 0 }}
                            className={cn("space-y-3", !isExpanded && "pointer-events-none")}
                        >
                            <div className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/30",
                                !isExpanded && "justify-center"
                            )}>
                                <div className="text-blue-600 dark:text-blue-400">
                                    {sectionIcons.categories}
                                </div>
                                {isExpanded && (
                                    <h3 className="font-semibold text-sm text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                                        <TranslatedText text="Categories" />
                                    </h3>
                                )}
                            </div>

                            {isExpanded && (
                                <motion.ul
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-1"
                                >
                                    <SidebarItem
                                        text="All"
                                        isActive={activeCategory === 'All'}
                                        onClick={() => { setActiveCategory('All'); setShowFavorites(false); }}
                                        isExpanded={isExpanded}
                                    />
                                    {categories.map(cat => (
                                        <SidebarItem
                                            key={cat}
                                            text={cat}
                                            isActive={activeCategory === cat}
                                            onClick={() => { setActiveCategory(cat); setShowFavorites(false); }}
                                            isExpanded={isExpanded}
                                        />
                                    ))}
                                </motion.ul>
                            )}
                        </motion.div>

                        <div className="border-t border-white/10 dark:border-gray-700/30 my-4" />

                        {/* Risk Levels Section */}
                        <motion.div
                            initial={false}
                            animate={{ opacity: isExpanded ? 1 : 0 }}
                            transition={{ duration: 0.3, delay: isExpanded ? 0.2 : 0 }}
                            className={cn("space-y-3", !isExpanded && "pointer-events-none")}
                        >
                            <div className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200/50 dark:border-red-700/30",
                                !isExpanded && "justify-center"
                            )}>
                                <div className="text-red-600 dark:text-red-400">
                                    {sectionIcons.riskLevels}
                                </div>
                                {isExpanded && (
                                    <h3 className="font-semibold text-sm text-red-700 dark:text-red-300 uppercase tracking-wide">
                                        <TranslatedText text="Risk Levels" />
                                    </h3>
                                )}
                            </div>

                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-2"
                                >
                                    {['LOW', 'MEDIUM', 'HIGH'].map(risk => (
                                        <motion.button
                                            key={risk}
                                            whileHover={{ scale: 1.02, x: 4 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleRiskLevelToggle(risk)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-3 rounded-lg transition-all duration-300 border",
                                                selectedRiskLevels.includes(risk)
                                                    ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-300/50 shadow-lg shadow-teal-500/20'
                                                    : 'bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-700/70 border-white/30 dark:border-gray-600/30 hover:border-white/50 dark:hover:border-gray-500/50'
                                            )}
                                        >
                                            <span className="flex items-center gap-3">
                                                <AlertCircle className={cn(
                                                    "h-4 w-4",
                                                    risk === 'CRITICAL' ? 'text-red-600 dark:text-red-400' :
                                                    risk === 'HIGH' ? 'text-red-500 dark:text-red-300' :
                                                    risk === 'MEDIUM' ? 'text-yellow-500 dark:text-yellow-300' :
                                                    'text-green-500 dark:text-green-400'
                                                )} />
                                                <TranslatedText text={risk} />
                                            </span>
                                            {selectedRiskLevels.includes(risk) && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="h-5 w-5 rounded-full bg-teal-500 flex items-center justify-center"
                                                >
                                                    <span className="text-white text-xs font-bold">✓</span>
                                                </motion.div>
                                            )}
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </motion.div>

                        <div className="border-t border-white/10 dark:border-gray-700/30 my-4" />

                        {/* Tags Section */}
                        <motion.div
                            initial={false}
                            animate={{ opacity: isExpanded ? 1 : 0 }}
                            transition={{ duration: 0.3, delay: isExpanded ? 0.25 : 0 }}
                            className={cn("space-y-3", !isExpanded && "pointer-events-none")}
                        >
                            <div className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/50 dark:border-purple-700/30",
                                !isExpanded && "justify-center"
                            )}>
                                <div className="text-purple-600 dark:text-purple-400">
                                    {sectionIcons.tags}
                                </div>
                                {isExpanded && (
                                    <h3 className="font-semibold text-sm text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                                        <TranslatedText text="Tags" />
                                    </h3>
                                )}
                            </div>

                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex flex-wrap gap-2"
                                >
                                    {allTags.map(tag => (
                                        <motion.button
                                            key={tag}
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleTagClick(tag)}
                                            className={cn(
                                                "px-3 py-2 text-xs rounded-full transition-all duration-300 border shadow-sm",
                                                selectedTags.includes(tag)
                                                    ? 'bg-teal-500 text-white border-teal-400 shadow-teal-500/30'
                                                    : 'bg-white/70 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-700 border-white/50 dark:border-gray-600/50 hover:border-white/70 dark:hover:border-gray-500/70 hover:shadow-md'
                                            )}
                                        >
                                            <TranslatedText text={tag} />
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                </div>

                {/* Collapsed State Icons */}
                {!isExpanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="absolute top-24 left-0 right-0 flex flex-col items-center space-y-6 py-6"
                    >
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowFavorites(!showFavorites)}
                            className={cn(
                                "p-3 rounded-full transition-all duration-300 border shadow-lg",
                                showFavorites
                                    ? 'bg-yellow-500 text-white border-yellow-400 shadow-yellow-500/30'
                                    : 'bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 border-white/50 dark:border-gray-600/50'
                            )}
                        >
                            {sectionIcons.favorites}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setActiveCategory(activeCategory === 'All' ? 'Legal' : 'All')}
                            className="p-3 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 border border-white/50 dark:border-gray-600/50 shadow-lg transition-all duration-300"
                        >
                            {sectionIcons.categories}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRiskLevelToggle('HIGH')}
                            className="p-3 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 border border-white/50 dark:border-gray-600/50 shadow-lg transition-all duration-300"
                        >
                            {sectionIcons.riskLevels}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleTagClick(allTags[0])}
                            className="p-3 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 border border-white/50 dark:border-gray-600/50 shadow-lg transition-all duration-300"
                        >
                            {sectionIcons.tags}
                        </motion.button>
                    </motion.div>
                )}
            </div>
        </motion.aside>
    );
};

const SidebarItem = ({ icon, text, isActive, onClick, isExpanded = true }: any) => (
    <motion.li
        whileHover={{ scale: 1.02, x: 4 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={cn(
            "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden border",
            isActive
                ? "text-white bg-gradient-to-r from-teal-500 to-blue-500 border-teal-400 shadow-lg shadow-teal-500/30"
                : "text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-700/70 border-white/30 dark:border-gray-600/30 hover:border-white/50 dark:hover:border-gray-500/50 hover:shadow-md"
        )}
    >
        {icon && (
            <div className={cn(
                "flex-shrink-0",
                isActive ? "text-white" : "text-gray-500 dark:text-gray-400"
            )}>
                {icon}
            </div>
        )}
        {isExpanded && (
            <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="font-medium"
            >
                <TranslatedText text={text} />
            </motion.span>
        )}
        {isActive && (
            <motion.div
                layoutId="activeIndicator"
                className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
        )}

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
    </motion.li>
);

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  sortBy: 'date' | 'name' | 'risk';
  setSortBy: (value: 'date' | 'name' | 'risk') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (value: 'asc' | 'desc') => void;
}

const Header = ({ searchQuery, setSearchQuery, sortBy, setSortBy, sortOrder, setSortOrder }: HeaderProps) => {
  const router = useRouter();
  
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };
  
  return (
    <header className="sticky top-0 z-30 p-4 -mx-4 mb-4 bg-warm-gray/80 dark:bg-charcoal/80 backdrop-blur-lg rounded-b-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                    placeholder="Search documents..." 
                    className="pl-10 bg-white/50 dark:bg-gray-800/50 border-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setSearchQuery('')}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
            <div className="flex items-center space-x-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <ArrowUpDown className="h-4 w-4" />
                            <TranslatedText text={`Sort by ${sortBy}`} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel><TranslatedText text="Sort By" /></DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setSortBy('date')}>
                            <Calendar className="mr-2 h-4 w-4" />
                            <TranslatedText text="Date" />
                            {sortBy === 'date' && <Badge className="ml-auto" variant="secondary">✓</Badge>}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy('name')}>
                            <FileText className="mr-2 h-4 w-4" />
                            <TranslatedText text="Name" />
                            {sortBy === 'name' && <Badge className="ml-auto" variant="secondary">✓</Badge>}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy('risk')}>
                            <AlertCircle className="mr-2 h-4 w-4" />
                            <TranslatedText text="Risk Level" />
                            {sortBy === 'risk' && <Badge className="ml-auto" variant="secondary">✓</Badge>}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={toggleSortOrder}>
                            <ArrowUpDown className="mr-2 h-4 w-4" />
                            <TranslatedText text={sortOrder === 'asc' ? 'Ascending' : 'Descending'} />
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                
                <Button className='cursor-pointer bg-teal-500 hover:bg-teal-600 dark:text-white' onClick={() => router.push('/upload')}>
                    <Plus className="mr-2 h-4 w-4" />
                    <TranslatedText text="Upload" />
                </Button>
            </div>
        </div>
    </header>
  )
};

const DocumentCard = ({ doc, variants, onCardClick }: { doc: Document, variants: any, onCardClick: () => void }) => {
  const router = useRouter();
  
  // Category-based gradient colors for heading
  const getCategoryFromDocType = (docType: string) => {
    const categoryMap: Record<string, string> = {
      'RENTAL_AGREEMENT': 'Personal',
      'LOAN_CONTRACT': 'Financial',
      'TERMS_OF_SERVICE': 'Legal',
      'PRIVACY_POLICY': 'Legal',
      'EMPLOYMENT_CONTRACT': 'Work',
      'FREELANCE_CONTRACT': 'Work',
      'PURCHASE_AGREEMENT': 'Legal',
      'NDA': 'Legal',
      'PARTNERSHIP_AGREEMENT': 'Legal',
      'INSURANCE_POLICY': 'Financial',
      'OTHER': 'Work'
    };
    return categoryMap[docType] || 'Work';
  };

  const category = doc.category || getCategoryFromDocType(doc.documentType);
  const tags = doc.tags || [];
  const isFavorite = doc.isFavorite || false;
  const riskLevel = doc.riskLevel || 'LOW';

  const categoryGradients = {
    Legal: 'from-blue-600 via-purple-600 to-pink-600',
    Financial: 'from-green-600 via-teal-600 to-cyan-600',
    Personal: 'from-orange-600 via-amber-600 to-yellow-600',
    Work: 'from-indigo-600 via-violet-600 to-purple-600',
  };
  
  const riskColor = {
      LOW: 'bg-green-300 text-neutral-700  dark:bg-green-700 dark:text-white',
      MEDIUM: 'bg-yellow-300 text-neutral-700 dark:bg-yellow-600 dark:text-white',
      HIGH: 'bg-red-300 text-neutral-700 dark:bg-red-700 dark:text-white',
  };
  
  const categoryColor = {
    Legal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    Financial: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    Personal: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    Work: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  };

  // Get file extension for icon
  const fileExtension = doc.originalFileName.split('.').pop()?.toUpperCase() || 'DOC';

  return (
    <motion.div
        variants={variants}
        className="group"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={onCardClick}
        className="relative flex flex-col h-60 cursor-pointer rounded-2xl bg-white dark:bg-zinc-900 shadow-lg transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-teal-500/30 overflow-hidden border border-gray-200 dark:border-gray-800"
      >
        {/* Animated gradient border on hover */}
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-teal-500/50 transition-colors duration-300 pointer-events-none z-10" />
        
        {/* Colored header with gradient */}
        <div className={cn(
          "relative h-24 p-4 bg-gradient-to-br overflow-hidden",
          categoryGradients[category as keyof typeof categoryGradients]
        )}>
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
          
          {/* File icon badge */}
          <Badge className="absolute top-3 right-3 bg-white/20 hover:bg-white/30 text-white border-white/30 font-mono text-xs">
            {fileExtension}
          </Badge>
          
          {/* Document title */}
          <h3 className="relative z-10 font-bold text-base text-white line-clamp-2 drop-shadow-lg">
            <TranslatedText text={doc.originalFileName} />
          </h3>
        </div>
        
        {/* Content area */}
        <div className="flex-grow p-4 space-y-3">
          {/* Metadata badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={cn("text-xs", categoryColor[category as keyof typeof categoryColor])}>
              <Tag className="h-3 w-3 mr-1" />
              <TranslatedText text={category} />
            </Badge>
            <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-gray-800">
              <Calendar className="h-3 w-3 mr-1" />
              {format(new Date(doc.createdAt), 'MMM d, yyyy')}
            </Badge>
          </div>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-xs rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                +{tags.length - 3}
              </span>
            )}
          </div>
        </div>
        
        {/* Footer with actions */}
        <div className="p-4 pt-0 flex items-center justify-between border-t border-gray-400 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className={cn("px-2 py-1 mt-4 text-xs font-medium text-white rounded-full flex items-center gap-1", riskColor[riskLevel as keyof typeof riskColor])}>
              <AlertCircle className="h-3 w-3" />
              <TranslatedText text={riskLevel} />
            </div>
            {isFavorite && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              >
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              </motion.div>
            )}
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={(e) => {e.stopPropagation(); router.push(`/analysis/${doc.id}`)}} 
              className="h-8 w-8 hover:bg-teal-100 dark:hover:bg-teal-900/30 hover:text-teal-600"
              title="View Analysis"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={(e) => {e.stopPropagation(); router.push(`/chat/${doc.id}`)}} 
              className="h-8 w-8 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600"
              title="Chat with AI"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const DocumentDetailDrawer = ({ document, onClose }: { document: Document; onClose: () => void; }) => {
    const router = useRouter();
    
    const getCategoryFromDocType = (docType: string) => {
      const categoryMap: Record<string, string> = {
        'RENTAL_AGREEMENT': 'Personal',
        'LOAN_CONTRACT': 'Financial',
        'TERMS_OF_SERVICE': 'Legal',
        'PRIVACY_POLICY': 'Legal',
        'EMPLOYMENT_CONTRACT': 'Work',
        'FREELANCE_CONTRACT': 'Work',
        'PURCHASE_AGREEMENT': 'Legal',
        'NDA': 'Legal',
        'PARTNERSHIP_AGREEMENT': 'Legal',
        'INSURANCE_POLICY': 'Financial',
        'OTHER': 'Work'
      };
      return categoryMap[docType] || 'Work';
    };

    const category = document.category || getCategoryFromDocType(document.documentType);
    const tags = document.tags || [];
    const isFavorite = document.isFavorite || false;
    const riskLevel = document.riskLevel || 'LOW';
    
    const categoryGradients = {
      Legal: 'from-blue-600 via-purple-600 to-pink-600',
      Financial: 'from-green-600 via-teal-600 to-cyan-600',
      Personal: 'from-orange-600 via-amber-600 to-yellow-600',
      Work: 'from-indigo-600 via-violet-600 to-purple-600',
    };
    
    const riskColor = {
        LOW: 'bg-green-500 text-white',
        MEDIUM: 'bg-yellow-500 text-white',
        HIGH: 'bg-red-500 text-white',
    };
    
    return (
        <>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        />
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-zinc-900 z-50 shadow-2xl flex flex-col overflow-hidden"
        >
            {/* Header with gradient */}
            <div className={cn(
                "relative p-6 bg-gradient-to-br",
                categoryGradients[category as keyof typeof categoryGradients]
            )}>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white hover:bg-white/20"
                >
                    <X />
                </Button>
                
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-white mb-1 break-words">
                            <TranslatedText text={document.originalFileName} />
                        </h2>
                        <p className="text-white/80 text-sm">
                            {format(new Date(document.createdAt), 'PPP')}
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Content */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <Card className="p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1"><TranslatedText text="Category" /></p>
                        <Badge className="bg-gradient-to-r from-teal-500 to-blue-500 text-white">
                            {document.category}
                        </Badge>
                    </Card>
                    <Card className="p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1"><TranslatedText text="Risk Level" /></p>
                        <Badge className={riskColor[riskLevel as keyof typeof riskColor]}>
                            {riskLevel}
                        </Badge>
                    </Card>
                </div>
                
                {/* Tags Section */}
                <div>
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Tag className="h-4 w-4 text-teal-500" />
                        <TranslatedText text="Tags" />
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </div>
                
                {/* Document Info */}
                <div>
                    <h3 className="font-semibold text-sm mb-3"><TranslatedText text="Document Information" /></h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                            <span className="text-gray-500 dark:text-gray-400"><TranslatedText text="Uploaded" /></span>
                            <span className="font-medium">{format(new Date(document.createdAt), 'PP, p')}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                            <span className="text-gray-500 dark:text-gray-400"><TranslatedText text="Favorite" /></span>
                            <span className="font-medium">
                                {document.isFavorite ? (
                                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 inline" />
                                ) : (
                                    <TranslatedText text="No" />
                                )}
                            </span>
                        </div>
                    </div>
                </div>
                
                {/* Preview Section */}
                <div>
                    <h3 className="font-semibold text-sm mb-3"><TranslatedText text="Preview" /></h3>
                    <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center">
                        <FileText className="h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400"><TranslatedText text="Preview not available" /></p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1"><TranslatedText text="Click 'View Analysis' to see details" /></p>
                    </div>
                </div>
            </div>
            
            {/* Action Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <Button 
                        className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
                        onClick={() => router.push(`/analysis/${document.id}`)}
                    >
                        <FileText className="mr-2 h-4 w-4"/> 
                        <TranslatedText text="View Analysis" />
                    </Button>
                    <Button 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                        onClick={() => router.push(`/chat/${document.id}`)}
                    >
                        <MessageSquare className="mr-2 h-4 w-4"/> 
                        <TranslatedText text="Chat with AI" />
                    </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4"/> 
                        <TranslatedText text="Download" />
                    </Button>
                    <Button variant="outline">
                        <Share2 className="mr-2 h-4 w-4"/> 
                        <TranslatedText text="Share" />
                    </Button>
                </div>
            </div>
        </motion.div>
      </>
    );
};

const EmptyState = () => {
  const router = useRouter();
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center h-[50vh] text-center"
    >
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ repeat: Infinity, duration: 1.5, repeatType: 'reverse', ease: 'easeInOut' }}
      >
        <FileText size={64} className="text-gray-300 dark:text-gray-600" />
      </motion.div>
      <h2 className="text-2xl font-semibold mt-6"><TranslatedText text="No Documents Found" /></h2>
      <p className="text-gray-500 mt-2 mb-6 max-w-sm">
          <TranslatedText text="It looks like there's nothing here yet. Try uploading a document to get started."/>
      </p>
      <Button className='cursor-pointer bg-teal-500 hover:bg-teal-600 dark:text-white' onClick={() => router.push('/upload')}>
          <Plus className="mr-2 h-4 w-4" />
          <TranslatedText text="Upload Your First Document" />
      </Button>
    </motion.div>
  );
};