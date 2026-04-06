"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

const SAMPLE_PRODUCTS = [
  { id: 1, title: "Fresh Organic Tomatoes", price: 5500, lga: "Ikeja", state: "Lagos", description: "Farm-fresh organic tomatoes harvested daily. Perfect for your stews and salads.", seller: "Ayo's Farm", sellerId: "s1", image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=1200", rating: 4.8 },
  { id: 2, title: "Professional Studio Headphones", price: 125000, lga: "Lagos Island", state: "Lagos", description: "Studio-grade headphones for professional audio production and immersive listening.", seller: "Gadget Hub", sellerId: "s2", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200", rating: 4.5 },
  { id: 3, title: "Handwoven Cotton Aso-Oke", price: 45000, lga: "Alimosho", state: "Lagos", description: "Authentic handwoven Aso-Oke fabric for traditional ceremonies and high fashion.", seller: "Heritage Textiles", sellerId: "s3", image: "https://images.unsplash.com/photo-1583394838336-acd977730f8a?q=80&w=1200", rating: 5.0 },
  { id: 4, title: "Pure Honey (Ogun Special)", price: 8000, lga: "Ijebu Ode", state: "Ogun", description: "100% pure, unprocessed honey from the forests of Ijebu. Rich in nutrients.", seller: "Nature's Gold", sellerId: "s4", image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=1200", rating: 4.7 },
  { id: 5, title: "Farm Fresh Eggs", price: 4200, lga: "Abeokuta South", state: "Ogun", description: "Large, brown farm-fresh eggs. Rich yoke and full of protein.", seller: "Poultry Plus", sellerId: "s5", image: "https://images.unsplash.com/photo-1582722134958-d0559c997763?q=80&w=1200", rating: 4.9 },
  { id: 6, title: "Spicy Kilishi (Ibadan Style)", price: 6500, lga: "Ibadan North", state: "Oyo", description: "Authentic Ibadan-style Kilishi. Thinly sliced, spiced, and sun-dried beef jerky.", seller: "Northern Bites", sellerId: "s6", image: "https://images.unsplash.com/photo-1599481238640-dfc41b0501d9?q=80&w=1200", rating: 4.6 },
];

export default function ProductDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeUser, setActiveUser] = useState<any>(null);
  
  const product = SAMPLE_PRODUCTS.find((p) => p.id === Number(id));

  useEffect(() => {
    // Enforce Auth
    const userRaw = localStorage.getItem('nearbuy_active_user');
    if (!userRaw) {
      router.push('/auth/selection');
      return;
    }
    const user = JSON.parse(userRaw);
    setActiveUser(user);
    setIsAuthorized(true);
  }, [router]);

  const startChat = () => {
    if (!product || !activeUser) return;
    
    const chats = JSON.parse(localStorage.getItem('nearbuy_chats') || '[]');
    
    // Check if chat already exists
    let existingChat = chats.find((c: any) => 
      (c.buyerId === activeUser.id && c.sellerId === product.sellerId)
    );

    if (!existingChat) {
      existingChat = {
        id: "chat_" + Date.now(),
        buyerId: activeUser.id,
        buyerName: activeUser.name,
        sellerId: product.sellerId,
        sellerName: product.seller,
        lastMessage: `Hello! I'm interested in ${product.title}`,
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

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Product not found</h1>
        <Link href="/" className="text-green-500 hover:underline">Back to Home</Link>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center font-black text-gray-400 animate-pulse tracking-widest text-sm uppercase">Verifying Session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 py-4 px-6 mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-nearbuy-primary transition-colors font-medium border-0 bg-transparent cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-7-7a1 1 0 010-1.414l7-7a1 1 0 011.414 1.414L4.414 9H17a1 1 0 110 2H4.414l5.293 5.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to browsing
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Product Image */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
          <img src={product.image} alt={product.title} className="w-full h-auto" />
        </div>

        {/* Product Info */}
        <div className="space-y-8">
          <div>
            <div className="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full text-xs font-bold uppercase mb-4">
              {product.lga}, {product.state}
            </div>
            <h1 className="text-4xl font-extrabold text-nearbuy-secondary mb-2 tracking-tight">{product.title}</h1>
            <p className="text-3xl font-mono font-black text-nearbuy-secondary">₦{product.price.toLocaleString()}</p>
          </div>

          <p className="text-gray-500 leading-relaxed text-lg font-medium">{product.description}</p>

          <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-nearbuy-primary/10 text-nearbuy-primary rounded-2xl flex items-center justify-center text-2xl font-black uppercase">
                {product.seller[0]}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Local Verified Seller</p>
                <p className="text-xl font-black text-nearbuy-secondary tracking-tight">{product.seller}</p>
              </div>
            </div>
            <button 
              onClick={startChat}
              className="bg-nearbuy-secondary hover:bg-nearbuy-primary text-white font-black py-4 px-8 rounded-2xl transition-all shadow-xl shadow-green-900/10 active:scale-95 text-[10px] uppercase tracking-widest border-0 cursor-pointer"
            >
              Negotiate Hub 💬
            </button>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => addToCart(product)}
              className="flex-1 bg-nearbuy-primary hover:bg-nearbuy-accent text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-green-900/20 active:scale-95 text-xs uppercase tracking-widest border-0 cursor-pointer"
            >
              Add to Basket 🛒
            </button>
            <button className="bg-white border-2 border-nearbuy-primary text-nearbuy-primary hover:bg-green-50 font-black py-5 px-8 rounded-2xl transition-all active:scale-95 border-0 cursor-pointer flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
