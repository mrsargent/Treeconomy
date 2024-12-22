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
    const lucid = await initLucid();
    const { address, refLockPolicy, nftMintPolicyName, treeData }: MintBurnConfig = req.body;
    console.log(address);
    lucid.selectWallet.fromAddress(address, [])

    // *****************************************************************/
    //*********  constructing NFT minting policy with params ***************/
    //**************************************************************** */ 
    const pkh1 = paymentCredentialOf(address).hash;

    console.log("pkh1: ", pkh1);
    const compiledNft = scripts.validators.find(
      (v) => v.title === nftMintPolicyName,
    )?.compiledCode;

    const applied = applyParamsToScript(applyDoubleCborEncoding(compiledNft!), [pkh1, 2n]);

    const mintingNFTpolicy: MintingPolicy = {
      type: "PlutusV3",
      script: applyDoubleCborEncoding(applied)
    };

    const mintingNFTPolicyId = mintingPolicyToId(mintingNFTpolicy);
    console.log("policy id: ", mintingNFTPolicyId);

    const compiledValidators = scripts.validators.find(
      (v) => v.title === refLockPolicy,
    )?.compiledCode;

    const rewardsValidator: Validator = {
      type: "PlutusV3",
      script: compiledValidators!
    };

    let contractAddr
    if (process.env.NODE_ENV === "development") {
      contractAddr = validatorToAddress("Preprod", rewardsValidator);
    }
    else {
      contractAddr = validatorToAddress("Mainnet", rewardsValidator);
    }
    console.log("contract address: ", contractAddr);
    // *****************************************************************/
    //*********  find utxo and construct redeemer ***************/
    //**************************************************************** */

    const goodUtxo: UTxO | undefined = await getFirstUxtoWithAda(lucid, address);
    console.log("Tx hash: ", goodUtxo?.txHash, "Index: ", goodUtxo?.outputIndex);
    let userTokenRedeemer, refTokenRedeemer

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


      //create data for reference token
      const metadataMap = new Map();
      metadataMap.set(fromText("name"), Data.to(fromText(treeData.name)));
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
          saplingNftName: userToken
        }
      });

      // *****************************************************************/
      //*********  constructing transaction ******************************/
      //**************************************************************** */
      const tx = await lucid
        .newTx()
        .collectFrom([goodUtxo])
        .pay.ToAddress(address, {
          [mintingNFTPolicyId + userToken]: 1n,
        })
        .pay.ToAddressWithData(
          contractAddr,
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
        .attach.MintingPolicy(mintingNFTpolicy)
        .attachMetadata(721, {
          [mintingNFTPolicyId]: {
            [userToken]: {
              name: "Sapling NFT " + updateTree.treeNumber,
              image: "https://capacitree.com/wp-content/uploads/2024/12/tree2.jpg",
              description: "No: " + updateTree.treeNumber + " Tree species: " + updateTree.species
            }
          }
        })
        .addSigner(address)
        .complete({ localUPLCEval: false })


      res.status(200).json({ tx: tx.toCBOR() });
    } else {
      console.log("not good utxo found");
      res.status(401).json({ error: "Couldn't find utxo" });
      return;
    }
  }

}