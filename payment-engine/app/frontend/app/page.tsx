"use client"

import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { Dashboard } from "@/components/dashboard"
import { BlockchainGrid } from "@/components/ui/blockchain-grid"
import { WalletParticles } from "@/components/ui/wallet-particles"

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 wallet-bg opacity-5" />
      <BlockchainGrid />
      <WalletParticles />
      <div className="relative">
        <Header />
        <main>
          <Hero />
          <Features />
          <Dashboard />
        </main>
      </div>
    </div>
  )
}
