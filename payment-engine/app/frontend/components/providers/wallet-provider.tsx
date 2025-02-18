"use client"

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets"
import { FC, ReactNode, useMemo } from "react"

// Import wallet modal styles for the connect wallet button
import "@solana/wallet-adapter-react-ui/styles.css"

/**
 * WalletProviders component sets up the Solana wallet connection infrastructure.
 * It provides:
 * 1. Connection to Solana network (devnet)
 * 2. Wallet connection capabilities (Phantom and Solflare)
 * 3. Wallet modal for connection UI
 */
const WalletProviders: FC<{ children: ReactNode }> = ({ children }) => {
  // Configure connection to Solana devnet
  const endpoint = "https://api.devnet.solana.com"
  
  // Initialize supported wallet adapters
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter()
    ],
    []
  )

  // Wrap the app with necessary providers for wallet functionality
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default WalletProviders
