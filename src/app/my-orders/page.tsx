"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const activeUserRaw = localStorage.getItem('nearbuy_active_user');
    if (!activeUserRaw) {
      router.push('/auth/selection');
      return;
    }
    const user = JSON.parse(activeUserRaw);
    setIsAuthorized(true);

    const allOrders = JSON.parse(localStorage.getItem('connectbuy_orders') || '[]');
    const myOrders = allOrders.filter((o: any) => o.buyerId === (user.id || user.email));
    setOrders(myOrders.reverse());
  }, [router]);

  const confirmReceipt = (orderId: string) => {
    if (confirm("Have you physically received all items in this order? Clicking 'Confirm' will release the funds to the seller.")) {
      const allOrders = JSON.parse(localStorage.getItem('connectbuy_orders') || '[]');
      const updatedOrders = allOrders.map((o: any) => 
        o.id === orderId ? { ...o, status: 'verified' } : o
      );
      localStorage.setItem('connectbuy_orders', JSON.stringify(updatedOrders));
      setOrders(updatedOrders.reverse());
      toast.success("Transaction Completed! Thank you for using Connect Buy Escrow.");
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center font-black text-gray-400 animate-pulse tracking-widest text-sm uppercase">Accessing Secure Orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <Link href="/marketplace" className="text-nearbuy-primary font-black text-[10px] uppercase tracking-widest mb-2 block hover:underline">← Back to Market</Link>
            <h1 className="text-4xl font-black text-nearbuy-secondary tracking-tight">My <span className="text-nearbuy-primary">Orders.</span></h1>
            <p className="text-gray-500 font-medium mt-2">Track your hyperlocal purchases and release funds securely.</p>
          </div>
          <div className="bg-nearbuy-primary/10 px-4 py-2 rounded-xl border border-nearbuy-primary/20">
             <p className="text-[10px] font-black text-nearbuy-primary uppercase tracking-widest leading-none">Escrow Status</p>
             <p className="text-xs font-bold text-nearbuy-secondary mt-1">Platform Secured 🛡️</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-20 text-center border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl opacity-50">📦</div>
            <h2 className="text-2xl font-black text-nearbuy-secondary mb-2">No orders found</h2>
            <p className="text-gray-400 mb-8 max-w-xs mx-auto">You haven't made any purchases yet. Your orders will appear here once you checkout.</p>
            <Link href="/marketplace" className="bg-nearbuy-primary text-white font-black py-4 px-10 rounded-2xl shadow-lg active:scale-95 transition-all text-sm uppercase tracking-widest">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order Identifier</p>
                    <p className="font-extrabold text-nearbuy-secondary">{order.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                      order.status === 'verified' ? 'bg-green-100 text-green-600' : 
                      order.status === 'delivered' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="space-y-4 mb-8">
                    {order.items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-4">
                        <img src={item.image} className="w-12 h-12 rounded-xl object-cover" alt="" />
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-500">₦{item.price.toLocaleString()} x {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-8 border-t border-gray-50">
                    <div>
                      <p className="text-2xl font-black text-nearbuy-secondary font-mono">₦{order.total.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Paid via Paystack</p>
                    </div>

                    {order.status === 'pending' && (
                      <div className="bg-nearbuy-secondary text-white p-6 rounded-3xl flex-1 max-w-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-bl-full transition-transform group-hover:scale-110"></div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-nearbuy-primary mb-2">Delivery Handshake Code</p>
                        <div className="flex items-end gap-3">
                          <p className="text-4xl font-black tracking-[0.2em]">{order.verificationCode}</p>
                          <p className="text-[10px] font-medium text-gray-400 leading-tight mb-1 max-w-[120px]">Give this to the seller only when receiving items.</p>
                        </div>
                      </div>
                    )}

                    {order.status === 'delivered' && (
                      <button 
                        onClick={() => confirmReceipt(order.id)}
                        className="bg-nearbuy-primary text-white font-black py-5 px-10 rounded-2xl shadow-xl shadow-green-900/10 active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center gap-3"
                      >
                        ✅ Confirm & Release Funds
                      </button>
                    )}

                    {order.status === 'verified' && (
                      <div className="flex items-center gap-2 text-green-600 font-bold">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Transaction Finalized
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
