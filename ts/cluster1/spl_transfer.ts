import { Commitment, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import wallet from "../../turbin3-wallet.json"
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Mint address
const mint = new PublicKey("31SMiv7BRKtX7cLbjAHF55tzv6rs2jUCdKL2oiTD3QjH");

// Recipient address
const to = new PublicKey("3pKiN8Q59NEUh4UsopfGAz3vJKJQGEfFnNDscqpxaqVW");

(async () => {
    try {
        // Get the token account of the fromWallet address, and if it does not exist, create it
        const fromAta = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, keypair.publicKey);
        console.log(`Your fromAta is: ${fromAta.address.toBase58()}`);
        // Get the token account of the toWallet address, and if it does not exist, create it
        const toAta = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, to);
        console.log(`Your toAta is: ${toAta.address.toBase58()}`);
        // Transfer the new token to the "toTokenAccount" we just created
        const transferTx = await transfer(connection, keypair, fromAta.address, toAta.address, keypair.publicKey, 10 * LAMPORTS_PER_SOL);
        console.log(`Your transfer txid: ${transferTx}`);
    } catch(e) {
        console.error(`Oops, something went wrong: ${e}`)
    }
})();