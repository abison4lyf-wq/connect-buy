"use client";

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  id: string | number;
  image: string;
  title: string;
  description?: string;
  price: number;
  lga: string;
  rating: number;
  sellerId: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ id, image, title, description, price, lga, rating, sellerId }) => {
  const { addToCart } = useCart();
  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full">
      <Link href={`/product/${id}`} className="block relative aspect-[3.5/4] overflow-hidden bg-gray-100">
        <img 
          src={image} 
          alt={title} 
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-nearbuy-primary shadow-sm border border-gray-100">
          {lga}
        </div>
      </Link>
      
      <div className="p-5 flex flex-col flex-grow">
        <Link href={`/product/${id}`}>
          <h3 className="text-nearbuy-secondary font-black text-lg group-hover:text-nearbuy-primary transition-colors leading-tight mb-1">
            {title}
          </h3>
        </Link>

        {description && (
          <p className="text-gray-400 text-xs font-medium leading-relaxed line-clamp-2 mb-3">
            {description}
          </p>
        )}
        
        <div className="flex items-center mb-4">
          <div className="flex text-yellow-500">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? 'fill-current' : 'text-gray-200'}`} viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-[10px] font-black text-gray-400 ml-2 tracking-widest uppercase">({rating})</span>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</span>
            <span className="text-xl font-black text-nearbuy-secondary font-mono leading-none">
              ₦{price.toLocaleString()}
            </span>
          </div>
          <button 
            onClick={() => addToCart({ id, title, price, image, sellerId })}
            className="bg-nearbuy-primary hover:bg-nearbuy-accent text-white font-black px-5 py-2.5 rounded-[1rem] shadow-sm active:scale-95 transition-transform text-[10px] uppercase tracking-[0.15em] whitespace-nowrap"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
