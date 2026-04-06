"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { compressImage } from "@/utils/image";
import { toast } from "react-hot-toast";
import { LOCATIONS_DATA } from "@/data/locations";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

const SHOP_GROUPS = [
  { id: "farmers", name: "Farmers Market" },
  { id: "tech", name: "Tech Hub" },
  { id: "fashion", name: "Fashion District" },
  { id: "food", name: "Food Court" },
  { id: "needs", name: "General Essentials" },
  { id: "declutter", name: "Declutter Store" },
];

export default function SellerRegistration() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    phone: "",
    description: "",
    shopImage: "", 
    category: "",
    locations: [{ state: "", lga: "" }],
    agreedToTerms: false,
    password: "",
    tier: "free",
    paymentReference: ""
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setFormData({ ...formData, shopImage: compressed });
      };
      reader.readAsDataURL(file);
    }
  };

  const addLocation = () => {
    const maxLocations = formData.tier === 'pro' ? 3 : 1;
    if (formData.locations.length < maxLocations) {
      setFormData({
        ...formData,
        locations: [...formData.locations, { state: "", lga: "" }],
      });
    } else {
      toast.error(`You can only serve up to ${maxLocations} LGA(s) on the ${formData.tier} tier.`);
    }
  };

  const removeLocation = (index: number) => {
    const newLocations = formData.locations.filter((_, i) => i !== index);
    setFormData({ ...formData, locations: newLocations });
  };

  const updateLocation = (index: number, updates: Record<string, string>) => {
    const newLocations = formData.locations.map((loc, i) => 
      i === index ? { ...loc, ...updates } : loc
    );
    setFormData(prev => ({ ...prev, locations: newLocations }));
  };

  const finishRegistration = (autoVerify = false) => {
    const newSeller = {
      id: "s_" + Date.now(),
      name: formData.businessName,
      email: formData.email,
      phone: formData.phone,
      description: formData.description,
      image: formData.shopImage || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=400",
      rating: 5.0,
      relationship: "New",
      delivery: "Same Day",
      category: formData.category,
      locations: formData.locations,
      verified: autoVerify, 
      paymentStatus: autoVerify ? 'paid' : (formData.tier === 'pro' ? 'pending' : 'verified'),
      paymentReference: autoVerify ? 'Paystack Card Payment' : formData.paymentReference,
      tier: formData.tier,
      products: [
        { id: "p_" + Date.now(), title: "Welcome Deal", price: 1000, image: "https://images.unsplash.com/photo-1599481238640-dfc41b0501d9?q=80&w=400" }
      ]
    };

    const newUser = {
      id: "u_" + Date.now(),
      name: formData.businessName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: "seller",
      tier: formData.tier,
      verified: autoVerify || formData.tier === 'free', 
      sellerId: newSeller.id,
      createdAt: new Date().toISOString()
    };

    const existingSellers = JSON.parse(localStorage.getItem('nearbuy_sellers') || '[]');
    localStorage.setItem('nearbuy_sellers', JSON.stringify([...existingSellers, newSeller]));

    const existingUsers = JSON.parse(localStorage.getItem('nearbuy_users') || '[]');
    localStorage.setItem('nearbuy_users', JSON.stringify([...existingUsers, newUser]));

    localStorage.setItem('active_seller_id', newSeller.id);
    localStorage.setItem('nearbuy_active_user', JSON.stringify(newUser));

    if (autoVerify) {
      toast.success("Payment Received! Store Instant-Activated ⚡");
    } else {
      toast.success("Store Created Successfully! Awaiting Verification.");
    }
    router.push("/seller-dashboard");
  };

  const handlePaystackPayment = () => {
    if (!window.PaystackPop) {
      toast.error("Paystack SDK not loaded.");
      return;
    }

    try {
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_KEY || 'pk_test_demo_key_123456789',
        email: formData.email,
        amount: 5000 * 100, // ₦5,000 in Kobo
        currency: "NGN",
        callback: (response: any) => {
          finishRegistration(true);
        },
        onClose: () => {
          toast("Payment cancelled.", { icon: 'ℹ️' });
        },
      });
      handler.openIframe();
    } catch (e) {
      toast.error("Error initializing Paystack.");
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreedToTerms) {
      toast.error("Please agree to the terms and conditions to continue.");
      return;
    }
    if (formData.tier === 'pro') {
      handlePaystackPayment();
    } else {
      finishRegistration();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-3 text-nearbuy-secondary hover:text-nearbuy-primary transition-all group z-50">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border border-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block text-nearbuy-secondary">Home</span>
      </Link>

      <div className="max-w-xl w-full mx-auto space-y-8 bg-white p-10 md:pt-16 md:pb-12 rounded-[3.5rem] shadow-2xl shadow-gray-200 border border-gray-100 relative overflow-hidden transition-all duration-700">
        <div>
          <h2 className="text-center text-4xl font-extrabold text-nearbuy-secondary tracking-tight italic">
            Launch Your <span className="text-nearbuy-primary">Shop.</span>
          </h2>
          <p className="mt-2 text-center text-[10px] text-gray-400 font-black uppercase tracking-widest leading-loose">
            Join the hyperlocal revolution.<br/>We value good behavior and quality service.
          </p>
        </div>
        
        <form className="mt-10 space-y-8" onSubmit={handleSubmitForm}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Business Name</label>
                <input required className="w-full px-6 py-5 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all placeholder:text-gray-300 font-bold"
                  placeholder="e.g. Mide's Hub" value={formData.businessName} onChange={(e) => setFormData({...formData, businessName: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Phone Number</label>
                <input required className="w-full px-6 py-5 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all placeholder:text-gray-300 font-bold"
                  placeholder="08012345678" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Email Address</label>
                <input required type="email" className="w-full px-6 py-5 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all placeholder:text-gray-300 font-bold"
                  placeholder="seller@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Password</label>
                <input required type="password" className="w-full px-6 py-5 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all placeholder:text-gray-300 font-bold"
                  placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 text-center">Shop Picture</label>
                  <div className="relative w-32 h-32 bg-gray-100 rounded-3xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-nearbuy-primary transition-colors cursor-pointer group">
                    {formData.shopImage ? <img src={formData.shopImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl group-hover:text-nearbuy-primary">+</div>}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Shop Profile / Bio</label>
                  <textarea required className="w-full px-6 py-5 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all placeholder:text-gray-300 font-bold min-h-[128px]"
                    placeholder="Briefly describe what your shop offers..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Market Hub</label>
              <select required className="w-full px-6 py-5 bg-gray-50 border-0 ring-1 ring-gray-100 rounded-2xl focus:ring-2 focus:ring-nearbuy-primary outline-none transition-all font-bold appearance-none bg-white cursor-pointer"
                value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                <option value="">Select Category</option>
                {SHOP_GROUPS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            <div className="space-y-4">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest px-2">Service Areas (Max 1 LGA - Upgrade to Pro for more!)</label>
                {formData.locations.map((loc, index) => (
                <div key={index} className="p-8 bg-nearbuy-secondary/5 rounded-[2rem] border border-nearbuy-secondary/10 relative transition-all hover:bg-nearbuy-secondary/[0.07]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <select required className="w-full px-5 py-4 bg-white border-0 ring-1 ring-gray-100 rounded-xl focus:ring-2 focus:ring-nearbuy-primary outline-none font-bold text-sm cursor-pointer"
                        value={loc.state} onChange={(e) => updateLocation(index, { state: e.target.value, lga: "" })}>
                        <option value="">Select State</option>
                        {Object.keys(LOCATIONS_DATA).map(state => <option key={state} value={state}>{state}</option>)}
                    </select>
                    <select required disabled={!loc.state} className="w-full px-5 py-4 bg-white border-0 ring-1 ring-gray-100 rounded-xl focus:ring-2 focus:ring-nearbuy-primary outline-none font-bold text-sm disabled:opacity-50 cursor-pointer"
                        value={loc.lga} onChange={(e) => updateLocation(index, { lga: e.target.value })}>
                        <option value="">Select LGA</option>
                        {loc.state && LOCATIONS_DATA[loc.state].map(lga => <option key={lga} value={lga}>{lga}</option>)}
                    </select>
                  </div>
                  {index > 0 && <button type="button" onClick={() => removeLocation(index)} className="mt-4 text-[10px] font-black text-red-400 uppercase hover:underline tracking-widest border-0 bg-transparent cursor-pointer">Remove Location</button>}
                </div>
                ))}
                {formData.locations.length < (formData.tier === 'pro' ? 3 : 1) && (
                <button type="button" onClick={addLocation} className="text-[12px] font-black text-nearbuy-primary uppercase flex items-center gap-2 border-0 bg-transparent cursor-pointer hover:underline px-2 tracking-widest">+ Add Service LGA</button>
                )}
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest px-2">Subscription Tier</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`relative p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all ${formData.tier === 'free' ? 'border-nearbuy-primary bg-nearbuy-primary/5' : 'border-gray-100 bg-white hover:border-nearbuy-primary/30'}`}>
                  <input type="radio" name="tier" value="free" className="absolute top-8 right-8 accent-nearbuy-primary w-5 h-5" checked={formData.tier === 'free'} onChange={() => setFormData({...formData, tier: 'free', locations: formData.locations.slice(0, 1)})} />
                  <h3 className="text-xl font-black text-nearbuy-secondary mb-1">Basic</h3>
                  <p className="text-3xl font-black text-gray-900 mb-6 italic tracking-tight">₦0</p>
                  <ul className="text-[11px] font-bold text-gray-500 space-y-2">
                    <li className="flex gap-2"><span>✓</span> Up to 10 products</li>
                    <li className="flex gap-2"><span>✓</span> 1 Service LGA limit</li>
                    <li className="flex gap-2 text-nearbuy-primary uppercase font-black tracking-widest text-[9px]">3% platform fee</li>
                  </ul>
                </label>

                <label className={`relative p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all ${formData.tier === 'pro' ? 'border-nearbuy-primary bg-nearbuy-primary/5' : 'border-gray-100 bg-white hover:border-nearbuy-primary/30'}`}>
                  <input type="radio" name="tier" value="pro" className="absolute top-8 right-8 accent-nearbuy-primary w-5 h-5" checked={formData.tier === 'pro'} onChange={() => setFormData({...formData, tier: 'pro'})} />
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-full tracking-[0.2em] shadow-lg shadow-orange-500/20">PRO</div>
                  <h3 className="text-xl font-black text-nearbuy-secondary mb-1 italic">Professional</h3>
                  <p className="text-3xl font-black text-gray-900 mb-6 italic tracking-tight">₦5,000<span className="text-sm text-gray-400 font-medium">/mo</span></p>
                  <ul className="text-[11px] font-bold text-gray-500 space-y-2">
                    <li className="flex gap-2"><span>⭐</span> Unlimited Products</li>
                    <li className="flex gap-2"><span>📍</span> 3 LGAs / Statewide</li>
                    <li className="flex gap-2 text-nearbuy-primary uppercase font-black tracking-widest text-[9px]">1.5% platform fee</li>
                    <li className="flex gap-2 text-orange-500 uppercase font-black tracking-widest text-[9px]">Featured Badge</li>
                  </ul>
                </label>
              </div>
            </div>

            <div className="flex items-start gap-4 p-8 bg-nearbuy-primary/5 rounded-3xl border border-nearbuy-primary/10">
                <input type="checkbox" className="mt-1 w-5 h-5 accent-nearbuy-primary cursor-pointer" checked={formData.agreedToTerms} onChange={(e) => setFormData({...formData, agreedToTerms: e.target.checked})} />
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">I agree to maintain <span className="text-nearbuy-primary font-bold">Good Behavior</span> and verified service standards.</p>
            </div>
          </div>

          <button type="submit" className="w-full bg-nearbuy-primary hover:bg-nearbuy-accent text-white font-black py-7 rounded-[2.5rem] shadow-xl shadow-green-900/20 active:scale-95 transition-all text-xl cursor-pointer border-0 uppercase tracking-[0.2em] italic">
            {formData.tier === 'pro' ? 'Proceed to Payout' : 'Create My Store'}
          </button>
        </form>
      </div>
    </div>
  );
}
