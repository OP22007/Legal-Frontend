"use client";
import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./button";
import { cn } from "@/lib/utils";

const STAGES = [
  { key: "uploading", text: "Uploading Securely..." },
  { key: "processing", text: "Processing Document..." },
  { key: "analyzing", text: "Analyzing Document..." },
  { key: "generating", text: "Generating Detailed Analysis..." },
  { key: "saving", text: "Finalizing Results..." },
];

type UploadStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "analyzing"
  | "generating"
  | "saving"
  | "success"
  | "error";

interface FileUpload {
  file: File;
  status: UploadStatus;
  error?: string;
  jobId?: string;
  progress?: string;
}

export function Dropzone() {
  const [file, setFile] = useState<FileUpload | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const resetState = () => {
    setFile(null);
    setIsProcessing(false);
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      toast.error(
        rejectedFiles[0].errors[0]?.message || "File type not supported"
      );
      return;
    }
    if (acceptedFiles.length > 0) {
      setFile({ file: acceptedFiles[0], status: "pending" });
    }
  }, []);

  useEffect(() => {
    if (file && file.status === "pending") {
      handleUpload(file.file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 20 * 1024 * 1024,
    multiple: false,
    disabled: isProcessing,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/plain": [".txt"],
    },
  });

  const setFileState = (newState: Partial<FileUpload>) => {
    setFile((prev) => (prev ? { ...prev, ...newState } : null));
  };

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const handleUpload = async (fileToProcess: File) => {
    if (!fileToProcess) return;
    setIsProcessing(true);
    const toastId = toast.loading("Starting process...");
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    console.log("Using backend URL:", BACKEND_URL);
    
    try {
      const formData = new FormData();
      formData.append("file", fileToProcess);

      // Step 1: Initiate async upload
      setFileState({ status: "uploading" });
      toast.loading("Initiating upload...", { id: toastId });

      const initiateResponse = await fetch(`${BACKEND_URL}/upload/initiate`, {
        method: "POST",
        headers: { Authorization: "Bearer RANDOM_TOKEN_VALUE" },
        body: formData,
      });

      if (!initiateResponse || !initiateResponse.ok) {
        let detail = "Failed to initiate upload.";
        try {
          const j = await initiateResponse?.json();
          detail = j?.detail || detail;
        } catch {
          // ignore
        }
        throw new Error(detail);
      }

      const { job_id } = await initiateResponse.json();
      setFileState({ jobId: job_id, status: "processing" });
      console.log("Job initiated with ID:", job_id);

      // Step 2: Poll for status
      let analysisResult = null;
      let pollAttempts = 0;
      const maxPollAttempts = 100; // 5 minutes max (3s * 100 = 300s)

      while (!analysisResult && pollAttempts < maxPollAttempts) {
        await sleep(3000); // Poll every 3 seconds
        pollAttempts++;

        const statusResponse = await fetch(
          `${BACKEND_URL}/upload/status/${job_id}`,
          {
            headers: { Authorization: "Bearer RANDOM_TOKEN_VALUE" },
          }
        );

        if (!statusResponse || !statusResponse.ok) {
          throw new Error("Failed to check upload status.");
        }

        const statusData = await statusResponse.json();
        console.log("Status update:", statusData);

        // Update UI based on progress message
        if (statusData.progress) {
          setFileState({ progress: statusData.progress });
          
          // Map progress to appropriate status
          if (statusData.progress.includes("Extracting text") || 
              statusData.progress.includes("Chunking")) {
            setFileState({ status: "processing" });
            toast.loading(statusData.progress, { id: toastId });
          } else if (statusData.progress.includes("Analyzing")) {
            setFileState({ status: "analyzing" });
            toast.loading(statusData.progress, { id: toastId });
          } else if (statusData.progress.includes("Storing") || 
                     statusData.progress.includes("embeddings")) {
            setFileState({ status: "generating" });
            toast.loading(statusData.progress, { id: toastId });
          }
        }

        if (statusData.status === "completed") {
          analysisResult = statusData.result;
          break;
        } else if (statusData.status === "failed") {
          throw new Error(statusData.error || "Upload processing failed.");
        }
      }

      if (!analysisResult) {
        throw new Error("Upload timed out. Please try again.");
      }

      // Step 3: Save to our database
      setFileState({ status: "saving" });
      toast.loading("Saving analysis...", { id: toastId });

      const saveResponse = await fetch("/api/documents/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisResult,
          fileMetadata: {
            fileName: fileToProcess.name,
            fileSize: fileToProcess.size,
            fileType: fileToProcess.type,
          },
        }),
      });

      if (!saveResponse || !saveResponse.ok) {
        let err = "Failed to save analysis.";
        try {
          const j = await saveResponse?.json();
          err = j?.error || err;
        } catch {
          // ignore
        }
        throw new Error(err);
      }

      setFileState({ status: "success" });
      toast.success("Analysis complete!", { id: toastId });

      setTimeout(
        () => router.push(`/analysis/${analysisResult.document_id}`),
        1500
      );
    } catch (error: any) {
      setFileState({ status: "error", error: error?.message || "Unknown" });
      toast.error(error?.message || "Error", { id: toastId });
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div
              {...getRootProps()}
              className={cn(
                "group relative flex flex-col items-center justify-center w-full h-80 cursor-pointer rounded-2xl border-2 border-dashed border-muted-foreground/30 transition-all duration-300 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-sm shadow-md",
                {
                  "border-primary/50 bg-primary/10 ring-2 ring-primary/30":
                    isDragActive,
                }
              )}
            >
              <input {...getInputProps()} />
              <div className="text-center p-8 z-10">
                <motion.div
                  animate={{
                    scale: isDragActive ? 1.1 : 1,
                    y: isDragActive ? -5 : 0,
                  }}
                >
                  <UploadCloud className="mx-auto h-16 w-16 text-muted-foreground/60 group-hover:text-primary/80" />
                </motion.div>
                <p className="mt-4 text-xl font-semibold text-foreground">
                  Drag & drop your document
                </p>
                <p className="mt-2 text-base text-muted-foreground">
                  or click to select (Max 20MB)
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="progress"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <UploadProgress file={file} onReset={resetState} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===================== ANIMATION ===========================
const SecureAnalysisAnimation = ({ status }: { status: UploadStatus }) => {
  const documentPath =
    "M25 3H75C76.1046 3 77 3.89543 77 5V95C77 96.1046 76.1046 97 75 97H25C23.8954 97 23 96.1046 23 95V5C23 3.89543 23.8954 3 25 3Z";
  const padlockPath =
    "M71.5 50.5H28.5C27.1 50.5 26 51.6 26 53V73C26 74.4 27.1 75.5 28.5 75.5H71.5C72.9 75.5 74 74.4 74 73V53C74 51.6 72.9 50.5 71.5 50.5ZM50 67.5C47.5 67.5 45.5 65.5 45.5 63C45.5 60.5 47.5 58.5 50 58.5C52.5 58.5 54.5 60.5 54.5 63C54.5 65.5 52.5 67.5 50 67.5Z M62.5 50.5V41.5C62.5 34.6 56.9 29 50 29C43.1 29 37.5 34.6 37.5 41.5V50.5";

  const isUploading = status === "uploading";
  const isProcessing = status === "processing";
  const isGenerating = status === "generating" || status === "analyzing";
  const isSuccess = status === "success";

  const docColors = [
    { fill: "#AECDE0", stroke: "#6A9CC9" }, // Muted Blue
    { fill: "#C8E6C9", stroke: "#81C784" }, // Muted Green
    { fill: "#FFF9C4", stroke: "#FFEB3B" }, // Muted Yellow
    { fill: "#F8BBD0", stroke: "#F06292" }, // Muted Pink
  ];
  const documentPaths = [
    "M30 30 H70 V70 H30 Z",
    "M35 25 L65 25 L70 30 L70 75 L30 75 L30 30 Z",
    "M40 20 H75 V60 H35 L40 20 Z",
    "M30 35 C30 25 40 20 50 20 C60 20 70 25 70 35 V70 H30 Z",
  ];

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="liquidGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#16a34a" stopOpacity="0.85" />
        </linearGradient>

        {/* Filter for paper-like texture */}
        <filter id="roughPaper" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="1"
            result="noise"
          />
          <feDiffuseLighting
            in="noise"
            lightingColor="white"
            surfaceScale="2"
            result="light"
          >
            <feDistantLight azimuth="225" elevation="45" />
          </feDiffuseLighting>
          <feComposite
            in="SourceGraphic"
            in2="light"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="0.5"
            k4="0"
          />
        </filter>
      </defs>

      {/* UPLOADING: Colorful documents flying in with magnifier */}
      <AnimatePresence>
        {(isUploading || isProcessing) && (
          <motion.g key="uploading-docs">
            {/* Documents flying in with paper texture */}
            {documentPaths.map((dPath, i) => (
              <motion.path
                key={`doc-upload-${i}`}
                d={dPath}
                fill={docColors[i].fill}
                stroke={docColors[i].stroke}
                strokeWidth="1"
                filter="url(#roughPaper)" 
                initial={{ opacity: 0, x: 50, y: 50, scale: 0.5, rotate: 45 }}
                animate={{
                  opacity: [0, 1, 1],
                  x: 0,
                  y: 0,
                  scale: 1,
                  rotate: -5 + i * 3,
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: i * 0.3,
                  ease: "easeInOut",
                }}
              />
            ))}
            {/* Magnifier static during upload */}
            <g transform="translate(0, 10)">
              <circle
                cx="50"
                cy="40"
                r="14"
                fill="rgba(180,180,180,0.05)"
                stroke="hsl(210 90% 70%)"
                strokeWidth="1.6"
              />
              <rect
                x="62"
                y="52"
                width="12"
                height="3"
                rx="1.5"
                transform="rotate(35 62 52)"
                fill="hsl(210 90% 60%)"
              />
            </g>
          </motion.g>
        )}
      </AnimatePresence>

      {/* GENERATING: Colorful documents cycling with active magnifier */}
      <AnimatePresence>
        {isGenerating && (
          <motion.g
            key="generating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {/* Cycling colorful documents with paper texture */}
            {documentPaths.map((dPath, i) => (
              <motion.path
                key={`doc-generate-${i}`}
                d={dPath}
                fill={docColors[i].fill}
                stroke={docColors[i].stroke}
                strokeWidth="1"
                filter="url(#roughPaper)" 
                initial={{ opacity: 0, y: i * 2 }}
                animate={{
                  opacity: [0, 0.8, 0],
                  y: [i * 2, i * 2 - 5, i * 2],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: "easeInOut",
                }}
              />
            ))}

            {/* Magnifier and its animations */}
            <motion.g
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            >
              <motion.circle
                cx="50"
                cy="40"
                r="14"
                fill="rgba(255,255,255,0.02)"
                stroke="hsl(210 90% 60%)"
                strokeWidth="1.6"
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, 6, -6, 0] }}
                transition={{ duration: 2.8, repeat: Infinity }}
              />
              <motion.rect
                x="62"
                y="52"
                width="12"
                height="3"
                rx="1.5"
                transform="rotate(35 62 52)"
                fill="hsl(210 90% 50%)"
                initial={{ opacity: 0.9 }}
                animate={{ opacity: [0.9, 0.5, 0.9] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
              <motion.path
                d="M40 40 A10 10 0 0 1 60 40"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1.6"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: [0, 1, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
              />
            </motion.g>

            {/* Particles and bars */}
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.circle
                key={"p" + i}
                cx={50 + Math.cos((i / 6) * Math.PI * 2) * 22}
                cy={40 + Math.sin((i / 6) * Math.PI * 2) * 22}
                r={1.4}
                fill="#22c55e"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0.2, 1, 0.2],
                  cx: [
                    50 + Math.cos((i / 6) * Math.PI * 2) * 20,
                    50 + Math.cos((i / 6) * Math.PI * 2) * 24,
                    50 + Math.cos((i / 6) * Math.PI * 2) * 20,
                  ],
                }}
                transition={{
                  delay: i * 0.12,
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
            {Array.from({ length: 7 }).map((_, i) => {
              const x = 24 + i * 8;
              return (
                <motion.rect
                  key={"b" + i}
                  x={x}
                  y={64}
                  width={4}
                  rx={1}
                  height={8}
                  initial={{ height: 6, y: 66, opacity: 0.8 }}
                  animate={{
                    height: [6, 18 - (i % 3) * 3, 6],
                    y: [66, 58 + (i % 3) * 2, 66],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    delay: i * 0.08,
                    duration: 1.3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  fill="#34d399"
                />
              );
            })}
          </motion.g>
        )}
      </AnimatePresence>

      {/* SUCCESS: Final document with padlock */}
      <AnimatePresence>
        {isSuccess && (
          <motion.g
            key="success-padlock"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <motion.path
              d={documentPath}
              stroke="var(--foreground)"
              strokeWidth="1.6"
              fill="url(#liquidGrad)"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
            <motion.path
              d={padlockPath}
              fill="#FFD700"
              stroke="black"
              strokeWidth="2"
              initial={{ scale: 0, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 160, delay: 0.5 }}
            />
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
};

function UploadProgress({
  file,
  onReset,
}: {
  file: FileUpload;
  onReset: () => void;
}) {
  const currentStage = STAGES.find((s) => s.key === file.status);
  const displayText = file.progress || currentStage?.text || "Processing...";

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center w-full h-80 rounded-2xl border border-muted-foreground/10 p-8 transition-colors bg-white/70 dark:bg-zinc-900/50 backdrop-blur-sm shadow-md",
        {
          "border-green-500/40": file.status === "success",
          "border-destructive/30": file.status === "error",
        }
      )}
    >
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
          {file.status === "error" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <AlertCircle className="h-20 w-20 text-destructive" />
            </motion.div>
          ) : (
            <SecureAnalysisAnimation status={file.status} />
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={file.status + "_text"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6"
          >
            {file.status === "success" && (
              <>
                <h3 className="text-2xl font-semibold text-foreground">
                  Analysis Complete!
                </h3>
                <p className="mt-1 text-muted-foreground">
                  Redirecting to results...
                </p>
              </>
            )}
            {file.status === "error" && (
              <>
                <h3 className="text-2xl font-semibold text-destructive">
                  Processing Failed
                </h3>
                <p className="mt-1 text-muted-foreground max-w-xs mx-auto">
                  {file.error}
                </p>
                <Button onClick={onReset} variant="secondary" className="mt-6">
                  Try Another File
                </Button>
              </>
            )}
            {(file.status !== "success" && file.status !== "error") && (
              <>
                <h3 className="text-2xl font-semibold text-foreground">
                  {displayText}
                </h3>
                <p className="mt-1 text-muted-foreground truncate max-w-xs mx-auto">
                  {file.file.name}
                </p>
                {file.jobId && (
                  <p className="mt-2 text-xs text-muted-foreground/70">
                    Job ID: {file.jobId.substring(0, 8)}...
                  </p>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}