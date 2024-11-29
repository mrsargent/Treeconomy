import { Blockfrost, Lucid, Validator, UTxO, Constr, Data, fromHex, toHex } from "@lucid-evolution/lucid";
import { NextApiRequest, NextApiResponse } from "next";
import { BuyNFTConfig } from "./apitypes";
import { MarketRedeemerEnum, OutputReference } from "./schemas";
import { queryNFT } from "./queryNFT";



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
    const {marketplace, sellerAddr, pid}: BuyNFTConfig = req.body; 
    console.log(sellerAddr);   
    
    lucid.selectWallet.fromAddress(sellerAddr, [])

    const buyUtxo: UTxO[] = await queryNFT(lucid, marketplace, 10_000_000n, sellerAddr, pid);
    console.log(buyUtxo);  
    
    const myData: OutputReference  = {
        transaction_id: buyUtxo[0].txHash ,
        output_index: BigInt(buyUtxo[0].outputIndex)
    };  
   
    const plutus = new Constr(0, [new Constr (0, [buyUtxo[0].txHash]), BigInt(buyUtxo[0].outputIndex)]);
    //const p = Data.to(plutus);
    const d = Data.to(myData,OutputReference);
    //const d2 = Data.to(toHex(C.hash_blake2b256(fromHex(d))));  
    console.log("out ref cbor: ",d);
    //console.log("out ref cbor plutus", p);
    //console.log("hashed out ref", d2);
    console.log("tx hash: ",buyUtxo[0].txHash);
    console.log("index: ", BigInt(buyUtxo[0].outputIndex));

    
  

    const contract: Validator = {
        type: "PlutusV2",
        script: marketplace,
      };
    
    //   const redeemer = Data.to("Buy", MarketRedeemerEnum);
    //   const tx = await lucid
    //       .newTx()
    //       .pay.ToAddressWithData(sellerAddr, 
    //         {
    //           kind: "inline",
    //           value: d2,
    //         },
    //         {lovelace: 10_000_000n}
    //       )
    //       .collectFrom(buyUtxo, redeemer)
    //       .attach.SpendingValidator(contract)
    //       .complete();
    // res.status(200).json({ tx: tx.toCBOR() });
    // console.log(tx.toCBOR());
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


/*
Ouput from lucid
out ref cbor:  d879825820fb5c55a96f87d6d03e606f2634cacaa184e6fe5673b4a7ee241d01227e2681f100
121_0([ h'fb5c55a96f87d6d03e606f2634cacaa184e6fe5673b4a7ee241d01227e2681f1',0]) -> derived from cbor.me website
Constr[0, ("fb5c55a96f87d6d03e606f2634cacaa184e6fe5673b4a7ee241d01227e2681f1",0)] -> plutus constructed by myself

Output from Aiken
121([_ 121([_ h'FB5C55A96F87D6D03E606F2634CACAA184E6FE5673B4A7EE241D01227E2681F1']), 0]) -> got from cbor.diagnostic
Constr(0, [Constr (0, "FB5C55A96F87D6D03E606F2634CACAA184E6FE5673B4A7EE241D01227E2681F1", 0)]) -> plutus constructed by myself

*/
