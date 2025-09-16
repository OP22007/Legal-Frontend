//src/app/upload/page.tsx
"use client";
import React from "react";
import { motion } from "framer-motion";
import { Dropzone } from "@/components/ui/dropzone";

export default function UploadPage() {
	const containerVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				staggerChildren: 0.2,
				ease: "easeInOut",
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0 },
	};

	return (
		<motion.div
			className="w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-zinc-950"
			variants={containerVariants}
			initial="hidden"
			animate="visible"
		>
			<motion.div
				className="w-full max-w-2xl text-center"
				variants={itemVariants}
			>
				<h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
					Upload Your Documents
				</h1>
				<p className="mt-4 text-lg text-muted-foreground">
					Securely upload your legal documents for analysis. Drag and drop files or
					click to browse.
				</p>
			</motion.div>

			<motion.div
				className="mt-12 w-full max-w-3xl"
				variants={itemVariants}
			>
				<Dropzone />
			</motion.div>
		</motion.div>
	);
}