import { Button } from "@/components/ui/button"

export function FAQ() {
  return (
    <section className="py-16 border-t border-white/10">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Have a Questions?<br />
            We  &apos;ve Got Your Answers.
          </h2>
          <Button variant="outline" className="border-white/20 text-white">
            Read More
          </Button>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">
              What is Webtrix?
            </h3>
            <p className="text-gray-400">
              Webtrix is a comprehensive blockchain platform that enables secure transactions and efficient asset management across multiple networks.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">
              How do I start using Webtrix?
            </h3>
            <p className="text-gray-400">
              Getting started is easy! Simply create an account, complete verification, and you can begin exploring our platform&apos;s features.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

