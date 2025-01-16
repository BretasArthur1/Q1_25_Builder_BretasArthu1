import wallet from "../../turbin3-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"

// Create a devnet connection
const umi = createUmi('https://api.devnet.solana.com');

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
    try {
        // Follow this JSON structure
        // https://docs.metaplex.com/programs/token-metadata/changelog/v1.0#json-structure

            const image = "https://devnet.irys.xyz/Hg9o1Voe3nFEHnyfX51V1AxVr3bUNC2yvyCfmNLDM1xP"
            const metadata = {
                name: "SWQueryNFT",
                symbol: "SWQ",
                description: "Arthur RugDay",
                image,
                attributes: [
                    {trait_type: 'rug', value: '4'}
                ],
                properties: {
                    files: [
                        {
                            type: "image/jpg",
                            uri: image,
                        },
                    ]
                },
                creators: []
            };
            const myUri = await umi.uploader.uploadJson(metadata);
            console.log("Your metadata URI: ", myUri);
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();
