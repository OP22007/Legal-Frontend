'use client';

import * as React from 'react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AnimatePresence, motion } from 'framer-motion';
import { SendHorizonal, PanelLeftClose, PanelRightClose, GripVertical, FileText, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Icons } from '@/components/icons';
import type { Message } from '@/types/chat';
import DocumentViewer from '@/app/analysis/[documentId]/DocumentViewer';

interface ChatClientProps {
  documentId: string;
  documentName: string;
  documentUrl: string;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => {
      setMatches(media.matches);
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// Custom hook for resizable panels
function useResizable(initialWidth: number, minWidth: number, maxWidth: number) {
  const [width, setWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    startX.current = e.clientX;
    startWidth.current = width;
    e.preventDefault();
  }, [width]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const diff = e.clientX - startX.current;
    const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth.current + diff));
    
    // Use requestAnimationFrame for smoother resizing
    requestAnimationFrame(() => {
      setWidth(newWidth);
    });
  }, [isDragging, minWidth, maxWidth]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return { width, handleMouseDown, isDragging };
}

const Typewriter = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    const typing = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typing);
      }
    }, 15);

    return () => clearInterval(typing);
  }, [text]);

  return (
    <div className="whitespace-pre-wrap">
      {displayedText}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
        className="ml-px inline-block h-4 w-0.5 bg-current"
      />
    </div>
  );
};

const ChatBubble = React.memo(({ message, isLast }: { message: Message, isLast: boolean }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={cn('flex items-start gap-3', isUser && 'justify-end')}
    >
      {!isUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
        >
          <Avatar className="w-9 h-9 border-2 border-teal-400/50 dark:border-teal-500/50 ring-2 ring-teal-400/20 shadow-lg">
            <AvatarFallback className="bg-gradient-to-br from-teal-600 to-teal-700">
              <Icons.gavel className="w-4 h-4 text-white" />
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className={cn(
          'max-w-xl rounded-2xl p-4 text-sm shadow-lg transition-all hover:shadow-xl backdrop-blur-sm',
          isUser
            ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white rounded-br-md shadow-blue-500/25'
            : 'bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-zinc-800/90 dark:to-zinc-900/90 text-gray-800 dark:text-gray-100 rounded-bl-md border border-gray-200/50 dark:border-zinc-700/50'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          isLast ? <Typewriter text={message.content} /> : <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        )}
        {!isUser && message.sources && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ delay: 0.3 }}
          >
            <Accordion type="single" collapsible className="mt-3">
              <AccordionItem value="item-1" className="border-none">
                <AccordionTrigger className="text-xs py-2 hover:no-underline text-teal-600 dark:text-teal-400 font-medium">
                  View clause details
                </AccordionTrigger>
                <AccordionContent className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100/80 dark:bg-zinc-800/80 p-3 rounded-lg mt-2 border border-gray-200/50 dark:border-zinc-700/50">
                  <pre className="whitespace-pre-wrap font-mono text-xs">
                    {JSON.stringify(message.sources, null, 2)}
                  </pre>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        )}
      </motion.div>

      {isUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
        >
          <Avatar className="w-9 h-9 shadow-lg">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
              U
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}
    </motion.div>
  );
});

// Memoized DocumentViewer component to prevent re-renders
const MemoizedDocumentViewer = React.memo(({ documentUrl }: { documentUrl: string }) => (
  <div className="h-full w-full bg-white dark:bg-zinc-900">
    <DocumentViewer storageUrl={documentUrl} />
  </div>
));

export function ChatClient({ documentId, documentName, documentUrl }: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);
  const [isDocCollapsed, setIsDocCollapsed] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLg = useMediaQuery('(min-width: 1024px)');
  
  // Resizable hook with responsive initial width
  const initialWidth = useMemo(() => {
    if (typeof window === 'undefined') return 400;
    return isLg ? window.innerWidth * 0.4 : 400;
  }, [isLg]);
  
  const { width: docWidth, handleMouseDown, isDragging } = useResizable(
    initialWidth,
    300, // min width
    typeof window !== 'undefined' ? window.innerWidth * 0.7 : 800 // max width
  );

  // Improved scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        const scrollHeight = viewport.scrollHeight;
        const clientHeight = viewport.clientHeight;
        viewport.scrollTo({
          top: scrollHeight - clientHeight,
          behavior: 'smooth'
        });
      }
    }
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: uuidv4(), role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer token` },
        body: JSON.stringify({ message: input.trim(), document_id: documentId }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      const assistantMessage: Message = {
        id: data.id,
        role: 'assistant',
        content: data.response,
        sources: data.sources,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to fetch chat response:', error);
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Modern collapsible button component
  const CollapsibleButton = ({ 
    isCollapsed, 
    onClick, 
    icon: Icon, 
    label, 
    position = 'left' 
  }: {
    isCollapsed: boolean;
    onClick: () => void;
    icon: React.ElementType;
    label: string;
    position?: 'left' | 'right';
  }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        "group relative h-full min-w-[60px] flex items-center justify-center",
        "bg-gradient-to-b from-slate-50 to-slate-100 dark:from-zinc-800 dark:to-zinc-900",
        "border-gray-200/60 dark:border-zinc-700/60 hover:from-slate-100 hover:to-slate-200",
        "dark:hover:from-zinc-700 dark:hover:to-zinc-800 transition-all duration-300",
        position === 'left' ? "border-r" : "border-l"
      )}
    >
      <motion.button
        onClick={onClick}
        className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-all duration-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="p-3 rounded-xl bg-white dark:bg-zinc-800 shadow-lg border border-gray-200/50 dark:border-zinc-700/50 mb-2 group-hover:shadow-xl transition-shadow duration-200"
          whileHover={{ y: -2 }}
        >
          <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
        </motion.div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors writing-mode-vertical">
          {label}
        </span>
      </motion.button>
      
      {/* Expand indicator */}
      <motion.div
        className={cn(
          "absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200",
          position === 'left' ? "-right-3" : "-left-3"
        )}
        whileHover={{ scale: 1.1 }}
      >
        {position === 'left' ? (
          <ChevronRight className="w-3 h-3 text-white" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-white" />
        )}
      </motion.div>
    </motion.div>
  );

  const DocumentViewerPanel = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full w-full bg-white dark:bg-zinc-900 border-r border-gray-200/80 dark:border-zinc-800/80 relative overflow-hidden"
    >
      <MemoizedDocumentViewer documentUrl={documentUrl} />
      
      {/* Modern collapse button */}
      <motion.button
        onClick={() => setIsDocCollapsed(true)}
        className="absolute top-4 right-4 z-10 p-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-zinc-700/50 shadow-lg hover:shadow-xl transition-all duration-200 group"
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        <PanelLeftClose className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
      </motion.button>
    </motion.div>
  );

  const ResizeDivider = () => (
    <motion.div
      className={cn(
        "relative w-1 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 dark:from-zinc-700 dark:via-zinc-600 dark:to-zinc-700 cursor-col-resize group hover:w-2 transition-all duration-200 flex-shrink-0",
        isDragging && "w-2 bg-gradient-to-b from-teal-400 via-teal-500 to-teal-400"
      )}
      onMouseDown={handleMouseDown}
      whileHover={{ scale: 1.02 }}
    >
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-zinc-800 shadow-lg border border-gray-200 dark:border-zinc-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <GripVertical className="w-3 h-3 text-gray-600 dark:text-zinc-400" />
      </motion.div>
    </motion.div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-800 overflow-hidden shadow-2xl">
      {/* Mobile Document Viewer Drawer */}
      <AnimatePresence>
        {!isLg && isDocViewerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsDocViewerOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="h-full w-11/12 max-w-3xl bg-white dark:bg-zinc-900 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">Document Viewer</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDocViewerOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </Button>
                </div>
                <div className="flex-1">
                  <MemoizedDocumentViewer documentUrl={documentUrl} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Layout */}
      {isLg && (
        <>
          {/* Document Panel */}
          <AnimatePresence>
            {!isDocCollapsed && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: docWidth, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="flex-shrink-0 relative"
              >
                <DocumentViewerPanel />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Resize Divider */}
          {!isDocCollapsed && !isChatCollapsed && <ResizeDivider />}

          {/* Collapsed Document Panel Button */}
          <AnimatePresence>
            {isDocCollapsed && (
              <CollapsibleButton
                isCollapsed={isDocCollapsed}
                onClick={() => setIsDocCollapsed(false)}
                icon={FileText}
                label="Document"
                position="left"
              />
            )}
          </AnimatePresence>
        </>
      )}

      {/* Chat Panel */}
      <AnimatePresence>
        {!isChatCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col flex-1 h-full bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-zinc-900/50 dark:to-zinc-800/50"
          >
            {/* Header */}
            <motion.header
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between p-4 border-b border-gray-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md sticky top-0 z-10"
            >
              <div className="flex items-center space-x-3 group">
                <motion.h1
                  whileHover={{ scale: 1.02 }}
                  className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate transition-colors group-hover:text-teal-600 dark:group-hover:text-teal-400"
                >
                  {documentName}
                </motion.h1>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="flex items-center text-xs font-semibold text-emerald-700 bg-emerald-100/80 dark:text-emerald-300 dark:bg-emerald-900/50 px-3 py-1 rounded-full transition-all group-hover:shadow-md border border-emerald-200/50 dark:border-emerald-800/50"
                >
                  <Icons.secure className="w-3 h-3 mr-1.5" />
                  Secure Chat
                </motion.span>
              </div>
              <div className="flex items-center space-x-2">
                {!isLg && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDocViewerOpen(true)}
                    className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-zinc-800"
                  >
                    View Document
                  </Button>
                )}
                {isLg && (
                  <motion.button
                    onClick={() => setIsChatCollapsed(true)}
                    className="p-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-zinc-700/50 shadow-lg hover:shadow-xl transition-all duration-200 group"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <PanelRightClose className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
                  </motion.button>
                )}
              </div>
            </motion.header>

            {/* Chat Area */}
            <div className="flex-1 relative overflow-hidden">
              <ScrollArea className="h-full" ref={scrollAreaRef}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-6 p-6 pb-6"
                >
                  <AnimatePresence mode="popLayout">
                    {messages.map((m, i) => (
                      <ChatBubble key={m.id} message={m} isLast={i === messages.length - 1 && m.role === 'assistant'} />
                    ))}
                  </AnimatePresence>
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex items-start space-x-3"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Avatar className="w-9 h-9 border-2 border-teal-400/50 dark:border-teal-500/50 ring-2 ring-teal-400/20 shadow-lg">
                          <AvatarFallback className="bg-gradient-to-br from-teal-600 to-teal-700">
                            <Icons.gavel className="w-4 h-4 text-white" />
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center space-x-2 pt-3"
                      >
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="w-2 h-2 bg-teal-500 rounded-full"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                          />
                        ))}
                      </motion.div>
                    </motion.div>
                  )}
                  {/* Invisible div for scrolling */}
                  <div ref={messagesEndRef} />
                </motion.div>
              </ScrollArea>
            </div>

            {/* Input Bar */}
            <motion.footer
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex-shrink-0 p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-t border-gray-200/80 dark:border-zinc-800/80"
            >
              <form onSubmit={handleSubmit} className="flex items-center space-x-3">
                <div className="relative flex-1">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask a question about your document..."
                    className="pr-12 bg-white/80 dark:bg-zinc-800/80 border-gray-200/80 dark:border-zinc-700/80 focus:ring-2 focus:ring-teal-500/50 focus:border-transparent rounded-2xl h-12 backdrop-blur-sm shadow-lg"
                    disabled={isLoading}
                  />
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    <Button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="rounded-xl w-8 h-8 p-0 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      aria-label="Send message"
                    >
                      <SendHorizonal className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </div>
              </form>
            </motion.footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Chat Panel Button */}
      <AnimatePresence>
        {isChatCollapsed && isLg && (
          <CollapsibleButton
            isCollapsed={isChatCollapsed}
            onClick={() => setIsChatCollapsed(false)}
            icon={MessageSquare}
            label="Chat"
            position="right"
          />
        )}
      </AnimatePresence>
    </div>
  );
}