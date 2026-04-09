"use client";

import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeUser, setActiveUser] = useState<any>(null);

  useEffect(() => {
    const activeUserRaw = localStorage.getItem('nearbuy_active_user');
    if (!activeUserRaw) {
      router.push('/auth/selection');
      return;
    }
    setActiveUser(JSON.parse(activeUserRaw));
    setIsAuthorized(true);
  }, [router]);

  const processOrder = (reference: string) => {
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Create the Order object
    const newOrder = {
      id: "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      buyerId: activeUser.id || activeUser.email,
      buyerName: activeUser.name,
      items: cart,
      total: totalPrice,
      status: 'pending',
      verificationCode: verificationCode,
      createdAt: new Date().toISOString(),
      paymentRef: reference
    };

    const existingOrders = JSON.parse(localStorage.getItem('connectbuy_orders') || '[]');
    localStorage.setItem('connectbuy_orders', JSON.stringify([...existingOrders, newOrder]));

    // Signal all tabs (especially seller) that a new order has arrived
    window.dispatchEvent(new Event('nearbuy_sync'));
    window.dispatchEvent(new StorageEvent('storage', { key: 'connectbuy_orders' }));

    clearCart();
    toast.success("Order Placed Successfully!");
    router.push("/my-orders");
  };

  const handleCheckout = () => {
    if (!activeUser) {
      router.push('/auth/selection');
      return;
    }

    if (!window.PaystackPop) {
      toast.error("Paystack SDK not loaded. Refreshing...");
      window.location.reload();
      return;
    }

    try {
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_KEY || 'pk_test_demo_key_123456789', // Fallback for dev
        email: activeUser.email || 'buyer@connectbuy.com',
        amount: totalPrice * 100, // Kobo
        currency: "NGN",
        callback: (response: any) => {
          processOrder(response.reference);
        },
        onClose: () => {
          toast("Payment cancelled.", { icon: 'ℹ️' });
        },
      });
      handler.openIframe();
    } catch (e) {
      toast.error("Error initializing payment.");
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center font-black text-gray-400 animate-pulse tracking-widest text-sm uppercase">Verifying Session...</div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-8 max-w-xs">Looks like you haven't added anything to your cart yet.</p>
        <Link href="/" className="bg-nearbuy-primary text-white font-black py-4 px-8 rounded-2xl shadow-lg transition-all active:scale-95">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
           <h1 className="text-3xl font-extrabold text-nearbuy-secondary">Checkout</h1>
           <Link href="/" className="text-sm font-bold text-nearbuy-primary hover:underline">Back to Store</Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-3xl flex items-center gap-6 shadow-sm border border-gray-100">
                <img src={item.image} alt={item.title} className="w-24 h-24 rounded-2xl object-cover" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                </div>
                <p className="font-mono font-black text-xl text-nearbuy-secondary">₦{(item.price * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-50 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between text-gray-500 font-medium">
                <span>Subtotal</span>
                <span className="font-mono">₦{totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500 font-medium">
                <span>Transaction Fee</span>
                <span className="text-nearbuy-primary font-bold">₦0 (Included)</span>
              </div>
              <div className="flex justify-between text-gray-500 font-medium">
                <span>Delivery</span>
                <span className="text-nearbuy-primary font-bold">FREE</span>
              </div>
            </div>
            
            <div className="flex justify-between text-2xl font-black text-nearbuy-secondary pt-6 border-t border-gray-100 italic">
              <span>Total</span>
              <span className="font-mono">₦{totalPrice.toLocaleString()}</span>
            </div>

            <button 
              onClick={handleCheckout}
              className="w-full bg-nearbuy-primary hover:bg-nearbuy-accent text-white font-black py-6 rounded-[2rem] transition-all shadow-xl shadow-green-900/20 active:scale-95 border-0 cursor-pointer text-xl uppercase tracking-widest italic"
            >
              Pay Now
            </button>

            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear your entire cart?')) {
                  clearCart();
                  toast.success('Cart cleared!');
                }
              }}
              className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest py-2 border-0 bg-transparent cursor-pointer transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Cart
            </button>
            
            <div className="flex items-center justify-center gap-3 opacity-60">
               <div className="w-6 h-6 bg-[#09A5DB] rounded-[4px]"></div>
               <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none">Secured by Paystack</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
