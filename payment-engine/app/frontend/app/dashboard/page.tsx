'use client';

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { BlockchainGrid } from "@/components/ui/blockchain-grid";
import { WalletParticles } from "@/components/ui/wallet-particles";
import { Header } from '@/components/header';

export default function DashboardPage() {
  const [requests, setRequests] = useState<number>(0);
  const [plan, setPlan] = useState<string>('Free');

  // TODO: Replace this with actual API calls to get user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // real API calls
        // For now using mock data
        setRequests(150);
        setPlan('Pro');
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 wallet-bg opacity-5" />
      <BlockchainGrid />
      <WalletParticles />
      <div className="relative">
        <Header />
        <div className="container mx-auto px-4 py-16 relative z-10">
          <h1 className="text-4xl font-bold mb-8 text-center hero-title">Your Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="p-8 shadow-lg bg-black/40 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
            <h2 className="text-xl font-semibold mb-3 text-white/80">Available Requests</h2>
            <p className="text-5xl font-bold text-primary bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">{requests}</p>
            <p className="text-sm text-gray-400 mt-3">Remaining API calls in your plan</p>
          </Card>

          <Card className="p-8 shadow-lg bg-black/40 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
            <h2 className="text-xl font-semibold mb-3 text-white/80">Subscription Tier</h2>
            <p className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">{plan}</p>
            <p className="text-sm text-gray-400 mt-3">Current active subscription</p>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}
