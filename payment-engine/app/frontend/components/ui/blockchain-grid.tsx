"use client"

import { useEffect, useRef } from "react"

export function BlockchainGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const blockSize = 40
    const spacing = blockSize * 1.5
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const drawBlock = (x: number, y: number, size: number, opacity: number) => {
      ctx.beginPath()
      ctx.rect(x, y, size, size)
      ctx.strokeStyle = `rgba(80, 250, 250, ${opacity})`
      ctx.stroke()

      // Draw connecting lines
      ctx.beginPath()
      ctx.moveTo(x + size / 2, y + size)
      ctx.lineTo(x + size / 2, y + spacing)
      ctx.moveTo(x + size, y + size / 2)
      ctx.lineTo(x + spacing, y + size / 2)
      ctx.strokeStyle = `rgba(80, 250, 250, ${opacity * 0.5})`
      ctx.stroke()
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      time += 0.001

      for (let x = 0; x < canvas.width + spacing; x += spacing) {
        for (let y = 0; y < canvas.height + spacing; y += spacing) {
          const opacity = (Math.sin(x * 0.05 + y * 0.05 + time) + 1) * 0.1
          drawBlock(x, y, blockSize, opacity)
        }
      }

      requestAnimationFrame(animate)
    }

    resize()
    window.addEventListener("resize", resize)
    animate()

    return () => {
      window.removeEventListener("resize", resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none opacity-20" />
}

