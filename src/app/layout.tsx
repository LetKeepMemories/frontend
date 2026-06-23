import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Providers from "./providers";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: "Lets Keep Memories",
  description: "A digital memory and celebration platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable}`}>
        <Providers>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <div style={{ flex: 1 }}>
              {children}
            </div>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
