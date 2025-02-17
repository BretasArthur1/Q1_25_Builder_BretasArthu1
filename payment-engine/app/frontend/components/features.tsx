"use client"

import { LineChart, ShieldCheck, Wallet, Search } from "lucide-react"

export function Features() {
  const features = [
    {
      title: "Real-Time Wallet Analytics",
      description:
        "Monitor your blockchain wallets and track transactions in real-time with our advanced analytics dashboard.",
      icon: LineChart,
    },
    {
      title: "Secure Blockchain Integration",
      description:
        "Integrate our SDK into your application to analyze wallet activities and transactions.",
      icon: ShieldCheck,
    },
    {
      title: "Multi-Wallet Support",
      description: "Analyze and manage multiple wallets across different blockchains from a single dashboard.",
      icon: Wallet,
    },
    {
      title: "Deep Blockchain Insights",
      description: "Gain valuable insights into wallet activities, token distributions, and transaction patterns.",
      icon: Search,
    },
  ]

  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
            Powerful Features of SWQuery
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Our platform combines advanced blockchain technology with intuitive wallet analysis tools
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 relative z-10">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card p-8 hover:transform hover:scale-[1.02] transition-all duration-200"
            >
              <h3 className="text-xl font-semibold mb-4 text-white">
                {feature.title}
              </h3>
              <p className="text-white/70">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Floating Elements Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="floating-elements" />
        </div>
      </div>
    </section>
  )
}

