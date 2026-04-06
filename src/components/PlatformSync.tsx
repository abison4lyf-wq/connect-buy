"use client";

import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { usePathname } from "next/navigation";

export default function PlatformSync() {
  const pathname = usePathname();
  
  // Track previous counts to detect real-time additions securely across renders
  const prevOrdersCount = useRef<number>(0);
  const prevMessagesCount = useRef<number>(0);

  useEffect(() => {
    // Initial fetch to establish a baseline before notifying
    const initializeBaseCounts = () => {
       const uRaw = localStorage.getItem('nearbuy_active_user');
       if (!uRaw) return;
       const u = JSON.parse(uRaw);

       if (u.role === 'seller') {
          const ordersRaw = localStorage.getItem('connectbuy_orders');
          const orders = ordersRaw ? JSON.parse(ordersRaw) : [];
          const myOrders = orders.filter((o:any) => o.items.some((i:any) => i.sellerId === (u.sellerId || u.id)));
          prevOrdersCount.current = myOrders.length;
       }

       const msgsRaw = localStorage.getItem('nearbuy_messages');
       const msgs = msgsRaw ? JSON.parse(msgsRaw) : [];
       prevMessagesCount.current = msgs.length; // Can just track total size to trigger check
    };
    
    initializeBaseCounts();

    const checkStorageState = () => {
       const uRaw = localStorage.getItem('nearbuy_active_user');
       const u = uRaw ? JSON.parse(uRaw) : null;
       if (!u) return;

       // 1. Check Orders (For Sellers)
       if (u.role === 'seller') {
          const ordersRaw = localStorage.getItem('connectbuy_orders');
          const orders = ordersRaw ? JSON.parse(ordersRaw) : [];
          const myOrders = orders.filter((o:any) => o.items.some((i:any) => i.sellerId === (u.sellerId || u.id)));
          
          if (myOrders.length > prevOrdersCount.current) {
             const pending = myOrders[myOrders.length - 1];
             toast.success(`🎉 Cha-ching! New Order: ₦${pending.total.toLocaleString()}`, {
                duration: 6000,
                icon: '🛍️',
                style: { borderRadius: '10px', background: '#003531', color: '#fff', fontWeight: 'bold' }
             });
             // Dispatch event so Dashboard re-renders
             window.dispatchEvent(new Event('dashboard_update'));
          }
          prevOrdersCount.current = myOrders.length;
       }

       // 2. Check Messages (For Everyone)
       const msgsRaw = localStorage.getItem('nearbuy_messages');
       const msgs = msgsRaw ? JSON.parse(msgsRaw) : [];
       
       if (msgs.length > prevMessagesCount.current) {
          const newestMsg = msgs[0]; // Messages are prepended
          
          // Check if this message involves the active user
          const chatsRaw = localStorage.getItem('nearbuy_chats');
          const chats = chatsRaw ? JSON.parse(chatsRaw) : [];
          
          const involvedChat = chats.find((c:any) => c.id === newestMsg.chatId && (c.buyerId === u.id || c.sellerId === u.sellerId || c.sellerId === u.id));
          
          if (involvedChat && newestMsg.senderId !== u.id && newestMsg.senderId !== u.sellerId) {
             if (!pathname?.includes('/messages')) {
                 toast(`New message from ${involvedChat.buyerId === u.id ? involvedChat.sellerName : involvedChat.buyerName}`, {
                     icon: '💬',
                     style: { borderRadius: '10px', background: '#E3F2FD', color: '#1E3A8A', fontWeight: 'bold' }
                 });
             }
             // Optional: trigger custom event to instantly update navbar badge without routing
             window.dispatchEvent(new Event('messages_update'));
          }
       }
       prevMessagesCount.current = msgs.length;
    };

    // Event listeners
    const handleStorageEvent = () => checkStorageState();
    const handleCustomTrigger = () => checkStorageState();
    
    // Listen to native multi-tab storage events
    window.addEventListener('storage', handleStorageEvent);
    
    // Listen to custom intra-tab events (fired by our app manually)
    window.addEventListener('nearbuy_sync', handleCustomTrigger);
    
    // Polling fallback to keep MVP "alive" seamlessly if events miss
    const interval = setInterval(checkStorageState, 3000);

    return () => {
       window.removeEventListener('storage', handleStorageEvent);
       window.removeEventListener('nearbuy_sync', handleCustomTrigger);
       clearInterval(interval);
    };
  }, [pathname]);

  return null;
}
