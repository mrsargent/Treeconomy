import { Blockfrost, Data, fromText, Lucid, mintingPolicyToId, paymentCredentialOf, scriptFromNative, Validator, validatorToAddress, Credential } from "@lucid-evolution/lucid";
import { NextApiRequest, NextApiResponse } from "next";
import { LockNFTConfig, NFTMinterConfig, RegisterConfig } from "./apitypes";
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
  


    const {paymentAddress,stakeAddress}:  RegisterConfig = req.body; 
    const lucid = await initLucid();
    lucid.selectWallet.fromAddress(paymentAddress, []);

    console.log("staking address: ", stakeAddress);

    const resgisterStakeAddr = await lucid
      .newTx()
      .registerStake(stakeAddress!)
      .complete();
      
    res.status(200).json({ tx: resgisterStakeAddr.toCBOR() });  
    console.log(resgisterStakeAddr.toCBOR());
}
}