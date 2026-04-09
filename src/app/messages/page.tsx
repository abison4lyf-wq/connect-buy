"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { toast } from "react-hot-toast";

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, clearCart } = useCart();
  const [activeUser, setActiveUser] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(searchParams.get('chatId'));
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [orderedSellers, setOrderedSellers] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userRaw = localStorage.getItem('nearbuy_active_user');
    if (!userRaw) {
      router.push('/auth/selection');
      return;
    }
    setActiveUser(JSON.parse(userRaw));
  }, [router]);

  useEffect(() => {
    if (!activeUser) return;
    
    // Load Chats where user is either buyer or seller
    const allChats = JSON.parse(localStorage.getItem('nearbuy_chats') || '[]');
    const userChats = allChats.filter((c: any) => 
      c.buyerId === activeUser.id || 
      c.sellerId === activeUser.id || 
      (activeUser.sellerId && c.sellerId === activeUser.sellerId)
    );
    setChats(userChats);

    if (activeUser.role === 'buyer') {
      const orders = JSON.parse(localStorage.getItem('connectbuy_orders') || '[]');
      const buyerOrders = orders.filter((o: any) => o.buyerId === activeUser.id || o.buyerId === activeUser.email);
      
      const sellerIds = new Set<string>();
      buyerOrders.forEach((o: any) => {
        o.items?.forEach((item: any) => {
          if (item.sellerId) sellerIds.add(item.sellerId);
        });
      });

      const allSellers = JSON.parse(localStorage.getItem('nearbuy_sellers') || '[]');
      const staticSellers = [
        { id: 's1', name: 'Alhaji Farms' },
        { id: 's2', name: 'Tech Zone' },
        { id: 's3', name: 'Iya Oge Boutique' }
      ];

      const matchedSellers = Array.from(sellerIds).map(id => {
         const realSeller = allSellers.find((s:any) => s.id === id);
         if (realSeller) return realSeller;
         const sampleSeller = staticSellers.find(s => s.id === id);
         if (sampleSeller) return sampleSeller;
         return { id, name: "Local Seller" };
      });

      const sellersWithoutChat = matchedSellers.filter(seller => 
        !userChats.some((chat: any) => chat.sellerId === seller.id)
      );

      setOrderedSellers(sellersWithoutChat);
    }

    if (activeChatId) {
      const allMessages = JSON.parse(localStorage.getItem('nearbuy_messages') || '[]');
      const chatMessages = allMessages.filter((m: any) => m.chatId === activeChatId);
      setMessages(chatMessages.reverse()); // Show in order

      // Mark as read
      const updatedAllChats = allChats.map((c: any) => {
        if (c.id === activeChatId) {
          if (activeUser.role === 'buyer') return { ...c, unreadForBuyer: false };
          if (activeUser.role === 'seller') return { ...c, unreadForSeller: false };
        }
        return c;
      });
      localStorage.setItem('nearbuy_chats', JSON.stringify(updatedAllChats));
    }
  }, [activeUser, activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startChatWithSeller = (seller: any) => {
    if (!seller || !activeUser) return;
    
    const allChats = JSON.parse(localStorage.getItem('nearbuy_chats') || '[]');
    
    let existingChat = allChats.find((c: any) => 
      (c.buyerId === activeUser.id && c.sellerId === seller.id)
    );

    if (!existingChat) {
      existingChat = {
        id: "chat_" + Date.now(),
        buyerId: activeUser.id,
        buyerName: activeUser.name,
        sellerId: seller.id,
        sellerName: seller.name,
        lastMessage: `Hello! I'd like to ask about my recent order.`,
        timestamp: new Date().toISOString(),
        unreadForSeller: true,
        unreadForBuyer: false
      };
      
      const newChats = [existingChat, ...allChats];
      localStorage.setItem('nearbuy_chats', JSON.stringify(newChats));
      
      const userChats = newChats.filter((c: any) => 
        c.buyerId === activeUser.id || 
        c.sellerId === activeUser.id || 
        (activeUser.sellerId && c.sellerId === activeUser.sellerId)
      );
      setChats(userChats);
      setOrderedSellers(prev => prev.filter(s => s.id !== seller.id));
      setActiveChatId(existingChat.id);
      
      const allMessages = JSON.parse(localStorage.getItem('nearbuy_messages') || '[]');
      const newMsg = {
        id: "msg_" + Date.now(),
        chatId: existingChat.id,
        senderId: activeUser.id,
        text: existingChat.lastMessage,
        timestamp: existingChat.timestamp
      };
      localStorage.setItem('nearbuy_messages', JSON.stringify([newMsg, ...allMessages]));
    } else {
      setActiveChatId(existingChat.id);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId || !activeUser) return;

    const msgId = "msg_" + Date.now();
    const msgObj = {
      id: msgId,
      chatId: activeChatId,
      senderId: activeUser.id,
      text: newMessage,
      timestamp: new Date().toISOString()
    };

    // Save Message
    const allMessages = JSON.parse(localStorage.getItem('nearbuy_messages') || '[]');
    localStorage.setItem('nearbuy_messages', JSON.stringify([msgObj, ...allMessages]));

    // Update Chat Last Message and Notification Flags
    const allChats = JSON.parse(localStorage.getItem('nearbuy_chats') || '[]');
    const updatedChats = allChats.map((c: any) => {
      if (c.id === activeChatId) {
        return { 
          ...c, 
          lastMessage: newMessage, 
          timestamp: msgObj.timestamp,
          unreadForBuyer: activeUser.role === 'seller',
          unreadForSeller: activeUser.role === 'buyer'
        };
      }
      return c;
    });
    localStorage.setItem('nearbuy_chats', JSON.stringify(updatedChats));

    // Trigger real-time notification on all tabs
    window.dispatchEvent(new Event('messages_update'));
    window.dispatchEvent(new Event('nearbuy_sync'));
    window.dispatchEvent(new StorageEvent('storage', { key: 'nearbuy_messages' }));

    setMessages([...messages, msgObj]);
    // Refresh chats to update sidebar
    setChats(updatedChats.filter((c: any) => 
      c.buyerId === activeUser.id || 
      c.sellerId === activeUser.id || 
      (activeUser.sellerId && c.sellerId === activeUser.sellerId)
    ));
    setNewMessage("");
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Chat List */}
      <aside className="w-80 md:w-96 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
           <Link href="/" className="text-xl font-black tracking-tighter text-nearbuy-secondary">
             Near<span className="text-nearbuy-primary italic">Buy</span> Hub
           </Link>
           <Link href="/" className="text-[10px] font-black uppercase text-gray-300 hover:text-nearbuy-primary transition-all">Exit</Link>
        </div>
        
        <div className="p-6">
           <h2 className="text-2xl font-black text-nearbuy-secondary italic mb-6">Messages</h2>
           <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar">
              {chats.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Active Chats</p>
                  {chats.map(chat => (
                    <button 
                      key={chat.id}
                      onClick={() => setActiveChatId(chat.id)}
                      className={`w-full p-6 rounded-[2rem] text-left transition-all flex items-center gap-4 group ${activeChatId === chat.id ? 'bg-nearbuy-secondary text-white shadow-xl shadow-nearbuy-secondary/20' : 'hover:bg-gray-50'}`}
                    >
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 ${activeChatId === chat.id ? 'bg-nearbuy-primary/20 text-nearbuy-primary' : 'bg-gray-100 text-nearbuy-secondary group-hover:bg-nearbuy-primary group-hover:text-white'}`}>
                          {(activeUser?.id === chat.buyerId ? chat.sellerName : chat.buyerName)?.[0] || "?"}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className={`font-black tracking-tight truncate ${activeChatId === chat.id ? 'text-white' : 'text-nearbuy-secondary'}`}>
                             {activeUser?.id === chat.buyerId ? chat.sellerName : chat.buyerName}
                          </p>
                          <p className={`text-[10px] font-bold truncate mt-0.5 ${activeChatId === chat.id ? 'text-white/60' : 'text-gray-400'}`}>
                             {chat.lastMessage}
                          </p>
                       </div>
                    </button>
                  ))}
                </div>
              )}

              {chats.length === 0 && orderedSellers.length === 0 && (
                <div className="text-center py-10 text-gray-300 font-bold text-xs uppercase tracking-widest leading-loose">
                  No conversations <br/> initiated yet.
                </div>
              )}

              {orderedSellers.length > 0 && (
                <div className={`mt-6 ${chats.length > 0 ? 'border-t border-gray-100 pt-6' : ''}`}>
                  <p className="text-[10px] font-black text-nearbuy-primary uppercase tracking-widest mb-2 px-2">Your Sellers</p>
                  <p className="text-xs text-gray-400 mb-4 px-2 font-medium">Start a chat regarding your orders.</p>
                  {orderedSellers.map(seller => (
                    <button 
                      key={seller.id}
                      onClick={() => startChatWithSeller(seller)}
                      className="w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 hover:bg-gray-50 group border border-transparent hover:border-gray-100"
                    >
                       <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0 bg-nearbuy-primary/10 text-nearbuy-primary">
                          {seller.name?.[0] || "S"}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="font-black tracking-tight truncate text-nearbuy-secondary">
                             {seller.name}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest flex items-center gap-1">
                             Start New Chat <span className="text-nearbuy-primary opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                          </p>
                       </div>
                    </button>
                  ))}
                </div>
              )}
           </div>
        </div>
      </aside>

      {/* Main Chat Window */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
         {activeChat ? (
           <>
            {/* Chat Header */}
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-10">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-nearbuy-primary/10 text-nearbuy-primary rounded-xl flex items-center justify-center font-black">
                     {(activeUser?.id === activeChat.buyerId ? activeChat.sellerName : activeChat.buyerName)[0]}
                  </div>
                  <div>
                     <h3 className="font-black text-nearbuy-secondary uppercase italic tracking-tight">
                        {activeUser?.id === activeChat.buyerId ? activeChat.sellerName : activeChat.buyerName}
                     </h3>
                     <p className="text-[10px] font-black text-nearbuy-primary uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-nearbuy-primary rounded-full animate-pulse"></span>
                        Active Negotiation Hub
                     </p>
                  </div>
               </div>

               {activeUser?.role === 'buyer' && cart.length > 0 && (
                  <button 
                    onClick={() => {
                      if (confirm('Clear your cart?')) {
                        clearCart();
                        toast.success("Cart cleared during negotiation.");
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white font-black text-[10px] uppercase tracking-widest rounded-xl border-0 cursor-pointer transition-all active:scale-95"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                     Clear Cart
                  </button>
               )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-10 space-y-6 bg-gray-50/30 custom-scrollbar">
               {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center flex-col text-center opacity-20">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                     </svg>
                     <p className="font-black uppercase tracking-widest text-sm">Start your conversation</p>
                  </div>
               ) : (
                  messages.map((msg, idx) => (
                    <div 
                      key={msg.id} 
                      className={`flex ${msg.senderId === activeUser?.id ? 'justify-end' : 'justify-start'}`}
                    >
                       <div className={`max-w-[70%] p-6 rounded-[2.5rem] shadow-sm relative transition-all hover:shadow-lg ${msg.senderId === activeUser?.id ? 'bg-nearbuy-secondary text-white rounded-br-none' : 'bg-white text-nearbuy-secondary border border-gray-100 rounded-bl-none'}`}>
                          <p className="font-medium text-sm leading-relaxed">{msg.text}</p>
                          <span className={`text-[8px] font-black uppercase mt-2 block opacity-40 ${msg.senderId === activeUser?.id ? 'text-right' : 'text-left'}`}>
                             {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </div>
                    </div>
                  ))
               )}
               <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-8 border-t border-gray-100 bg-white">
               <form onSubmit={sendMessage} className="flex gap-4">
                  <input 
                    className="flex-1 px-8 py-5 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-[2rem] focus:ring-2 focus:ring-nearbuy-primary outline-none font-bold text-nearbuy-secondary placeholder:text-gray-300 transition-all"
                    placeholder="Type your message or negotiate price..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button 
                    type="submit"
                    className="bg-nearbuy-primary hover:bg-nearbuy-accent text-white w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-green-900/10 active:scale-90 transition-all shrink-0 border-0 cursor-pointer"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                     </svg>
                  </button>
               </form>
            </div>
           </>
         ) : (
           <div className="h-full flex items-center justify-center flex-col text-center p-20 animate-in fade-in zoom-in duration-700">
              <div className="w-32 h-32 bg-gray-50 rounded-[3rem] flex items-center justify-center mb-10 text-gray-200">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                 </svg>
              </div>
              <h2 className="text-5xl font-black text-nearbuy-secondary tracking-tighter italic mb-4">Chat Hub.</h2>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest max-w-[250px] leading-relaxed">Select a conversation from the list to start negotiating with local sellers.</p>
           </div>
         )}

         {/* Backdrop Decoration */}
         <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-nearbuy-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      </main>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex h-screen bg-gray-50 items-center justify-center font-black text-gray-400 uppercase tracking-widest text-sm">Loading Chat Hub...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
