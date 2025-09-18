"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
	email: z.string().email({ message: "Invalid email address" }),
	password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
	const [passwordVisible, setPasswordVisible] = useState(false);
	const router = useRouter();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	});

	const onSubmit = async (data: LoginFormData) => {
		const result = await signIn("credentials", {
			redirect: false,
			email: data.email,
			password: data.password,
		});

		if (result?.error) {
			toast.error("Login failed. Please check your credentials.");
		} else {
			toast.success("Login successful! Redirecting...");
			router.push("/"); // Redirect on success
		}
	};

	const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);

	const containerVariants = {
		initial: { opacity: 0 },
		animate: { opacity: 1, transition: { staggerChildren: 0.1 } },
	};

	const itemVariants = {
		initial: { y: 20, opacity: 0 },
		animate: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const } },
	};

	return (
		<div className="w-full lg:grid min-h-screen lg:grid-cols-2 bg-background overflow-hidden">
			<div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-zinc-950">
				<motion.div
					className="mx-auto w-full max-w-md space-y-8"
					variants={containerVariants}
					initial="initial"
					animate="animate"
				>
					<motion.div variants={itemVariants} className="space-y-2 text-center lg:text-left">
						<h2 className="text-3xl font-bold tracking-tight text-foreground">
							Welcome back
						</h2>
						<p className="text-muted-foreground">
							Don't have an account?{" "}
							<Link href="/auth/register" className="font-medium text-primary hover:underline">
								Sign up
							</Link>
						</p>
					</motion.div>

					<motion.div variants={itemVariants}>
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input id="email" type="email" placeholder="name@example.com" {...register("email")} className={cn("h-10", errors.email && "border-destructive focus-visible:ring-destructive")} />
							</div>
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label htmlFor="password">Password</Label>
									<Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
										Forgot password?
									</Link>
								</div>
								<div className="relative">
									<Input id="password" type={passwordVisible ? "text" : "password"} placeholder="********" {...register("password")} className={cn("h-10 pr-10", errors.password && "border-destructive focus-visible:ring-destructive")} />
									<button type="button" onClick={togglePasswordVisibility} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground">
										{passwordVisible ? (<EyeOff className="h-5 w-5" />) : (<Eye className="h-5 w-5" />)}
									</button>
								</div>
							</div>
							<Button type="submit" className="w-full h-10 font-semibold" disabled={isSubmitting}>
								{isSubmitting ? "Signing in..." : "Sign In"}
							</Button>
						</form>
					</motion.div>

					<motion.div variants={itemVariants} className="space-y-6">
						<div className="relative">
							<div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
							<div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-50 dark:bg-zinc-950 px-2 text-muted-foreground">Or continue with</span></div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<Button variant="outline" type="button" className="h-10" onClick={() => signIn("google", { callbackUrl: "/" })}>
								<FcGoogle className="mr-2 h-5 w-5" />Google
							</Button>
							<Button variant="outline" type="button" className="h-10" onClick={() => signIn("apple", { callbackUrl: "/" })}>
								<FaApple className="mr-2 h-5 w-5" />Apple
							</Button>
						</div>
					</motion.div>
				</motion.div>
			</div>

			<div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex">
				<div className="absolute inset-0">
					<Image src="/dark.png" alt="A beautiful desert landscape at dusk" quality={100} fill sizes="50vw" priority style={{ objectFit: "cover" }} className="hidden dark:block" />
					<Image src="/light.png" alt="A beautiful mountain landscape during the day" fill quality={100} sizes="50vw" priority style={{ objectFit: "cover" }} className="block dark:hidden" />
				</div>
				<div className="absolute inset-0 bg-black/2" />
				<div className="relative z-20 flex items-center justify-between text-lg font-medium">
					<span className="font-bold text-2xl">AMU</span>
					<Link href="/" className="text-sm hover:underline">Back to website &rarr;</Link>
				</div>
				<div className="relative z-20 mt-auto">
					<div className="space-y-2">
						<h1 className="text-4xl font-bold tracking-tighter">Welcome Back<br />to Your Journey</h1>
						<div className="flex items-center gap-2 pt-4">
							<span className="h-1.5 w-1.5 rounded-full bg-white/50"></span>
							<span className="h-1.5 w-8 rounded-full bg-white"></span>
							<span className="h-1.5 w-1.5 rounded-full bg-white/50"></span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}