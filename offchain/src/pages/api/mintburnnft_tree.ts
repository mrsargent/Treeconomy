import { Blockfrost, fromText, Lucid, mintingPolicyToId, paymentCredentialOf, UTxO, Validator, Data, applyParamsToScript, applyDoubleCborEncoding, MintingPolicy, validatorToAddress, Kupmios } from "@lucid-evolution/lucid";
import { NextApiRequest, NextApiResponse } from "next";
import { MintBurnConfig } from "./apitypes";
import { getFirstUxtoWithAda } from "./fingUtxoFunctions";
import scripts from '../../../../onchain/plutus.json';
import { CIP68Datum, MintRedeemer } from "./schemas";
import { assetNameLabels } from "@/Utils/constants";
import { generateUniqueAssetName } from "@/Utils/Utils";
import prisma from "../../../prisma/client";


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
        const b = new Kupmios(
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
    const { address, refLockPolicy, nftMintPolicyName, treeData, burnAssetName, isSignedIn }: MintBurnConfig = req.body;
    const lucidAI = await initLucid();
    const lucidUser = await initLucid();
    lucidUser.selectWallet.fromAddress(address, [])
    lucidAI.selectWallet.fromPrivateKey(process.env.AI_PRIVATE_KEY!);
    console.log(address);
    
    const aiAddr = await lucidAI.wallet().address();
    console.log("AI Addr", aiAddr);

    // *****************************************************************/
    //*********  constructing NFT minting policy with params ***************/
    //**************************************************************** */ 
    const pkh1 = paymentCredentialOf(aiAddr).hash;

    console.log("pkh1: ", pkh1);
    
    //policy for the mint of the Tree
    const compiledNft = scripts.validators.find(
      (v) => v.title === nftMintPolicyName,
    )?.compiledCode;

    const applied = applyParamsToScript(applyDoubleCborEncoding(compiledNft!), [pkh1, 2n]);

    const mintingNFTpolicy: MintingPolicy = {
      type: "PlutusV3",
      script: applyDoubleCborEncoding(applied)
    };

    const mintingNFTPolicyId = mintingPolicyToId(mintingNFTpolicy);
    console.log("mint policy id: ", mintingNFTPolicyId);

    //policy for the burn of the sapling
    const appliedBurn = applyParamsToScript(applyDoubleCborEncoding(compiledNft!), [pkh1, 1n]);

    const burningNFTpolicy: MintingPolicy = {
      type: "PlutusV3",
      script: applyDoubleCborEncoding(appliedBurn)
    };
    const burnNFTPolicyId = mintingPolicyToId(burningNFTpolicy);
    console.log("burn policy id: ", burnNFTPolicyId);
    // *****************************************************************/
    //*********  create contract that can't he unlockd ***************/
    //**************************************************************** */ 

    const compiledValidators = scripts.validators.find(
      (v) => v.title === refLockPolicy,
    )?.compiledCode;

    const rewardsValidator: Validator = {
      type: "PlutusV3",
      script: compiledValidators!
    };

    let lockAddr
    if (process.env.NODE_ENV === "development") {
      lockAddr = validatorToAddress("Preprod", rewardsValidator);
    }
    else {
      lockAddr = validatorToAddress("Mainnet", rewardsValidator);
    }
    console.log("contract address: ", lockAddr);
    // *****************************************************************/
    //*********  find utxo and construct redeemer ***************/
    //**************************************************************** */

    const goodUtxo: UTxO | undefined = await getFirstUxtoWithAda(lucidUser, address);
    console.log("Tx hash: ", goodUtxo?.txHash, "Index: ", goodUtxo?.outputIndex);
    let userTokenRedeemer, refTokenRedeemer, burnNFTRedeemer

    if (goodUtxo !== undefined) {
      const myData = {
        transaction_id: goodUtxo.txHash,
        output_index: BigInt(goodUtxo.outputIndex)
      }

      const userToken = generateUniqueAssetName(goodUtxo, assetNameLabels.prefix222);
      const refToken = generateUniqueAssetName(goodUtxo, assetNameLabels.prefix100);

      console.log("user token: ", userToken);
      console.log("ref token: ", refToken);

      userTokenRedeemer = Data.to({
        out_ref: myData,
        action: "Mint",
        prefix: assetNameLabels.prefix222,
        treeNumber: fromText("")
      }, MintRedeemer);

      refTokenRedeemer = Data.to({
        out_ref: myData,
        action: "Mint",
        prefix: assetNameLabels.prefix100,
        treeNumber: fromText("")
      }, MintRedeemer);

      burnNFTRedeemer = Data.to({
        out_ref: myData,
        action: "Burn", 
        prefix: assetNameLabels.prefix222,
        treeNumber: fromText("")
      }, MintRedeemer);

      //create data for reference token
      const metadataMap = new Map();
      metadataMap.set(fromText("name"), Data.to(fromText("Tree NFT " + treeData.number)));
      metadataMap.set(fromText("number"), Data.to(fromText(treeData.number)));
      metadataMap.set(fromText("species"), Data.to(fromText(treeData.species)));
      metadataMap.set(fromText("coordinates"), Data.to(fromText(treeData.coordinates)));
      metadataMap.set(fromText("image"), Data.to(fromText(treeData.coordinates)));


      const refTokenCIP68MetaData = Data.to({
        metadata: metadataMap,
        version: 1n
      }, CIP68Datum);

      const updateTree = await prisma.user.update({
        where: { treeNumber: parseInt(treeData.number) },
        data: {
          treeNftName: userToken
        }
      });

      // *****************************************************************/
      //*********  constructing transaction ******************************/
      //**************************************************************** */
      const tx = await lucidUser
        .newTx()
        .collectFrom([goodUtxo])
        .pay.ToAddress(address, {
          [mintingNFTPolicyId + userToken]: 1n,
        })
        .pay.ToAddressWithData(
          lockAddr,
          {
            kind: "inline",
            value: refTokenCIP68MetaData,
          },
          { [mintingNFTPolicyId + refToken]: 1n }
        )
        .mintAssets({
          [mintingNFTPolicyId + userToken]: 1n,
        }, userTokenRedeemer)
        .mintAssets({
          [mintingNFTPolicyId + refToken]: 1n,
        }, refTokenRedeemer)
        .mintAssets({
          [burnNFTPolicyId + burnAssetName]: -1n,
        }, burnNFTRedeemer)
        .attach.MintingPolicy(mintingNFTpolicy)
        .attach.MintingPolicy(burningNFTpolicy)        
        .addSigner(aiAddr)
        .complete({ localUPLCEval: false });

        const aiSigned = await lucidAI.fromTx(tx.toCBOR()).partialSign.withPrivateKey(process.env.AI_PRIVATE_KEY!);        
      
        if (isSignedIn) {
          const existingUser = await prisma.googleUser.findUnique({
            where: {
              address: address
            }
          });
  
          const userSign = await lucidUser.fromTx(tx.toCBOR()).partialSign.withPrivateKey(existingUser?.privateKey!);
          const signedTx = await lucidUser.fromTx(tx.toCBOR()).assemble([aiSigned, userSign]).complete();
          const signedTransaction = await signedTx.submit();
  
          res.status(200).json({
            signedTransaction
          });
        } else {
          res.status(200).json({
            tx: tx.toCBOR(),
            aiSigned,
  
          });
        }
    } else {
      console.log("not good utxo found");
      res.status(401).json({ error: "Couldn't find utxo" });
      return;
    }
  }

}