"use client"

import { useEffect, useRef } from "react"

export function WalletParticles() {
  const particlesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = particlesRef.current
    if (!container) return

    const createParticle = () => {
      const particle = document.createElement("div")
      particle.className = "absolute w-1 h-1 bg-primary rounded-full"

      const size = Math.random() * 4 + 1
      particle.style.width = `${size}px`
      particle.style.height = `${size}px`

      // Position the particle at a random fixed position
      const posX = Math.random() * container.offsetWidth
      const posY = Math.random() * container.offsetHeight

      particle.style.left = `${posX}px`
      particle.style.top = `${posY}px`

      container.appendChild(particle)

      const animation = particle.animate(
        [
          { opacity: 0 },
          { opacity: 0.8, offset: 0.1 },
          { opacity: 0.8, offset: 0.9 },
          { opacity: 0 },
        ],
        {
          duration: Math.random() * 3000 + 2000,
          easing: "ease-in-out",
        },
      )

      animation.onfinish = () => {
        particle.remove()
        createParticle()
      }
    }

    // Create initial particles
    for (let i = 0; i < 50; i++) {
      createParticle()
    }
  }, [])

  return <div ref={particlesRef} className="fixed inset-0 pointer-events-none overflow-hidden opacity-30" />
}

