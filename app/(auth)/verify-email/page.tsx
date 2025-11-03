// app/auth/verify-email/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"; // (مسیر دکمه خودتان را چک کنید)

const VerifyEmailPage = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 text-center bg-gray-900 rounded-lg shadow-md">
        {" "}
        {/* (کلاس‌های استایل را متناسب با تم خودتان تغییر دهید) */}
        <h1 className="text-3xl font-bold text-yellow-400">Check Your Email</h1>
        <p className="text-lg text-gray-300">
          We&apos;ve sent a verification link to your email address.
        </p>
        <p className="text-md text-gray-400">
          Please check your inbox (and spam folder!) and click the link to
          activate your account.
        </p>
        <div className="pt-4">
          <Button
            onClick={() => router.push("/sign-in")}
            className="yellow-btn w-full" // (کلاس دکمه خودتان)
          >
            Back to Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
