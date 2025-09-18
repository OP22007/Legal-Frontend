// components/PageTransition.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface PageTransitionProps {
	children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
	const pathname = usePathname();
	
	const isLoginPage = pathname.includes('/login');
	
	// Animation variants for the swapping effect
	const imageVariants = {
		loginInitial: { x: 0, opacity: 1 }, // Image on left in login
		loginExit: { x: '100%', opacity: 0 }, // Image moves right and fades
		registerInitial: { x: '-100%', opacity: 0 }, // Image comes from left
		registerVisible: { x: 0, opacity: 1 }, // Image settles on left
	};
	
	const formVariants = {
		loginInitial: { x: 0, opacity: 1 }, // Form on right in login  
		loginExit: { x: '-100%', opacity: 0 }, // Form moves left and fades
		registerInitial: { x: '100%', opacity: 0 }, // Form comes from right
		registerVisible: { x: 0, opacity: 1 }, // Form settles on right
	};

	const transition = {
		duration: 0.8,
		ease: [0.25, 0.46, 0.45, 0.94] as const, // Smooth easing
	};

	return (
		<AnimatePresence mode="wait" initial={false}>
			<motion.div
				key={pathname}
				initial="initial"
				animate="visible" 
				exit="exit"
				transition={transition}
				className="w-full min-h-screen"
			>
				{children}
			</motion.div>
		</AnimatePresence>
	);
}