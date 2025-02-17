import React from "react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <div className="space-y-8">
          <div>
            <h1 className="hero-title">
              Revolutionize Your{" "}
              <span className="block">Wallet Analysis</span>
            </h1>
          </div>
            
          <p className="text-lg text-white/70">
            Experience the future of blockchain analytics with SWQuery.
          </p>

          <div className="flex flex-wrap items-center justify-center w-full">
            <Link href="/pricing" className="button-primary mx-4">
              Plans
            </Link>
            <Link href= "dashboard" className="button-primary mx-4">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

