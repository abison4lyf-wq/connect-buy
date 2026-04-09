"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { toast } from "react-hot-toast";

export default function Navbar() {
  const { totalItems } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [activeUser, setActiveUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const refreshUnread = () => {
    const userRaw = localStorage.getItem('nearbuy_active_user');
    if (!userRaw) return;
    const user = JSON.parse(userRaw);
    setActiveUser(user);

    const allChats = JSON.parse(localStorage.getItem('nearbuy_chats') || '[]');
    const count = allChats.reduce((acc: number, chat: any) => {
      if (user.role === 'seller' && (chat.sellerId === user.sellerId || chat.sellerId === user.id) && chat.unreadForSeller) return acc + 1;
      if (user.role === 'buyer' && chat.buyerId === user.id && chat.unreadForBuyer) return acc + 1;
      return acc;
    }, 0);
    setUnreadCount(count);
  };

  useEffect(() => {
    refreshUnread();

    // Real-time badge updates from PlatformSync
    window.addEventListener('messages_update', refreshUnread);
    window.addEventListener('nearbuy_sync', refreshUnread);
    window.addEventListener('storage', refreshUnread);

    return () => {
      window.removeEventListener('messages_update', refreshUnread);
      window.removeEventListener('nearbuy_sync', refreshUnread);
      window.removeEventListener('storage', refreshUnread);
    };
  }, [pathname]);

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem('nearbuy_active_user');
    localStorage.removeItem('nearbuy_active_role');
    localStorage.removeItem('active_seller_id');
    setActiveUser(null);
    toast.success("Logged out successfully");
    router.push('/');
    router.refresh();
  };

  if (pathname.startsWith('/auth')) return null;

  return (
    <nav className="w-full h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 lg:px-20 sticky top-0 z-50">
      <div className="flex items-center gap-12">
        <Link href="/" className="text-2xl font-black text-nearbuy-secondary tracking-tighter hover:scale-105 transition-transform duration-300">
          Connect<span className="text-nearbuy-primary italic">Buy.</span>
        </Link>

        <div className="hidden md:flex gap-8">
          <Link href="/marketplace" className={`text-[10px] font-black uppercase tracking-widest transition-all ${pathname === '/marketplace' ? 'text-nearbuy-primary' : 'text-gray-400 hover:text-nearbuy-secondary'}`}>Marketplace</Link>
          
          {activeUser?.role === 'admin' && (
            <Link href="/admin" className={`text-[10px] font-black uppercase tracking-widest transition-all ${pathname === '/admin' ? 'text-nearbuy-primary' : 'text-gray-400 hover:text-nearbuy-secondary'}`}>Admin Panel</Link>
          )}

          {activeUser?.role === 'seller' && (
            <Link href="/seller-dashboard" className={`text-[10px] font-black uppercase tracking-widest transition-all ${pathname === '/seller-dashboard' ? 'text-nearbuy-primary' : 'text-gray-400 hover:text-nearbuy-secondary'}`}>Seller Hub</Link>
          )}

          {activeUser?.role === 'buyer' && (
            <Link href="/my-orders" className={`text-[10px] font-black uppercase tracking-widest transition-all ${pathname === '/my-orders' ? 'text-nearbuy-primary' : 'text-gray-400 hover:text-nearbuy-secondary'}`}>My Orders</Link>
          )}

          {activeUser && (
            <Link href="/messages" className={`text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 relative ${pathname === '/messages' ? 'text-nearbuy-primary' : 'text-gray-400 hover:text-nearbuy-secondary'}`}>
              Messages 💬
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-nearbuy-primary text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-lg shadow-green-900/20">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}

          {activeUser?.role !== 'admin' && (
            <Link href="/support" className={`text-[10px] font-black uppercase tracking-widest transition-all ${pathname === '/support' ? 'text-nearbuy-primary' : 'text-gray-400 hover:text-nearbuy-secondary'}`}>Support Hub</Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <Link href="/checkout" className="relative group">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-nearbuy-secondary group-hover:text-nearbuy-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {totalItems > 0 && <span className="absolute -top-2 -right-2 bg-nearbuy-primary text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{totalItems}</span>}
        </Link>

        <div className="h-6 w-px bg-gray-100 hidden sm:block"></div>

        {!activeUser ? (
          <div className="hidden md:flex items-center gap-3">
             <Link href="/auth/selection" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-nearbuy-secondary px-2 border-0 bg-transparent no-underline">Login</Link>
             <Link href="/auth/selection" className="text-[10px] font-black bg-nearbuy-primary text-white uppercase tracking-widest px-6 py-3 rounded-xl shadow-lg shadow-green-900/10 active:scale-95 transition-all no-underline">Sign Up</Link>
          </div>

        ) : (
          <div className="hidden md:flex items-center gap-4">
            <div className="hidden lg:block text-right">
              <p className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Signed in as</p>
              <p className="text-[11px] font-black text-nearbuy-secondary truncate max-w-[120px]">{activeUser.name}</p>
            </div>
            <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white font-black text-[10px] uppercase tracking-widest rounded-xl border-0 cursor-pointer transition-all active:scale-95" title="Logout">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Logout
            </button>
          </div>
        )}

        {/* Mobile Hamburger Toggle */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-nearbuy-secondary border-0 bg-transparent cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-20 left-0 w-full bg-white border-b border-gray-100 shadow-xl p-6 flex flex-col gap-6 md:hidden animate-in slide-in-from-top-2 z-50">
          <Link href="/marketplace" className="text-sm font-black uppercase tracking-widest text-nearbuy-secondary no-underline">Marketplace</Link>
          
          {activeUser?.role === 'admin' && (
            <Link href="/admin" className="text-sm font-black uppercase tracking-widest text-nearbuy-primary no-underline">Admin Panel</Link>
          )}

          {activeUser?.role === 'seller' && (
            <Link href="/seller-dashboard" className="text-sm font-black uppercase tracking-widest text-nearbuy-primary no-underline">Seller Hub</Link>
          )}

          {activeUser?.role === 'buyer' && (
            <Link href="/my-orders" className="text-sm font-black uppercase tracking-widest text-nearbuy-primary no-underline">My Orders</Link>
          )}

          {activeUser && (
            <Link href="/messages" className="text-sm font-black uppercase tracking-widest text-nearbuy-secondary flex items-center justify-between no-underline">
              <span>Messages 💬</span>
              {unreadCount > 0 && <span className="bg-nearbuy-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{unreadCount}</span>}
            </Link>
          )}

          {activeUser?.role !== 'admin' && (
            <Link href="/support" className="text-sm font-black uppercase tracking-widest text-nearbuy-secondary no-underline">Support Hub</Link>
          )}

          <div className="pt-4 border-t border-gray-50 flex flex-col gap-4">
             {!activeUser ? (
               <>
                 <Link href="/auth/selection" className="text-xs font-black text-gray-400 uppercase tracking-widest text-center py-4 bg-gray-50 rounded-xl no-underline">Login</Link>
                 <Link href="/auth/selection" className="text-xs font-black bg-nearbuy-primary text-white uppercase tracking-widest py-4 rounded-xl shadow-lg text-center no-underline">Sign Up</Link>
               </>
             ) : (
               <div className="flex items-center justify-between">
                 <div className="text-left">
                   <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Signed in as</p>
                   <p className="text-sm font-black text-nearbuy-secondary truncate max-w-[200px]">{activeUser.name}</p>
                 </div>
                 <button onClick={logout} className="text-[10px] font-black text-red-500 uppercase tracking-widest px-4 py-2 bg-red-50 rounded-lg border-0 cursor-pointer">Logout</button>
               </div>
             )}
          </div>
        </div>
      )}
    </nav>
  );
}
