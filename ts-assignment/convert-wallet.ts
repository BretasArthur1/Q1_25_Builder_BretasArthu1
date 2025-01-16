import bs58 from "bs58";
import promptSync from "prompt-sync";

const prompt = promptSync();

function base58ToWallet() {
  const base58 = prompt("Enter your Base58 private key: ");
  try {
    const wallet = bs58.decode(base58);
    console.log("Wallet byte array:", Array.from(wallet));
  } catch (e: any) {
    console.error("Invalid Base58 key:", e.message);
  }
}

function walletToBase58() {
  const byteArrayInput = prompt(
    "Enter your wallet byte array (comma-separated): "
  );
  try {
    const byteArray = Uint8Array.from(
      byteArrayInput.split(",").map((val: string) => parseInt(val.trim(), 10))
    );
    const base58 = bs58.encode(byteArray);
    console.log("Base58 private key:", base58);
  } catch (e: any) {
    console.error("Invalid byte array:", e.message);
  }
}

const choice = prompt(
  "Choose: 1 for Base58 to Wallet, 2 for Wallet to Base58: "
);
if (choice === "1") {
  base58ToWallet();
} else if (choice === "2") {
  walletToBase58();
} else {
  console.error("Invalid choice. Please enter 1 or 2.");
}