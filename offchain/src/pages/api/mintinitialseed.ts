import { fromText, Lucid, mintingPolicyToId, paymentCredentialOf, UTxO, Validator, Data, applyParamsToScript, applyDoubleCborEncoding, MintingPolicy, Constr, validatorToAddress, Kupmios } from "@lucid-evolution/lucid";
import { NextApiRequest, NextApiResponse } from "next";
import { InitialMintConfig } from "./apitypes";
import { getFirstUxtoWithAda } from "./fingUtxoFunctions";
import scripts from '../../../../onchain/plutus.json';
import { CIP68Datum, fromAddress, MintRedeemer, RewardsDatum } from "./schemas";
import { AssetClass, POSIXTime } from "@/Utils/types";
import { assetNameLabels, ONE_HOUR_MS, THIRTY_MIN_MS, TreeToken } from "@/Utils/constants";
import prisma from "../../../prisma/client";
import { generateUniqueAssetName } from "@/Utils/Utils";



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
        const b = new Kupmios(
          process.env.KUPO_ENDPOINT_PREPROD!,
          process.env.OGMIOS_ENDPOINT_PREPROD!
        );
        return Lucid(b, "Mainnet");
      }

    };

    const { address, nftMintPolicyName, tokenMintPolicyName, rewardsValidatorName, lockingValidatorName, species, coordinates, isSignedIn }: InitialMintConfig = req.body;
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
    console.log("AI PKI:  ", pkh1);
    const compiledNft = scripts.validators.find(
      (v) => v.title === nftMintPolicyName,
    )?.compiledCode;

    const applied = applyParamsToScript(applyDoubleCborEncoding(compiledNft!), [pkh1, 0n]);

    const mintingNFTpolicy: MintingPolicy = {
      type: "PlutusV3",
      script: applyDoubleCborEncoding(applied)
    };

    const mintingNFTPolicyId = mintingPolicyToId(mintingNFTpolicy);
    console.log("policy id: ", mintingNFTPolicyId);

    // *****************************************************************/
    //*********  constructing token minting policy with params ***************/
    //**************************************************************** */   
    const compiledToken = scripts.validators.find(
      (v) => v.title === tokenMintPolicyName,
    )?.compiledCode;

    const mintingTokenpolicy: MintingPolicy = {
      type: "PlutusV3",
      script: applyParamsToScript(applyDoubleCborEncoding(compiledToken!), [pkh1, fromText(TreeToken)])
    };

    const mintingTokenPolicyId = mintingPolicyToId(mintingTokenpolicy);
    console.log("policy id: ", mintingTokenPolicyId);
    // *****************************************************************/
    //*********  constructing for ref token that cannot be unlocked*/
    //**************************************************************** */   

    const compiledLockingValidators = scripts.validators.find(
      (v) => v.title === lockingValidatorName,
    )?.compiledCode;

    const lockingValidatorNameValidator: Validator = {
      type: "PlutusV3",
      script: compiledLockingValidators!
    };

    let lockAddr
    if (process.env.NODE_ENV === "development") {
      lockAddr = validatorToAddress("Preprod", lockingValidatorNameValidator);
    }
    else {
      lockAddr = validatorToAddress("Mainnet", lockingValidatorNameValidator);
    }
    console.log("contract address: ", lockAddr);
    // *****************************************************************/
    //*********  find utxo and construct redeemer ***************/
    //**************************************************************** */

    const goodUtxo: UTxO | undefined = await getFirstUxtoWithAda(lucidUser, address);
    console.log("Tx hash: ", goodUtxo?.txHash, "Index: ", goodUtxo?.outputIndex);
    let userTokenRedeemer, hashedData, nftName, refTokenRedeemer

    if (goodUtxo !== undefined) {
      const myData = {
        transaction_id: goodUtxo.txHash,
        output_index: BigInt(goodUtxo.outputIndex)
      }

      const userToken = generateUniqueAssetName(goodUtxo, assetNameLabels.prefix222);
      const refToken = generateUniqueAssetName(goodUtxo, assetNameLabels.prefix100);

      console.log("user token: ", userToken);
      console.log("ref token: ", refToken);
      // *****************************************************************/
      //*********  creat new tree in database  ***************/
      //**************************************************************** */
      const userCount = await prisma.user.count();
      console.log("User Count: ", userCount);


      const newTree = await prisma.user.create({
        data: {
          treeNumber: userCount + 1,
          species: species,
          seedNftName: null,
          saplingNftName: null,
          treeNftName: null,
          createdAt: new Date
        }
      });

      console.log("tree number: ", newTree.treeNumber);

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


      const tokenRedeemer = Data.to(new Constr(0, [[]]));



      // *****************************************************************/
      //*********  constructing validator with data ***************/
      //**************************************************************** */
      const compiledValidators = scripts.validators.find(
        (v) => v.title === rewardsValidatorName,
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

      const vestingAsset: AssetClass = {
        policyId: mintingTokenPolicyId,
        tokenName: fromText(TreeToken)
      }
      const currentTime: POSIXTime = Date.now();
      console.log("current time: ", currentTime);

      const rewardsDatum = Data.to(
        {
          vestingAsset: vestingAsset,
          totalVestingQty: 10_000n,
          vestingPeriodStart: BigInt(currentTime),
          vestingPeriodEnd: BigInt(currentTime + THIRTY_MIN_MS),
          firstUnlockPossibleAfter: BigInt(currentTime),
          totalInstallments: 3n,
          treeNumer: BigInt(newTree.treeNumber),
        }, RewardsDatum
      );

      //create data for reference token
      const metadataMap = new Map();
      metadataMap.set(fromText("name"), Data.to(fromText("Seed NFT " + newTree.treeNumber.toString())));
      metadataMap.set(fromText("number"), Data.to(fromText(newTree.treeNumber.toString())));
      metadataMap.set(fromText("species"), Data.to(fromText(species)));
      metadataMap.set(fromText("coordinates"), Data.to(fromText(coordinates)));
      metadataMap.set(fromText("image"), Data.to(fromText("https://capacitree.com/wp-content/uploads/2024/09/seed_nft.jpg")));


      const refTokenCIP68MetaData = Data.to({
        metadata: metadataMap,
        version: 1n
      }, CIP68Datum);

      // *****************************************************************/
      //*********  constructing transaction ******************************/
      //** Note: Asset name is the serialized out_ref.  This will always
      //* give the NFT a unique encoded name (i.e.  policyid + token name)*/
      //**************************************************************** */
      const tx = await lucidUser
        .newTx()
        .collectFrom([goodUtxo])
        .pay.ToAddress(address, {
          [mintingNFTPolicyId + userToken]: 1n,
        })
        .pay.ToAddressWithData(
          contractAddr,
          {
            kind: "inline",
            value: rewardsDatum,
          },
          { [mintingTokenPolicyId + fromText(TreeToken)]: 10000n }
        )
        .pay.ToAddressWithData(
          lockAddr,
          {
            kind: "inline",
            value: refTokenCIP68MetaData,
          },
          { [mintingNFTPolicyId + refToken]: 1n }
        )
        .mintAssets({
          [mintingTokenPolicyId + fromText(TreeToken)]: 10000n,
        }, tokenRedeemer)
        .mintAssets({
          [mintingNFTPolicyId + userToken]: 1n,
        }, userTokenRedeemer)
        .mintAssets({
          [mintingNFTPolicyId + refToken]: 1n,
        }, refTokenRedeemer)
        .attach.MintingPolicy(mintingTokenpolicy)
        .attach.MintingPolicy(mintingNFTpolicy)
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