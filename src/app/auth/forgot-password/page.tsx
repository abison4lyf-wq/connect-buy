"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [verification, setVerification] = useState({ name: "", phone: "" });
  const [newPassword, setNewPassword] = useState("");
  const [targetUser, setTargetUser] = useState<any>(null);

  const handleFindAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('nearbuy_users') || '[]');
    const sellers = JSON.parse(localStorage.getItem('nearbuy_sellers') || '[]');
    
    const user = users.find((u: any) => u.email === email) || sellers.find((s: any) => s.email === email);
    
    if (user) {
      setTargetUser(user);
      setStep(2);
      toast.success("Account found. Please verify your identity.");
    } else {
      toast.error("No account found with this email address.");
    }
  };

  const handleVerifyIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strong verification check
    const isNameMatch = targetUser.name?.toLowerCase() === verification.name?.toLowerCase();
    const isPhoneMatch = targetUser.phone === verification.phone;

    if (isNameMatch && isPhoneMatch) {
      setStep(3);
      toast.success("Identity Verified. You may now reset your password.");
    } else {
      toast.error("Verification failed. Information does not match our records.");
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    const users = JSON.parse(localStorage.getItem('nearbuy_users') || '[]');
    const sellers = JSON.parse(localStorage.getItem('nearbuy_sellers') || '[]');

    const updatedUsers = users.map((u: any) => 
      u.email === email ? { ...u, password: newPassword } : u
    );
    const updatedSellers = sellers.map((s: any) => 
      s.email === email ? { ...s, password: newPassword } : s
    );

    localStorage.setItem('nearbuy_users', JSON.stringify(updatedUsers));
    localStorage.setItem('nearbuy_sellers', JSON.stringify(updatedSellers));

    toast.success("Password reset successfully! Please log in with your new credentials.");
    router.push('/auth/login');
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
          <div className="w-20 h-20 bg-nearbuy-primary/10 text-nearbuy-primary rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Security Recovery</h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">Follow the steps to secure your account.</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-10 overflow-hidden rounded-full bg-gray-50 p-1">
           {[1,2,3].map(s => (
             <div key={s} className={`flex-1 h-2 rounded-full transition-all duration-500 ${step >= s ? 'bg-nearbuy-primary' : 'bg-gray-200'}`}></div>
           ))}
        </div>

        {step === 1 && (
          <form className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-500" onSubmit={handleFindAccount}>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Account Email</label>
              <input
                required
                type="email"
                className="w-full px-5 py-4 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all font-bold"
                placeholder="Enter registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-nearbuy-secondary hover:bg-nearbuy-primary text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all text-xs uppercase tracking-widest"
            >
              Verify Email →
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-500" onSubmit={handleVerifyIdentity}>
            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl mb-4">
               <p className="text-[11px] text-yellow-700 font-bold uppercase tracking-wider mb-1">Strong Verification Mode</p>
               <p className="text-xs text-yellow-600/80 leading-relaxed font-medium">Please provide the exact details used during account setup to prove ownership.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Registered Full Name</label>
                <input
                  required
                  className="w-full px-5 py-4 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all font-bold"
                  placeholder="Enter your full name"
                  value={verification.name}
                  onChange={(e) => setVerification({...verification, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                <input
                  required
                  className="w-full px-5 py-4 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all font-bold"
                  placeholder="080 123 4567"
                  value={verification.phone}
                  onChange={(e) => setVerification({...verification, phone: e.target.value})}
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-nearbuy-primary hover:bg-nearbuy-accent text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all text-xs uppercase tracking-widest"
            >
              Confirm Identity
            </button>
          </form>
        )}

        {step === 3 && (
          <form className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-500" onSubmit={handleResetPassword}>
             <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">New Password</label>
              <input
                required
                type="password"
                className="w-full px-5 py-4 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all font-bold"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-nearbuy-secondary hover:bg-green-600 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all text-xs uppercase tracking-widest"
            >
              Reset Password & Login
            </button>
          </form>
        )}

        <div className="text-center mt-6">
           <Link href="/auth/login" className="text-xs font-bold text-gray-500 hover:text-nearbuy-primary transition-colors">
              Remembered your login? Sign In
           </Link>
        </div>
      </div>
    </div>
  );
}
