import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { LangProvider } from "@/context/LangContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const geist = Inter({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Tayyab Jewellers — 22K Gold & Silver Jewellery",
    template: "%s · Tayyab Jewellers",
  },
  description:
    "Shop hand-crafted 22K gold and silver jewellery: rings, necklaces, earrings, bangles and bridal sets.",
  keywords: ["jewellery", "gold", "silver", "22K", "rings", "necklaces"],
  openGraph: {
    title: "Tayyab Jewellers",
    description: "Exquisite 22K gold and silver jewellery.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-full flex flex-col bg-white text-stone-900 antialiased">
        <LangProvider>
          <CartProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <WhatsAppButton />
          </CartProvider>
        </LangProvider>
      </body>
    </html>
  );
}
