"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";

function BuyerSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stateParam = searchParams.get("state") || "";
  const lgaParam = searchParams.get("lga") || "";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newUser = {
      id: "u_" + Date.now(),
      ...formData,
      role: "buyer",
      createdAt: new Date().toISOString()
    };

    const existingUsers = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('nearbuy_users') || '[]') : [];
    localStorage.setItem('nearbuy_users', JSON.stringify([...existingUsers, newUser]));
    localStorage.setItem('nearbuy_active_user', JSON.stringify(newUser));

    toast.success("Account created successfully! Welcome to Connect Buy.");
    
    if (stateParam && lgaParam) {
       router.push(`/marketplace?state=${encodeURIComponent(stateParam)}&lga=${encodeURIComponent(lgaParam)}`);
    } else {
       router.push('/marketplace');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Back to Home Button */}
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-3 text-nearbuy-secondary hover:text-nearbuy-primary transition-all group z-50">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border border-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block text-nearbuy-secondary">Home</span>
      </Link>

      <div className="max-w-md w-full mx-auto space-y-8 bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 relative">
        <div className="text-center">
          <Link href="/" className="inline-block mb-4">
             <h1 className="text-2xl font-black tracking-tighter text-nearbuy-secondary">
              Connect<span className="text-nearbuy-primary italic">Buy.</span>
             </h1>
          </Link>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Create Buyer Account</h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">Join to discover local deals and fast delivery.</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
              <input
                required
                className="w-full px-5 py-4 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all font-bold placeholder:text-gray-300"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
              <input
                required
                type="email"
                className="w-full px-5 py-4 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all font-bold placeholder:text-gray-300"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
              <input
                required
                className="w-full px-5 py-4 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all font-bold placeholder:text-gray-300"
                placeholder="08012345678"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Password</label>
              <input
                required
                type="password"
                className="w-full px-5 py-4 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all font-bold placeholder:text-gray-300"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-nearbuy-secondary hover:bg-nearbuy-primary text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all text-sm uppercase tracking-widest mt-4"
          >
            Create Account
          </button>
        </form>
        
        <div className="text-center mt-6">
           <Link href="/auth/login" className="text-xs font-bold text-gray-500 hover:text-nearbuy-primary transition-colors">
              Already have an account? Sign In
           </Link>
        </div>
      </div>
    </div>
  );
}

export default function BuyerSignup() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-400">Loading Configuration...</div>}>
      <BuyerSignupContent />
    </Suspense>
  );
}
