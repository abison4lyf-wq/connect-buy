// src/app/auth/selection/page.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthSelectionContent() {
  const searchParams = useSearchParams();
  const state = searchParams.get("state");
  const lga = searchParams.get("lga");

  // Keep location params to pass them forward
  const queryParams = state && lga ? `?state=${encodeURIComponent(state)}&lga=${encodeURIComponent(lga)}` : "";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 relative">
      {/* Back to Home Button */}
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-3 text-nearbuy-secondary hover:text-nearbuy-primary transition-all group z-50">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border border-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Back to Home</span>
      </Link>
      <div className="max-w-2xl w-full text-center mb-12">
        <Link href="/" className="inline-block mb-8">
           <h1 className="text-3xl font-black tracking-tighter text-nearbuy-secondary">
            Connect<span className="text-nearbuy-primary italic">Buy.</span>
           </h1>
        </Link>
        <div className="inline-block bg-nearbuy-primary/10 text-nearbuy-primary font-black uppercase text-[10px] tracking-widest px-4 py-2 rounded-full mb-6 relative z-10">
          Getting Started
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-nearbuy-secondary mb-4 tracking-tighter uppercase italic leading-none">Are you a Buyer <br/><span className="text-nearbuy-primary">or a Seller?</span></h2>
        <p className="text-gray-900 font-bold text-lg max-w-lg mx-auto">Please select how you would like to use Connect Buy today to continue.</p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Buyer Card */}
        <Link 
          href={`/auth/buyer-signup${queryParams}`}
          className="group bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl hover:shadow-2xl hover:border-nearbuy-primary transition-all flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-[4rem] group-hover:bg-nearbuy-primary/5 transition-colors"></div>
          <div className="w-24 h-24 bg-nearbuy-primary/10 text-nearbuy-primary rounded-[2rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-lg relative z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-3xl font-black text-nearbuy-secondary mb-4 relative z-10">I want to Buy</h3>
          <p className="text-gray-500 font-medium leading-relaxed relative z-10">
            Discover amazing local deals, connect with verified sellers in your area, and get fast delivery.
          </p>
          <div className="mt-8 bg-nearbuy-secondary text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest group-hover:bg-nearbuy-primary transition-colors">
            Start Shopping →
          </div>
        </Link>

        {/* Seller Card */}
        <Link 
          href={`/register-seller${queryParams}`}
          className="group bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl hover:shadow-2xl hover:border-gray-900 transition-all flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-gray-50 rounded-br-[4rem] group-hover:bg-gray-100/50 transition-colors"></div>
          <div className="w-24 h-24 bg-gray-100 text-gray-900 rounded-[2rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-lg relative z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-3xl font-black text-nearbuy-secondary mb-4 relative z-10">I want to Sell</h3>
          <p className="text-gray-500 font-medium leading-relaxed relative z-10">
            Open your hyperlocal storefront, reach thousands of nearby customers, and grow your business today.
          </p>
          <div className="mt-8 bg-nearbuy-secondary text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest group-hover:bg-gray-900 transition-colors">
            Start Selling →
          </div>
        </Link>
      </div>
      
      <div className="mt-16 text-center w-full max-w-lg">
        <div className="flex items-center gap-4 mb-8">
           <div className="flex-1 h-px bg-gray-200"></div>
           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Returning Users</span>
           <div className="flex-1 h-px bg-gray-200"></div>
        </div>
        <Link 
          href="/auth/login" 
          className="block w-full bg-white border-2 border-nearbuy-primary text-nearbuy-primary hover:bg-nearbuy-primary hover:text-white font-black py-5 rounded-2xl shadow-sm transition-all active:scale-95 text-lg"
        >
          Log In to your Account
        </Link>
      </div>
    </div>
  );
}

export default function AuthSelection() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400">Loading Configuration...</div>}>
      <AuthSelectionContent />
    </Suspense>
  );
}
