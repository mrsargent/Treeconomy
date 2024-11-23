import { Blockfrost, Data, fromText, Lucid, mintingPolicyToId, paymentCredentialOf, scriptFromNative, Validator, validatorToAddress } from "@lucid-evolution/lucid";
import { NextApiRequest, NextApiResponse } from "next";
import { LockNFTConfig, NFTMinterConfig } from "./apitypes";
import { fromAddress, SimpleSaleDatum } from "./schemas";
import { NetworkType } from "@cardano-foundation/cardano-connect-with-wallet-core";
import { useCardano } from "@cardano-foundation/cardano-connect-with-wallet";


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("test")
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
    const {priceOfAsset, policyID, TokenName, marketPlace, sellerAddr}: LockNFTConfig = req.body; 
    console.log(sellerAddr);
    const priceOfAssetBI: bigint = BigInt(priceOfAsset); 
    
    lucid.selectWallet.fromAddress(sellerAddr, [])

    const datum = Data.to(
      {
        sellerAddress: fromAddress(sellerAddr),
        priceOfAsset: priceOfAssetBI,
      },
      SimpleSaleDatum
    );
    const contract: Validator = {
      type: "PlutusV2",
      script: marketPlace,
    };
    const contractAddr = validatorToAddress("Preprod", contract);
 
    const tx = await lucid
      .newTx()
      .pay.ToAddressWithData(
        contractAddr,
        {
          kind: "inline",
          value: datum,
        },
        { [policyID + TokenName]: 1n }
      )
      .complete();
      
    res.status(200).json({ tx: tx.toCBOR() });
    console.log(tx.toCBOR());
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
