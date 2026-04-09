"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function Login() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login for MVP
    setTimeout(() => {
      const existingUsers = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('nearbuy_users') || '[]') : [];
      
      const user = existingUsers.find((u: any) => u.email === formData.email && u.password === formData.password);
      
      // Admin Check (Dynamic + Fallback)
      const adminCredsRaw = typeof window !== 'undefined' ? localStorage.getItem('nearbuy_admin_creds') : null;
      const adminCreds = adminCredsRaw ? JSON.parse(adminCredsRaw) : { email: 'admin@connectbuy.com', password: 'admin123' };

      if (formData.email === adminCreds.email && formData.password === adminCreds.password) {
         const adminUser = { email: adminCreds.email, role: 'admin', name: 'System Admin' };
         localStorage.setItem('nearbuy_active_user', JSON.stringify(adminUser));
         toast.success("Welcome, Supreme Admin!");
         router.push('/admin');
         return;
      }

      if (user) {
         localStorage.setItem('nearbuy_active_user', JSON.stringify(user));
         toast.success(`Welcome back to Connect Buy, ${user.name}!`);
         if (user.role === 'admin') {
            router.push('/admin');
         } else if (user.role === 'seller') {
            localStorage.setItem('active_seller_id', user.sellerId || user.id);
            router.push('/seller-dashboard');
         } else {
            router.push('/marketplace');
         }
      } else {
         // Fallback for sellers
         const existingSellers = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('nearbuy_sellers') || '[]') : [];
         const seller = existingSellers.find((s: any) => s.email === formData.email && s.password === formData.password);
         if (seller) {
            localStorage.setItem('nearbuy_active_user', JSON.stringify({ ...seller, role: 'seller' }));
            localStorage.setItem('active_seller_id', seller.id);
            toast.success("Welcome back to Seller Dashboard!");
            router.push('/seller-dashboard');
         } else {
            toast.error("Invalid email or password. Please try again.");
            setIsLoading(false);
         }
      }
    }, 1000);
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
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">Sign in to your account.</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
              <input
                required
                type="email"
                className="w-full px-5 py-4 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Password</label>
              <input
                required
                type="password"
                className="w-full px-5 py-4 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <div className="flex justify-end mt-2">
                <Link href="/auth/forgot-password" className="text-[10px] font-black text-gray-400 hover:text-nearbuy-primary uppercase tracking-widest transition-colors">
                  Forgot Password?
                </Link>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-nearbuy-primary hover:bg-nearbuy-accent text-white font-black py-5 rounded-2xl shadow-xl shadow-green-900/20 active:scale-95 transition-all text-sm uppercase tracking-widest mt-4 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
        
        <div className="text-center mt-6">
           <Link href="/auth/selection" className="text-xs font-bold text-gray-500 hover:text-nearbuy-primary transition-colors">
              Don't have an account? Sign Up
           </Link>
        </div>
      </div>
    </div>
  );
}
