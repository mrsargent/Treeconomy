import { Blockfrost, fromHex, fromText, Lucid, mintingPolicyToId, paymentCredentialOf, UTxO, Validator, Data, applyParamsToScript, applyDoubleCborEncoding, getAddressDetails, MintingPolicy, toHex, Constr, validatorToAddress, Kupmios } from "@lucid-evolution/lucid";
import { NextApiRequest, NextApiResponse } from "next";
import { AssetClass, InitialMintConfig } from "./apitypes";
import { getFirstUxtoWithAda } from "./getFirstUtxo";
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
    const { TokenName, address, compiledCodeNFT, compiledCodeToken }: InitialMintConfig = req.body;
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
      (v) => v.title === "initialmint1.init_mint_nft.mint",
    )?.compiledCode;

    const applied = applyParamsToScript(applyDoubleCborEncoding(compiledNft!), [pkh1]);

    const mintingNFTpolicy: MintingPolicy = {
      type: "PlutusV3",
      script: applyDoubleCborEncoding(applied)
    };

    const mintingNFTPolicyId = mintingPolicyToId(mintingNFTpolicy);
    console.log("policy id: ", mintingNFTPolicyId);
  
    const burnNftAssetName = "f59dde19714b45504afa7df45fe2e6a9";
    // *****************************************************************/
    //*********  find utxo and construct redeemer ***************/
    //**************************************************************** */

    const goodUtxo: UTxO | undefined = await getFirstUxtoWithAda(lucid, address);
    console.log("Tx hash: ", goodUtxo?.txHash, "Index: ", goodUtxo?.outputIndex);
    let mintRedeemer, burnRedeemer, hashedData, nftName 

    if (goodUtxo !== undefined) {
      const myData = {
        transaction_id: goodUtxo.txHash,
        output_index: BigInt(goodUtxo.outputIndex)
      }

      mintRedeemer = Data.to({
        out_ref: myData,
        action: "Mint"
      }, MintRedeemer);

      nftName = Data.to(myData, OutputReference);     
      hashedData = toHex(sha256(fromHex(nftName))); 
      
      burnRedeemer = Data.to({
        out_ref: myData,
        action: "Burn"
      }, MintRedeemer);

    } else {
      console.log("not good utxo found");
      res.status(401).json({ error: "Couldn't find utxo" });
      return;
    }
    const formattedName = hashedData.slice(0, 32);
    console.log("Enc: ", formattedName);

    // *****************************************************************/
    //*********  constructing transaction ******************************/
    //**************************************************************** */
    const tx = await lucid
      .newTx()
      .collectFrom([goodUtxo])
      .pay.ToAddress(address, {
        [mintingNFTPolicyId + formattedName]: 1n,
      })          
      .mintAssets({
        [mintingNFTPolicyId + formattedName]: 1n,        
      }, mintRedeemer)    
      .mintAssets({
        [mintingNFTPolicyId + burnNftAssetName]: -1n,
      },burnRedeemer)
      .attach.MintingPolicy(mintingNFTpolicy)
      .attachMetadata(721, {
        [mintingNFTPolicyId]: {
          [formattedName]: {
            name: "Sapling NFT 1",
            image: "https://capacitree.com/wp-content/uploads/2024/09/seed_nft.jpg",
            description: "No: 1 Tree species: pecan"
          }
        }
      })
      .addSigner(address)
      .complete({ localUPLCEval: false })


    res.status(200).json({ tx: tx.toCBOR() });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

