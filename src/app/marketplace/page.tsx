"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { toast } from "react-hot-toast";

const SHOP_GROUPS = [
  { id: "farmers", name: "Farmers Market", icon: "🥬", description: "Fresh produce directly from local farms." },
  { id: "tech", name: "Tech Hub", icon: "📱", description: "Mobile accessories and electronic gadgets." },
  { id: "fashion", name: "Fashion District", icon: "👗", description: "Local textiles and modern fashion." },
  { id: "food", name: "Food Court", icon: "🍲", description: "Prepared meals and specialized kitchens." },
  { id: "needs", name: "General Essentials", icon: "🧼", description: "Household items and daily necessities." },
  { id: "declutter", name: "Declutter Store", icon: "♻️", description: "Used electronics, furniture, and pre-loved items locally." },
];

const STATIC_SELLERS: Record<string, any[]> = {
  farmers: [],
  tech: [],
  fashion: [],
  food: [],
  needs: [],
  declutter: []
};

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const stateParam = searchParams.get("state");
  const lgaParam = searchParams.get("lga");

  const [selectedGroup, setSelectedGroup] = useState(SHOP_GROUPS[0]);
  const [sellers, setSellers] = useState(STATIC_SELLERS);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { addToCart, totalItems } = useCart();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeUser, setActiveUser] = useState<any>(null);

  const router = useRouter();

  useEffect(() => {
    // 0. Enforce Auth
    const activeUserRaw = localStorage.getItem('nearbuy_active_user');
    if (!activeUserRaw) {
      toast.error("Please login to access the marketplace.");
      router.push('/auth/selection');
      return;
    }
    
    setActiveUser(JSON.parse(activeUserRaw));
    setIsAuthorized(true);

    // Load sellers from localStorage
    const savedSellers = JSON.parse(localStorage.getItem('nearbuy_sellers') || '[]');
    const merged = { ...STATIC_SELLERS };
    
    savedSellers.forEach((s: any) => {
      if (merged[s.category]) {
        // Only add if not already in the static list (avoid duplicate IDs)
        const exists = merged[s.category].some((existing: any) => existing.id === s.id);
        if (!exists) {
          merged[s.category] = [...merged[s.category], s];
        }
      } else {
        merged[s.category] = [s];
      }
    });
    
    setSellers(merged);
  }, [router]);

  // 1. Get all sellers in the current group
  const groupSellers = sellers[selectedGroup.id] || [];
  
  // 2. Filter by location and verification status
  const locationSellers = lgaParam 
    ? groupSellers.filter(s => (s.isGlobal || s.locations.some((loc: any) => 
        loc.lga.toLowerCase() === lgaParam.toLowerCase() && 
        loc.state.toLowerCase() === stateParam?.toLowerCase()
      )))
    : groupSellers;

  // 3. Search Filter (Across all sellers in location/group)
  const allProducts = locationSellers.flatMap(s => (s.products || []).map((p: any) => ({ ...p, seller: s })));
  const searchResults = searchQuery 
    ? allProducts.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  useEffect(() => {
    if (!searchQuery) {
      if (locationSellers.length > 0) {
        setSelectedSeller(locationSellers[0]);
      } else {
        setSelectedSeller(null);
      }
    }
  }, [selectedGroup, stateParam, lgaParam, sellers, searchQuery, locationSellers]);

  const startChatWithSeller = (seller: any) => {
    if (!seller || !activeUser) return;
    
    const chats = JSON.parse(localStorage.getItem('nearbuy_chats') || '[]');
    
    // Check if chat already exists
    let existingChat = chats.find((c: any) => 
      (c.buyerId === activeUser.id && c.sellerId === seller.id)
    );

    if (!existingChat) {
      existingChat = {
        id: "chat_" + Date.now(),
        buyerId: activeUser.id,
        buyerName: activeUser.name,
        sellerId: seller.id,
        sellerName: seller.name,
        lastMessage: `Hello! I'm interested in buying from your store.`,
        timestamp: new Date().toISOString(),
        unreadForSeller: true,
        unreadForBuyer: false
      };
      localStorage.setItem('nearbuy_chats', JSON.stringify([existingChat, ...chats]));
      
      // Add initial greeting message
      const messages = JSON.parse(localStorage.getItem('nearbuy_messages') || '[]');
      const newMsg = {
        id: "msg_" + Date.now(),
        chatId: existingChat.id,
        senderId: activeUser.id,
        text: existingChat.lastMessage,
        timestamp: existingChat.timestamp
      };
      localStorage.setItem('nearbuy_messages', JSON.stringify([newMsg, ...messages]));
    }

    router.push(`/messages?chatId=${existingChat.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* Marketplace Search & Category Toolbar */}
      <div className="w-full bg-nearbuy-secondary text-white py-4 px-6 lg:px-12 flex flex-col md:flex-row items-center gap-6 sticky top-20 z-40 shadow-xl border-t border-white/5">
        {/* Search Bar */}
        <div className="relative flex-1 w-full max-w-2xl">
           <input 
            type="text" 
            placeholder={`Search products in ${lgaParam || 'all locations'}...`}
            className="w-full bg-white/10 border-0 ring-1 ring-white/10 rounded-2xl px-6 py-3 pl-12 text-sm font-bold focus:ring-2 focus:ring-nearbuy-primary focus:bg-white/20 transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
           />
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
           </svg>
        </div>

        {/* Category Quick Filter */}
        <div className="flex overflow-x-auto no-scrollbar gap-3 w-full md:w-auto pb-2 md:pb-0">
          {SHOP_GROUPS.map((group) => (
            <button 
              key={group.id}
              onClick={() => { setSelectedGroup(group); setSearchQuery(""); }}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                selectedGroup.id === group.id ? 'bg-nearbuy-primary text-white shadow-lg shadow-nearbuy-primary/20' : 'bg-white/5 hover:bg-white/10 text-gray-400'
              }`}
            >
              <span className="text-sm">{group.icon}</span> {group.name}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-8 p-6 lg:p-12">
        {/* Left Sidebar: Seller Selection */}
        <aside className="lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm sticky top-32">
            <h2 className="text-xl font-black text-nearbuy-secondary mb-6 flex items-center gap-2">
              <span className="bg-nearbuy-primary/10 p-2 rounded-lg">{selectedGroup.icon}</span> 
              {selectedGroup.name}
            </h2>
            <div className="space-y-4">
              {locationSellers.length > 0 ? locationSellers.map((seller) => (
                <button 
                  key={seller.id}
                  onClick={() => setSelectedSeller(seller)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border ${
                    selectedSeller?.id === seller.id 
                    ? 'bg-nearbuy-primary/5 border-nearbuy-primary border-2 shadow-inner' 
                    : 'bg-gray-50 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-extrabold text-sm ${selectedSeller?.id === seller.id ? 'text-nearbuy-primary' : 'text-gray-700'}`}>
                      {seller.name}
                    </span>
                    <span className="text-[10px] font-bold text-yellow-500">★{seller.rating}</span>
                  </div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{seller.relationship} Relations</p>
                </button>
              )) : (
                <div className="text-center py-10 text-gray-400 text-sm italic">
                  No sellers found in this area for {selectedGroup.name}.
                </div>
              )}
            </div>
            {lgaParam && (
              <div className="mt-12 bg-gray-50 p-6 rounded-3xl border border-dashed border-gray-200">
                 <p className="text-xs font-bold text-gray-400 uppercase mb-2">Selected Area</p>
                 <p className="text-sm font-bold text-nearbuy-secondary">{lgaParam}, {stateParam}</p>
                 <Link href="/" className="text-nearbuy-primary text-[10px] font-bold uppercase mt-2 block hover:underline">Change Location</Link>
              </div>
            )}
          </div>
        </aside>

        {/* Right Content */}
        <main className="flex-1">
           {searchQuery ? (
             <>
               <h2 className="text-3xl font-black text-nearbuy-secondary mb-8">Search results for "{searchQuery}"</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {searchResults.map((product: any) => (
                    <div key={product.id} className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                       <div className="aspect-square relative overflow-hidden">
                          <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute top-4 left-4 bg-nearbuy-primary text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">
                             {product.seller.name}
                          </div>
                       </div>
                       <div className="p-6">
                          <h4 className="font-extrabold text-nearbuy-secondary mb-2">{product.title}</h4>
                          <div className="flex justify-between items-center">
                             <span className="text-xl font-black">₦{product.price.toLocaleString()}</span>
                             <button 
                               onClick={() => addToCart({ ...product, sellerId: product.seller.id })}
                               className="bg-nearbuy-primary text-white font-black px-4 py-2 rounded-xl text-[10px] active:scale-95 transition-all">
                                 Add to Cart
                              </button>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
               {searchResults.length === 0 && (
                 <div className="py-20 text-center font-bold text-gray-400">No products match your search.</div>
               )}
             </>
           ) : selectedSeller ? (
             <>
               <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm mb-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-nearbuy-primary/5 rounded-bl-[100px]"></div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-6">
                      <img src={selectedSeller.image || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=400"} className="w-20 h-20 rounded-3xl object-cover shadow-md" alt={selectedSeller.name} />
                       <div>
                         <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-extrabold text-nearbuy-secondary tracking-tight">{selectedSeller.name}</h1>
                            {selectedSeller.verified && (
                               <span className="bg-nearbuy-primary/10 text-nearbuy-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                  <span className="text-sm">✓</span> Verified
                               </span>
                            )}
                         </div>
                         <p className="text-sm text-gray-500 font-medium italic max-w-lg mb-3">"{selectedSeller.description || "Verified NearBuy Local Partner."}"</p>
                         <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1"><span className="text-nearbuy-primary text-lg">●</span> {selectedSeller.delivery} Delivery</span>
                            <span className="flex items-center gap-1"><span className="text-nearbuy-primary text-lg">●</span> {selectedSeller.phone || "Verified Contact"}</span>
                         </div>
                      </div>
                    </div>
                    <button 
                       onClick={() => startChatWithSeller(selectedSeller)}
                       className="bg-nearbuy-secondary hover:bg-nearbuy-primary transition-all active:scale-95 text-white px-8 py-5 rounded-3xl shadow-xl flex-shrink-0 border-0 cursor-pointer flex flex-col justify-center gap-1"
                    >
                       <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] leading-none mb-1">Direct Chat</p>
                       <p className="font-extrabold text-sm uppercase tracking-widest leading-none">Negotiate Hub ✉</p>
                    </button>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {(selectedSeller.products || []).map((product: any) => (
                    <div key={product.id} className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                      <div className="aspect-[4/3] relative overflow-hidden bg-gray-100 italic">
                        <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-nearbuy-secondary shadow-sm">
                          INSTOCK
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-extrabold text-nearbuy-secondary text-lg mb-4 line-clamp-1">{product.title}</h3>
                        <div className="flex justify-between items-center">
                           <span className="text-2xl font-black text-gray-900 font-mono">₦{product.price.toLocaleString()}</span>
                           <button 
                             onClick={() => {
                               addToCart({ ...product, sellerId: selectedSeller.id });
                               toast.success(`${product.title} added to cart!`, {
                                 icon: '🛒',
                                 style: { borderRadius: '1rem', background: '#333', color: '#fff' }
                               });
                             }}
                             className="bg-nearbuy-primary hover:bg-nearbuy-accent text-white font-black px-5 py-2.5 rounded-[1rem] shadow-sm active:scale-95 transition-transform text-[10px] uppercase tracking-[0.15em] whitespace-nowrap"
                           >
                             Add to Cart
                           </button>
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
             </>
           ) : (
             <div className="h-full flex flex-col items-center justify-center bg-white rounded-[3rem] p-20 text-center border border-dashed border-gray-200">
                <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-8 text-6xl opacity-50">
                  {selectedGroup.icon}
                </div>
                <h2 className="text-3xl font-black text-nearbuy-secondary mb-4">No sellers here... yet!</h2>
                <p className="max-w-md text-gray-400 text-lg mb-10">
                  Be the first to open a store in <strong>{lgaParam || "this area"}</strong> under the <strong>{selectedGroup.name}</strong> category.
                </p>
                <Link href="/register-seller" className="bg-nearbuy-primary text-white font-bold py-5 px-12 rounded-3xl shadow-xl hover:shadow-green-900/10 active:scale-95 transition-all">
                  Register My Business
                </Link>
             </div>
           )}
        </main>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-nearbuy-primary">Opening Portals to Local Markets...</div>}>
      <MarketplaceContent />
    </Suspense>
  );
}
