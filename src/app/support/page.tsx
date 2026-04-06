"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function SupportPage() {
  const router = useRouter();
  const [activeUser, setActiveUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    subject: "",
    category: "General Inquiry",
    orderId: "",
    message: ""
  });

  useEffect(() => {
    const user = localStorage.getItem('nearbuy_active_user');
    if (user) setActiveUser(JSON.parse(user));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTicket = {
      id: "TKT-" + Date.now(),
      userId: activeUser?.id || "guest",
      userName: activeUser?.name || "Anonymous",
      userEmail: activeUser?.email || "anonymous@example.com",
      ...formData,
      status: "Open",
      createdAt: new Date().toISOString()
    };

    const tickets = JSON.parse(localStorage.getItem('nearbuy_support_tickets') || '[]');
    localStorage.setItem('nearbuy_support_tickets', JSON.stringify([newTicket, ...tickets]));

    toast.success("Support ticket submitted! Our team will contact you shortly.");
    setFormData({ subject: "", category: "General Inquiry", orderId: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pb-20">
      {/* Back to Home Button */}
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-3 text-nearbuy-secondary hover:text-nearbuy-primary transition-all group z-50">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border border-gray-100 font-black">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block text-nearbuy-secondary">Home</span>
      </Link>

      <section className="w-full bg-nearbuy-secondary pt-24 pb-32 text-center text-white relative overflow-hidden shrink-0">
         <div className="max-w-4xl mx-auto px-6 relative z-10">
            <div className="w-20 h-20 bg-nearbuy-primary/20 text-nearbuy-primary rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-nearbuy-primary/10">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
               </svg>
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter italic">Connect Buy <br/><span className="text-nearbuy-primary">Care & Support.</span></h1>
            <p className="max-w-xl mx-auto text-gray-400 font-medium text-lg leading-relaxed">How can we help you today? Whether you're a buyer or seller, our team is here to assist with any platform issues.</p>
         </div>
         {/* Decorative elements */}
         <div className="absolute top-10 right-0 w-64 h-64 bg-nearbuy-primary/10 rounded-full blur-3xl animate-pulse"></div>
         <div className="absolute bottom-0 left-0 w-96 h-96 bg-nearbuy-primary/5 rounded-full blur-3xl animate-pulse [animation-delay:2s]"></div>
      </section>

      <div className="max-w-5xl w-full mx-auto px-6 -mt-16 relative z-20 flex flex-col lg:flex-row gap-8">
         {/* Left Side: Contact Form */}
         <div className="flex-[2] bg-white rounded-[4rem] p-12 shadow-2xl border border-gray-100">
            <div className="mb-10">
               <h2 className="text-3xl font-black text-nearbuy-secondary tracking-tight mb-2 uppercase italic">Open Support Ticket</h2>
               <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Detail your issue and we'll resolve it accordingly</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Ticket Subject</label>
                     <input 
                        required
                        className="w-full px-6 py-4 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all font-bold placeholder:text-gray-300"
                        placeholder="I have an issue with..."
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Incident Category</label>
                     <select 
                        className="w-full px-6 py-4 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all font-bold appearance-none cursor-pointer"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                     >
                        <option>General Inquiry</option>
                        <option>Payment/Naira Issue</option>
                        <option>Delivery Tracking</option>
                        <option>Report a Seller</option>
                        <option>Account Security</option>
                        <option>Technical Bug</option>
                     </select>
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Order Reference (Optional)</label>
                  <input 
                     className="w-full px-6 py-4 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all font-bold placeholder:text-gray-300"
                     placeholder="e.g. ORD-12345"
                     value={formData.orderId}
                     onChange={(e) => setFormData({...formData, orderId: e.target.value})}
                  />
               </div>

               <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Your Message / Complaint</label>
                  <textarea 
                     required
                     rows={5}
                     className="w-full px-6 py-4 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all font-bold placeholder:text-gray-300 resize-none"
                     placeholder="Please provide as much detail as possible..."
                     value={formData.message}
                     onChange={(e) => setFormData({...formData, message: e.target.value})}
                  />
               </div>

               <button 
                  type="submit"
                  className="w-full bg-nearbuy-secondary hover:bg-nearbuy-primary text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all text-xs uppercase tracking-widest border-0 cursor-pointer"
               >
                  Submit Support Ticket ⚡
               </button>
            </form>
         </div>

         {/* Right Side: Quick Links / Contact Cards */}
         <div className="flex-1 space-y-6">
            <div className="bg-nearbuy-primary text-white p-10 rounded-[3rem] shadow-xl relative overflow-hidden group">
               <div className="relative z-10">
                  <h3 className="text-xl font-black tracking-tight mb-2 uppercase italic leading-none">Emergency?</h3>
                  <p className="text-white/60 font-medium text-sm leading-relaxed mb-8">Contact our 24/7 hotline for immediate security concerns.</p>
                  <div className="text-2xl font-black tabular-nums tracking-tighter italic">0800-NEARBUY-CARE</div>
               </div>
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl">
               <h3 className="text-lg font-black text-nearbuy-secondary mb-6 uppercase italic">Quick Help</h3>
               <div className="space-y-4">
                  <div className="flex items-center gap-4 group cursor-pointer hover:translate-x-2 transition-transform">
                     <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-nearbuy-secondary group-hover:bg-nearbuy-primary group-hover:text-white transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                     </div>
                     <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Platform FAQ</span>
                  </div>
                  <div className="flex items-center gap-4 group cursor-pointer hover:translate-x-2 transition-transform">
                     <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-nearbuy-secondary group-hover:bg-nearbuy-primary group-hover:text-white transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                     </div>
                     <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Direct Email</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
