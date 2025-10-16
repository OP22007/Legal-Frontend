"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { LogOut, User as UserIcon, Settings } from "lucide-react";
import { TranslatedLink } from "@/components/TranslatedLink";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { NotificationBell } from "@/components/NotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const navLinks = [
	{ href: "/", label: "Home" },
	{ href: "/upload", label: "Upload" },
	{ href: "/dashboard", label: "Documents" },
	{ href: "/teams", label: "Teams" },
	{ href: "/contact", label: "Contact" },
];

const getInitials = (name: string | null | undefined = ""): string => {
	if (!name) return "U";
	return name
		.split(" ")
		.map((n) => n[0])
		.slice(0, 2)
		.join("");
};

export default function Navbar() {
	const pathname = usePathname();
	const router = useRouter();
	const { data: session, status } = useSession();

	return (
		<motion.nav
			initial={{ y: -100, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ duration: 0.5, ease: "easeInOut" }}
			className="fixed top-0 left-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b shadow-sm"
		>
			<div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between">
				<Link href="/" className="text-2xl font-bold text-primary tracking-wider">
					AMU Legal
				</Link>

				<ul className="hidden md:flex items-center gap-2">
					{navLinks.map((link) => (
						<li key={link.href} className="relative">
							<TranslatedLink
								href={link.href}
								label={link.label}
								className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-300 ${pathname === link.href ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
							/>
							{pathname === link.href && (
								<motion.span
									layoutId="underline"
									className="absolute left-0 bottom-0 w-full h-0.5 bg-primary"
									transition={{ type: "spring", stiffness: 380, damping: 30 }}
								/>
							)}
						</li>
					))}
				</ul>

				<div className="flex items-center gap-2">
					<ThemeToggle />
					<LanguageToggle />
					<NotificationBell />

					{status === "loading" && (
						<div className="flex items-center gap-2">
							<Skeleton className="h-10 w-20 rounded-md" />
							<Skeleton className="h-10 w-10 rounded-full" />
						</div>
					)}
					
					{status === "unauthenticated" && (
						<Link href="/auth/login">
							<Button asChild>
								<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
									Login
								</motion.div>
							</Button>
						</Link>
					)}

					{status === "authenticated" && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" className="relative h-11 w-11 rounded-full">
									<Avatar className="h-11 w-11 cursor-pointer">
										<AvatarImage
											src={session.user?.image!}
											alt={session.user?.name ?? "User"}
										/>
										<AvatarFallback>{getInitials(session.user?.name)}</AvatarFallback>
									</Avatar>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-56" align="end">
								<DropdownMenuLabel>
									<p className="text-sm font-medium">Welcome {session.user?.name?.split(" ")?.[0]}</p>
									<p className="text-xs text-muted-foreground">{session.user?.email}</p>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/dashboard/profile')}>
									<UserIcon className="mr-2 h-4 w-4" />
									<span>Profile</span>
								</DropdownMenuItem>
								<DropdownMenuItem className="cursor-pointer">
									<Settings className="mr-2 h-4 w-4" />
									<span>Settings</span>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10"
									onClick={() => signOut({ callbackUrl: "/" })}
								>
									<LogOut className="mr-2 h-4 w-4" />
									<span>Logout</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</div>
		</motion.nav>
	);
}