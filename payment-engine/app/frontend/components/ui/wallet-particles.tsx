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

      const startX = Math.random() * container.offsetWidth
      const startY = Math.random() * container.offsetHeight
      const endX = Math.random() * container.offsetWidth
      const endY = Math.random() * container.offsetHeight

      particle.style.left = `${startX}px`
      particle.style.top = `${startY}px`

      container.appendChild(particle)

      const animation = particle.animate(
        [
          { transform: `translate(0, 0)`, opacity: 0 },
          { opacity: 1, offset: 0.1 },
          { transform: `translate(${endX - startX}px, ${endY - startY}px)`, opacity: 0 },
        ],
        {
          duration: Math.random() * 3000 + 2000,
          easing: "cubic-bezier(0.4, 0.0, 0.2, 1)",
        },
      )

      animation.onfinish = () => {
        particle.remove()
        createParticle()
      }
    }

    for (let i = 0; i < 50; i++) {
      createParticle()
    }
  }, [])

  return <div ref={particlesRef} className="fixed inset-0 pointer-events-none overflow-hidden opacity-30" />
}

