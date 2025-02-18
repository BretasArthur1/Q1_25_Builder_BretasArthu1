'use client';

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { BlockchainGrid } from "@/components/ui/blockchain-grid";
import { WalletParticles } from "@/components/ui/wallet-particles";
import { Header } from '@/components/header';
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { createAnchorClient, type Plan } from '@/lib/anchorClient';

// Interface defining the structure of user's dashboard data
interface UserDashboardData {
  availableRequests: number;  // Number of API requests remaining
  activePlan: Plan | null;    // Currently active subscription plan
}

export default function DashboardPage() {
  // Wallet connection hooks
  const { publicKey } = useWallet();
  const anchorWallet = useAnchorWallet();
  
  // State management for user's dashboard data and loading state
  const [dashboardData, setDashboardData] = useState<UserDashboardData>({
    availableRequests: 0,
    activePlan: null
  });
  const [loading, setLoading] = useState(true);

  // Effect hook to fetch user's subscription data when wallet is connected
  useEffect(() => {
    const fetchUserData = async () => {
      if (!publicKey || !anchorWallet) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const client = createAnchorClient(anchorWallet);

        // Fetch user's subscription data from the blockchain
        const userAccount = await client.getUserAccount(publicKey);
        
        if (userAccount) {
          // Get the most recent subscription plan
          const activePlan = userAccount.subscribedPlans.length > 0
            ? userAccount.subscribedPlans[userAccount.subscribedPlans.length - 1]
            : null;

          // Update dashboard with user's current subscription status
          setDashboardData({
            availableRequests: Number(userAccount.totalRequests),
            activePlan: activePlan ? {
              id: Number(activePlan.id),
              name: activePlan.name,
              price: Number(activePlan.price),
              requests: activePlan.requests,
              description: activePlan.description
            } : null
          });
        } else {
          // Reset dashboard for users without any subscription
          setDashboardData({
            availableRequests: 0,
            activePlan: null
          });
        }
      } catch (error) {
        // Handle case where user account doesn't exist yet
        if (error instanceof Error && error.message.includes("Account does not exist")) {
          setDashboardData({
            availableRequests: 0,
            activePlan: null
          });
        } else {
          console.error('Error fetching user data:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [publicKey, anchorWallet]); // Re-fetch when wallet changes

  // Helper function to display the current plan status
  const getPlanDisplay = () => {
    if (loading) return 'Loading...';
    if (!dashboardData.activePlan) return 'No Active Plan';
    return dashboardData.activePlan.name;
  };

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
              <p className="text-5xl font-bold text-primary bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                {loading ? '...' : dashboardData.availableRequests}
              </p>
              <p className="text-sm text-gray-400 mt-3">Remaining API calls in your plan</p>
            </Card>

            <Card className="p-8 shadow-lg bg-black/40 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
              <h2 className="text-xl font-semibold mb-3 text-white/80">Subscription Tier</h2>
              <p className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                {getPlanDisplay()}
              </p>
              <p className="text-sm text-gray-400 mt-3">Current active subscription</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
