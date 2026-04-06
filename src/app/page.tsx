"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LocationPicker from "@/components/LocationPicker";
import { useCart } from "@/context/CartContext";

export default function Home() {
  const { totalItems } = useCart();
  const router = useRouter();
  const [activeFeatured, setActiveFeatured] = useState(0);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [allStores, setAllStores] = useState<any[]>([]);

  // Platform State - 100% Dynamic now
  const FEATURED_STORES: any[] = [];

  useEffect(() => {
    const user = localStorage.getItem('nearbuy_active_user');
    if (user) setActiveUser(JSON.parse(user));
  }, []);

  useEffect(() => {
    const localSellers = JSON.parse(localStorage.getItem('nearbuy_sellers') || '[]');
    const verifiedSellers = localSellers.filter((s: any) => s.verified === true);
    
    // Combine any static fallback (none now) with local real sellers
    const displayStores = [...verifiedSellers].slice(0, 8);
    setAllStores(displayStores);
  }, []);

  const handleLocationChange = (state: string, lga: string) => {
    handleProtectedLink(`/marketplace?state=${encodeURIComponent(state)}&lga=${encodeURIComponent(lga)}`);
  };

  const handleProtectedLink = (destination: string) => {
    let isAuthenticated = false;
    if (typeof window !== 'undefined') {
      const activeUserRaw = localStorage.getItem('nearbuy_active_user');
      if (activeUserRaw) {
        try {
          const user = JSON.parse(activeUserRaw);
          if (user && user.name) {
            isAuthenticated = true;
          }
        } catch (e) {
          isAuthenticated = false;
        }
      }
    }

    if (isAuthenticated) {
      router.push(destination);
    } else {
      const parts = destination.split('?');
      const query = parts.length > 1 ? `?${parts[1]}` : '';
      router.push(`/auth/selection${query}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* Official Announcement Bar */}
      <div className="w-full bg-nearbuy-secondary text-[10px] font-black text-white py-3 px-6 text-center uppercase tracking-[0.2em] relative overflow-hidden shrink-0">
        <div className="relative z-10 animate-pulse text-white">
           🇳🇬 Welcome to Connect Buy Nigeria! | Supporting local sellers in 50+ LGAs | <span className="text-nearbuy-primary">Secure Pay-on-Delivery</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
      </div>

      {/* Main Hero & Location Picker */}
      <section className="w-full bg-white border-b border-gray-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-nearbuy-primary/5 text-nearbuy-primary rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
               <span className="w-2 h-2 rounded-full bg-nearbuy-primary animate-ping"></span>
               Live Marketplace
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-nearbuy-secondary mb-6 tracking-tighter leading-[0.9]">
              Shop Near <br/>
              <span className="text-nearbuy-primary italic">Buy.</span>
            </h1>
            <p className="max-w-xl text-lg text-gray-500 mb-12 leading-relaxed font-medium">
              The ultimate hyperlocal marketplace. Connect with verified sellers in your LGA and get your items delivered in record time.
            </p>
            
            <div className="w-full max-w-lg mb-8">
              <LocationPicker onLocationChange={handleLocationChange} />
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
               <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-nearbuy-secondary"> Verified Partners </div>
               <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-nearbuy-secondary"> Paystack Secure </div>
               <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-nearbuy-secondary"> 24h Support </div>
            </div>
          </div>

          <div className="flex-1 w-full lg:w-auto relative group">
             {/* Dynamic Hero Visual based on store presence */}
             {allStores.length > 0 ? (
                <div className="bg-gray-50 rounded-[3.5rem] p-4 border border-gray-100 shadow-2xl relative z-10 transition-all duration-700">
                   <div className="bg-white rounded-[3rem] overflow-hidden aspect-[4/5] relative shadow-inner">
                      <img src={allStores[0].image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Featured Store" />
                      <div className="absolute inset-0 bg-gradient-to-t from-nearbuy-secondary/80 to-transparent"></div>
                      <div className="absolute bottom-10 left-10 text-white">
                         <p className="text-[10px] font-black uppercase tracking-widest text-nearbuy-primary mb-2">{allStores[0].category}</p>
                         <h3 className="text-3xl font-black">{allStores[0].name}</h3>
                         <p className="text-xs text-white/60">Verified Local Seller</p>
                      </div>
                   </div>
                </div>
             ) : (
                <div className="bg-nearbuy-secondary rounded-[3.5rem] p-12 border border-white/10 shadow-2xl relative z-10 text-center flex flex-col items-center justify-center min-h-[500px]">
                   <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-nearbuy-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                   </div>
                   <h2 className="text-3xl font-black text-white tracking-tight italic mb-4">Be the first <br/>in your <span className="text-nearbuy-primary">LGA.</span></h2>
                   <p className="text-gray-400 text-sm font-bold uppercase tracking-widest leading-loose max-w-[250px]">Open your business on Connect Buy today and dominate your local community.</p>
                   <Link href="/register-seller" className="mt-10 bg-nearbuy-primary text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all w-full">Apply to Sell</Link>
                </div>
             )}
             
             {/* Decorative Background Elements */}
             <div className="absolute -top-10 -right-10 w-64 h-64 bg-nearbuy-primary/10 rounded-full blur-3xl animate-pulse"></div>
             <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-nearbuy-primary/5 rounded-full blur-3xl animate-pulse [animation-delay:1s]"></div>
          </div>
        </div>
      </section>

      {/* Trending Stores Section (Only if sellers exist) */}
      {allStores.length > 0 && (
         <section className="w-full max-w-7xl px-6 py-24">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
               <div>
                  <h2 className="text-3xl md:text-5xl font-black text-nearbuy-secondary tracking-tighter">Local Trusted <span className="text-nearbuy-primary italic">Stores.</span></h2>
                  <p className="text-gray-400 mt-2 font-bold uppercase text-[10px] tracking-[0.3em]">Verified sellers in your community</p>
               </div>
               <button onClick={() => handleProtectedLink('/marketplace')} className="bg-nearbuy-secondary text-white px-8 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-nearbuy-primary transition-all active:scale-95 shadow-xl shadow-nearbuy-secondary/10 border-0 cursor-pointer">Explore More</button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
               {allStores.map((store, idx) => (
                  <button 
                  key={`${store.id}-${idx}`} 
                  onClick={() => handleProtectedLink(`/marketplace`)}
                  className="group w-full bg-white p-6 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-nearbuy-primary/20 transition-all flex flex-col relative overflow-hidden cursor-pointer text-left"
                  >
                     <div className="w-full aspect-square rounded-[2rem] overflow-hidden mb-6 bg-gray-50 border border-gray-100">
                        <img src={store.image} alt={store.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                     </div>
                     <h3 className="font-black text-nearbuy-secondary text-lg leading-tight line-clamp-1 mb-1">{store.name}</h3>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{store.category || "General Store"}</p>
                     
                     <div className="absolute top-8 left-8 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-nearbuy-primary shadow-sm uppercase">
                        Verified
                     </div>
                  </button>
               ))}
            </div>
         </section>
      )}

      {/* Main Advantage Cards */}
      <section className="w-full max-w-7xl px-6 py-24">
         <div className="mb-12 text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl font-black text-nearbuy-secondary tracking-tight">The Local <span className="text-nearbuy-primary italic">Difference.</span></h2>
            <p className="text-gray-400 mt-2 font-bold uppercase text-[10px] tracking-widest">Connect Buy Hyperlocal Advantage</p>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:border-nearbuy-primary transition-all">
               <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-[2rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
               </div>
               <h3 className="font-black text-nearbuy-secondary text-xl mb-4 uppercase tracking-tighter">Your LGA Markets</h3>
               <p className="text-gray-400 text-sm font-medium leading-relaxed">Shop from verified local vendors in your immediate vicinity. Real people, real products.</p>
            </div>
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:border-nearbuy-primary transition-all">
               <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-[2rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
               </div>
               <h3 className="font-black text-nearbuy-secondary text-xl mb-4 uppercase tracking-tighter">Zero-Waste Delivery</h3>
               <p className="text-gray-400 text-sm font-medium leading-relaxed">Because it's locally based, delivery is faster, cheaper, and more sustainable. Often in minutes.</p>
            </div>
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col items-center text-center group hover:border-nearbuy-primary transition-all">
               <div className="w-20 h-20 bg-purple-50 text-purple-500 rounded-[2rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
               </div>
               <h3 className="font-black text-nearbuy-secondary text-xl mb-4 uppercase tracking-tighter">Verified Trust</h3>
               <p className="text-gray-400 text-sm font-medium leading-relaxed">Every seller is vetted for authenticity and local presence. Shop with 100% confidence.</p>
            </div>
         </div>
      </section>

      {/* Final Join CTA */}
      <section className="w-full max-w-7xl px-6 py-24 mb-20">
         <div className="bg-nearbuy-secondary rounded-[4rem] px-6 py-16 md:px-8 md:py-24 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-nearbuy-primary/20 to-transparent"></div>
            <div className="relative z-10 max-w-2xl mx-auto">
               <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter italic">Connect your business to your <span className="text-nearbuy-primary">Community.</span></h2>
               <p className="text-gray-400 mb-12 text-sm md:text-lg font-medium leading-relaxed">Join the most active hyperlocal network in Nigeria. Register as a seller and start dominating your LGA marketplace.</p>
               <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Link href="/register-seller" className="bg-nearbuy-primary text-white font-black py-5 px-12 rounded-2xl shadow-xl hover:bg-nearbuy-accent transition-all uppercase tracking-widest text-xs">Verify My Shop</Link>
                  <Link href="/auth/selection" className="bg-white/5 border border-white/10 text-white font-black py-5 px-12 rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest text-xs">Login / Signup</Link>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-7xl px-6 py-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-10 text-center md:text-left">
         <div className="flex-1">
            <Link href="/" className="text-2xl font-black tracking-tighter text-nearbuy-secondary mb-4 block">
               Connect<span className="text-nearbuy-primary italic">Buy.</span>
            </Link>
            <p className="text-gray-400 text-xs font-bold max-w-xs leading-relaxed uppercase tracking-widest">The Hyperlocal Marketplace. Dominate Local. Nigeria's #1 Community Commerce Platform.</p>
         </div>
         <div className="flex gap-12">
            <Link href="/auth/selection" className="text-xs font-black text-gray-400 hover:text-nearbuy-primary transition-all uppercase tracking-widest">Account Access</Link>
            <Link href="/register-seller" className="text-xs font-black text-gray-400 hover:text-nearbuy-primary transition-all uppercase tracking-widest">Become Seller</Link>
            <button 
               onClick={() => handleProtectedLink('/marketplace')} 
               className="text-xs font-black text-gray-400 hover:text-nearbuy-primary transition-all uppercase tracking-widest bg-transparent border-0 cursor-pointer p-0"
            >
               Marketplace
            </button>
         </div>
      </footer>
      
      <div className="w-full py-12 text-center border-t border-gray-50 mt-10">
         <p className="text-gray-300 text-[9px] uppercase font-black tracking-[0.3em]">© 2026 Connect Buy Nigeria | Secure Local Commerce Network</p>
      </div>

      {/* Floating Cart (Only if items exist) */}
      {totalItems > 0 && (
         <Link 
            href="/checkout" 
            className="fixed bottom-10 right-10 bg-nearbuy-primary text-white p-6 rounded-full shadow-2xl flex items-center gap-3 active:scale-95 transition-all z-50 hover:bg-nearbuy-accent"
         >
            <div className="relative">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
               </svg>
               <div className="absolute -top-2 -right-2 bg-nearbuy-secondary border-2 border-nearbuy-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
               </div>
            </div>
            <span className="font-bold text-lg hidden sm:inline">Pay for Items</span>
         </Link>
      )}
    </div>
  );
}
