"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Unplug } from "lucide-react"; // Or any icon library you use

export default function AuthError() {
  const [count, setCount] = useState(5);
  const router = useRouter();

  useEffect(() => {
    // 1. Start the countdown
    const timer = setInterval(() => {
      setCount((prev) => prev - 1);
    }, 1000);

    // 2. Redirect when countdown hits 0
    const redirect = setTimeout(() => {
      router.push("/login");
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <div className="flex justify-center mb-4">
          <Unplug className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          Sorry, only accounts with <strong>@provusinc.com</strong> or <strong>@provus.ai</strong> domains can access this portal.
        </p>
        
        <div className="text-sm text-gray-500">
          Redirecting you back to login in <span className="font-bold text-blue-600">{count}</span> seconds...
        </div>

        <button 
          onClick={() => router.push("/login")}
          className="mt-6 w-full py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition"
        >
          Return to Login Now
        </button>
      </div>
    </div>
  );
}