import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { setComputeUnitLimit } from "@metaplex-foundation/mpl-toolbox";
import {
  transactionBuilder,
  generateSigner,
  publicKey,
  keypairIdentity,
  Umi,
} from "@metaplex-foundation/umi";

import {
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";

import {
  fetchCandyMachine,
  fetchCandyGuard,
  mplCandyMachine,
  mintV2,
  CandyMachine,
} from "@metaplex-foundation/mpl-candy-machine";

import fs from 'fs';
const mint = async (umi: Umi, cm: CandyMachine, nftMint: any) => {

    const guard = await fetchCandyGuard(umi, cm.mintAuthority);
    // Mint to the backend wallet.
    await transactionBuilder()
        .add(setComputeUnitLimit(umi, { units: 800_000 }))
        .add(
            mintV2(umi, {
                candyMachine: cm.publicKey,
                nftMint,
                collectionMint: cm.collectionMint,
                collectionUpdateAuthority: cm.authority,
                candyGuard: guard?.publicKey,
                tokenStandard: cm.tokenStandard,
            })
        )
        .sendAndConfirm(umi, {
            confirm: {
                commitment: "finalized",
            },
        });
};

const mintController = async () => {
  console.log("start");
  for (let index = 0; index <= 92; index++) {
    console.log(index);
    
    try {
        console.log("rpc ------",process.env.SOLANA_RPC_URL  );
        
        const umi = createUmi(process.env.SOLANA_RPC_URL as string);
        const backendKp = umi.eddsa.createKeypairFromSecretKey(
          Uint8Array.from(Buffer.from(bs58.decode(process.env.SOLANA_PRIVATE as string)))
        );
        umi
          .use(mplTokenMetadata())
          .use(mplCandyMachine())
          .use(keypairIdentity(backendKp));
        const cm = await fetchCandyMachine(umi, publicKey(process.env.CANDYMANCHINE_ID as string));
        const nftMint = generateSigner(umi);
    
        await mint(umi, cm, nftMint);
        const metadata = JSON.parse(fs.readFileSync('metadata.json', 'utf-8'));
        metadata.push(nftMint.publicKey.toString());
        fs.writeFileSync('metadata.json', JSON.stringify(metadata));
        console.log("mint completed!");
    } catch (error) {
        console.log("mint error", error);
    }
  }
}

mintController();