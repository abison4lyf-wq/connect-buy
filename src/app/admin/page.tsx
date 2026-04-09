"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend
} from 'recharts';

import { ALL_LOCATIONS } from "@/data/locations";

// Pre-existing Static Sellers (Removed for Fresh Platform)
const RAW_STATIC_SELLERS: any[] = [];

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [sellers, setSellers] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalSellers: 0, totalProducts: 0, activeHubs: 0, totalIncome: 0 });
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [adminCreds, setAdminCreds] = useState({ email: "", password: "" });
  const [tickets, setTickets] = useState<any[]>([]);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [draftReply, setDraftReply] = useState("");

  const [bankDetails, setBankDetails] = useState({
    bankName: "NearBuy Global Bank",
    accountNumber: "0123456789",
    accountName: "NearBuy Marketplace Ltd"
  });

  useEffect(() => {
    // Load Tickets
    const localTickets = JSON.parse(localStorage.getItem('nearbuy_support_tickets') || '[]');
    setTickets(localTickets);
    const credsRaw = localStorage.getItem('nearbuy_admin_creds');
    if (credsRaw) {
      setAdminCreds(JSON.parse(credsRaw));
    } else {
      setAdminCreds({ email: 'admin@connectbuy.com', password: 'admin123' });
    }

    const bankRaw = localStorage.getItem('nearbuy_admin_bank_details');
    if (bankRaw) {
      setBankDetails(JSON.parse(bankRaw));
    }
  }, []);

  useEffect(() => {
    // 0. Auth Guard
    const activeUserRaw = localStorage.getItem('nearbuy_active_user');
    const activeUser = activeUserRaw ? JSON.parse(activeUserRaw) : null;

    if (!activeUser || activeUser.role !== 'admin') {
      toast.error("Unauthorized. Admin access only.");
      router.push('/auth/login');
      return;
    }

    const localSellers = JSON.parse(localStorage.getItem('nearbuy_sellers') || '[]');
    const localUsers = JSON.parse(localStorage.getItem('nearbuy_users') || '[]');
    const localOrders = JSON.parse(localStorage.getItem('connectbuy_orders') || '[]');
    
    setOrders(localOrders);

    // Extract buyers
    const buyerData = localUsers.filter((u: any) => u.role === 'buyer');
    setBuyers(buyerData);

    // Combine static and local, avoid duplicates by ID
    const combined = [...RAW_STATIC_SELLERS];
    localSellers.forEach((ls: any) => {
      // Find the user config to get tier
      const userRecord = localUsers.find((u:any) => u.sellerId === ls.id);
      const sellerWithTier = { ...ls, tier: userRecord?.tier || 'free' };

      if (!combined.find(s => s.id === ls.id)) combined.push(sellerWithTier);
    });
    
    setSellers(combined);
    
    // Calculate Stats
    const totalProducts = combined.reduce((acc: number, s: any) => acc + (s.products?.length || 0), 0);
    const hubs = new Set(combined.map((s: any) => s.category)).size;
    
    // Real Income: Commissions (3% / 1.5%) + Pro Subscriptions
    const proSellersCount = combined.filter(s => s.tier === 'pro').length;
    
    const commissionIncome = localOrders
       .filter((o: any) => o.status === 'verified')
       .reduce((sum: number, o: any) => {
          // Identify seller tier for each item in the order
          const orderCommission = o.items.reduce((cSum: number, item: any) => {
             const seller = combined.find(s => s.id === item.sellerId);
             const rate = seller?.tier === 'pro' ? 0.015 : 0.03;
             return cSum + (item.price * item.quantity * rate);
          }, 0);
          return sum + orderCommission;
       }, 0);
    
    const actualIncome = commissionIncome + (proSellersCount * 5000);
    
    setStats({
      totalSellers: combined.length,
      totalProducts,
      activeHubs: hubs,
      totalIncome: actualIncome
    });
  }, []);

  // Global Analytics Helper
  const globalAnalytics = useMemo(() => {
    if (!orders.length) return { timeline: [], categorySplit: [], aov: 0 };

    const verifiedOrders = orders.filter(o => o.status === 'verified');
    
    // 1. Revenue Timeline (7 Days)
    const timelineMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      timelineMap[label] = 0;
    }

    verifiedOrders.forEach(o => {
      const dateLabel = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (timelineMap[dateLabel] !== undefined) {
        timelineMap[dateLabel] += o.total;
      }
    });

    const timeline = Object.entries(timelineMap).map(([day, amount]) => ({ day, amount }));

    // 2. Category Distribution
    const catMap: Record<string, number> = {};
    verifiedOrders.forEach(o => {
      o.items.forEach((item: any) => {
        const sellerId = item.sellerId;
        const seller = sellers.find(s => s.id === sellerId);
        const category = seller?.category || 'Unknown';
        catMap[category] = (catMap[category] || 0) + (item.price * item.quantity);
      });
    });

    const categorySplit = Object.entries(catMap).map(([name, value]) => ({ name, value }));

    // 3. Platform AOV
    const aov = verifiedOrders.length ? verifiedOrders.reduce((s, o) => s + o.total, 0) / verifiedOrders.length : 0;

    return { timeline, categorySplit, aov };
  }, [orders, sellers]);

  const getTopSellers = () => {
    const revenueMap: Record<string, { name: string, total: number, count: number }> = {};
    
    orders.forEach(o => {
       o.items.forEach((item: any) => {
          if (!revenueMap[item.sellerId]) {
             const seller = sellers.find(s => s.id === item.sellerId);
             revenueMap[item.sellerId] = { name: seller?.name || item.sellerId, total: 0, count: 0 };
          }
          revenueMap[item.sellerId].total += (item.price * (item.quantity || 1));
          revenueMap[item.sellerId].count += 1;
       });
    });

    return Object.values(revenueMap).sort((a, b) => b.total - a.total);
  };

  const toggleVerify = (id: string) => {
    const updated = sellers.map(s => {
      if (s.id === id) return { ...s, verified: !s.verified };
      return s;
    });
    setSellers(updated);
    localStorage.setItem('nearbuy_sellers', JSON.stringify(updated.filter(s => !RAW_STATIC_SELLERS.find(rs => rs.id === s.id))));
    toast.success("Store status updated.");
  };

  const deleteSeller = (id: string) => {
    if (confirm("Are you sure you want to PERMANENTLY remove this seller? This cannot be undone.")) {
      const updated = sellers.filter(s => s.id !== id);
      setSellers(updated);
      localStorage.setItem('nearbuy_sellers', JSON.stringify(updated.filter(s => !RAW_STATIC_SELLERS.find(rs => rs.id === s.id))));
      toast.success("Store permanently removed.");
    }
  };

  const updateAdminCreds = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('nearbuy_admin_creds', JSON.stringify(adminCreds));
    
    // Update active session locally so navbar/etc reflect it
    const activeRaw = localStorage.getItem('nearbuy_active_user');
    if (activeRaw) {
      const active = JSON.parse(activeRaw);
      localStorage.setItem('nearbuy_active_user', JSON.stringify({ ...active, email: adminCreds.email }));
    }
    
    toast.success("Admin security credentials updated successfully.");
  };

  const updateTicketStatus = (id: string, newStatus: string) => {
    const updated = tickets.map(t => t.id === id ? { ...t, status: newStatus } : t);
    setTickets(updated);
    localStorage.setItem('nearbuy_support_tickets', JSON.stringify(updated));
    toast.success(`Ticket ${id} marked as ${newStatus}`);
  };

  const sendAdminReply = (id: string, userEmail: string, subject: string) => {
    if (!draftReply.trim()) {
      toast.error("Reply cannot be empty.");
      return;
    }
    // Requested: remain Open after drafting.
    const updated = tickets.map(t => t.id === id ? { ...t, adminReply: draftReply } : t);
    setTickets(updated);
    localStorage.setItem('nearbuy_support_tickets', JSON.stringify(updated));

    // Standardize physical email sending using the exact user mail
    window.location.href = `mailto:${userEmail}?subject=${encodeURIComponent(`Connect Buy Support: ${subject}`)}&body=${encodeURIComponent(draftReply)}`;

    toast.success(`Response drafted and physically routed to ${userEmail}!`);
    setReplyingToId(null);
    setDraftReply("");
  };

  const purgePlatformData = () => {
    // Purge but keep Admin session
    const adminSession = localStorage.getItem('nearbuy_active_user');
    
    localStorage.removeItem('nearbuy_users');
    localStorage.removeItem('nearbuy_sellers');
    localStorage.removeItem('connectbuy_orders');
    localStorage.removeItem('active_seller_id');
    
    // Restore admin session
    if (adminSession) {
      localStorage.setItem('nearbuy_active_user', adminSession);
    }
    
    toast.success("Platform Data Purged Successfully!");
    setShowPurgeModal(false);
    
    setTimeout(() => {
      window.location.reload(); 
    }, 1000);
  };

  const updateBankDetails = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('nearbuy_admin_bank_details', JSON.stringify(bankDetails));
    toast.success("Company bank details updated.");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-80 bg-nearbuy-secondary text-white p-10 flex flex-col hidden lg:flex">
         <div className="mb-12">
            <h1 className="text-3xl font-black tracking-tighter">Connect Buy <span className="text-nearbuy-primary italic">Admin.</span></h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Platform Command Center</p>
         </div>
         
         <nav className="flex-1 space-y-4">
            {[
              { id: 'overview', name: 'Overview', icon: '📈' },
              { id: 'sellers', name: 'Manage Sellers', icon: '🏪' },
              { id: 'financials', name: 'Financials', icon: '💳' },
              { id: 'buyers', name: 'Manage Buyers', icon: '👥' },
              { id: 'support', name: 'Support Hub', icon: '🛠️' },
              { id: 'settings', name: 'Settings', icon: '⚙️' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left p-4 rounded-2xl font-black text-sm flex items-center gap-3 transition-all ${activeTab === tab.id ? 'bg-nearbuy-primary/10 text-nearbuy-primary' : 'text-gray-400 hover:bg-white/5'}`}>
                <span className="text-xl">{tab.icon}</span> {tab.name}
              </button>
            ))}
         </nav>

         <div className="pt-10 border-t border-white/10">
            <Link href="/" className="text-xs font-bold text-gray-500 hover:text-white transition-all uppercase tracking-widest">Logout Admin</Link>
         </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 pt-8 pb-32 lg:p-12 overflow-y-auto">
         {activeTab === "overview" && (
           <>
            <div className="flex justify-between items-end mb-12">
               <div>
                  <h2 className="text-4xl font-black text-nearbuy-secondary tracking-tight">System <span className="text-nearbuy-primary">Overview.</span></h2>
                  <p className="text-gray-500 font-medium mt-2">Real-time platform health across all LGAs.</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Server Status</p>
                  <p className="text-nearbuy-primary font-bold flex items-center gap-2 justify-end text-sm"><span className="w-2 h-2 bg-nearbuy-primary rounded-full animate-ping"></span> Operational Hubs Live</p>
               </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
               <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between h-48 group hover:shadow-lg transition-all">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Global Sellers</p>
                  <div>
                     <p className="text-5xl font-black text-nearbuy-secondary mb-2">{stats.totalSellers}</p>
                     <p className="text-xs font-bold text-nearbuy-primary flex items-center gap-1">↑ 12% vs last week</p>
                  </div>
               </div>
               <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between h-48 group hover:shadow-lg transition-all">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Global Categories</p>
                  <div>
                     <p className="text-5xl font-black text-nearbuy-secondary mb-2">{stats.activeHubs}</p>
                     <p className="text-xs font-bold text-nearbuy-primary flex items-center gap-1">Live Inventory Scale</p>
                  </div>
               </div>
               <div className="bg-nearbuy-primary p-8 rounded-[2.5rem] shadow-2xl shadow-green-900/40 text-white flex flex-col justify-between h-48 relative overflow-hidden group border border-nearbuy-accent">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-bl-full group-hover:scale-125 transition-transform duration-700"></div>
                   <p className="text-xs font-black text-white uppercase tracking-widest relative z-10 drop-shadow-md">Platform Net Profit</p>
                  <div className="relative z-10">
                     <p className="text-4xl font-mono font-black mb-2 drop-shadow-md">₦{stats.totalIncome.toLocaleString()}</p>
                     <p className="text-[10px] font-black text-white uppercase bg-black/20 inline-block px-3 py-1 rounded-full backdrop-blur-sm backdrop-filter">Fees & Pro Subs Only</p>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               {/* Global Scale Timeline */}
               <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-xl font-black text-nearbuy-secondary">Revenue Velocity 📊</h3>
                  </div>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={globalAnalytics.timeline}>
                        <defs>
                          <linearGradient id="colorGlobal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
                        <YAxis hide />
                        <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                        <Area type="monotone" dataKey="amount" stroke="#22C55E" strokeWidth={4} fillOpacity={1} fill="url(#colorGlobal)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
               </div>

                <div className="bg-nearbuy-secondary text-white p-10 rounded-[3rem] shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-40 h-40 bg-nearbuy-primary/10 rounded-bl-full"></div>
                   <div className="relative z-10 flex flex-col justify-between h-full">
                     <div>
                       <h3 className="text-xl font-black mb-8 px-4 py-2 border border-white/10 rounded-xl inline-block">Category Split</h3>
                       <div className="h-[180px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={globalAnalytics.categorySplit}>
                             <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                               {globalAnalytics.categorySplit.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#22C55E' : '#4ADE80'} />
                               ))}
                             </Bar>
                             <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#003531', borderRadius: '12px', borderColor: 'rgba(255,255,255,0.1)', color: '#fff'}} />
                           </BarChart>
                         </ResponsiveContainer>
                       </div>
                     </div>
                   </div>
                </div>
            </div>
           </>
         )}

         {activeTab === "sellers" && (
            <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm">
               <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-black text-nearbuy-secondary">Moderation <span className="text-nearbuy-primary italic">Hub</span></h2>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="border-b border-gray-50">
                           <th className="pb-6 text-xs font-black text-gray-400 uppercase tracking-widest">Business</th>
                           <th className="pb-6 text-xs font-black text-gray-400 uppercase tracking-widest">Tier</th>
                           <th className="pb-6 text-xs font-black text-gray-400 uppercase tracking-widest">Scale</th>
                           <th className="pb-6 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                           <th className="pb-6 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {sellers.map((seller) => (
                           <tr key={seller.id} className="group hover:bg-gray-50/50 transition-all">
                              <td className="py-8">
                                 <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-nearbuy-primary">
                                       {seller.name.charAt(0)}
                                    </div>
                                    <div>
                                       <p className="font-extrabold text-nearbuy-secondary">{seller.name}</p>
                                       <p className="text-[9px] font-black uppercase text-gray-400">{seller.category}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="py-8">
                                 {seller.tier === 'pro' || seller.isGlobal ? (
                                    <div className="flex items-center gap-1.5 text-orange-500 text-[10px] font-black uppercase tracking-widest">💎 Pro</div>
                                 ) : (
                                    <div className="text-gray-300 text-[10px] font-black uppercase tracking-widest">Basic</div>
                                 )}
                              </td>
                              <td className="py-8">
                                 <div className="text-[11px] font-bold text-gray-400">
                                    {seller.isGlobal ? "Universal" : `${seller.locations?.length || 1} LGAs`}
                                 </div>
                              </td>
                              <td className="py-8">
                                 <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${
                                    seller.verified ? 'bg-nearbuy-primary/10 text-nearbuy-primary' : 'bg-yellow-50 text-yellow-600'
                                 }`}>
                                    {seller.verified ? 'Verified' : 'Pending'}
                                 </div>
                              </td>
                              <td className="py-8 text-right">
                                  {!seller.isGlobal && (
                                   <div className="flex justify-end gap-3 transition-all">
                                    <button 
                                       onClick={() => toggleVerify(seller.id)}
                                       className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm ${
                                          seller.verified ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-nearbuy-primary text-white hover:bg-nearbuy-accent'
                                       }`}
                                    >
                                       {seller.verified ? 'Unverify' : 'Approve'}
                                    </button>
                                    <button 
                                       onClick={() => deleteSeller(seller.id)}
                                       className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                    >
                                       Delete
                                    </button>
                                   </div>
                                 )}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {activeTab === "financials" && (
            <div className="space-y-10">
               <div className="bg-white rounded-[4rem] p-12 border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-nearbuy-primary/5 rounded-bl-[15rem]"></div>
                  <h2 className="text-3xl font-black text-nearbuy-secondary mb-12 relative z-10">Platform <span className="text-nearbuy-primary italic">Financial Oversight</span></h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16 relative z-10">
                     <div className="p-8 bg-nearbuy-secondary text-white rounded-[2.5rem]">
                         <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-4">Total Platform Fee Income</p>
                        <p className="text-3xl font-mono font-black">₦{stats.totalIncome.toLocaleString()}</p>
                     </div>
                     <div className="p-8 bg-gray-50 rounded-[2.5rem]">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Verified Orders</p>
                        <p className="text-3xl font-mono font-black text-nearbuy-secondary">{orders.filter(o => o.status === 'verified').length}</p>
                     </div>
                     <div className="p-8 bg-gray-50 rounded-[2.5rem]">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Platform AOV</p>
                        <p className="text-3xl font-mono font-black text-nearbuy-secondary">₦{Math.round(globalAnalytics.aov).toLocaleString()}</p>
                     </div>
                     <div className="p-8 bg-gray-50 rounded-[2.5rem]">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Loyalty Index</p>
                        <p className="text-3xl font-mono font-black text-nearbuy-secondary">{buyers.length}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 bg-gray-50 rounded-[3rem] p-10 h-[400px]">
                       <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-10">Daily Platform Velocity</h3>
                       <ResponsiveContainer width="100%" height="80%">
                          <AreaChart data={globalAnalytics.timeline}>
                             <Tooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                             <Area type="step" dataKey="amount" stroke="#22C55E" strokeWidth={3} fill="#DCFCE7" />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                    
                    <div className="bg-nearbuy-secondary rounded-[3rem] p-10 h-[400px] flex flex-col justify-center text-center">
                       <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] mb-12">Category Momentum</h3>
                       <div className="space-y-6">
                          {globalAnalytics.categorySplit.slice(0, 4).map((cat, idx) => (
                             <div key={idx} className="flex flex-col gap-2">
                                <div className="flex justify-between text-[10px] font-black uppercase text-white/60">
                                   <span>{cat.name}</span>
                                   <span>₦{cat.value.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                   <div 
                                     className="bg-nearbuy-primary h-full rounded-full transition-all duration-1000" 
                                     style={{ width: `${(cat.value / stats.totalIncome) * 100}%` }}
                                   ></div>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                  </div>

                  <div className="mt-20">
                     <h3 className="text-xl font-black text-nearbuy-secondary mb-10">Top Performing Stores</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {getTopSellers().slice(0, 4).map((seller, idx) => (
                           <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 group hover:border-nearbuy-primary transition-all">
                              <p className="text-[10px] font-black text-nearbuy-primary uppercase mb-2">Rank #{idx+1}</p>
                              <p className="font-extrabold text-nearbuy-secondary truncate">{seller.name}</p>
                              <p className="text-xl font-mono font-black mt-4">₦{seller.total.toLocaleString()}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{seller.count} Sales</p>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-[4rem] p-12 border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-black text-nearbuy-secondary mb-10">platform_ledger.log</h3>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                        <thead>
                           <tr className="border-b border-gray-100">
                              <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</th>
                              <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Buyer Entity</th>
                              <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">GMV</th>
                              <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lifecycle Status</th>
                              <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Timestamp</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {orders.map((order) => (
                              <tr key={order.id} className="group hover:bg-gray-50/10 transition-all">
                                 <td className="py-6 font-mono font-bold text-nearbuy-secondary text-xs">{order.id}</td>
                                 <td className="py-6 font-bold text-gray-600 text-xs">{order.buyerName}</td>
                                 <td className="py-6 font-black font-mono text-sm leading-none">₦{order.total.toLocaleString()}</td>
                                 <td className="py-6">
                                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                                       order.status === 'verified' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                                    }`}>
                                       {order.status}
                                    </span>
                                 </td>
                                 <td className="py-6 text-right text-gray-400 text-[10px] font-black uppercase">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}
         
         {activeTab === "buyers" && (
            <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm">
               <h2 className="text-3xl font-black text-nearbuy-secondary mb-10">User <span className="text-nearbuy-primary italic">Base</span></h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 hover:shadow-lg transition-all">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Registered Buyers</p>
                     <p className="text-4xl font-black text-nearbuy-secondary">{buyers.length}</p>
                  </div>
                  <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 hover:shadow-lg transition-all">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Total Users (Global)</p>
                     <p className="text-4xl font-black text-nearbuy-primary">{sellers.length + buyers.length}</p>
                  </div>
               </div>
               
               <div className="mt-12 overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="border-b border-gray-100">
                           <th className="pb-6 text-xs font-black text-gray-400 uppercase tracking-widest">ID</th>
                           <th className="pb-6 text-xs font-black text-gray-400 uppercase tracking-widest">Name</th>
                           <th className="pb-6 text-xs font-black text-gray-400 uppercase tracking-widest">Contact</th>
                           <th className="pb-6 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Joined</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {buyers.length === 0 ? (
                           <tr>
                              <td colSpan={4} className="py-20 text-sm font-bold text-gray-400 uppercase tracking-widest italic text-center">No buyers registered yet.</td>
                           </tr>
                        ) : (
                           buyers.map((buyer) => (
                              <tr key={buyer.id} className="group hover:bg-gray-50/50 transition-all">
                                 <td className="py-6 text-xs font-mono text-gray-300">{buyer.id.slice(0, 8)}...</td>
                                 <td className="py-6 font-extrabold text-nearbuy-secondary">{buyer.name}</td>
                                 <td className="py-6 text-[11px] font-bold text-gray-500">
                                    <div>{buyer.email}</div>
                                 </td>
                                 <td className="py-6 text-[10px] font-black text-gray-400 uppercase text-right">
                                    {new Date(buyer.createdAt || new Date()).toLocaleDateString()}
                                 </td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {activeTab === "settings" && (
            <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm">
               <h2 className="text-3xl font-black text-nearbuy-secondary mb-10">Platform <span className="text-nearbuy-primary italic">Control</span></h2>
               <div className="space-y-8 max-w-xl">
                  <div className="flex justify-between items-center p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                     <div>
                        <p className="font-black text-nearbuy-secondary text-lg">Strict Store Moderation</p>
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1">Manual Approval Workflow</p>
                     </div>
                     <div className="w-14 h-7 bg-nearbuy-primary rounded-full relative shadow-inner">
                        <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-md"></div>
                     </div>
                  </div>
                  <div className="flex justify-between items-center p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 opacity-60">
                     <div>
                        <p className="font-black text-nearbuy-secondary text-lg">Platform-wide Shutdown</p>
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1">Maintenance Protocol</p>
                     </div>
                     <div className="w-14 h-7 bg-gray-200 rounded-full relative shadow-inner">
                        <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow-md"></div>
                     </div>
                  </div>

                  <div className="p-10 bg-white rounded-[3rem] border border-gray-100 shadow-xl mt-12">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-nearbuy-secondary text-white rounded-2xl flex items-center justify-center shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xl font-black text-nearbuy-secondary">Security & Access</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Manage Admin Credentials</p>
                      </div>
                    </div>

                    <form onSubmit={updateAdminCreds} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Admin Login Email</label>
                          <input 
                            type="email" 
                            required
                            className="w-full px-5 py-4 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all font-bold"
                            value={adminCreds.email}
                            onChange={(e) => setAdminCreds({...adminCreds, email: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Admin Secure Password</label>
                          <input 
                            type="password" 
                            required
                            className="w-full px-5 py-4 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all font-bold"
                            value={adminCreds.password}
                            onChange={(e) => setAdminCreds({...adminCreds, password: e.target.value})}
                          />
                        </div>
                      </div>
                      <button 
                        type="submit"
                        className="bg-nearbuy-secondary hover:bg-nearbuy-primary text-white font-black px-10 py-4 rounded-2xl transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest"
                      >
                        Update Access Logic
                      </button>
                    </form>
                  </div>

                  {/* Company Payout Settings */}
                  <div className="p-10 bg-white rounded-[3rem] border border-gray-100 shadow-xl mt-12">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-nearbuy-primary text-white rounded-2xl flex items-center justify-center shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xl font-black text-nearbuy-secondary">Company Payout Account</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Direct Payments for Pro Subscriptions</p>
                      </div>
                    </div>

                    <form onSubmit={updateBankDetails} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                           <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Company Bank Name</label>
                           <input 
                             className="w-full px-5 py-4 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all font-bold"
                             value={bankDetails.bankName}
                             onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                           />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Company Account Number</label>
                          <input 
                            className="w-full px-5 py-4 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all font-bold"
                            value={bankDetails.accountNumber}
                            onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Company Account Name</label>
                          <input 
                            className="w-full px-5 py-4 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all font-bold"
                            value={bankDetails.accountName}
                            onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
                          />
                        </div>
                      </div>
                      <button 
                        type="submit"
                        className="bg-nearbuy-secondary hover:bg-nearbuy-primary text-white font-black px-10 py-4 rounded-2xl transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest"
                      >
                        Save Company Account
                      </button>
                    </form>
                  </div>

                  <div className="p-10 bg-red-50 rounded-[3rem] border border-red-100 mt-10 text-center">
                    <p className="text-xl font-black text-red-600 mb-2">Danger Zone ⚠️</p>
                    <p className="text-[11px] font-bold text-red-400 uppercase tracking-widest mb-6">Critical Actions - Irreversible</p>
                    <button 
                      onClick={() => setShowPurgeModal(true)}
                      className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-900/10 active:scale-95 transition-all text-xs uppercase tracking-widest"
                    >
                      Force Reset Platform Database
                    </button>
                    <p className="text-[10px] text-red-300 italic font-medium mt-4 text-center px-4">
                      Clears all Buyers, Sellers, and Transactions. Your current Admin session will be preserved.
                    </p>
                  </div>
               </div>
            </div>
         )}

         {activeTab === "support" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="mb-12">
                  <h2 className="text-4xl font-black text-nearbuy-secondary tracking-tighter uppercase">Support Ticket <span className="text-nearbuy-primary italic">Inbox.</span></h2>
               </div>

               <div className="grid grid-cols-1 gap-6">
                  {tickets.length === 0 ? (
                     <div className="bg-white rounded-[3rem] p-24 text-center border border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                           </svg>
                        </div>
                        <h3 className="text-xl font-black text-nearbuy-secondary italic mb-2 uppercase tracking-tight">System All Clear</h3>
                        <p className="text-gray-400 text-sm font-medium">No active complaints or support inquiries recorded.</p>
                     </div>
                  ) : (
                     tickets.map(ticket => (
                        <div key={ticket.id} className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-md flex flex-col gap-6 hover:shadow-xl transition-all">
                           <div className="flex flex-col md:flex-row gap-10 items-start">
                              <div className="flex-1">
                                 <div className="flex items-center gap-3 mb-4">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${ticket.status === 'Open' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                                       {ticket.status}
                                    </span>
                                    <span className="text-[10px] font-black text-nearbuy-primary uppercase tracking-widest">{ticket.id}</span>
                                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">• {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                 </div>
                                 <h3 className="text-2xl font-black text-nearbuy-secondary uppercase italic mb-4">{ticket.subject}</h3>
                                 <p className="text-gray-500 font-medium leading-relaxed bg-gray-50 p-6 rounded-2xl mb-6 italic">"{ticket.message}"</p>
                                 
                                 <div className="flex flex-wrap gap-8 text-[10px] font-black uppercase tracking-widest">
                                    <div><span className="text-gray-300">User:</span> <span className="text-nearbuy-secondary ml-1">{ticket.userName}</span></div>
                                    <div className="px-3 py-1 bg-gray-100 rounded-lg"><span className="text-gray-400">Category:</span> <span className="text-nearbuy-secondary ml-1">{ticket.category}</span></div>
                                    {ticket.orderId && <div><span className="text-gray-300">Order Ref:</span> <span className="text-nearbuy-primary ml-1 font-mono">{ticket.orderId}</span></div>}
                                 </div>
                              </div>
                              
                              <div className="shrink-0 flex flex-col gap-3 w-full md:w-auto">
                                 {ticket.status === 'Open' ? (
                                    <button 
                                       onClick={() => updateTicketStatus(ticket.id, 'Resolved')}
                                       className="bg-green-500 hover:bg-green-600 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-xl shadow-green-900/10 text-[10px] uppercase tracking-widest whitespace-nowrap cursor-pointer border-0"
                                    >
                                       Mark Resolved ✓
                                    </button>
                                 ) : (
                                    <button 
                                       onClick={() => updateTicketStatus(ticket.id, 'Open')}
                                       className="bg-gray-100 hover:bg-gray-200 text-gray-400 font-black px-8 py-4 rounded-2xl transition-all text-[10px] uppercase tracking-widest whitespace-nowrap cursor-pointer border-0"
                                    >
                                       Reopen Ticket
                                    </button>
                                 )}
                                 <button 
                                    onClick={() => { setReplyingToId(ticket.id); setDraftReply(""); }}
                                    className="bg-nearbuy-secondary hover:bg-nearbuy-primary text-white font-black px-8 py-4 rounded-2xl transition-all text-[10px] uppercase tracking-widest text-center border-0 cursor-pointer"
                                 >
                                    Draft User Reply ✉
                                 </button>
                              </div>
                           </div>

                           {ticket.adminReply && (
                              <div className="border-t border-gray-100 pt-6 mt-2">
                                 <p className="text-[10px] font-black text-nearbuy-primary uppercase tracking-widest mb-2">Agent Response Sent:</p>
                                 <p className="text-gray-500 font-medium bg-green-50/50 p-6 rounded-2xl border border-green-100/50 italic">"{ticket.adminReply}"</p>
                              </div>
                           )}

                           {replyingToId === ticket.id && (
                              <div className="border-t border-gray-100 pt-6 mt-2 animate-in slide-in-from-top-2">
                                 <label className="block text-[10px] font-black text-nearbuy-secondary uppercase tracking-widest mb-3">Draft Response Message</label>
                                 <textarea
                                    className="w-full px-6 py-4 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all font-bold placeholder:text-gray-300 resize-none h-32 mb-4"
                                    placeholder={`Typing message directly to ${ticket.userEmail}...`}
                                    value={draftReply}
                                    onChange={(e) => setDraftReply(e.target.value)}
                                    autoFocus
                                 />
                                 <div className="flex justify-end gap-3">
                                    <button onClick={() => { setReplyingToId(null); setDraftReply(""); }} className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase text-gray-400 hover:bg-gray-100 transition-all border-0 cursor-pointer bg-transparent">Cancel</button>
                                    <button onClick={() => sendAdminReply(ticket.id, ticket.userEmail, ticket.subject)} className="bg-nearbuy-secondary hover:bg-nearbuy-primary text-white font-black px-8 py-3 rounded-2xl transition-all shadow-xl shadow-green-900/10 active:scale-95 text-[10px] uppercase tracking-widest cursor-pointer border-0">
                                       Send Electronic Response ✉
                                    </button>
                                 </div>
                              </div>
                           )}
                        </div>
                     ))
                  )}
               </div>
            </div>
         )}

      </main>

      {/* Custom Purge Confirmation Modal */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-nearbuy-secondary/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white max-w-md w-full rounded-[3.5rem] p-10 shadow-2xl border border-gray-100 animate-scale-up">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                 </svg>
              </div>
              <h3 className="text-3xl font-black text-nearbuy-secondary text-center mb-4 tracking-tighter uppercase italic">Confirm <br/><span className="text-red-500">System Purge?</span></h3>
              <p className="text-center text-gray-500 font-medium leading-relaxed mb-10">
                You are about to delete all Sellers, Buyers, and Orders from the database. This action is <span className="text-red-500 font-black uppercase">Irreversible</span>.
              </p>
              
              <div className="flex flex-col gap-4">
                 <button 
                  onClick={purgePlatformData}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-red-900/20 active:scale-95 transition-all text-sm uppercase tracking-widest"
                 >
                   Yes, Purge Website Data
                 </button>
                 <button 
                  onClick={() => setShowPurgeModal(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-400 font-black py-5 rounded-2xl transition-all text-sm uppercase tracking-widest"
                 >
                   Cancel Action
                 </button>
              </div>
           </div>
        </div>
      )}
      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 px-4 py-3 flex justify-between items-center pb-safe">
        {[
          { id: 'overview', name: 'Overview', icon: '📈' },
          { id: 'sellers', name: 'Sellers', icon: '🏪' },
          { id: 'financials', name: 'Finance', icon: '💳' },
          { id: 'buyers', name: 'Buyers', icon: '👥' },
          { id: 'support', name: 'Support', icon: '🛠️' },
          { id: 'settings', name: 'Setup', icon: '⚙️' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all border-0 bg-transparent cursor-pointer ${activeTab === tab.id ? 'text-nearbuy-primary scale-110 shadow-sm' : 'text-gray-400 grayscale opacity-60'}`}>
            <span className="text-xl leading-none">{tab.icon}</span>
            <span className={`text-[8px] font-black uppercase tracking-widest ${activeTab === tab.id ? 'text-nearbuy-primary' : 'text-gray-400'}`}>{tab.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

