'use client';

import { useState, useEffect, useRef, useMemo,useCallback } from "react";
import { motion, useInView, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import dynamic from 'next/dynamic';
import confetti from 'canvas-confetti';
import { useTheme } from "next-themes";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  FileText,
  Shield,
  Printer,
  Lightbulb,
  BookOpen,
  MoreVertical,
  Download,
  Share2,
  Link as LinkIcon,
  Sparkles,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Document as PrismaDocument, DocumentAnalysis, RiskFactor, KeyPoint, GlossaryTerm, RiskLevel } from "@/generated/prisma/client";
import React from "react";
import {toast} from 'sonner'

// --- DYNAMIC IMPORTS ---
const DocumentViewer = dynamic(() => import('./DocumentViewer'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[80vh] bg-gray-200 dark:bg-white/5" />,
});

// --- TYPES ---
export type DocumentWithAnalysis = PrismaDocument & {
    analyses: DocumentAnalysis[];
    riskFactors: RiskFactor[];
    keyPoints: KeyPoint[];
    glossaryTerms: GlossaryTerm[];
};

// --- THEME-AWARE CONFIGURATION ---
const riskConfig = {
  LOW: { title: "Low Risk", light: { color: "text-green-600", gradient: "from-green-50 to-white" }, dark: { color: "text-green-400", gradient: "from-green-900/30 to-gray-900/20" }, glow: "shadow-green-500/30" },
  MEDIUM: { title: "Medium Risk", light: { color: "text-amber-600", gradient: "from-amber-50 to-white" }, dark: { color: "text-amber-400", gradient: "from-amber-900/30 to-gray-900/20" }, glow: "shadow-amber-500/30" },
  HIGH: { title: "High Risk", light: { color: "text-red-600", gradient: "from-red-50 to-white" }, dark: { color: "text-red-400", gradient: "from-red-900/30 to-gray-900/20" }, glow: "shadow-red-500/40" },
  CRITICAL: { title: "Critical Risk", light: { color: "text-red-600", gradient: "from-red-50 to-white" }, dark: { color: "text-red-400", gradient: "from-red-900/30 to-gray-900/20" }, glow: "shadow-red-500/40" },
};

// --- HOOKS ---
const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const media = window.matchMedia(query);
        if (media.matches !== matches) setMatches(media.matches);
        const listener = () => setMatches(media.matches);
        window.addEventListener("resize", listener);
        return () => window.removeEventListener("resize", listener);
    }, [matches, query]);
    return matches;
};

// --- REUSABLE & ENHANCED COMPONENTS ---

const AnimatedBackground = () => {
    const { resolvedTheme } = useTheme();

    const lightBg = `
        <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'>
            <circle cx='1.5' cy='1.5' r='1.5' fill='rgba(0,0,0,0.08)'/>
        </svg>
    `;

    return (
        <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
            <AnimatePresence>
                {resolvedTheme === 'dark' ? (
                    <motion.div 
                        key="dark"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]"
                    >
                        <motion.div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-[#3b82f6]/[0.25] to-transparent rounded-full filter blur-3xl" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
                        <motion.div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-[#d946ef]/[0.15] to-transparent rounded-full filter blur-3xl" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
                    </motion.div>
                ) : (
                    <motion.div 
                        key="light"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0 bg-white"
                        style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(lightBg)}")` }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const SectionWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });
    return (
        <motion.div ref={ref} className={className} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: "easeOut" }}>
            {children}
        </motion.div>
    );
};

const PulsingRiskGauge = ({ score, level }: { score: number; level: keyof typeof riskConfig }) => {
    const { resolvedTheme } = useTheme();
    const config = riskConfig[level];
    const themeConfig = resolvedTheme === 'dark' ? config.dark : config.light;
    const circumference = 2 * Math.PI * 80;
    const offset = circumference - (score / 100) * circumference;

    return (
        <SectionWrapper>
            <Card className="bg-white/60 dark:bg-black/20 backdrop-blur-lg border border-gray-200 dark:border-white/10">
                <CardHeader><CardTitle className="flex items-center text-gray-800 dark:text-white"><Shield className="mr-2" /> Overall Risk</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-center p-6">
                    <motion.div 
                        className="relative w-52 h-52 flex items-center justify-center rounded-full"
                        animate={score > 70 ? { boxShadow: [`0 0 0px ${riskConfig.HIGH.glow}`, `0 0 70px ${riskConfig.HIGH.glow}`, `0 0 0px ${riskConfig.HIGH.glow}`] } : {}}
                        transition={score > 70 ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" } : {}}
                    >
                        <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 200 200">
                            <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-gray-200 dark:text-white/10" />
                            <motion.circle cx="100" cy="100" r="80" stroke="url(#risk-gradient)" strokeWidth="16" fill="transparent" strokeLinecap="round" initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.5, ease: "circOut", delay: 0.2 }} />
                            <defs><linearGradient id="risk-gradient" gradientTransform="rotate(90)"><stop offset="0%" stopColor={level === 'LOW' ? '#4ade80' : level === 'MEDIUM' ? '#facc15' : '#f87171'} /><stop offset="100%" stopColor={level === 'LOW' ? '#16a34a' : level === 'MEDIUM' ? '#f59e0b' : '#dc2626'} /></linearGradient></defs>
                        </svg>
                        <div className={`absolute flex flex-col items-center justify-center ${themeConfig.color}`}>
                            <div className="text-5xl font-bold">{Math.round(score)}</div>
                            <div className="text-xl font-semibold">{level}</div>
                        </div>
                    </motion.div>
                </CardContent>
            </Card>
        </SectionWrapper>
    );
};

const KeyPointsSection = ({ keyPoints }: { keyPoints: KeyPoint[] }) => {
    const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } };

    return (
        <SectionWrapper>
            <Card className="bg-white/60 dark:bg-black/20 backdrop-blur-lg border border-gray-200 dark:border-white/10">
                <CardHeader><CardTitle className="flex items-center text-gray-800 dark:text-white"><BookOpen className="mr-2"/> Key Points</CardTitle></CardHeader>
                <CardContent>
                    <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
                        <Accordion type="single" collapsible className="w-full text-gray-800 dark:text-white">
                            {keyPoints.map(point => (
                                <motion.div key={point.id} variants={itemVariants}>
                                    <AccordionItem value={point.id} className="border-b border-gray-200 dark:border-white/10">
                                        <AccordionTrigger>{point.title}</AccordionTrigger>
                                        <AccordionContent className="text-gray-600 dark:text-gray-300">
                                            <p>{point.description}</p>
                                            <p className="text-sky-600 dark:text-sky-300/80 mt-2 italic"><strong>Impact:</strong> {point.potentialImpact}</p>
                                        </AccordionContent>
                                    </AccordionItem>
                                </motion.div>
                            ))}
                        </Accordion>
                    </motion.div>
                </CardContent>
            </Card>
        </SectionWrapper>
    );
};

const Eli5Summary = ({ summary }: { summary: string }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });
    const [animatedSummary, setAnimatedSummary] = useState("");

    useEffect(() => {
        if (isInView && summary) {
            let i = 0;
            setAnimatedSummary("");
            const intervalId = setInterval(() => {
                if (i < summary.length) {
                    setAnimatedSummary(prev => prev + summary.charAt(i));
                    i++;
                } else { clearInterval(intervalId); }
            }, 15);
            return () => clearInterval(intervalId);
        }
    }, [isInView, summary]);

    return (
        <SectionWrapper>
            <Card className="bg-white/60 dark:bg-black/20 backdrop-blur-lg border border-gray-200 dark:border-white/10">
                <CardHeader><CardTitle className="flex items-center text-gray-800 dark:text-white"><Lightbulb className="mr-2"/> ELI5 Summary</CardTitle></CardHeader>
                <CardContent ref={ref} className="text-gray-700 dark:text-gray-200 leading-relaxed min-h-[12rem] font-mono">
                    {animatedSummary}
                    {isInView && animatedSummary.length === summary.length ? null : <span className="inline-block w-2 h-5 bg-gray-800 dark:bg-white animate-pulse ml-1" />}
                </CardContent>
            </Card>
        </SectionWrapper>
    );
};

const RiskFactorCard = ({ factor, onSwipe, isTop }: { factor: RiskFactor, onSwipe: () => void, isTop: boolean }) => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-250, 250], [-25, 25]);

    return (
        <motion.div
            className={`absolute w-full h-full p-6 rounded-2xl border dark:border-white/10 border-gray-200 bg-white/50 dark:bg-black/30 backdrop-blur-xl shadow-2xl flex flex-col justify-between ${isTop ? 'cursor-grab active:cursor-grabbing' : ''}`}
            drag={isTop ? "x" : false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            onDragEnd={(e, info) => { if (isTop && Math.abs(info.offset.x) > 150) onSwipe(); }}
            style={{ x, rotate }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ x: x.get() > 0 ? 300 : -300, opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
        >
            <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{factor.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{factor.description}</p>
            </div>
            <div className="mt-4 p-3 bg-sky-100 dark:bg-sky-900/50 border-l-4 border-sky-500 dark:border-sky-400 rounded-r-md">
                <h4 className="font-semibold text-sky-800 dark:text-sky-300">Suggested Action</h4>
                <p className="text-sm text-sky-700 dark:text-sky-200/80 mt-1">{factor.mitigation}</p>
            </div>
        </motion.div>
    );
};

const RiskFactorDeck = ({ factors, level }: { factors: RiskFactor[], level: keyof typeof riskConfig }) => {
    const [cards, setCards] = useState(factors);
    const { resolvedTheme } = useTheme();
    const config = riskConfig[level];
    const themeConfig = resolvedTheme === 'dark' ? config.dark : config.light;

    useEffect(() => setCards(factors), [factors]);

    const handleSwipe = () => {
        setCards(prevCards => prevCards.slice(0, -1));
        if (cards.length === 1) { confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ['#4ade80', '#facc15', '#f87171'] }); }
    };

    const handleReset = () => setCards(factors);

    return (
        <div className={`w-full min-h-[450px] rounded-2xl p-4 bg-gradient-to-br ${themeConfig.gradient} shadow-lg`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className={`text-2xl font-bold ${themeConfig.color}`}>{config.title} ({cards.length})</h2>
                <Button variant="ghost" size="icon" onClick={handleReset} disabled={cards.length === factors.length} className="text-gray-600 dark:text-gray-300"><RotateCcw className="w-5 h-5"/></Button>
            </div>
            <div className="relative w-full h-[350px]">
                <AnimatePresence>
                    {cards.length > 0 ? (
                        cards.map((factor, index) => {
                            const isTop = index === cards.length - 1;
                            return (
                                <motion.div
                                    key={factor.id}
                                    className="absolute w-full h-full"
                                    style={{ scale: 1 - (cards.length - 1 - index) * 0.05, top: (cards.length - 1 - index) * 10 }}
                                    animate={{ scale: 1 - (cards.length - 1 - index) * 0.05, top: (cards.length - 1 - index) * 10 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                >
                                    <RiskFactorCard factor={factor} onSwipe={handleSwipe} isTop={isTop} />
                                </motion.div>
                            );
                        })
                    ) : (
                        <motion.div initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}} className="flex flex-col items-center justify-center h-full text-center text-green-800 dark:text-green-300">
                            <Sparkles className="w-16 h-16 mb-4" />
                            <p className="text-xl font-semibold">All clear!</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const ResponsiveRiskFactors = ({ groupedRisks }: { groupedRisks: { [key in 'HIGH' | 'MEDIUM' | 'LOW']: RiskFactor[] } }) => {
    const isMobile = useMediaQuery("(max-width: 768px)");

    if (isMobile) {
        return (
            <Tabs defaultValue="HIGH" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-200 dark:bg-gray-800/50 border border-gray-300 dark:border-white/10">
                    <TabsTrigger value="HIGH">High ({groupedRisks.HIGH.length})</TabsTrigger>
                    <TabsTrigger value="MEDIUM">Medium ({groupedRisks.MEDIUM.length})</TabsTrigger>
                    <TabsTrigger value="LOW">Low ({groupedRisks.LOW.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="HIGH" className="py-6"><RiskFactorDeck factors={groupedRisks.HIGH} level="HIGH" /></TabsContent>
                <TabsContent value="MEDIUM" className="py-6"><RiskFactorDeck factors={groupedRisks.MEDIUM} level="MEDIUM" /></TabsContent>
                <TabsContent value="LOW" className="py-6"><RiskFactorDeck factors={groupedRisks.LOW} level="LOW" /></TabsContent>
            </Tabs>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <RiskFactorDeck factors={groupedRisks.HIGH} level="HIGH" />
            <RiskFactorDeck factors={groupedRisks.MEDIUM} level="MEDIUM" />
            <RiskFactorDeck factors={groupedRisks.LOW} level="LOW" />
        </div>
    );
}

// --- MAIN CLIENT COMPONENT ---
export const AnalysisClient = ({ document }: { document: DocumentWithAnalysis }) => {
    const { resolvedTheme } = useTheme();
    const [isScrolled, setIsScrolled] = useState(false);

    const handlePrint = useCallback(() => window.print(), []);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const groupedRisks = useMemo(() => {
        const groups: { [key in 'HIGH' | 'MEDIUM' | 'LOW']: RiskFactor[] } = { HIGH: [], MEDIUM: [], LOW: [] };
        document.riskFactors.forEach(factor => {
            if (factor.severity === 'CRITICAL' || factor.severity === 'HIGH') groups.HIGH.push(factor);
            else if (factor.severity === 'MEDIUM') groups.MEDIUM.push(factor);
            else groups.LOW.push(factor);
        });
        return groups;
    }, [document.riskFactors]);

    const handleDownloadPdf = () => {
        const proxiedUrl = `/api/document-proxy?url=${encodeURIComponent(document.storageUrl)}`;
        const link = document.createElement('a');
        link.href = proxiedUrl;
        link.download = document.originalFileName || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Downloading PDF...');
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Legal Document Analysis: ${document.originalFileName}`,
                    url: window.location.href,
                });
                toast.success('Shared successfully!');
            } catch (error) {
                console.error('Error sharing:', error);
                toast.error('Failed to share.');
            }
        } else {
            toast.error('Web Share API not supported in this browser.');
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied to clipboard!');
        } catch (error) {
            console.error('Error copying link:', error);
            toast.error('Failed to copy link.');
        }
    };

    return (
        <div className="min-h-screen text-gray-800 dark:text-gray-100">
            <AnimatedBackground />
            <header className={cn("sticky top-0 z-50 transition-all duration-300", isScrolled ? "py-2 bg-white/80 dark:bg-black/30 backdrop-blur-xl border-b border-gray-200 dark:border-white/10" : "py-6")}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center text-gray-900 dark:text-white"><FileText className="mr-3" /> Analysis Report</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{document.originalFileName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleDownloadPdf}><Download className="mr-2 h-4 w-4"/>Download PDF</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleShare}><Share2 className="mr-2 h-4 w-4"/>Share</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleCopyLink}><LinkIcon className="mr-2 h-4 w-4"/>Copy Link</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Tabs defaultValue="report" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-200 dark:bg-gray-800/50 border border-gray-300 dark:border-white/10">
                        <TabsTrigger value="report">Interactive Report</TabsTrigger>
                        <TabsTrigger value="document">Document Viewer</TabsTrigger>
                    </TabsList>
                    <TabsContent value="report" className="py-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                            <div className="lg:col-span-1 flex flex-col gap-8">
                                <PulsingRiskGauge score={(document.overallRiskScore || 0) * 10} level={(document.riskLevel as keyof typeof riskConfig) || "LOW"} />
                            </div>
                            <div className="lg:col-span-2 flex flex-col gap-8">
                                <Eli5Summary summary={(document.analyses[0]?.summary as any)?.main || ""} />
                            </div>
                        </div>
                        <KeyPointsSection keyPoints={document.keyPoints} />
                        <div className="mt-12">
                            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">Risk Factor Analysis</h2>
                            <ResponsiveRiskFactors groupedRisks={groupedRisks} />
                        </div>
                    </TabsContent>
                    <TabsContent value="document" className="py-6">
                        <DocumentViewer storageUrl={document.storageUrl} glossaryTerms={document.glossaryTerms} />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};