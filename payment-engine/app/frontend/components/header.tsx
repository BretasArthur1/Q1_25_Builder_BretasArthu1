"use client"

import Image from "next/image"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import logo from "./favicon.ico"
import { useEffect, useState } from "react"
import Link from "next/link"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300 ${
      isScrolled ? 'bg-black/50 backdrop-blur-lg' : ''
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Image
              src={logo}
              alt="SWQuery Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
          </Link>
          <span className="text-xl font-bold gradient-text">SWQuery</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
        </nav>
        <div className="flex items-center gap-4">
          <WalletMultiButton className="button-primary" />
        </div>
      </div>
    </header>
  )
}

