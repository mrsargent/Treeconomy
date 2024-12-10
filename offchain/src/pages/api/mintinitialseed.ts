import { Blockfrost, fromHex, fromText, Lucid, mintingPolicyToId, paymentCredentialOf, UTxO, Validator, Data, applyParamsToScript, applyDoubleCborEncoding, getAddressDetails, MintingPolicy, toHex, Constr, validatorToAddress, Kupmios } from "@lucid-evolution/lucid";
import { NextApiRequest, NextApiResponse } from "next";
import { AssetClass, InitialMintConfig } from "./apitypes";
import { getFirstUxtoWithAda } from "./fingUtxoFunctions";
import { sha256 } from '@noble/hashes/sha2';
import scripts from '../../../../onchain/plutus.json';
import { fromAddress, MintRedeemer, OutputReference, RewardsDatum } from "./schemas";
import { POSIXTime } from "@/Utils/types";
import { ONE_HOUR_MS, ONE_MIN_MS, TreeToken } from "@/Utils/constants";


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
        const b =  new Kupmios(
          process.env.KUPO_ENDPOINT_PREPROD!,
          process.env.OGMIOS_ENDPOINT_PREPROD!
        );
        return Lucid(b, "Preprod");
      } else {
        const b =  new Kupmios(
          process.env.KUPO_ENDPOINT_PREPROD!,
          process.env.OGMIOS_ENDPOINT_PREPROD!
        );
        return Lucid(b, "Mainnet");
      }

    };
    const lucid = await initLucid();
    const { address, nftMintPolicyName, tokenMintPolicyName, rewardsValidatorName, treeNumber, species }: InitialMintConfig = req.body;
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
        beneficiary: fromAddress(address),
        vestingAsset: vestingAsset,
        totalVestingQty: 10_000n,
        vestingPeriodStart: BigInt(currentTime),
        vestingPeriodEnd: BigInt(currentTime + ONE_HOUR_MS),
        firstUnlockPossibleAfter: BigInt(currentTime),
        totalInstallments: 3n,
        treeNumer: BigInt(treeNumber),
      }, RewardsDatum
    );

    // *****************************************************************/
    //*********  find utxo and construct redeemer ***************/
    //**************************************************************** */

    const goodUtxo: UTxO | undefined = await getFirstUxtoWithAda(lucid, address);
    console.log("Tx hash: ", goodUtxo?.txHash, "Index: ", goodUtxo?.outputIndex);
    let nftRedeemer, hashedData, nftName 

    if (goodUtxo !== undefined) {
      const myData = {
        transaction_id: goodUtxo.txHash,
        output_index: BigInt(goodUtxo.outputIndex)
      }

      nftRedeemer = Data.to({
        out_ref: myData,
        action: "Mint"
      }, MintRedeemer);

      nftName = Data.to(myData, OutputReference);     
      hashedData = toHex(sha256(fromHex(nftName)));     

    } else {
      console.log("not good utxo found");
      res.status(401).json({ error: "Couldn't find utxo" });
      return;
    }
    const formattedName = hashedData.slice(0, 32);
    console.log("Enc: ", formattedName);
    const tokenRedeemer = Data.to(new Constr(0, [[]]));


    // *****************************************************************/
    //*********  constructing transaction ******************************/
    //** Note: Asset name is the serialized out_ref.  This will always
    //* give the NFT a unique encoded name (i.e.  policyid + token name)*/
    //**************************************************************** */
    const tx = await lucid
      .newTx()
      .collectFrom([goodUtxo])
      .pay.ToAddress(address, {
        [mintingNFTPolicyId + formattedName]: 1n,
      })
      .pay.ToAddressWithData(
        contractAddr,
        {
          kind: "inline",
          value: rewardsDatum,
        },
        { [mintingTokenPolicyId + fromText(TreeToken)]: 10000n }
      )
      .mintAssets({
        [mintingTokenPolicyId + fromText(TreeToken)]: 10000n,
      }, tokenRedeemer)
      .mintAssets({
        [mintingNFTPolicyId + formattedName]: 1n,
      }, nftRedeemer)
      .attach.MintingPolicy(mintingTokenpolicy)
      .attach.MintingPolicy(mintingNFTpolicy)
      .attachMetadata(721, {
        [mintingNFTPolicyId]: {
          [formattedName]: {
            name: "Seed NFT " + treeNumber,
            image: "https://capacitree.com/wp-content/uploads/2024/09/seed_nft.jpg",
            description: "No: " + treeNumber + " Tree species: " + species
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

