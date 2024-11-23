import { Blockfrost, fromHex, fromText, Lucid, mintingPolicyToId, paymentCredentialOf, scriptFromNative, UTxO, Validator, Data } from "@lucid-evolution/lucid";
import { NextApiRequest, NextApiResponse } from "next";
import { InitialMintConfig } from "./apitypes";
import { getFirstUxtoWithAda } from "./getFirstUtxo";
import { sha256 } from '@noble/hashes/sha2';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    //   // Process a POST request
    const initLucid = async () => {
      if (process.env.NODE_ENV === "development") {
        const b = new Blockfrost(
          process.env.API_URL_PREPROD as string,
          process.env.BLOCKFROST_KEY_PREPROD as string
        );
        return Lucid(b, "Preprod");
      } else {
        const b = new Blockfrost(
          process.env.API_URL_MAINNET!,
          process.env.BLOCKFROST_KEY_MAINNET!
        );
        return Lucid(b, "Mainnet");
      }

    };
    const lucid = await initLucid();

    const { TokenName, address, compiledCodeNFT, compiledCodeToken }: InitialMintConfig = req.body;
    console.log(address);
    lucid.selectWallet.fromAddress(address, [])

    const mintingpolicy: Validator = {
      type: "PlutusV2",
      script: compiledCodeNFT,
    };

    const goodUtxo: UTxO | undefined = await getFirstUxtoWithAda(lucid, address);

    console.log("Tx hash: ", goodUtxo?.txHash, "Index: ", goodUtxo?.outputIndex);
    if (goodUtxo !== undefined) {
      const d = Data.to(goodUtxo.txHash);
      const encodedUtxo = sha256(fromHex(d));
      
    }
    else {
      console.log("not good utxo found");
    }

    const nativePolicyId = mintingPolicyToId(mintingpolicy);


    //don't fucking worry... just for testing.  
    // I want to see the console.log prints from my getFirstUxtowithAda function to make sure I'm getting the 
    // right data.  hence the reponse with error 400.
    res.status(200).json({ message: "Success" });

    // const tx = await lucid
    //   .newTx()
    //   .pay.ToAddress(address, {
    //     [nativePolicyId + fromText(TokenName)]: 1n,
    //   })
    //   .mintAssets({
    //     [nativePolicyId + fromText(TokenName)]: 1n,
    //   })
    //   .attach.MintingPolicy(mintingpolicy)
    //   .attachMetadata(721, {
    //     [nativePolicyId]: {
    //       [TokenName]: {
    //         name: "Seed NFT",
    //         image: "https://capacitree.com/wp-content/uploads/2024/09/seed_nft.jpg",
    //         description: "Tree species: oak"
    //       }
    //     }
    //   })
    //   .complete();
    // res.status(200).json({ tx: tx.toCBOR() });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export const parse = (json: string) =>
  JSON.parse(json, (key, value) =>
    typeof value === "string" && /^\d+n$/.test(value)
      ? BigInt(value.slice(0, -1))
      : value
  );
