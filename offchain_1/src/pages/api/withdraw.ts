import { Blockfrost, Data, fromText, fromUnit, Lucid, mintingPolicyToId, paymentCredentialOf, scriptFromNative, Validator, validatorToAddress } from "@lucid-evolution/lucid";
import { NextApiRequest, NextApiResponse } from "next";
import { findIfPolicyIdMatches, parseAssetId, WithdrawNFTConfig } from "./apitypes";
import { fromAddress, MarketRedeemerEnum, SimpleSaleDatum } from "./schemas";

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
    const {marketplace,sellerAddr, pid}: WithdrawNFTConfig = req.body; 
    console.log(sellerAddr);
 
    lucid.selectWallet.fromAddress(sellerAddr, [])

    const contract: Validator = {
        type: "PlutusV2",
        script: marketplace,
      };
      const contractAddr = validatorToAddress("Preprod", contract);
     console.log(contractAddr);
    
      //const allContractUtxos = await withdrawNFTConfig.lucid.utxosAt(withdrawNFTConfig.marketplace);
      const allContractUtxos = await lucid.utxosAt(contractAddr);
     
      const allUserContractUtxos = allContractUtxos.filter((value) => {
        if (value.datum) {
          try {
            const foundPid = findIfPolicyIdMatches(value, pid);
            const datum = Data.from(value.datum, SimpleSaleDatum);
            const datumSellerAddr = JSON.stringify(datum.sellerAddress);
            const inputSellerAddr = JSON.stringify(fromAddress(sellerAddr));           
            console.log("pid equal", foundPid);
            console.log("seller equivalent", datumSellerAddr === inputSellerAddr);           
            return (datumSellerAddr === inputSellerAddr) && foundPid;
          } catch (_) {
            return false;
          }
        } else {
          return false;
        }
      }); 
      
      console.log(allUserContractUtxos.length);
      console.log(allUserContractUtxos);
    
      const redeemer = Data.to("Withdraw", MarketRedeemerEnum);
      const tx =
        await
        lucid
          .newTx()
          .collectFrom(allUserContractUtxos, redeemer)
          .attach.SpendingValidator(contract)
          .addSigner(await lucid.wallet().address())
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


 