import { Button } from "@/components/ui/button"

export function Liquidity() {
  const pools = [
    { pair: "BTC/ETH", apy: "45.25%", tvl: "$234.6M" },
    { pair: "ETH/USDT", apy: "38.75%", tvl: "$156.8M" },
    { pair: "MATIC/ETH", apy: "42.50%", tvl: "$98.3M" },
  ]

  return (
    <section className="py-16">
      <div className="container px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="space-y-4">
              {pools.map((pool) => (
                <div
                  key={pool.pair}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-white font-medium">{pool.pair}</div>
                    <div className="text-green-400">{pool.apy}</div>
                  </div>
                  <div className="text-gray-400">{pool.tvl}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Supply liquidity to leading pools.
            </h2>
            <p className="text-gray-400 mb-8">
              By contributing your assets to these high-performing pools, you can earn competitive returns while supporting the growth and stability of the ecosystem.
            </p>
            <Button className="bg-white text-black hover:bg-gray-100">
              Explore Top Pools
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

