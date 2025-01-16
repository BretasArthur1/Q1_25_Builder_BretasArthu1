import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createSignerFromKeypair, signerIdentity, generateSigner, percentAmount } from "@metaplex-foundation/umi"
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";

import wallet from "../../turbin3-wallet.json"
import base58 from "bs58";

const RPC_ENDPOINT = "https://api.devnet.solana.com";
const umi = createUmi(RPC_ENDPOINT);

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const myKeypairSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(myKeypairSigner));
umi.use(mplTokenMetadata())

const mint = generateSigner(umi);

(async () => {
    const tx = await createNft(umi, {
        mint,
        authority: myKeypairSigner,
        name: "SWQueryNFT",
        symbol: "SWQ",
        uri: "https://devnet.irys.xyz/AwDG7bZ4dAuDrzgge7nqMQHn7r1VFtcVMWuL8KuGoB1B",
        sellerFeeBasisPoints: percentAmount(2.5), // 2.5% seller fee
    });

    const result = await tx.sendAndConfirm(umi);
    const signature = base58.encode(result.signature);

    console.log(`Successfully Minted! Check out your TX here:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`);

    console.log("Mint Address: ", mint.publicKey);
})();