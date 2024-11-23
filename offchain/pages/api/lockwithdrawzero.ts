import { Blockfrost, Data, fromText, Lucid, mintingPolicyToId, paymentCredentialOf, scriptFromNative, Validator, validatorToAddress, Credential } from "@lucid-evolution/lucid";
import { NextApiRequest, NextApiResponse } from "next";
import { LockNFTConfig, NFTMinterConfig } from "./apitypes";
import { fromAddress, SimpleSaleDatum, SimpleSaleDatumZero } from "./schemas";
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
    const priceOfAssetBI: bigint = BigInt(priceOfAsset); 
    
    lucid.selectWallet.fromAddress(sellerAddr, [])

    const datum = Data.to(
      {
        owner: fromAddress(sellerAddr),
        sellerAddress: fromAddress(sellerAddr),
        priceOfAsset: priceOfAssetBI,
      },
      SimpleSaleDatumZero
    );
    const spendcbor = "5902080100003232323232322232323232322322533300b3232533300d3009300e3754602260240042a66601a64660020026eacc048c04cc04cc04cc04cc04cc04cc040dd50011129998090008a5013253330103375e01e6022602800429444cc00c00c004c0500044cdd7980898079baa00500c14a02c6020002601a6ea80045261365653330093006300a375400226464a66601c60200042649318028008b180700098059baa0011632533300830053009375400c2646464646464a66602260260042646493180400218038028b1bad30110013011002300f001300f002300d001300a375400c2c4a666010600a60126ea80044c8c8c8c94ccc03cc0440084c8c92632533300e300b0011323253330133015002132498c02800458c04c004c040dd50018a99980718050008a99980898081baa00314985858c038dd500118038018b18078009807801180680098051baa001162325333008300500113232533300d300f002132498c01400458c034004c028dd50010a99980418020008991919191919299980898098010a4c2c6eb4c044004c044008dd6980780098078011bad300d001300a37540042c60106ea80048c94ccc01cc0100044c8c94ccc030c03800852616375c601800260126ea800854ccc01cc00c0044c8c94ccc030c03800852616375c601800260126ea800858c01cdd50009b8748008dc3a4000ae6955ceaab9e5573eae855d101";
    const stakecbor: string = "a73dc950baf7bf1442395b7ee2cbe8a3c814ef4d57b15b90f75b1320";
    
    const spendingValidator: Validator = {
      type: "PlutusV2",
      script: spendcbor,
    };

    const stakeCred: Credential = {
      type: "Script",
      hash: stakecbor,
    };  

    const contractAddr = validatorToAddress("Preprod", spendingValidator, stakeCred);
    // !!!!! also can use the valdiatorToRewardAddress function to accomplish this as well
    console.log("contract addresss:" , contractAddr);

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

// from lucid-evolution/packages/lucid/test/specs/services.ts
  // const networkConfig = yield* NetworkConfig;
  // const stakeCBOR = yield* pipe(
  //   Effect.fromNullable(
  //     scripts.validators.find(
  //       (v) => v.title === "stake.stake_multivalidator.withdraw",
  //     ),
  //   ),
  //   Effect.andThen((script) => script.compiledCode),
  // );
  // const stake: Script = {
  //   type: "PlutusV3",
  //   script: applyDoubleCborEncoding(stakeCBOR),
  // };
  // const contractAddress = validatorToAddress(networkConfig.NETWORK, stake);
  // const rewardAddress = validatorToRewardAddress(networkConfig.NETWORK, stake);
