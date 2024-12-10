import { Blockfrost, fromHex, fromText, Lucid, mintingPolicyToId, paymentCredentialOf, UTxO, Validator, Data, applyParamsToScript, applyDoubleCborEncoding, getAddressDetails, MintingPolicy, toHex, Constr, validatorToAddress, Kupmios } from "@lucid-evolution/lucid";
import { NextApiRequest, NextApiResponse } from "next";
import { AssetClass, BurnConfig, InitialMintConfig } from "./apitypes";
import { getFirstUxtoWithAda } from "./fingUtxoFunctions";
import { sha256 } from '@noble/hashes/sha2';
import scripts from '../../../../onchain/plutus.json';
import { fromAddress, MintRedeemer, OutputReference, RewardsDatum } from "./schemas";
import { POSIXTime } from "@/Utils/types";
import { ONE_HOUR_MS, ONE_MIN_MS, TreeToken } from "@/Utils/constants";

//TODO: bring in NFT policyid to burn

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // *****************************************************************/
    //*********  establish network and wallet connection ***************/
    //**************************************************************** */
    const initLucid = async () => {
      if (process.env.NODE_ENV === "development") {
        // const b = new Blockfrost(
        //   process.env.API_URL_PREPROD as string,
        //   process.env.BLOCKFROST_KEY_PREPROD as string
        // );
        const b =  new Kupmios(
          process.env.KUPO_ENDPOINT_PREPROD!,
          process.env.OGMIOS_ENDPOINT_PREPROD!
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
    const { address, nftMintPolicyName}: BurnConfig = req.body;
    console.log(address);
    lucid.selectWallet.fromAddress(address, [])

    // *****************************************************************/
    //*********  constructing NFT minting policy with params ***************/
    //**************************************************************** */
    const pkh = getAddressDetails(address).paymentCredential?.hash;
    const pkh1 = paymentCredentialOf(address).hash;

    console.log("pkh: ", pkh);
    console.log("pkh1: ", pkh1);
    const compiledNft = scripts.validators.find(
      (v) => v.title === nftMintPolicyName,
    )?.compiledCode;

    const applied = applyParamsToScript(applyDoubleCborEncoding(compiledNft!), [pkh1]);

    const mintingNFTpolicy: MintingPolicy = {
      type: "PlutusV3",
      script: applyDoubleCborEncoding(applied)
    };

    const mintingNFTPolicyId = mintingPolicyToId(mintingNFTpolicy);
    console.log("policy id: ", mintingNFTPolicyId);
  
    // *****************************************************************/
    //*********  find utxo and construct redeemer ***************/
    //**************************************************************** */

    const goodUtxo: UTxO | undefined = await getFirstUxtoWithAda(lucid, address);
    console.log("Tx hash: ", goodUtxo?.txHash, "Index: ", goodUtxo?.outputIndex);
    let encodedUtxo, nftRedeemer, d, nftName 

    if (goodUtxo !== undefined) {
      const myData = {
        transaction_id: goodUtxo.txHash,
        output_index: BigInt(goodUtxo.outputIndex)
      }

      nftRedeemer = Data.to({
        out_ref: myData,
        action: "Burn"
      }, MintRedeemer);

      nftName = Data.to(myData, OutputReference);

      console.log("redeemer: ", nftRedeemer);
      d = toHex(sha256(fromHex(nftName)));
      console.log("d: ", d);
      encodedUtxo = Data.to(d);
      console.log("encodedutxo:", encodedUtxo);

    } else {
      console.log("not good utxo found");
      res.status(401).json({ error: "Couldn't find utxo" });
      return;
    }

    //enter burn name here
    const enc = "65b359e3a22b20edab8c101b1b042778"
    console.log("Enc: ", enc);

    // *****************************************************************/
    //*********  constructing transaction ******************************/
    //**************************************************************** */
    const tx = await lucid
      .newTx()
      .collectFrom([goodUtxo])             
      .mintAssets({
        [mintingNFTPolicyId + enc]: -1n,        
      }, nftRedeemer)      
      .attach.MintingPolicy(mintingNFTpolicy)      
      .addSigner(address)
      .complete({ localUPLCEval: false })


    res.status(200).json({ tx: tx.toCBOR() });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

