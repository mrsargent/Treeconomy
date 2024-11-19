import { Blockfrost, fromText, Lucid, mintingPolicyToId, paymentCredentialOf, scriptFromNative, Validator } from "@lucid-evolution/lucid";
import { NextApiRequest, NextApiResponse } from "next";
import { InitialMintConfig } from "./apitypes";
import { getFirstUxtoWithAda } from "./getFirstUtxo";

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

    const goodUtxo = getFirstUxtoWithAda(lucid,address);


    const nativePolicyId = mintingPolicyToId(mintingpolicy);

    res.status(400);

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
    // Handle any other HTTP method
  }
}

export const parse = (json: string) =>
  JSON.parse(json, (key, value) =>
    typeof value === "string" && /^\d+n$/.test(value)
      ? BigInt(value.slice(0, -1))
      : value
  );
