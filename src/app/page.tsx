"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BotMessageSquare,
  FileCheck,
  FileScan,
  Fingerprint,
  ChevronRight,
  FileText,
  Search,
  BrainCircuit
} from "lucide-react";
import { Manrope, Inter } from "next/font/google";
import Link from "next/link";
import { useEffect, useState } from "react";
import Footer  from "@/components/Footer";
import { useInView } from "react-intersection-observer";

const manrope = Manrope({ subsets: ["latin"] });
const inter = Inter({ subsets: ["latin"] });

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] as const }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB] dark:bg-black relative overflow-hidden">
      {/* subtle gradient globes for dark mode */}
      <div className="pointer-events-none absolute -left-32 top-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-700/20 via-purple-700/20 to-pink-700/20 blur-3xl dark:opacity-40 opacity-0" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-purple-700/20 via-blue-700/20 to-indigo-700/20 blur-3xl dark:opacity-40 opacity-0" />
      <main className="flex-grow relative z-10">
        <HeroSection />
        <HowItWorksSection />
        <InteractiveDemoBlock />
        <TrustSection />
        <CtaFooter />
      </main>
    </div>
  );
}

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-24 md:py-32 bg-grid-slate-200/[0.4] dark:bg-gradient-to-r dark:from-black dark:via-gray-950 dark:to-black">
      <div className="absolute inset-0 -z-10" />
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-start text-left"
          >
            <motion.h1
              variants={fadeIn}
              className={`${manrope.className} text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white`}
            >
              Demystify Any Legal Document Instantly
            </motion.h1>
            <motion.p
              variants={fadeIn}
              className={`${inter.className} mt-6 text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-prose`}
            >
              Upload agreements, contracts, or terms of service and get clear, human-friendly summaries in seconds.
            </motion.p>
            <motion.div variants={fadeIn} className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/upload"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "group relative overflow-hidden bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all duration-300 ease-in-out"
                )}
              >
                <span className="absolute inset-0 bg-white/20 mix-blend-soft-light group-hover:animate-ripple" />
                Upload Document
                <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#demo"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "group relative border-2 border-indigo-500/50 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400/50 hover:text-white hover:bg-indigo-600/10 dark:hover:bg-indigo-400/10"
                )}
              >
                See Demo
              </Link>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-full min-h-[300px] md:min-h-[400px]"
          >
            <LottieDocumentAnimation />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const LottieDocumentAnimation = () => {
  const [searchVisible, setSearchVisible] = useState(false);
  const [fileCheckVisible, setFileCheckVisible] = useState(false);

  useEffect(() => {
    const searchTimer = setTimeout(() => setSearchVisible(true), 800);
    const searchExitTimer = setTimeout(() => setSearchVisible(false), 2300);
    const fileCheckTimer = setTimeout(() => setFileCheckVisible(true), 2500);

    return () => {
      clearTimeout(searchTimer);
      clearTimeout(searchExitTimer);
      clearTimeout(fileCheckTimer);
    };
  }, []);

  return (
    <div className="relative flex mt-28 items-center justify-center p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] as const }}
          className="absolute w-full max-w-xs"
        >
          <FileText className="w-full h-full text-slate-300 dark:text-slate-700" strokeWidth={0.5} />
        </motion.div>

        {searchVisible && (
          <motion.div
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            exit={{ pathLength: 0, opacity: 0 }}
            transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] as const }}
            className="absolute w-full max-w-xs"
          >
            <Search className="w-full h-full text-indigo-500" strokeWidth={1} />
          </motion.div>
        )}

        {fileCheckVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] as const }}
            className="absolute w-full max-w-xs"
          >
            <FileCheck className="w-full h-full text-emerald-500" strokeWidth={1} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HowItWorksSection = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  const steps = [
    {
      icon: FileScan,
      title: "Upload Your Document",
      description: "Drag and drop any legal document. We support PDF, DOCX, and TXT formats."
    },
    {
      icon: BrainCircuit,
      title: "AI-Powered Analysis",
      description: "Our advanced AI scans your document for key clauses, risks, and obligations."
    },
    {
      icon: BotMessageSquare,
      title: "Get a Clear Summary",
      description: "Receive an easy-to-understand summary, highlighting what matters most to you."
    }
  ];

  return (
    <section
      ref={ref}
      className="py-20 md:py-28 bg-white dark:bg-gradient-to-l dark:from-black dark:via-gray-950 dark:to-black"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeIn}
          className="text-center mb-12"
        >
          <h2 className={`${manrope.className} text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white`}>
            A simple, three-step process
          </h2>
          <p className={`${inter.className} mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto`}>
            Understand your legal documents without the complexity.
          </p>
        </motion.div>
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-8"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={fadeIn}
              whileHover={{ y: -8, scale: 1.03, transition: { type: "spring", stiffness: 300 } }}
              className="p-8 bg-slate-50 dark:bg-slate-900/40 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-center justify-center h-16 w-16 mb-6 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
                <step.icon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className={`${manrope.className} text-xl font-bold text-slate-900 dark:text-white`}>{step.title}</h3>
              <p className={`${inter.className} mt-2 text-slate-500 dark:text-slate-400`}>{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const InteractiveDemoBlock = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });

  const handleDrop = () => {
    setIsProcessing(true);
    setIsComplete(false);
    setTimeout(() => {
      setIsProcessing(false);
      setIsComplete(true);
    }, 3000);
  };

  return (
    <section
      id="demo"
      ref={ref}
      className="py-20 md:py-28 bg-[#F9FAFB] dark:bg-gradient-to-r dark:from-black dark:via-gray-950 dark:to-black"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeIn}
          className="text-center mb-12"
        >
          <h2 className={`${manrope.className} text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white`}>
            See it in Action
          </h2>
          <p className={`${inter.className} mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto`}>
            Drag and drop a sample file or click to upload and watch the magic happen.
          </p>
        </motion.div>
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <motion.div
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={fadeIn}
            onClick={handleDrop}
            className="relative flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer h-80 bg-white dark:bg-slate-900/50 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-300"
          >
            <AnimatePresence>
              {isProcessing ? (
                <ProcessingAnimation />
              ) : isComplete ? (
                <p className="text-center text-green-600 dark:text-green-400">
                  <FileCheck className="h-12 w-12 mx-auto mb-4" />
                  Analysis Complete!
                </p>
              ) : (
                <div className="text-center text-slate-500 dark:text-slate-400">
                  <FileScan className="h-12 w-12 mx-auto mb-4" />
                  <p className="font-semibold">Just Click</p>
                  <p className="text-sm">And watch a small demo of our sample analysis</p>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
          <AnimatePresence>
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg"
              >
                <h3 className={`${manrope.className} text-xl font-bold text-slate-900 dark:text-white`}>
                  Summary of Your Document
                </h3>
                <ul className="mt-4 space-y-3 text-slate-600 dark:text-slate-300">
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 mt-1 text-indigo-500 flex-shrink-0" />
                    <span className="ml-2">
                      <strong>Termination Clause:</strong> The agreement can be terminated with 30 days written notice.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 mt-1 text-indigo-500 flex-shrink-0" />
                    <span className="ml-2">
                      <strong>Liability:</strong> Liability is limited to the total contract value.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 mt-1 text-indigo-500 flex-shrink-0" />
                    <span className="ml-2">
                      <strong>Payment Terms:</strong> Net 30 days from the date of invoice.
                    </span>
                  </li>
                </ul>
                <Button
                  onClick={() => {
                    setIsComplete(false);
                    setIsProcessing(false);
                  }}
                  className="mt-6 w-full"
                >
                  Analyze Another
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

const ProcessingAnimation = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center text-center"
  >
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-4 overflow-hidden">
      <motion.div
        className="bg-indigo-600 h-2.5 rounded-full"
        initial={{ x: "-100%" }}
        animate={{ x: "0%" }}
        transition={{ repeat: Infinity, duration: 1.5, ease: [0.4, 0, 0.2, 1] as const }}
      />
    </div>
    <p className="text-indigo-600 dark:text-indigo-400 font-semibold">Simplifying your contract...</p>
  </motion.div>
);

const TrustSection = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const faqs = [
    {
      question: "Is my data secure?",
      answer:
        "Absolutely. We use bank-level encryption (AES-256) for all documents, both in transit and at rest. Your data is processed securely and is never stored permanently unless you choose to save it to your account."
    },
    {
      question: "What file types are supported?",
      answer:
        "We currently support PDF, DOCX, and plain text (TXT) files. We are actively working on expanding our support to include more formats."
    },
    {
      question: "Can I use this for my business?",
      answer:
        "Yes! Our platform is designed for both individuals and businesses. For enterprise solutions with advanced features and team management, please contact our sales team."
    }
  ];

  return (
    <section
      ref={ref}
      className="py-20 md:py-28 bg-white dark:bg-gradient-to-l dark:from-black dark:via-gray-950 dark:to-black"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeIn}
          className="text-center mb-16"
        >
          <h2 className={`${manrope.className} text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white`}>
            Trusted & Secure
          </h2>
          <p className={`${inter.className} mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto`}>
            Your privacy is our priority. We are committed to the highest standards of data security.
          </p>
          <div className="mt-8 flex justify-center items-center gap-8 opacity-60">
            <Fingerprint className="h-10 w-10 text-slate-500" />
            <p className="font-mono text-slate-500">AES-256 ENCRYPTION</p>
            <p className="font-mono text-slate-500">SOC 2 COMPLIANT</p>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeIn}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className={`${inter.className} text-lg font-semibold`}>
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className={`${inter.className} text-base text-slate-600 dark:text-slate-300`}>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

const CtaFooter = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });
  return (
    <footer ref={ref} className="relative py-20 md:py-24 overflow-hidden">
      <div className="absolute -z-10 inset-0  dark:from-black dark:via-gray-950 dark:to-black" />
      <motion.div
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="container mx-auto px-4 text-center"
      >
        <motion.h2
          variants={fadeIn}
          className={`${manrope.className} text-4xl md:text-5xl font-extrabold dark:text-white`}
        >
          Get Clarity, Not Complexity
        </motion.h2>
        <motion.p
          variants={fadeIn}
          className={`${inter.className} mt-4 text-lg dark:text-indigo-200 text-indigo-800 max-w-2xl mx-auto`}
        >
          Ready to transform your legal documents into simple, actionable insights? Get started now.
        </motion.p>
        <motion.div variants={fadeIn} className="mt-8">
          <Link
            href="/upload"
            className={cn(
              buttonVariants({ size: "lg" }),
              "group relative bg-white text-indigo-600 shadow-2xl hover:bg-slate-100 scale-105 animate-pulse hover:animate-none"
            )}
          >
            Upload Document for Free
            <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </motion.div>
    </footer>
  );
};
