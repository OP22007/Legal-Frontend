// components/ui/theme-toggle.tsx
"use client";
import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button"; // Assuming you use shadcn/ui

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	const toggleTheme = () => {
		setTheme(theme === "light" ? "dark" : "light");
	};

	return (
		<Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
			<AnimatePresence initial={false} mode="wait">
				<motion.div
					key={theme === "light" ? "sun" : "moon"}
					initial={{ y: -20, opacity: 0, rotate: -90 }}
					animate={{ y: 0, opacity: 1, rotate: 0 }}
					exit={{ y: 20, opacity: 0, rotate: 90 }}
					transition={{ duration: 0.2 }}
				>
					{theme === "light" ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
				</motion.div>
			</AnimatePresence>
		</Button>
	);
}