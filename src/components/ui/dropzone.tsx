//src/components/ui/dropzone.tsx
"use client";
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
	CheckCircle2,
	File as FileIcon,
	Trash2,
	UploadCloud,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "./button";
import { Progress } from "./progress";
import { cn } from "@/lib/utils";

interface FileUpload {
	file: File;
	progress: number;
	error?: string;
}

export function Dropzone() {
	const [files, setFiles] = useState<FileUpload[]>([]);
	const [isUploading, setIsUploading] = useState(false);

	const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
		const newFiles: FileUpload[] = acceptedFiles.map((file) => ({
			file,
			progress: 0,
		}));

		rejectedFiles.forEach((rejectedFile: any) => {
			const error =
				rejectedFile.errors[0]?.message || "File type not supported";
			toast.error(`Error with ${rejectedFile.file.name}: ${error}`);
		});

		setFiles((prevFiles) => [...prevFiles, ...newFiles]);
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		maxSize: 5 * 1024 * 1024, // 5MB
		accept: {
			"application/pdf": [".pdf"],
			"application/msword": [".doc"],
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
				".docx",
			],
			"text/plain": [".txt"],
		},
	});

	const removeFile = (fileName: string) => {
		setFiles((prevFiles) =>
			prevFiles.filter((f) => f.file.name !== fileName)
		);
	};

	const simulateUpload = (fileUpload: FileUpload) => {
		return new Promise<void>((resolve, reject) => {
			const interval = setInterval(() => {
				setFiles((prevFiles) =>
					prevFiles.map((f) => {
						if (f.file.name === fileUpload.file.name) {
							const newProgress = f.progress + 10;
							if (newProgress >= 100) {
								clearInterval(interval);
								resolve();
								return { ...f, progress: 100 };
							}
							return { ...f, progress: newProgress };
						}
						return f;
					})
				);
			}, 200);
		});
	};

	const handleUpload = async () => {
		if (files.length === 0) {
			toast.error("Please select at least one file to upload.");
			return;
		}

		setIsUploading(true);
		toast.info("Starting upload...");

		for (const fileUpload of files) {
			try {
				await simulateUpload(fileUpload);
			} catch (error) {
				setFiles((prevFiles) =>
					prevFiles.map((f) =>
						f.file.name === fileUpload.file.name
							? { ...f, error: "Upload failed" }
							: f
					)
				);
			}
		}

		setIsUploading(false);
		toast.success("All files uploaded successfully!");
	};

	return (
		<div className="w-full">
			<motion.div
				{...getRootProps()}
				className={cn(
					"group relative flex flex-col items-center justify-center w-full h-64 cursor-pointer rounded-xl border-2 border-dashed border-muted-foreground/30 bg-background/20 transition-colors",
					{
						"border-primary/50 bg-primary/10": isDragActive,
					}
				)}
				whileHover={{ scale: 1.02, borderColor: "hsl(var(--primary))" }}
			>
				<input {...getInputProps()} />
				<div className="text-center">
					<UploadCloud
						className={cn(
							"mx-auto h-16 w-16 text-muted-foreground/50 transition-transform",
							{
								"scale-110 text-primary": isDragActive,
							}
						)}
					/>
					{isDragActive ? (
						<p className="mt-4 text-lg font-semibold text-primary">
							Drop the files here...
						</p>
					) : (
						<>
							<p className="mt-4 text-lg font-semibold text-foreground">
								Drag and drop files here, or click to select
							</p>
							<p className="mt-1 text-sm text-muted-foreground">
								PDF, DOC, DOCX, TXT (up to 5MB)
							</p>
						</>
					)}
				</div>
			</motion.div>

			<AnimatePresence>
				{files.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						className="mt-8 space-y-4"
					>
						<div className="flex justify-between items-center">
							<h3 className="text-xl font-semibold">Uploaded Files</h3>
							<Button onClick={handleUpload} disabled={isUploading || files.every(f => f.progress === 100)}>
								{isUploading ? "Uploading..." : "Upload All"}
							</Button>
						</div>

						<ul className="space-y-3">
							{files.map((fileUpload, index) => (
								<motion.li
									key={index}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: 20 }}
									className="relative flex items-center p-4 space-x-4 bg-background/50 border rounded-lg"
								>
									<FileIcon className="h-8 w-8 text-muted-foreground" />
									<div className="flex-1">
										<p className="font-medium text-foreground truncate">
											{fileUpload.file.name}
										</p>
										<div className="flex items-center gap-2">
											<Progress value={fileUpload.progress} className="w-full h-2" />
											<span className="text-sm font-mono text-muted-foreground">
												{fileUpload.progress}%
											</span>
										</div>
										{fileUpload.error && <p className="text-xs text-destructive">{fileUpload.error}</p>}
									</div>
									{fileUpload.progress === 100 && !fileUpload.error ? (
										<CheckCircle2 className="h-6 w-6 text-green-500" />
									) : fileUpload.error ? (
										<XCircle className="h-6 w-6 text-destructive" />
									) : (
										<Button
											variant="ghost"
											size="icon"
											onClick={() => removeFile(fileUpload.file.name)}
											className="text-muted-foreground hover:text-destructive"
											disabled={isUploading}
										>
											<Trash2 className="h-5 w-5" />
										</Button>
									)}
								</motion.li>
							))}
						</ul>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}