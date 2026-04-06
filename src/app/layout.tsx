import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Connect Buy | The Hyperlocal Marketplace",
  description: "Shop from verified local sellers in your LGA and get your items delivered instantly.",
};

import { CartProvider } from "@/context/CartContext";
import Script from "next/script";
import { Toaster } from "react-hot-toast";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import PlatformSync from "@/components/PlatformSync";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased font-sans"
    >
      <body className={`${inter.className} min-h-full flex flex-col`}>
        <CartProvider>
          <PlatformSync />
          <Navbar />
          {children}
        </CartProvider>
        <Toaster position="top-center" reverseOrder={true} />
        <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
