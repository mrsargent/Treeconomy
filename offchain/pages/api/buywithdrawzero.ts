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
        transaction_id: {hash: buyUtxo[0].txHash },
        output_index: BigInt(buyUtxo[0].outputIndex)
    };  
   
    const plutus = new Constr(0, [new Constr (0, [buyUtxo[0].txHash]), BigInt(buyUtxo[0].outputIndex)]);
    //const p = Data.to(plutus);
    const d = Data.to(myData,OutputReference);
    //const d2 = Data.to(toHex(C.hash_blake2b256(fromHex(d))));  
 
  

    const contract: Validator = {
        type: "PlutusV2",
        script: "5902080100003232323232322232323232322322533300b3232533300d3009300e3754602260240042a66601a64660020026eacc048c04cc04cc04cc04cc04cc04cc040dd50011129998090008a5013253330103375e01e6022602800429444cc00c00c004c0500044cdd7980898079baa00500c14a02c6020002601a6ea80045261365653330093006300a375400226464a66601c60200042649318028008b180700098059baa0011632533300830053009375400c2646464646464a66602260260042646493180400218038028b1bad30110013011002300f001300f002300d001300a375400c2c4a666010600a60126ea80044c8c8c8c94ccc03cc0440084c8c92632533300e300b0011323253330133015002132498c02800458c04c004c040dd50018a99980718050008a99980898081baa00314985858c038dd500118038018b18078009807801180680098051baa001162325333008300500113232533300d300f002132498c01400458c034004c028dd50010a99980418020008991919191919299980898098010a4c2c6eb4c044004c044008dd6980780098078011bad300d001300a37540042c60106ea80048c94ccc01cc0100044c8c94ccc030c03800852616375c601800260126ea800854ccc01cc00c0044c8c94ccc030c03800852616375c601800260126ea800858c01cdd50009b8748008dc3a4000ae6955ceaab9e5573eae855d101",
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



  // const rdmrBuilderWithdraw: RedeemerBuilder = {
  //   kind: "selected",
  //   makeRedeemer: (inputIndices: bigint[]) => {
  //     return Data.to(new Constr(0, [inputIndices]));
  //   },
  //   inputs: selectedStakeUTxOs,
  // };
  // sorted lexicographically 


/*
Ouput from lucid
out ref cbor:  d879825820fb5c55a96f87d6d03e606f2634cacaa184e6fe5673b4a7ee241d01227e2681f100
121_0([ h'fb5c55a96f87d6d03e606f2634cacaa184e6fe5673b4a7ee241d01227e2681f1',0]) -> derived from cbor.me website
Constr[0, ("fb5c55a96f87d6d03e606f2634cacaa184e6fe5673b4a7ee241d01227e2681f1",0)] -> plutus constructed by myself

Output from Aiken
121([_ 121([_ h'FB5C55A96F87D6D03E606F2634CACAA184E6FE5673B4A7EE241D01227E2681F1']), 0]) -> got from cbor.diagnostic
Constr(0, [Constr (0, "FB5C55A96F87D6D03E606F2634CACAA184E6FE5673B4A7EE241D01227E2681F1", 0)]) -> plutus constructed by myself

*/
