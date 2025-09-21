"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
	Scale, 
	UploadCloud, 
	FileText, 
	CheckCircle2, 
	Twitter, 
	Linkedin, 
	Github, 
	MoveRight,
	Loader2
} from "lucide-react";
import { Dropzone } from "@/components/ui/dropzone";
import Footer from "@/components/Footer";
import { TranslatedText } from "@/components/TranslatedText";

const AnimatedFileIcon = () => (
	<motion.div
		initial={{ opacity: 0, y: -20, scale: 0.8, x: 0 }}
		animate={{ opacity: 1, y: 100, scale: 0.3, x: 20 }}
		exit={{ opacity: 0, scale: 0, transition: { duration: 0.3 } }}
		transition={{ duration: 0.8, ease: "circIn" }}
		className="fixed top-1/2 left-1/2 z-50 p-3 bg-white dark:bg-[#1A313C] rounded-lg shadow-2xl"
	>
		<FileText className="w-8 h-8 text-teal-500" />
	</motion.div>
);

const MotionWrapper = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
	<motion.div
		initial={{ opacity: 0, y: 30 }}
		whileInView={{ opacity: 1, y: 0 }}
		viewport={{ once: true, amount: 0.3 }}
		transition={{ duration: 0.6, ease: "easeOut", delay }}
	>
		{children}
	</motion.div>
);

const HeroBackground = () => {
	const ref = useRef(null);
	const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

	const scaleY1 = useTransform(scrollYProgress, [0, 1], [0, -150]);
	const scaleY2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
	const opacity = useTransform(scrollYProgress, [0, 0.5], [0.8, 0]);

	return (
		<div ref={ref} className="absolute inset-0 overflow-hidden z-0">
			<div 
				className="absolute inset-0 bg-cover bg-center opacity-[0.5] dark:opacity-[0.5] bg-[url('/paper-texture.jpg')] dark:bg-[url('/paper-texture-dark.jpg')]"
			/>
			<motion.div style={{ y: scaleY1, opacity }}>
				<Scale className="absolute top-[15%] left-[5%] h-32 w-32 text-slate-200 dark:text-[#1A313C] -rotate-12" />
			</motion.div>
			<motion.div style={{ y: scaleY2, opacity }}>
				<Scale className="absolute bottom-[10%] right-[5%] h-24 w-24 text-slate-200 dark:text-[#1A313C] rotate-12" />
			</motion.div>
		</div>
	);
};

const Testimonials = () => (
	<div className="w-full max-w-5xl">
		<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
			{[
				{ name: "Sarah Jenkins, Esq.", title: "IP Attorney", text: "This AI is revolutionary. It cuts down my initial contract review time by at least 70%. An indispensable tool.", avatar: "https://dhwlegal.com/wp-content/uploads/2024/07/Screenshot-2024-07-31-at-10.33.17%E2%80%AFAM-e1722876921390.png" },
				{ name: "Michael Chen", title: "Paralegal, LexCorp", text: "The accuracy and speed are mind-blowing. It spots clauses and risks that would take me hours to find manually.", avatar: "https://harvardtechnologyreview.com/wp-content/uploads/2023/10/image.jpeg" },
				{ name: "Dr. Evelyn Reed", title: "In-House Counsel", text: "As the sole counsel for a fast-growing startup, this platform is my secret weapon. It provides confidence and clarity.", avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCNuCHGXcTglicQJDi7X0Lfnod1cPiVqkmuA&s" }
			].map((t, i) => (
				<MotionWrapper delay={i * 0.1} key={t.name}>
					<div className="group h-full rounded-xl border border-slate-200 dark:border-[#1A313C] bg-white/50 dark:bg-[#1A313C]/50 p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-teal-500/30">
						<div className="flex items-center mb-4">
							<img src={t.avatar} alt={t.name} className="h-12 w-12 rounded-full mr-4 border-2 border-slate-300 dark:border-[#2A434F]"/>
							<div>
								<h4 className="font-bold text-slate-800 dark:text-[#CFE7EE]"><TranslatedText text={t.name} /></h4>
								<p className="text-sm text-slate-500 dark:text-[#708B96]"><TranslatedText text={t.title} /></p>
							</div>
						</div>
						<p className="text-slate-600 dark:text-[#8FA7B2]">"<TranslatedText text={t.text} />"</p>
					</div>
				</MotionWrapper>
			))}
		</div>
	</div>
);

export default function UploadPage() {
	const [uploadStep, setUploadStep] = useState(0);
	const [fileName, setFileName] = useState<string | null>(null);
	const [isAnimatingFile, setIsAnimatingFile] = useState(false);

	const handleFileDrop = (name: string) => {
		setIsAnimatingFile(true);
		setFileName(name);
		setTimeout(() => setUploadStep(1), 500);
		setTimeout(() => setIsAnimatingFile(false), 900);
		
		setTimeout(() => setUploadStep(2), 2500);
	};

	return (
		<div className="min-h-screen w-full bg-slate-50 dark:bg-[#0A181D] text-slate-800 dark:text-[#A0B5BD]">
			<AnimatePresence>
				{isAnimatingFile && <AnimatedFileIcon />}
			</AnimatePresence>
			<main className="relative flex flex-col items-center justify-center w-full px-4 pt-24 pb-12 sm:px-6 lg:px-8 overflow-hidden">
				<HeroBackground />
				<MotionWrapper>
					<div className="relative z-10 w-full max-w-3xl text-center mb-8">
						<h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
							<TranslatedText text="Deconstruct Legal Jargon" />
						</h1>
						<p className="mt-4 text-xl text-slate-600 dark:text-[#8FA7B2] leading-relaxed">
							<span className="font-semibold text-teal-600 dark:text-teal-400"><TranslatedText text="Instant" /></span> <TranslatedText text="AI-powered legal clarity." />{" "}
							<span className="font-semibold text-teal-600 dark:text-teal-400"><TranslatedText text="Securely" /></span> <TranslatedText text="upload your document and get results in seconds." />
						</p>
					</div>
				</MotionWrapper>

				<MotionWrapper delay={0.1}>
					<div className="relative z-10 w-full min-w-[500px] flex flex-col items-center mb-8 space-y-4">
						<Dropzone />
					</div>
				</MotionWrapper>
				
				<MotionWrapper delay={0.2}>
					<div className="relative z-10 flex justify-center flex-wrap gap-4 mb-16">
						<button className="px-8 py-3 rounded-md font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 transition-opacity shadow-lg">
							<TranslatedText text="View Sample Analysis" />
						</button>
						<button className="px-8 py-3 rounded-md font-semibold text-slate-700 dark:text-[#A0B5BD] bg-transparent border border-slate-300 dark:border-[#1A313C] hover:bg-slate-100 dark:hover:bg-[#1A313C] transition-colors">
							<TranslatedText text="Learn How It Works" />
						</button>
					</div>
				</MotionWrapper>

				<div className="w-full max-w-5xl my-12">
					<hr className="border-slate-200 dark:border-[#1A313C]" />
				</div>

				<MotionWrapper delay={0.3}>
					<h2 className="text-3xl font-bold text-center mb-10 text-slate-800 dark:text-[#CFE7EE] relative z-10 "><TranslatedText text="Trusted by Top Legal Professionals" /></h2>
					<Testimonials />
				</MotionWrapper>
			</main>
			{/* <Footer /> */}
		</div>
	);
}