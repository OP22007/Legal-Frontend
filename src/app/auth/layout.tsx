// app/auth/layout.tsx
"use client";
import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function AuthLayout({
	children,
}: {
	children: ReactNode;
}) {
	const pathname = usePathname();

	return (
		<div className="min-h-screen">
			<AnimatePresence mode="wait" initial={false}>
				<div key={pathname}>
					{children}
				</div>
			</AnimatePresence>
		</div>
	);
}