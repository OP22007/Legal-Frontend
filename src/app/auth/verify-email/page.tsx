"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
      handleVerify(urlToken);
    }
    // eslint-disable-next-line
  }, [searchParams]);

  const handleVerify = async (verifyToken?: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verifyToken || token }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Verification failed.");
        toast.error(result.error || "Verification failed.");
      } else {
        setSuccess(true);
        toast.success("Email verified successfully!");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      }
    } catch (err) {
      setError("A network error occurred. Please try again.");
      toast.error("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded shadow">
        <h2 className="text-2xl font-bold mb-4 text-center">Verify Your Email</h2>
        {success ? (
          <div className="text-green-600 text-center mb-4">
            Your email has been verified! Redirecting to login...
          </div>
        ) : (
          <>
            <p className="mb-4 text-muted-foreground text-center">
              Enter your verification token or click the link in your email.
            </p>
            <Input
              type="text"
              placeholder="Verification token"
              value={token}
              onChange={e => setToken(e.target.value)}
              disabled={loading}
              className="mb-4"
            />
            <Button
              onClick={() => handleVerify()}
              disabled={loading || !token}
              className="w-full"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </Button>
            {error && (
              <div className="text-red-600 text-center mt-4">{error}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded shadow">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
