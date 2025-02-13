import Image from "next/image"

export function Partners() {
  return (
    <section className="py-16 bg-black/50">
      <div className="container px-4">
        <h2 className="text-center text-gray-400 mb-8">Leading the Way in Crypto Trust with Webtrix</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-items-center">
          <div className="grayscale opacity-70 hover:opacity-100 transition">
            <Image src="/placeholder.svg" alt="Partner" width={120} height={40} />
          </div>
          <div className="grayscale opacity-70 hover:opacity-100 transition">
            <Image src="/placeholder.svg" alt="Partner" width={120} height={40} />
          </div>
          <div className="grayscale opacity-70 hover:opacity-100 transition">
            <Image src="/placeholder.svg" alt="Partner" width={120} height={40} />
          </div>
          <div className="grayscale opacity-70 hover:opacity-100 transition">
            <Image src="/placeholder.svg" alt="Partner" width={120} height={40} />
          </div>
          <div className="grayscale opacity-70 hover:opacity-100 transition">
            <Image src="/placeholder.svg" alt="Partner" width={120} height={40} />
          </div>
        </div>
      </div>
    </section>
  )
}

