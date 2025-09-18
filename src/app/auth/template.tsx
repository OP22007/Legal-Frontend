"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();

	const variants = {
		hidden: { opacity: 0, x: "100%", transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const } },
		enter: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const } },
		exit: { opacity: 0, x: "-100%", transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const } },
	};

	return (
		<AnimatePresence mode="wait" initial={false}>
			<motion.div
				key={pathname}
				variants={variants}
				initial="hidden"
				animate="enter"
				exit="exit"
			>
				{children}
			</motion.div>
		</AnimatePresence>
	);
}