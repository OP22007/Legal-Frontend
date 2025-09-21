"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, easeInOut } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { TranslatedText } from "@/components/TranslatedText";

const registerSchema = z.object({
	acceptTerms: z.boolean().refine(val => val === true, {
		message: "You must accept the terms and conditions",
	}),
	firstName: z.string().min(1, { message: "First name is required" }),
	lastName: z.string().optional(),
	email: z.string().email({ message: "Invalid email address" }),
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters" }),
	persona: z.enum(
		["STUDENT", "FREELANCER", "TENANT", "SMALL_BUSINESS", "GENERAL"],
		{ message: "Invalid input" }
	),
	preferredLanguage: z
		.string()
		.min(2, { message: "Preferred language is required" }),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const personaOptions = {
	GENERAL: "General",
	STUDENT: "Student",
	FREELANCER: "Freelancer",
	TENANT: "Tenant",
	SMALL_BUSINESS: "Small Business",
};

const languageOptions = {
	en: "English",
	hi: "Hindi",
	bn: "Bengali",
	ta: "Tamil",
	te: "Telugu",
	mr: "Marathi",
	gu: "Gujarati",
	kn: "Kannada",
	ml: "Malayalam",
	pa: "Punjabi",
};

export default function RegisterPage() {
	const [passwordVisible, setPasswordVisible] = useState(false);
	const [personaOpen, setPersonaOpen] = useState(false);
	const [languageOpen, setLanguageOpen] = useState(false);
	const router = useRouter();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		setValue,
		watch,
		control,
	} = useForm<RegisterFormData>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			persona: "GENERAL",
			preferredLanguage: "en",
			acceptTerms: false,
		},
	});

	const currentPersona = watch("persona");
	const currentLanguage = watch("preferredLanguage");

	const onSubmit = async (data: RegisterFormData) => {
		try {
			const res = await fetch("/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});
			const result = await res.json();
			if (!res.ok) {
				toast.error(result.error || "Registration failed.");
			} else {
				toast.success("Account created successfully! Redirecting...");
				setTimeout(() => {
					router.push("/auth/login");
				}, 2000);
			}
		} catch (err) {
			toast.error("A network error occurred. Please try again.");
		}
	};

	const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
			},
		},
	};

	const itemVariants = {
		hidden: { y: 20, opacity: 0 },
		visible: {
			y: 0,
			opacity: 1,
			transition: {
				duration: 0.5,
				ease: easeInOut,
			},
		},
	};

	return (
		<div className="w-full lg:grid min-h-screen lg:grid-cols-2 bg-background">
			<div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex">
				<div className="absolute inset-0">
					<Image
						src="/dark.png"
						alt="A beautiful desert landscape at dusk"
						quality={100}
						fill
						sizes="50vw"
						priority
						style={{ objectFit: "cover" }}
						className="hidden dark:block"
					/>
					<Image
						src="/light.png"
						alt="A beautiful mountain landscape during the day"
						fill
						quality={100}
						sizes="50vw"
						priority
						style={{ objectFit: "cover" }}
						className="block dark:hidden"
					/>
				</div>
				<div className="absolute inset-0 bg-black/2" />
				<div className="relative z-20 flex items-center justify-between text-lg font-medium">
					<span className="font-bold text-2xl">AMU</span>
					<Link href="/" className="text-sm hover:underline">
						<TranslatedText text="Back to website" /> &rarr;
					</Link>
				</div>
				<div className="relative z-20 mt-auto">
					<div className="space-y-2">
						<h1 className="text-4xl font-bold tracking-tighter">
							<TranslatedText text="Capturing Moments," /><br />
							<TranslatedText text="Creating Memories" />
						</h1>
						<div className="flex items-center gap-2 pt-4">
							<span className="h-1.5 w-1.5 rounded-full bg-white/50"></span>
							<span className="h-1.5 w-8 rounded-full bg-white"></span>
							<span className="h-1.5 w-1.5 rounded-full bg-white/50"></span>
						</div>
					</div>
				</div>
			</div>
			<div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-zinc-950">
				<motion.div
					className="mx-auto w-full max-w-md space-y-8"
					variants={containerVariants}
					initial="hidden"
					animate="visible"
				>
					<motion.div
						variants={itemVariants}
						className="space-y-2 text-center lg:text-left"
					>
						<h2 className="text-3xl font-bold tracking-tight text-foreground">
							<TranslatedText text="Create an account" />
						</h2>
						<p className="text-muted-foreground">
							<TranslatedText text="Already have an account?" />{" "}
							<Link
								href="/auth/login"
								className="font-medium text-primary hover:underline"
							>
								<TranslatedText text="Log in" />
							</Link>
						</p>
					</motion.div>
					<motion.div variants={itemVariants}>
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="firstName"><TranslatedText text="First name" /></Label>
									<Input
										id="firstName"
										{...register("firstName")}
										className={cn(
											"h-10",
											errors.firstName &&
												"border-destructive focus-visible:ring-destructive"
										)}
									/>
									{errors.firstName && (
										<p className="text-xs text-destructive">
											{errors.firstName.message}
										</p>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="lastName"><TranslatedText text="Last name" /></Label>
									<Input
										id="lastName"
										{...register("lastName")}
										className={cn(
											"h-10",
											errors.lastName &&
												"border-destructive focus-visible:ring-destructive"
										)}
									/>
									{errors.lastName && (
										<p className="text-xs text-destructive">
											{errors.lastName.message}
										</p>
									)}
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="persona"><TranslatedText text="Persona" /></Label>
								<div className="relative">
									<input type="hidden" {...register("persona")} />
									<button
										type="button"
										className={cn(
											"h-10 w-full border rounded px-3 flex items-center justify-between bg-white dark:bg-zinc-900 text-left shadow-sm transition-all",
											errors.persona &&
												"border-destructive focus-visible:ring-destructive"
										)}
										onClick={() => setPersonaOpen((open) => !open)}
									>
										<TranslatedText text={personaOptions[currentPersona as keyof typeof personaOptions]} />
										<span className="ml-2">▼</span>
									</button>
									<AnimatePresence>
										{personaOpen && (
											<motion.ul
												initial={{ opacity: 0, y: -10 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -10 }}
												transition={{ duration: 0.2, ease: easeInOut }}
												className="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-900 border rounded shadow-lg overflow-hidden"
											>
												{Object.entries(personaOptions).map(([value, label]) => (
													<li
														key={value}
														className="px-4 py-2 hover:bg-primary/10 cursor-pointer transition-colors"
														onClick={() => {
															setValue(
																"persona",
																value as keyof typeof personaOptions,
																{ shouldValidate: true }
															);
															setPersonaOpen(false);
														}}
													>
														<TranslatedText text={label} />
													</li>
												))}
											</motion.ul>
										)}
									</AnimatePresence>
								</div>
								{errors.persona && (
									<p className="text-xs text-destructive">
										{errors.persona.message}
									</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="preferredLanguage"><TranslatedText text="Preferred Language" /></Label>
								<div className="relative">
									<input type="hidden" {...register("preferredLanguage")} />
									<button
										type="button"
										className={cn(
											"h-10 w-full border rounded px-3 flex items-center justify-between bg-white dark:bg-zinc-900 text-left shadow-sm transition-all",
											errors.preferredLanguage &&
												"border-destructive focus-visible:ring-destructive"
										)}
										onClick={() => setLanguageOpen((open) => !open)}
									>
										{
											languageOptions[
												currentLanguage as keyof typeof languageOptions
											]
										}
										<span className="ml-2">▼</span>
									</button>
									<AnimatePresence>
										{languageOpen && (
											<motion.ul
												initial={{ opacity: 0, y: -10 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -10 }}
												transition={{ duration: 0.2, ease: easeInOut }}
												className="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-900 border rounded shadow-lg overflow-hidden"
											>
												{Object.entries(languageOptions).map(
													([value, label]) => (
														<li
															key={value}
															className="px-4 py-2 hover:bg-primary/10 cursor-pointer transition-colors"
															onClick={() => {
																setValue("preferredLanguage", value, {
																	shouldValidate: true,
																});
																setLanguageOpen(false);
															}}
														>
															<TranslatedText text={label} />
														</li>
													)
												)}
											</motion.ul>
										)}
									</AnimatePresence>
								</div>
								{errors.preferredLanguage && (
									<p className="text-xs text-destructive">
										{errors.preferredLanguage.message}
									</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="email"><TranslatedText text="Email" /></Label>
								<Input
									id="email"
									type="email"
									{...register("email")}
									className={cn(
										"h-10",
										errors.email &&
											"border-destructive focus-visible:ring-destructive"
									)}
								/>
								{errors.email && (
									<p className="text-xs text-destructive">
										{errors.email.message}
									</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="password"><TranslatedText text="Password" /></Label>
								<div className="relative">
									<Input
										id="password"
										type={passwordVisible ? "text" : "password"}
										{...register("password")}
										className={cn(
											"h-10 pr-10",
											errors.password &&
												"border-destructive focus-visible:ring-destructive"
										)}
									/>
									<button
										type="button"
										onClick={togglePasswordVisibility}
										className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
									>
										{passwordVisible ? (
											<EyeOff className="h-5 w-5" />
										) : (
											<Eye className="h-5 w-5" />
										)}
									</button>
								</div>
								{errors.password && (
									<p className="text-xs text-destructive">
										{errors.password.message}
									</p>
								)}
							</div>

							<Controller
								control={control}
								name="acceptTerms"
								render={({ field }) => (
									<div className="items-top flex space-x-2 pt-2">
										<Checkbox
											id="acceptTerms"
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
										<div className="grid gap-1.5 leading-none">
											<Label
												htmlFor="acceptTerms"
												className="text-sm font-normal text-muted-foreground"
											>
												<TranslatedText text="I accept the" />{" "}
												<Link
													href="/terms"
													className="underline hover:text-primary"
												>
													<TranslatedText text="terms and conditions" />
												</Link>
											</Label>
											{errors.acceptTerms && (
												<p className="text-xs text-destructive -mt-1">
													{errors.acceptTerms.message}
												</p>
											)}
										</div>
									</div>
								)}
							/>

							<Button
								type="submit"
								className="w-full h-10 font-semibold"
								disabled={isSubmitting}
							>
								{isSubmitting ? <TranslatedText text="Creating account..." /> : <TranslatedText text="Create account" />}
							</Button>
						</form>
					</motion.div>
					<motion.div variants={itemVariants} className="space-y-6">
						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-slate-50 dark:bg-zinc-950 px-2 text-muted-foreground">
									<TranslatedText text="Or register with" />
								</span>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<Button variant="outline" type="button" className="h-10">
								<FcGoogle className="mr-2 h-5 w-5" />
								Google
							</Button>
							<Button variant="outline" type="button" className="h-10">
								<FaApple className="mr-2 h-5 w-5" />
								Apple
							</Button>
						</div>
					</motion.div>
				</motion.div>
			</div>
		</div>
	);
}