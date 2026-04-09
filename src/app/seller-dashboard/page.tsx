"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { compressImage } from "@/utils/image";
import { toast } from "react-hot-toast";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, AreaChart, Area 
} from 'recharts';

export default function SellerDashboard() {
  const router = useRouter();
  const [activeSeller, setActiveSeller] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [newProduct, setNewProduct] = useState({ title: "", price: "", image: "", description: "" });
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'performance' | 'messages'>('inventory');
  const [orders, setOrders] = useState<any[]>([]);
  const [verificationInput, setVerificationInput] = useState<{ [key: string]: string }>({});
  
  // Messaging State
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let sellerId = localStorage.getItem('active_seller_id');
    const activeUserRaw = localStorage.getItem('nearbuy_active_user');
    const activeUser = activeUserRaw ? JSON.parse(activeUserRaw) : null;

    if (!activeUser) {
      router.push('/auth/login');
      return;
    }

    const sellers = JSON.parse(localStorage.getItem('nearbuy_sellers') || '[]');
    if (!sellerId && activeUser.role === 'seller') {
      const recoveredSeller = sellers.find((s: any) => s.email === activeUser.email);
      if (recoveredSeller) {
        sellerId = recoveredSeller.id;
        localStorage.setItem('active_seller_id', sellerId as string);
      }
    }

    if (!sellerId || (activeUser.role !== 'seller' && activeUser.role !== 'admin')) {
      router.push('/auth/login');
      return;
    }

    const seller = sellers.find((s: any) => s.id === sellerId);
    
    if (seller) {
      setActiveSeller(seller);
      setIsAuthorized(true);
      
      // Load orders
      const allOrders = JSON.parse(localStorage.getItem('connectbuy_orders') || '[]');
      const sellerOrders = allOrders.filter((o: any) => 
        o.items.some((item: any) => item.sellerId === sellerId)
      );
      setOrders(sellerOrders.reverse());

      // Load Chats
      const allChats = JSON.parse(localStorage.getItem('nearbuy_chats') || '[]');
      const sellerChats = allChats.filter((c: any) => c.sellerId === sellerId);
      setChats(sellerChats);
    } else {
      router.push('/auth/login');
    }
  }, [router, activeTab]);

  useEffect(() => {
    if (activeChatId) {
      const allMessages = JSON.parse(localStorage.getItem('nearbuy_messages') || '[]');
      const chatMessages = allMessages.filter((m: any) => m.chatId === activeChatId);
      setActiveMessages(chatMessages.reverse());
      
      // Mark as read
      const allChats = JSON.parse(localStorage.getItem('nearbuy_chats') || '[]');
      const updatedChats = allChats.map((c: any) => 
        c.id === activeChatId ? { ...c, unreadForSeller: false } : c
      );
      localStorage.setItem('nearbuy_chats', JSON.stringify(updatedChats));
    }
  }, [activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  const loadMessages = (chatId: string) => {
    setActiveChatId(chatId);
  };

  // Analytics Helpers
  const performanceData = useMemo(() => {
    // If no real orders, provide beautiful sample data for demonstration
    if (!orders.length || !activeSeller) {
      const sampleTimeline = [
        { day: 'Mon', amount: 12000 },
        { day: 'Tue', amount: 19000 },
        { day: 'Wed', amount: 15000 },
        { day: 'Thu', amount: 22000 },
        { day: 'Fri', amount: 31000 },
        { day: 'Sat', amount: 28000 },
        { day: 'Sun', amount: 35000 },
      ];
      const sampleTopProducts = [
        { name: 'Fresh Tomatoes', units: 45 },
        { name: 'Organic Honey', units: 32 },
        { name: 'Smoked Fish', units: 28 },
        { name: 'Farm Eggs', units: 22 },
        { name: 'Red Onions', units: 18 },
      ];
      return { timeline: sampleTimeline, topProducts: sampleTopProducts, metrics: { totalRev: 162000, aov: 23140, customers: 12 } };
    }

    const sellerId = activeSeller.id;
    const verifiedOrders = orders.filter(o => o.status === 'verified');
    let totalRev = 0;
    const customerIds = new Set();
    verifiedOrders.forEach(o => {
      o.items.forEach((item: any) => { if (item.sellerId === sellerId) totalRev += (item.price * item.quantity); });
      customerIds.add(o.buyerId);
    });
    const aov = verifiedOrders.length ? totalRev / verifiedOrders.length : 0;
    const timelineMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(); date.setDate(date.getDate() - i);
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      timelineMap[label] = 0;
    }
    verifiedOrders.forEach(o => {
      const dateLabel = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (timelineMap[dateLabel] !== undefined) {
        o.items.forEach((item: any) => { if (item.sellerId === sellerId) timelineMap[dateLabel] += (item.price * item.quantity); });
      }
    });
    const timeline = Object.entries(timelineMap).map(([day, amount]) => ({ day, amount }));
    const productMap: Record<string, number> = {};
    orders.forEach(o => { o.items.forEach((item: any) => { if (item.sellerId === sellerId) productMap[item.title] = (productMap[item.title] || 0) + item.quantity; }); });
    const topProducts = Object.entries(productMap).map(([name, units]) => ({ name, units })).sort((a, b) => b.units - a.units).slice(0, 5);
    return { timeline, topProducts, metrics: { totalRev, aov, customers: customerIds.size } };
  }, [orders, activeSeller]);

  const seedStoreData = () => {
    if (!activeSeller) return;
    const sampleProducts = [
      { id: "sp1", title: "Fresh Organic Tomatoes", price: 5500, image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=400" },
      { id: "sp2", title: "Pure Forest Honey", price: 8000, image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=400" },
      { id: "sp3", title: "Abeokuta Smoked Fish", price: 12000, image: "https://images.unsplash.com/photo-1599481238640-dfc41b0501d9?q=80&w=400" }
    ];
    saveToStorage({ ...activeSeller, products: [...(activeSeller.products || []), ...sampleProducts] });
    toast.success("Store seeded with samples!");
  };

  const verifyDelivery = (orderId: string) => {
    const code = verificationInput[orderId];
    const allOrders = JSON.parse(localStorage.getItem('connectbuy_orders') || '[]');
    const order = allOrders.find((o: any) => o.id === orderId);
    if (order && order.verificationCode === code) {
      const updatedOrders = allOrders.map((o: any) => o.id === orderId ? { ...o, status: 'delivered' } : o);
      localStorage.setItem('connectbuy_orders', JSON.stringify(updatedOrders));
      setOrders(updatedOrders.filter((o: any) => o.items.some((item: any) => item.sellerId === activeSeller.id)).reverse());
      toast.success("Handshake Successful!");
    } else {
      toast.error("Invalid Code.");
    }
  };

  const sendSellerMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId || !activeSeller) return;
    const msgObj = { id: "msg_" + Date.now(), chatId: activeChatId, senderId: activeSeller.id, text: newMessage, timestamp: new Date().toISOString() };
    const allMessages = JSON.parse(localStorage.getItem('nearbuy_messages') || '[]');
    localStorage.setItem('nearbuy_messages', JSON.stringify([msgObj, ...allMessages]));
    const allChats = JSON.parse(localStorage.getItem('nearbuy_chats') || '[]');
    const updatedChats = allChats.map((c: any) => c.id === activeChatId ? { ...c, lastMessage: newMessage, timestamp: msgObj.timestamp, unreadForBuyer: true } : c);
    localStorage.setItem('nearbuy_chats', JSON.stringify(updatedChats));
    setChats(updatedChats.filter((c: any) => c.sellerId === activeSeller.id));
    setActiveMessages([...activeMessages, msgObj]);
    setNewMessage("");
  };

  const getEscrowBalance = () => {
    const rate = activeSeller?.tier === 'pro' ? 0.015 : 0.03;
    return orders.filter(o => o.status === 'pending' || o.status === 'delivered').reduce((sum, o) => {
      const myItemsTotal = o.items.filter((item: any) => item.sellerId === activeSeller?.id).reduce((s: number, item: any) => s + (item.price * item.quantity), 0);
      return sum + (myItemsTotal * (1 - rate));
    }, 0);
  };

  const getAvailableBalance = () => {
    const rate = activeSeller?.tier === 'pro' ? 0.015 : 0.03;
    return orders.filter(o => o.status === 'verified').reduce((sum, o) => {
      const myItemsTotal = o.items.filter((item: any) => item.sellerId === activeSeller?.id).reduce((s: number, item: any) => s + (item.price * item.quantity), 0);
      return sum + (myItemsTotal * (1 - rate));
    }, 0);
  };

  const saveToStorage = (updatedSeller: any) => {
    const sellers = JSON.parse(localStorage.getItem('nearbuy_sellers') || '[]');
    const newSellers = sellers.map((s: any) => s.id === updatedSeller.id ? updatedSeller : s);
    localStorage.setItem('nearbuy_sellers', JSON.stringify(newSellers));
    setActiveSeller(updatedSeller);
    window.dispatchEvent(new Event('nearbuy_sync'));
    window.dispatchEvent(new StorageEvent('storage', { key: 'nearbuy_sellers' }));
  };

  const addProduct = () => {
    if (!newProduct.title || !newProduct.price) return toast.error("Fill title and price.");
    const product = { 
      id: "p_" + Date.now(), 
      title: newProduct.title, 
      description: newProduct.description || "",
      price: Number(newProduct.price), 
      image: newProduct.image || "https://images.unsplash.com/photo-1599481238640-dfc41b0501d9?q=80&w=400" 
    };
    saveToStorage({ ...activeSeller, products: [...(activeSeller.products || []), product] });
    setShowAddModal(false); setNewProduct({ title: "", price: "", image: "", description: "" });
    toast.success("Product added!");
  };

  const unreadCount = chats.filter(c => c.unreadForSeller).length;

  if (!isAuthorized || !activeSeller) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-black text-gray-400">Loading Seller Hub...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <nav className="bg-nearbuy-secondary text-white py-8 px-10 flex justify-between items-center shadow-xl sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">⚡</div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">{activeSeller.name} <span className="text-nearbuy-primary">Power</span></h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">Hyperlocal Inventory Hub</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Link href="/marketplace" className="text-xs font-bold uppercase border-2 border-white/20 px-6 py-3 rounded-xl hover:bg-white/10 transition-all">View Market</Link>
          <button onClick={() => { localStorage.removeItem('active_seller_id'); router.push('/'); }} className="text-xs font-bold uppercase bg-red-500/10 text-red-400 px-6 py-3 rounded-xl hover:bg-red-500 hover:text-white transition-all border-0 cursor-pointer">Logout</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <aside className="lg:col-span-1 space-y-8">
            <div className="bg-nearbuy-primary text-white p-8 rounded-[3rem] shadow-2xl shadow-green-900/40 relative overflow-hidden flex flex-col justify-between border border-nearbuy-accent">
               <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/20 rounded-bl-full mix-blend-overlay"></div>
               <div className="relative z-10 mb-8">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">Total Balance</p>
                 <p className="text-4xl font-black font-mono tracking-tight drop-shadow-md">₦{getAvailableBalance().toLocaleString()}</p>
                 <p className="text-[10px] font-black text-white uppercase bg-black/20 inline-block px-3 py-1 rounded-full backdrop-blur-sm backdrop-filter mt-3">Ready for Payout</p>
               </div>
               
               <div className="relative z-10 pt-6 border-t border-white/20">
                  <div className="flex justify-between items-center hidden">
                     <div>
                       <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1">Held in Escrow 🛡️</p>
                       <p className="text-xl font-black font-mono text-white/90">₦{getEscrowBalance().toLocaleString()}</p>
                     </div>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                     <div className="flex flex-col">
                        <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Escrow 🛡️</p>
                        <p className="text-xl font-black font-mono text-white/90">₦{getEscrowBalance().toLocaleString()}</p>
                     </div>
                     <button className="bg-white text-nearbuy-primary font-black py-3 px-6 rounded-2xl active:scale-95 transition-transform text-[10px] uppercase tracking-widest border-0 cursor-pointer shadow-lg hover:shadow-xl shrink-0">
                        Withdraw
                     </button>
                  </div>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
               <h3 className="text-sm font-black text-nearbuy-secondary uppercase tracking-[0.1em] mb-6">Quick Insights</h3>
               <div className="space-y-6">
                  <div>
                    <p className="text-2xl font-black text-nearbuy-secondary">{performanceData.metrics.customers}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total Customers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-nearbuy-secondary">₦{performanceData.metrics.aov.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Avg Order Value</p>
                  </div>
               </div>
            </div>
         </aside>

          <main className="lg:col-span-2">
            <div className="flex gap-6 mb-10 border-b border-gray-100 pb-2 overflow-x-auto whitespace-nowrap custom-scrollbar">
               <button onClick={() => setActiveTab('inventory')} className={`text-sm font-black uppercase tracking-widest pb-4 px-2 transition-all border-b-4 border-l-0 border-r-0 border-t-0 cursor-pointer bg-transparent shrink-0 ${activeTab === 'inventory' ? 'border-nearbuy-primary text-nearbuy-secondary' : 'border-transparent text-gray-300'}`}>Inventory</button>
               <button onClick={() => setActiveTab('orders')} className={`text-sm font-black uppercase tracking-widest pb-4 px-2 transition-all border-b-4 border-l-0 border-r-0 border-t-0 cursor-pointer bg-transparent shrink-0 ${activeTab === 'orders' ? 'border-nearbuy-primary text-nearbuy-secondary' : 'border-transparent text-gray-300'}`}>Incoming Orders ({orders.filter(o => o.status !== 'verified').length})</button>
               <button onClick={() => setActiveTab('performance')} className={`text-sm font-black uppercase tracking-widest pb-4 px-2 transition-all border-b-4 border-l-0 border-r-0 border-t-0 cursor-pointer bg-transparent shrink-0 ${activeTab === 'performance' ? 'border-nearbuy-primary text-nearbuy-secondary' : 'border-transparent text-gray-300'}`}>Performance Analysis 📊</button>
               <button onClick={() => setActiveTab('messages')} className={`text-sm font-black uppercase tracking-widest pb-4 px-2 transition-all border-b-4 border-l-0 border-r-0 border-t-0 cursor-pointer bg-transparent relative shrink-0 ${activeTab === 'messages' ? 'border-nearbuy-primary text-nearbuy-secondary' : 'border-transparent text-gray-300'}`}>
                 Negotiate Hub ✉
                 {unreadCount > 0 && <span className="absolute -top-1 -right-2 bg-nearbuy-primary text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-bounce">{unreadCount}</span>}
               </button>
            </div>

            {activeTab === 'inventory' && (
              <>
                 <div className="flex justify-between items-center mb-10">
                    <h3 className="text-3xl font-black text-nearbuy-secondary">My <span className="text-nearbuy-primary">Inventory</span></h3>
                    <button onClick={() => setShowAddModal(true)} className="bg-nearbuy-primary text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-green-900/20 active:scale-95 transition-all flex items-center gap-3 border-0 cursor-pointer">+ Add New Product</button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeSeller.products.map((product: any) => (
                      <div key={product.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex gap-6 items-center group relative overflow-hidden">
                         <div className="w-24 h-24 rounded-3xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100"><img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={product.title} /></div>
                         <div className="flex-1">
                            <h4 className="font-extrabold text-nearbuy-secondary mb-1 leading-tight">{product.title}</h4>
                            <div className="flex items-center justify-between mb-4">
                               <p className="text-xl font-black text-nearbuy-primary font-mono whitespace-nowrap">₦{product.price.toLocaleString()}</p>
                               <button 
                                 onClick={() => {
                                   const updatedProducts = activeSeller.products.map((p: any) => p.id === product.id ? { ...p, outOfStock: !p.outOfStock } : p);
                                   saveToStorage({ ...activeSeller, products: updatedProducts });
                                   toast.success(product.outOfStock ? "Item back in stock!" : "Marked as Out of Stock.");
                                 }}
                                 className={`text-[9px] font-black uppercase px-3 py-1 rounded-full transition-all border cursor-pointer ${product.outOfStock ? 'bg-red-50 text-red-500 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}
                               >
                                 {product.outOfStock ? "Out of Stock" : "In Stock"}
                               </button>
                            </div>
                            <div className="flex gap-3">
                               <button onClick={() => setEditingProduct(product)} className="text-[10px] font-black text-nearbuy-secondary uppercase bg-gray-100 px-4 py-2 rounded-lg hover:bg-nearbuy-primary hover:text-white transition-all border-0 cursor-pointer">Edit</button>
                               <button onClick={() => { if(confirm("Remove?")) { const updated = { ...activeSeller, products: activeSeller.products.filter((p: any) => p.id !== product.id) }; saveToStorage(updated); toast.success("Removed."); } }} className="text-[10px] font-black text-red-400 px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-all border-0 cursor-pointer">Remove</button>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-6">
                 {orders.length === 0 ? <div className="py-20 text-center text-gray-400 font-bold italic">No orders received yet.</div> : orders.map((order: any) => (
                   <div key={order.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-start mb-6">
                         <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer: {order.buyerName || 'Verified Guest'}</p><h4 className="font-extrabold text-nearbuy-secondary">Order {order.id}</h4></div>
                         <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${order.status === 'verified' ? 'bg-green-100 text-green-600' : order.status === 'delivered' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'}`}>{order.status}</span>
                      </div>
                      <div className="space-y-4 mb-8">
                         {order.items.filter((i: any) => i.sellerId === activeSeller.id).map((item: any, idx: number) => (
                           <div key={idx} className="flex justify-between text-sm font-medium"><span className="text-gray-600">{item.title} x {item.quantity}</span><span className="font-mono font-bold">₦{(item.price * item.quantity).toLocaleString()}</span></div>
                         ))}
                      </div>
                      {order.status === 'pending' && (
                        <div className="pt-6 border-t border-gray-100">
                           <p className="text-[10px] font-black text-nearbuy-primary uppercase tracking-widest mb-3 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-nearbuy-primary rounded-full animate-ping"></span> Buyer Verification Required</p>
                           <div className="flex flex-col sm:flex-row items-center gap-4">
                              <input maxLength={4} placeholder="Enter 4-digit token" className="w-full sm:w-2/3 px-5 py-4 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl font-mono font-black text-lg focus:ring-2 focus:ring-nearbuy-primary transition-all text-center tracking-widest text-nearbuy-secondary placeholder:text-gray-300" value={verificationInput[order.id] || ''} onChange={(e) => setVerificationInput({...verificationInput, [order.id]: e.target.value})} />
                              <button onClick={() => verifyDelivery(order.id)} className="w-full sm:w-1/3 bg-nearbuy-primary hover:bg-nearbuy-accent text-white font-black py-4 px-6 rounded-2xl active:scale-95 transition-all text-sm uppercase tracking-widest border-0 cursor-pointer shadow-lg shadow-green-900/10">Approve</button>
                           </div>
                        </div>
                      )}
                      {order.status === 'delivered' && <div className="pt-6 border-t border-gray-50 flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-widest"><span className="animate-pulse">●</span> Waiting for Release</div>}
                   </div>
                 ))}
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-10">
                 <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden"><div className="absolute top-0 right-0 w-64 h-64 bg-nearbuy-primary/5 rounded-bl-[10rem]"></div><div className="relative z-10"><h3 className="text-2xl font-black text-nearbuy-secondary mb-2">Revenue Growth</h3><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-10">Last 7 Days</p><div className="h-[300px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={performanceData.timeline}><defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22C55E" stopOpacity={0.8}/><stop offset="95%" stopColor="#22C55E" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" /><XAxis dataKey="day" stroke="#9CA3AF" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} dy={10}/><YAxis stroke="#9CA3AF" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} tickFormatter={(value) => `₦${value.toLocaleString()}`}/><Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}/><Area type="monotone" dataKey="amount" stroke="#22C55E" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" /></AreaChart></ResponsiveContainer></div></div></div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm"><h3 className="text-xl font-black text-nearbuy-secondary mb-8 underline decoration-nearbuy-primary/30 decoration-4 underline-offset-4">Most Sold</h3><div className="h-[250px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={performanceData.topProducts} layout="vertical"><XAxis type="number" hide /><YAxis dataKey="name" type="category" stroke="#4B5563" fontSize={10} fontWeight="black" width={100} axisLine={false} tickLine={false} /><Tooltip cursor={{fill: 'transparent'}} /><Bar dataKey="units" fill="#003531" radius={[0, 10, 10, 0]} barSize={25} /></BarChart></ResponsiveContainer></div></div><div className="bg-nearbuy-secondary text-white p-10 rounded-[3rem] shadow-xl relative overflow-hidden group"><div className="absolute top-0 right-0 w-40 h-40 bg-nearbuy-primary/20 rounded-bl-5rem group-hover:scale-110 transition-transform"></div><div className="relative z-10 flex flex-col justify-between h-full"><div><h3 className="text-2xl font-black mb-1">Loyalty Hub</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer Lifecycle</p></div><div className="mt-12"><div className="flex items-center gap-4 mb-6"><span className="text-3xl">👤</span><div><p className="text-3xl font-black font-mono">{performanceData.metrics.customers}</p><p className="text-[9px] font-bold text-nearbuy-primary uppercase tracking-widest">Verified Buyers</p></div></div><p className="text-xs text-gray-400 leading-relaxed font-medium">You've connected with {performanceData.metrics.customers} local buyers in your LGA.</p></div></div></div></div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm flex h-[600px] overflow-hidden">
                <div className={`w-full md:w-1/3 border-r border-gray-50 flex-col ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
                  <div className="p-6 border-b border-gray-50 font-black text-nearbuy-secondary italic uppercase tracking-widest text-[10px]">Negotiations</div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {chats.length === 0 ? (
                      <div className="text-center py-10 text-gray-300 font-bold text-xs uppercase leading-loose">No active <br/> negotiations.</div>
                    ) : (
                      chats.map(chat => (
                        <button key={chat.id} onClick={() => loadMessages(chat.id)} className={`w-full p-4 rounded-3xl text-left mb-2 transition-all flex items-center gap-3 group relative ${activeChatId === chat.id ? 'bg-nearbuy-secondary text-white shadow-lg' : 'hover:bg-gray-50 font-bold border-0 bg-transparent cursor-pointer'}`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${activeChatId === chat.id ? 'bg-nearbuy-primary/20 text-nearbuy-primary' : 'bg-gray-100 text-nearbuy-secondary group-hover:text-nearbuy-primary'}`}>{chat.buyerName[0]}</div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-black text-xs truncate ${activeChatId === chat.id ? 'text-white' : 'text-nearbuy-secondary'}`}>{chat.buyerName}</p>
                            <p className={`text-[8px] font-bold truncate mt-0.5 ${activeChatId === chat.id ? 'text-white/60' : 'text-gray-400'}`}>{chat.lastMessage}</p>
                          </div>
                          {chat.unreadForSeller && <span className="absolute top-4 right-4 w-2 h-2 bg-nearbuy-primary rounded-full animate-ping"></span>}
                        </button>
                      ))
                    )}
                  </div>
                </div>
                <div className={`flex-1 flex-col bg-gray-50/20 ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
                  {activeChatId ? (
                    <>
                      <div className="p-6 border-b border-gray-100 bg-white flex items-center gap-3">
                         <button onClick={() => setActiveChatId(null)} className="md:hidden bg-gray-50 p-3 rounded-xl border-0 cursor-pointer hover:bg-gray-100 transition-all text-nearbuy-secondary">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                         </button>
                         <div className="w-8 h-8 bg-nearbuy-primary/10 text-nearbuy-primary rounded-lg flex items-center justify-center font-black text-xs">{chats.find(c => c.id === activeChatId)?.buyerName[0]}</div>
                         <h4 className="font-black text-nearbuy-secondary uppercase italic text-xs tracking-tight">{chats.find(c => c.id === activeChatId)?.buyerName}</h4>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {activeMessages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.senderId === activeSeller.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-4 rounded-3xl shadow-sm text-xs ${msg.senderId === activeSeller.id ? 'bg-nearbuy-secondary text-white rounded-br-none' : 'bg-white text-nearbuy-secondary border border-gray-100 rounded-bl-none'}`}>
                              <p className="font-medium leading-relaxed">{msg.text}</p>
                              <span className="text-[7px] font-black uppercase mt-1 block opacity-40">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                      <form onSubmit={sendSellerMessage} className="p-6 bg-white border-t border-gray-100 flex gap-3">
                        <input className="flex-1 px-6 py-4 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-nearbuy-primary font-bold text-xs" placeholder="Reply to buyer..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                        <button type="submit" className="bg-nearbuy-primary text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all border-0 cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg></button>
                      </form>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 grayscale"><div className="w-20 h-20 bg-gray-200 rounded-[2rem] flex items-center justify-center mb-6">💬</div><p className="font-black uppercase tracking-widest text-[10px]">Select a chat to <br/> start negotiating</p></div>
                  )}
                </div>
              </div>
            )}
         </main>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-nearbuy-secondary/90 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-nearbuy-secondary">
           <div className="bg-white w-full max-w-md rounded-[3.5rem] p-10 animate-in zoom-in duration-300">
              <h2 className="text-3xl font-black mb-8 italic">Stock New Item.</h2>
              <div className="space-y-6">
               <div>
                 <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Item Name</label>
                 <input className="w-full px-6 py-5 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-nearbuy-primary font-bold text-gray-900" placeholder="e.g. Fresh Tomatoes" value={newProduct.title} onChange={(e) => setNewProduct({...newProduct, title: e.target.value})} />
               </div>
               <div>
                 <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Description</label>
                 <textarea className="w-full px-6 py-5 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-nearbuy-primary font-bold text-gray-900 min-h-[90px] resize-none" placeholder="e.g. Freshly harvested, farm-direct quality..." value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} />
               </div>
               <div>
                 <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Price (₦)</label>
                 <input type="number" className="w-full px-6 py-5 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-nearbuy-primary font-bold text-gray-900" placeholder="0.00" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} />
               </div>
               <div><label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Photo</label><div className="relative w-full h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden">{newProduct.image ? <img src={newProduct.image} className="w-full h-full object-cover" /> : <span className="text-gray-300 font-bold uppercase text-[10px] tracking-widest">Select Image</span>}<input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => { const file = e.target.files?.[0]; if(file) { const reader = new FileReader(); reader.onloadend = async () => { const compressed = await compressImage(reader.result as string); setNewProduct({ ...newProduct, image: compressed }); }; reader.readAsDataURL(file); } }} /></div></div>
              </div>
              <div className="flex gap-4 mt-12"><button onClick={() => setShowAddModal(false)} className="flex-1 font-black text-gray-400 uppercase py-6 border-0 bg-transparent cursor-pointer">Cancel</button><button onClick={addProduct} className="flex-1 bg-nearbuy-primary text-white font-black py-6 rounded-3xl shadow-xl shadow-green-900/10 active:scale-95 transition-all">Add to Store</button></div>
           </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-nearbuy-secondary/90 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-nearbuy-secondary">
           <div className="bg-white w-full max-w-md rounded-[3.5rem] p-10 animate-in zoom-in duration-300">
              <h2 className="text-3xl font-black mb-8 italic">Edit Item.</h2>
              <div className="space-y-6">
                 <div><label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Item Name</label><input className="w-full px-6 py-5 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-nearbuy-primary font-bold text-gray-900" value={editingProduct.title} onChange={(e) => setEditingProduct({...editingProduct, title: e.target.value})} /></div>
                 <div><label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Description</label><textarea className="w-full px-6 py-5 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-nearbuy-primary font-bold text-gray-900 min-h-[90px] resize-none" placeholder="Describe your product..." value={editingProduct.description || ''} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} /></div>
                 <div><label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Price (₦)</label><input type="number" className="w-full px-6 py-5 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-nearbuy-primary font-bold text-gray-900" value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})} /></div>
                 <div><label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Photo</label><div className="relative w-full h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden"><img src={editingProduct.image} className="w-full h-full object-cover" /><input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => { const file = e.target.files?.[0]; if(file) { const reader = new FileReader(); reader.onloadend = async () => { const compressed = await compressImage(reader.result as string); setEditingProduct({ ...editingProduct, image: compressed }); }; reader.readAsDataURL(file); } }} /></div></div>
              </div>
              <div className="flex gap-4 mt-12"><button onClick={() => setEditingProduct(null)} className="flex-1 font-black text-gray-400 uppercase py-6 border-0 bg-transparent cursor-pointer">Cancel</button><button onClick={() => { const updatedProducts = activeSeller.products.map((p: any) => p.id === editingProduct.id ? editingProduct : p); saveToStorage({ ...activeSeller, products: updatedProducts }); setEditingProduct(null); toast.success("Saved."); }} className="flex-1 bg-nearbuy-primary text-white font-black py-6 rounded-3xl shadow-xl shadow-green-900/10 active:scale-95 transition-all">Save Changes</button></div>
           </div>
        </div>
      )}
    </div>
  );
}
