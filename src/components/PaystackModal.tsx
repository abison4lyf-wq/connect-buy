"use client";

import { useState, useEffect } from "react";

interface PaystackModalProps {
  amount: number;
  email: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function PaystackModal({ amount, email, onSuccess, onClose, isOpen }: PaystackModalProps) {
  const [activeMethod, setActiveMethod] = useState<'card' | 'transfer' | 'bank' | 'ussd'>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePay = (status: 'success' | 'declined') => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (status === 'success') {
        const reference = "DEMO-" + Math.random().toString(36).substr(2, 9).toUpperCase();
        onSuccess(reference);
      } else {
        alert("Payment Declined. Please try a different card.");
      }
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl h-[550px] rounded-lg shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-500 relative">
        
        {/* Sidebar */}
        <div className="w-1/3 bg-gray-50 border-r border-gray-100 flex flex-col p-6">
           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">Pay With</h3>
           <nav className="space-y-4">
              {[
                { id: 'card', name: 'Card', icon: '💳' },
                { id: 'transfer', name: 'Transfer', icon: '🏦' },
                { id: 'bank', name: 'Bank', icon: '🏛️' },
                { id: 'ussd', name: 'USSD', icon: '*#' }
              ].map((m) => (
                <button 
                  key={m.id}
                  onClick={() => setActiveMethod(m.id as any)}
                  className={`w-full flex items-center gap-4 py-3 px-4 rounded-lg text-sm font-bold transition-all ${
                    activeMethod === m.id ? 'bg-white text-[#09A5DB] shadow-sm border border-gray-100' : 'text-gray-500 hover:bg-gray-100/50'
                  }`}
                >
                  <span className="text-xl">{m.icon}</span>
                  {m.name}
                </button>
              ))}
           </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
           {/* Header */}
           <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-[#09A5DB] rounded-[4px] relative overflow-hidden flex items-center justify-center">
                    <div className="w-4 h-4 bg-white/30 rounded-full blur-[2px]"></div>
                    <div className="w-3 h-3 bg-white rounded-[2px] z-10 shadow-sm"></div>
                 </div>
                 <span className="font-black text-[#1F2937] tracking-tighter">paystack</span>
              </div>
              <div className="text-right">
                 <p className="text-[10px] text-gray-400 font-bold uppercase">{email || "user@example.com"}</p>
                 <p className="text-lg font-black text-[#22C55E]">Pay NGN {amount.toLocaleString()}</p>
              </div>
           </div>

           {/* Body */}
           <div className="flex-1 p-10 overflow-y-auto relative">
              <div className="max-w-md mx-auto text-center space-y-8">
                 <div className="bg-yellow-50 text-yellow-700 text-[10px] font-black uppercase px-4 py-2 rounded-full inline-block mb-4">TEST MODE</div>
                 <h2 className="text-xl font-bold text-gray-900 leading-tight">Use any of the options below to test the payment flow</h2>
                 
                 <div className="space-y-4">
                    <button 
                      onClick={() => handlePay('success')}
                      disabled={isProcessing}
                      className="w-full bg-white border border-gray-200 p-5 rounded-xl hover:border-[#09A5DB] hover:bg-blue-50 transition-all flex items-center gap-6 group text-left disabled:opacity-50"
                    >
                       <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-[#09A5DB] flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-[#09A5DB] rounded-full opacity-0 group-hover:opacity-100 transition-all"></div>
                       </div>
                       <span className="font-bold text-gray-700">Success</span>
                    </button>

                    <button 
                      className="w-full bg-white border border-gray-200 p-5 rounded-xl hover:border-[#09A5DB] hover:bg-blue-50 transition-all flex items-center gap-6 group text-left"
                    >
                       <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-[#09A5DB] flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-[#09A5DB] rounded-full opacity-0 group-hover:opacity-100 transition-all"></div>
                       </div>
                       <span className="font-bold text-gray-700">Bank Authentication</span>
                    </button>

                    <button 
                      onClick={() => handlePay('declined')}
                      disabled={isProcessing}
                      className="w-full bg-white border border-gray-200 p-5 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all flex items-center gap-6 group text-left disabled:opacity-50"
                    >
                       <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-red-400 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-all"></div>
                       </div>
                       <span className="font-bold text-gray-700">Declined</span>
                    </button>
                 </div>

                 <button 
                   onClick={() => handlePay('success')}
                   disabled={isProcessing}
                   className="w-full bg-[#22C55E] hover:bg-[#1DA14A] text-white font-black py-5 rounded-xl shadow-lg shadow-green-900/10 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 text-sm"
                 >
                    {isProcessing ? (
                      <div className="flex gap-2">
                         <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                         <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100"></div>
                         <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></div>
                      </div>
                    ) : (
                      <>Pay NGN {amount.toLocaleString()}</>
                    )}
                 </button>

                 <button onClick={onClose} className="text-gray-400 text-xs font-bold hover:text-red-500 transition-colors uppercase tracking-widest bg-transparent border-0 cursor-pointer">
                    Cancel Payment
                 </button>
              </div>
           </div>
        </div>

        {/* Close Button UI Link */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 border-0 bg-transparent cursor-pointer font-bold"
        >
           X
        </button>
      </div>
    </div>
  );
}
