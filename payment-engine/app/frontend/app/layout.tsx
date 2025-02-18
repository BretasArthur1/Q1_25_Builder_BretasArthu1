import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"
import WalletProvider from "@/components/providers/wallet-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Payment Engine",
  description: "A decentralized payment engine for subscription services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          {children}
          <Toaster richColors position="top-right" />
        </WalletProvider>
      </body>
    </html>
  );
}
