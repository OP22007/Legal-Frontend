'use client';

import * as React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
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
    ChevronsRight
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TranslatedText } from "@/components/TranslatedText";

// --- TYPE DEFINITIONS ---
interface Document {
  id: string;
  originalFileName: string;
  createdAt: string;
  category: 'Legal' | 'Financial' | 'Personal' | 'Work';
  tags: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  isFavorite: boolean;
}

// --- MOCK DATA (for demonstration purposes) ---
const mockDocuments: Document[] = [
  { id: '1', originalFileName: 'Employment Contract Q4.pdf', createdAt: new Date(2025, 8, 15).toISOString(), category: 'Legal', tags: ['contract', 'urgent'], riskLevel: 'High', isFavorite: true },
  { id: '2', originalFileName: 'Investment Portfolio Report.docx', createdAt: new Date(2025, 8, 12).toISOString(), category: 'Financial', tags: ['investing', 'q3-report'], riskLevel: 'Medium', isFavorite: false },
  { id: '3', originalFileName: 'Personal Will and Testament.pdf', createdAt: new Date(2025, 7, 20).toISOString(), category: 'Personal', tags: ['estate'], riskLevel: 'Low', isFavorite: false },
  { id: '4', originalFileName: 'Project Alpha Spec.docx', createdAt: new Date(2025, 8, 18).toISOString(), category: 'Work', tags: ['specs', 'project-alpha'], riskLevel: 'Low', isFavorite: true },
  { id: '5', originalFileName: 'Rental Agreement - Apt 4B.pdf', createdAt: new Date(2025, 6, 5).toISOString(), category: 'Legal', tags: ['lease', 'housing'], riskLevel: 'Medium', isFavorite: false },
  { id: '6', originalFileName: '2024 Tax Returns.pdf', createdAt: new Date(2025, 3, 10).toISOString(), category: 'Financial', tags: ['taxes'], riskLevel: 'High', isFavorite: false },
  { id: '7', originalFileName: 'Project Phoenix Proposal.pdf', createdAt: new Date(2025, 8, 1).toISOString(), category: 'Work', tags: ['proposal', 'new-biz'], riskLevel: 'Medium', isFavorite: false },
  { id: '8', originalFileName: 'Medical Records Summary.docx', createdAt: new Date(2025, 5, 22).toISOString(), category: 'Personal', tags: ['health'], riskLevel: 'Low', isFavorite: false },
];

const categories = ['Legal', 'Financial', 'Personal', 'Work'];
const allTags = ['contract', 'urgent', 'investing', 'q3-report', 'estate', 'specs', 'project-alpha', 'lease', 'housing', 'taxes', 'proposal', 'new-biz', 'health'];


// --- MAIN DASHBOARD COMPONENT ---
export function DashboardClient() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
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

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const categoryMatch = activeCategory === 'All' || doc.category === activeCategory;
      const tagMatch = selectedTags.length === 0 || selectedTags.every(tag => doc.tags.includes(tag));
      const favoriteMatch = !showFavorites || doc.isFavorite;
      return categoryMatch && tagMatch && favoriteMatch;
    });
  }, [documents, activeCategory, selectedTags, showFavorites]);

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
      />

      {/* --- Main Content --- */}
      <main className="flex-1 p-6 lg:p-8 ml-0 md:ml-64 lg:ml-72 transition-all duration-300">
        {/* --- Sticky Header --- */}
        <Header />

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

const Sidebar = ({ activeCategory, setActiveCategory, selectedTags, handleTagClick, showFavorites, setShowFavorites }: any) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const toggleSidebar = () => setIsExpanded(!isExpanded);
    return (
        <motion.aside 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className={cn(
                "fixed top-0 left-0 h-full z-40 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-r border-white/20 dark:border-gray-700/50 transition-all duration-300 ease-in-out",
                isExpanded ? "w-64 lg:w-72" : "w-16"
            )}
        >
            <div className="flex flex-col h-full p-4">
                <div className="flex items-center justify-between mb-8">
                   {isExpanded && <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-purple-500">
                        <TranslatedText text="LegisEye" />
                    </h2>}
                    <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
                        <ChevronsRight className={cn("transition-transform", !isExpanded && "rotate-180")}/>
                    </Button>
                </div>
                
                <div className={cn(!isExpanded && "opacity-0 invisible transition-opacity duration-200")}>
                    <h3 className="font-semibold text-sm mb-2 text-gray-500 dark:text-gray-400"><TranslatedText text="FAVORITES" /></h3>
                    <ul className="space-y-1 mb-6">
                        <SidebarItem icon={<Star />} text="Favorites" isActive={showFavorites} onClick={() => setShowFavorites(!showFavorites)} />
                    </ul>

                    <h3 className="font-semibold text-sm mb-2 text-gray-500 dark:text-gray-400"><TranslatedText text="CATEGORIES" /></h3>
                    <ul className="space-y-1 mb-6">
                        <SidebarItem text="All" isActive={activeCategory === 'All'} onClick={() => { setActiveCategory('All'); setShowFavorites(false); }} />
                        {categories.map(cat => (
                            <SidebarItem key={cat} text={cat} isActive={activeCategory === cat} onClick={() => { setActiveCategory(cat); setShowFavorites(false); }} />
                        ))}
                    </ul>

                    <h3 className="font-semibold text-sm mb-2 text-gray-500 dark:text-gray-400"><TranslatedText text="TAGS" /></h3>
                    <div className="flex flex-wrap gap-2">
                        {allTags.map(tag => (
                            <motion.button
                                key={tag}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleTagClick(tag)}
                                className={cn(
                                    "px-2 py-1 text-xs rounded-full transition-colors",
                                    selectedTags.includes(tag) 
                                    ? 'bg-teal-500 text-white' 
                                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                                )}
                            >
                                <TranslatedText text={tag} />
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>
        </motion.aside>
    );
};

const SidebarItem = ({ icon, text, isActive, onClick }: any) => (
    <li 
        onClick={onClick}
        className={cn(
            "flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-all relative",
            isActive ? "text-gray-900 dark:text-white" : "text-gray-500 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
        )}
    >
        {icon}
        <span><TranslatedText text={text} /></span>
        {isActive && (
            <motion.div
                layoutId="activeIndicator"
                className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 rounded-r-full"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
        )}
    </li>
);

const Header = () => {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 p-4 -mx-4 mb-4 bg-warm-gray/80 dark:bg-charcoal/80 backdrop-blur-lg rounded-b-xl">
        <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input placeholder="Search documents..." className="pl-10 bg-white/50 dark:bg-gray-800/50 border-0"/>
            </div>
            <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm"><TranslatedText text="Sort by" /></Button>
                <Button variant="ghost" size="sm"><TranslatedText text="Filter" /> <Filter className="ml-2 h-4 w-4"/></Button>
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
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };
  
  const riskColor = {
      Low: 'bg-green-500',
      Medium: 'bg-yellow-500',
      High: 'bg-red-500',
  };

  return (
    <motion.div
        variants={variants}
        className="group perspective-1000"
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{ rotateX, rotateY, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={onCardClick}
        className="relative flex flex-col h-48 cursor-pointer rounded-2xl bg-white/50 dark:bg-zinc-800/50 shadow-lg transition-shadow duration-300 group-hover:shadow-2xl group-hover:shadow-teal-500/20"
      >
        <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-teal-500/50 transition-colors duration-300 pointer-events-none" />
        <div className="flex-grow p-4">
            <h3 className="font-bold text-base bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-100 dark:to-gray-300 truncate">
              <TranslatedText text={doc.originalFileName} />
            </h3>
            <p className="text-xs text-gray-500 mt-1">
                <TranslatedText text={format(new Date(doc.createdAt), 'PP')} />
            </p>
        </div>
        <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={cn("px-2 py-0.5 text-xs text-white rounded-full", riskColor[doc.riskLevel])}>
                  <TranslatedText text={`${doc.riskLevel} Risk`} />
              </div>
              {doc.isFavorite && <Star className="h-4 w-4 text-yellow-400 fill-current" />}
            </div>
            
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button size="icon" variant="ghost" onClick={(e) => {e.stopPropagation(); router.push(`/analysis/${doc.id}`)}} className="h-7 w-7"><FileText className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={(e) => {e.stopPropagation(); router.push(`/chat/${doc.id}`)}} className="h-7 w-7"><MessageSquare className="h-4 w-4" /></Button>
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const DocumentDetailDrawer = ({ document, onClose }: { document: Document; onClose: () => void; }) => {
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
            className="fixed top-0 right-0 h-full w-full max-w-md bg-warm-gray dark:bg-charcoal z-50 shadow-2xl p-6 flex flex-col"
        >
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold"><TranslatedText text={document.originalFileName} /></h2>
                <Button variant="ghost" size="icon" onClick={onClose}><X /></Button>
            </div>
            <div className="flex-grow overflow-y-auto pr-2">
                <h3 className="font-semibold mb-2"><TranslatedText text="Details" /></h3>
                <p><TranslatedText text="Category:" /> {document.category}</p>
                <p><TranslatedText text="Risk Level:" /> {document.riskLevel}</p>
                <p><TranslatedText text="Tags:" /> {document.tags.join(', ')}</p>
                <p><TranslatedText text="Uploaded:" /> {format(new Date(document.createdAt), 'PPP p')}</p>
                
                <div className="mt-6">
                    <h3 className="font-semibold mb-2"><TranslatedText text="Document Preview" /></h3>
                    <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500"><TranslatedText text="Preview not available" /></p>
                    </div>
                </div>
            </div>
            <div className="mt-6 flex space-x-2">
                <Button className="flex-1"><Download className="mr-2 h-4 w-4"/> <TranslatedText text="Download" /></Button>
                <Button className="flex-1" variant="outline"><Share2 className="mr-2 h-4 w-4"/> <TranslatedText text="Share" /></Button>
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