'use client';

import { useState, useMemo, useEffect, useCallback, Fragment, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  ZoomIn, ZoomOut, Book, RotateCw, Download, Printer, Expand, Shrink,
  Maximize2, ChevronLeft, ChevronRight, X, Loader2
} from "lucide-react";
import React from "react";

if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
}

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  simplifiedDefinition?: string;
}

const ViewerToolbar = ({
  numPages, pageNumber, inputPageNumber, scale, viewMode,
  goToPrevPage, goToNextPage, handlePageInputChange, handlePageInputSubmit, setInputPageNumber,
  zoomIn, zoomOut, fitToWidth, fitToPage, toggleViewMode, rotateDocument,
  downloadDocument, printDocument, isCompact = false, onFullscreen
}: any) => (
  <div className={`flex items-center ${isCompact ? 'gap-1' : 'gap-2'} p-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-md shadow-sm flex-wrap`}>
    <div className="flex items-center gap-1">
      <Button variant="outline" size={isCompact ? "sm" : "icon"} onClick={goToPrevPage} disabled={pageNumber <= 1}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-1">
        <Input
          type="text"
          value={inputPageNumber}
          onChange={handlePageInputChange}
          onKeyDown={handlePageInputSubmit}
          onBlur={() => setInputPageNumber(pageNumber.toString())}
          className="w-12 h-8 text-center text-sm"
        />
        <span className="text-sm text-gray-500">/ {numPages || '-'}</span>
      </div>
      <Button variant="outline" size={isCompact ? "sm" : "icon"} onClick={goToNextPage} disabled={!numPages || pageNumber >= numPages}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
    <div className="flex items-center gap-1">
      <Button variant="outline" size={isCompact ? "sm" : "icon"} onClick={zoomOut} disabled={scale <= 0.1}>
        <ZoomOut className="h-4 w-4" />
      </Button>
      <span className="text-xs font-medium w-12 text-center">{(scale * 100).toFixed(0)}%</span>
      <Button variant="outline" size={isCompact ? "sm" : "icon"} onClick={zoomIn} disabled={scale >= 3.0}>
        <ZoomIn className="h-4 w-4" />
      </Button>
    </div>
    <div className="flex items-center gap-1">
      <Button variant="outline" size={isCompact ? "sm" : "icon"} title="Fit to Width" onClick={fitToWidth}>
        <Expand className="h-4 w-4" />
      </Button>
      <Button variant="outline" size={isCompact ? "sm" : "icon"} title="Fit to Page" onClick={fitToPage}>
        <Shrink className="h-4 w-4" />
      </Button>
    </div>
    <Button variant="outline" size={isCompact ? "sm" : "icon"} title={viewMode === 'single' ? 'Continuous View' : 'Single Page'} onClick={toggleViewMode} className={viewMode === 'continuous' ? 'bg-blue-100 dark:bg-blue-900' : ''}>
      <Book className="h-4 w-4" />
    </Button>
    <div className="flex items-center gap-1">
      <Button variant="outline" size={isCompact ? "sm" : "icon"} title="Rotate" onClick={rotateDocument}>
        <RotateCw className="h-4 w-4" />
      </Button>
      <Button variant="outline" size={isCompact ? "sm" : "icon"} title="Download" onClick={downloadDocument}>
        <Download className="h-4 w-4" />
      </Button>
      <Button variant="outline" size={isCompact ? "sm" : "icon"} title="Print" onClick={printDocument}>
        <Printer className="h-4 w-4" />
      </Button>
      {onFullscreen && (
        <Button variant="outline" size={isCompact ? "sm" : "icon"} title="Fullscreen" onClick={onFullscreen}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  </div>
);

const DocumentViewer = ({ storageUrl, glossaryTerms = [] }: {
  storageUrl: string;
  glossaryTerms?: GlossaryTerm[]
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [inputPageNumber, setInputPageNumber] = useState<string>("1");
  const [scale, setScale] = useState(1.2);
  const [pageWidth, setPageWidth] = useState<number | null>(null);
  const [pageHeight, setPageHeight] = useState<number | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'single' | 'continuous'>('single');

  const cardContentRef = useRef<HTMLDivElement>(null);
  const fullscreenContentRef = useRef<HTMLDivElement>(null);

  const proxiedUrl = useMemo(() => `/api/document-proxy?url=${encodeURIComponent(storageUrl)}`, [storageUrl]);

  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
  }), []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setDocumentError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error("Failed to load PDF:", error);
    setDocumentError("Failed to load document. Please check the URL and sharing permissions.");
    setIsLoading(false);
  }, []);

  const onPageLoadSuccess = useCallback((page: any) => {
    if (!pageWidth || !pageHeight) {
      const { width, height } = page.getViewport({ scale: 1 });
      setPageWidth(width);
      setPageHeight(height);
    }
  }, [pageWidth, pageHeight]);

  const fitToWidth = useCallback(() => {
    const containerRef = isFullscreen ? fullscreenContentRef : cardContentRef;
    if (containerRef.current && pageWidth) {
      const containerWidth = containerRef.current.offsetWidth;
      const newScale = (containerWidth - 80) / pageWidth;
      setScale(Math.max(0.1, Math.min(newScale, 3.0)));
    }
  }, [pageWidth, isFullscreen]);

  const fitToPage = useCallback(() => {
    const containerRef = isFullscreen ? fullscreenContentRef : cardContentRef;
    if (containerRef.current && pageWidth && pageHeight) {
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight - 100;
      const widthScale = (containerWidth - 80) / pageWidth;
      const heightScale = (containerHeight - 80) / pageHeight;
      const newScale = Math.min(widthScale, heightScale);
      setScale(Math.max(0.1, Math.min(newScale, 3.0)));
    }
  }, [pageWidth, pageHeight, isFullscreen]);

  const rotateDocument = useCallback(() => setRotation(prev => (prev + 90) % 360), []);
  const downloadDocument = useCallback(() => window.open(proxiedUrl, '_blank'), [proxiedUrl]);
  const printDocument = useCallback(() => window.open(proxiedUrl, '_blank'), [proxiedUrl]);
  const goToNextPage = useCallback(() => setPageNumber(prev => Math.min(prev + 1, numPages!)), [numPages]);
  const goToPrevPage = useCallback(() => setPageNumber(prev => Math.max(prev - 1, 1)), []);
  const handlePageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setInputPageNumber(e.target.value), []);
  const handlePageInputSubmit = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const pageNum = parseInt(inputPageNumber);
      if (numPages && pageNum >= 1 && pageNum <= numPages) setPageNumber(pageNum);
      else setInputPageNumber(pageNumber.toString());
    }
  }, [inputPageNumber, numPages, pageNumber]);
  const toggleViewMode = useCallback(() => setViewMode(prev => prev === 'single' ? 'continuous' : 'single'), []);
  const zoomIn = useCallback(() => setScale(s => Math.min(s + 0.2, 3.0)), []);
  const zoomOut = useCallback(() => setScale(s => Math.max(s - 0.2, 0.1)), []);
  
  useEffect(() => setInputPageNumber(pageNumber.toString()), [pageNumber]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === 'ArrowRight') goToNextPage();
      if (event.key === 'ArrowLeft') goToPrevPage();
      if (event.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextPage, goToPrevPage, isFullscreen]);
  
  const textRenderer = useCallback((textItem: any) => {
    if (!textItem?.str || !glossaryTerms?.length) return textItem.str;
    const text = textItem.str;
    const allMatches: { term: GlossaryTerm; index: number }[] = [];
    for (const term of glossaryTerms) {
      let startIndex = 0;
      while (startIndex < text.length) {
        const index = text.toLowerCase().indexOf(term.term.toLowerCase(), startIndex);
        if (index === -1) break;
        allMatches.push({ term, index });
        startIndex = index + term.term.length;
      }
    }
    if (allMatches.length === 0) return text;
    allMatches.sort((a, b) => a.index - b.index);
    const uniqueMatches: { term: GlossaryTerm; index: number; endIndex: number }[] = [];
    let lastEndIndex = -1;
    for (const match of allMatches) {
      const endIndex = match.index + match.term.term.length;
      if (match.index >= lastEndIndex) {
        uniqueMatches.push({ ...match, endIndex });
        lastEndIndex = endIndex;
      }
    }
    const result: (string | React.JSX.Element)[] = [];
    let lastIndex = 0;
    for (const match of uniqueMatches) {
      if (match.index > lastIndex) {
        result.push(text.substring(lastIndex, match.index));
      }
      const matchedText = text.substring(match.index, match.endIndex);
      result.push(
        <Popover key={`${match.term.id}-${match.index}`}>
          <PopoverTrigger asChild>
            <mark className="bg-yellow-300/70 hover:bg-yellow-400/90 transition-colors duration-200 cursor-pointer rounded-md px-1 shadow-sm">
              {matchedText}
            </mark>
          </PopoverTrigger>
          <PopoverContent className="w-80 shadow-xl">
            <div className="space-y-2">
              <h4 className="font-semibold text-lg flex items-center">
                <Book className="mr-2 h-5 w-5 text-blue-500" />
                {match.term.term}
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {match.term.simplifiedDefinition || match.term.definition}
              </p>
            </div>
          </PopoverContent>
        </Popover>
      );
      lastIndex = match.endIndex;
    }
    if (lastIndex < text.length) {
      result.push(text.substring(lastIndex));
    }
    return <>{result.map((item, i) => <Fragment key={i}>{item}</Fragment>)}</>;
  }, [glossaryTerms]);

  const PageLoadingComponent = useMemo(() => <Skeleton className="w-full h-96" />, []);
  const DocumentLoadingComponent = useMemo(() => (
    <div className="w-full flex justify-center items-center p-10">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <Skeleton className="w-[600px] h-[800px]" />
      </div>
    </div>
  ), []);
  const DocumentErrorComponent = useMemo(() => (
    <div className="text-red-500 p-8 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
      {documentError || "Error loading PDF."}
    </div>
  ), [documentError]);

  const renderSinglePage = () => (
    <motion.div key={`page_${pageNumber}_${rotation}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
      <Page 
        pageNumber={pageNumber} 
        scale={scale} 
        rotate={rotation} 
        customTextRenderer={textRenderer} 
        loading={PageLoadingComponent}
        onLoadSuccess={onPageLoadSuccess}
      />
    </motion.div>
  );

  const renderContinuousView = () => (
    <div className="space-y-4">
      {Array.from({ length: numPages || 0 }, (_, i) => (
        <motion.div 
          key={`page_${i + 1}_${rotation}`} 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: i * 0.1 }} 
          className="flex justify-center"
        >
          <Page 
            pageNumber={i + 1} 
            scale={scale} 
            rotate={rotation} 
            customTextRenderer={textRenderer} 
            loading={PageLoadingComponent}
            onLoadSuccess={i === 0 ? onPageLoadSuccess : undefined}
          />
        </motion.div>
      ))}
    </div>
  );

  const toolbarProps = {
    numPages, pageNumber, inputPageNumber, scale, viewMode,
    goToPrevPage, goToNextPage, handlePageInputChange, handlePageInputSubmit, setInputPageNumber,
    zoomIn, zoomOut, fitToWidth, fitToPage, toggleViewMode, rotateDocument,
    downloadDocument, printDocument
  };

  // Normal viewer content
  const normalViewerContent = (
    <Card className="h-full flex flex-col print:hidden rounded-2xl shadow-2xl border border-gray-200/40">
      <CardHeader className="flex-shrink-0 border-b bg-gray-50 dark:bg-gray-800/50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Document Viewer</CardTitle>
          <ViewerToolbar 
            {...toolbarProps} 
            onFullscreen={() => setIsFullscreen(true)}
          />
        </div>
      </CardHeader>
      <CardContent 
        ref={cardContentRef} 
        className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-100 dark:bg-gray-900"
        style={{ maxHeight: '600px' }} // Set a fixed height for the scrollable area
      >
        <Document
          file={proxiedUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          options={pdfOptions}
          loading={DocumentLoadingComponent}
          error={DocumentErrorComponent}
        >
          <div className="min-h-full">
            {!isLoading && !documentError && (
              viewMode === 'single' ? renderSinglePage() : renderContinuousView()
            )}
          </div>
        </Document>
      </CardContent>
    </Card>
  );

  return (
    <>
      {normalViewerContent}
      
      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 border-0 flex flex-col">
          <VisuallyHidden><DialogTitle>Document Viewer - Fullscreen</DialogTitle></VisuallyHidden>
          <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Document Viewer - Fullscreen</h2>
            <div className="flex items-center gap-4">
              <ViewerToolbar {...toolbarProps} isCompact />
              <Button variant="outline" size="sm" onClick={() => setIsFullscreen(false)} className="ml-2">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div 
            ref={fullscreenContentRef}
            className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900"
          >
            <Document
              file={proxiedUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              options={pdfOptions}
              loading={DocumentLoadingComponent}
              error={DocumentErrorComponent}
            >
              <div className="min-h-full">
                {!isLoading && !documentError && (
                  viewMode === 'single' ? renderSinglePage() : renderContinuousView()
                )}
              </div>
            </Document>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocumentViewer;