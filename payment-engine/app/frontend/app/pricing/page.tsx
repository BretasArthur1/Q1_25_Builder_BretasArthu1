"use client"

import { Check, X } from "lucide-react"
import { Header } from "@/components/header"
import { BlockchainGrid } from "@/components/ui/blockchain-grid"
import { WalletParticles } from "@/components/ui/wallet-particles"

const tiers = [
  {
    name: 'Basic',
    id: 1,
    price: '10',
    description: 'Basic plan with 20 requests',
    features: [
      { name: '20 requests', included: true },
      { name: 'Priority Support', included: false },
    ],
    buttonText: 'Get Basic'
  },
  {
    name: 'Standard',
    id: 2,
    price: '20',
    description: 'Standard plan with 50 requests',
    features: [
      { name: '50 requests', included: true },
      { name: 'Priority Support', included: true },
    ],
    buttonText: 'Get Standard'
  },
  {
    name: 'Premium',
    id: 3,
    price: '50',
    description: 'Premium plan with 100 requests',
    features: [
      { name: '100 requests', included: true },
      { name: 'Priority Support', included: true },
    ],
    buttonText: 'Get Premium'
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 wallet-bg opacity-5" />
      <BlockchainGrid />
      <WalletParticles />
      <div className="relative">
        <Header />
        <div className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="text-base font-semibold leading-7 text-purple-500">Pricing</h1>
              <p className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Choose the perfect plan for your brand
              </p>
              <p className="mt-6 text-lg leading-8 text-white/70">
                Transform your business with our professional wallet analysis services
              </p>
            </div> 
            <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              {tiers.map((tier) => (
                <div
                  key={tier.name}
                  className="rounded-3xl bg-[#0F0F0F] p-8 ring-1 ring-gray-800"
                >
                  <h3 className="text-2xl font-bold text-white">
                    {tier.name}
                  </h3>
                  
                  <p className="mt-6 flex items-baseline gap-x-1">
                    <span className="text-4xl font-bold text-purple-500">${tier.price}</span>
                  </p>
                  <ul role="list" className="mt-8 space-y-3 text-base leading-6 text-gray-300">
                    {tier.features.map((feature) => (
                      <li key={feature.name} className="flex gap-x-3">
                        {feature.included ? (
                          <Check className="h-6 w-5 flex-none text-purple-500" aria-hidden="true" />
                        ) : (
                          <X className="h-6 w-5 flex-none text-gray-500" aria-hidden="true" />
                        )}
                        {feature.name}
                      </li>
                    ))}
                  </ul>
                  <button
                    className="mt-8 block w-full rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-3 py-3 text-center text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                  >
                    {tier.buttonText}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

