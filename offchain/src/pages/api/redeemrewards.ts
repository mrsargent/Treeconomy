import { Blockfrost, fromHex, fromText, Lucid, UTxO, Validator, Data, toHex, Constr, validatorToAddress, toUnit } from "@lucid-evolution/lucid";
import { NextApiRequest, NextApiResponse } from "next";
import { AssetClass, InitialMintConfig } from "./apitypes";
import { getFirstUxtoWithAda } from "./getFirstUtxo";
import { sha256 } from '@noble/hashes/sha2';
import scripts from '../../../../onchain/plutus.json';
import { fromAddress, OutputReference, RewardsDatum, VestingRedeemer } from "./schemas";
import { divCeil, parseSafeDatum, toAddress } from "@/Utils/Utils";


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
    const { TokenName, address, compiledCodeNFT, compiledCodeToken }: InitialMintConfig = req.body;
    console.log(address);
    lucid.selectWallet.fromAddress(address, [])

    

    // *****************************************************************/
    //*********  constructing validator with data ***************/
    //**************************************************************** */
    const compiledValidators = scripts.validators.find(
      (v) => v.title === "rewards_validator.rewards_validator.spend",
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
      tokenName: fromText(treeToken)
    }
    const currentSlot = lucid.currentSlot();
    const slotLengthInSeconds = 1;
    const oneHourInSlots = Math.floor(3600 / slotLengthInSeconds);


    const rewardsDatum = Data.to(
      {
        beneficiary: fromAddress(address),
        vestingAsset: vestingAsset,
        totalVestingQty: 10000n,
        vestingPeriodStart: BigInt(currentSlot),
        vestingPeriodEnd: BigInt(currentSlot + oneHourInSlots),
        firstUnlockPossibleAfter: BigInt(currentSlot + 1),
        totalInstallments: 5n
      }, RewardsDatum
    );

     // *****************************************************************/
    //*********  construct stuff ***************/
    //**************************************************************** */
    config.currentTime ??= Date.now();

   
  
    const vestingUTXO = (await lucid.utxosByOutRef([config.vestingOutRef]))[0];
  
    if (!vestingUTXO)
      return { type: "error", error: new Error("No Utxo in Script") };
  
    if (!vestingUTXO.datum)
      return { type: "error", error: new Error("Missing Datum") };
  
    const datum = parseSafeDatum(vestingUTXO.datum, VestingDatum);
    if (datum.type == "left")
      return { type: "error", error: new Error(datum.value) };
  
    const vestingPeriodLength =
      datum.value.vestingPeriodEnd - datum.value.vestingPeriodStart;
  
    const vestingTimeRemaining =
      datum.value.vestingPeriodEnd - BigInt(config.currentTime);
    // console.log("vestingTimeRemaining", vestingTimeRemaining);
  
    const timeBetweenTwoInstallments = divCeil(
      BigInt(vestingPeriodLength),
      datum.value.totalInstallments
    );
    // console.log("timeBetweenTwoInstallments", timeBetweenTwoInstallments);
  
    const futureInstallments = divCeil(
      vestingTimeRemaining,
      timeBetweenTwoInstallments
    );
    // console.log("futureInstallments", futureInstallments);
  
    const expectedRemainingQty = divCeil(
      futureInstallments * datum.value.totalVestingQty,
      datum.value.totalInstallments
    );
    // console.log("expectedRemainingQty", expectedRemainingQty);
  
    const vestingTokenUnit = datum.value.assetClass.symbol
      ? toUnit(datum.value.assetClass.symbol, datum.value.assetClass.name)
      : "lovelace";
    // console.log("vestingTokenUnit", vestingTokenUnit)
  
    const vestingTokenAmount =
      vestingTimeRemaining < 0n
        ? vestingUTXO.assets[vestingTokenUnit]
        : vestingUTXO.assets[vestingTokenUnit] - expectedRemainingQty;
    // console.log("vestingTokenAmount", vestingTokenAmount);
  
    const beneficiaryAddress = toAddress(datum.value.beneficiary, network);
  
    const vestingRedeemer =
      vestingTimeRemaining < 0n
        ? Data.to("FullUnlock", VestingRedeemer)
        : Data.to("PartialUnlock", VestingRedeemer);
  
    // *****************************************************************/
    //*********  find utxo and construct redeemer ***************/
    //**************************************************************** */

    const goodUtxo: UTxO | undefined = await getFirstUxtoWithAda(lucid, address);
    console.log("Tx hash: ", goodUtxo?.txHash, "Index: ", goodUtxo?.outputIndex);
    let encodedUtxo, nftRedeemer, d

    if (goodUtxo !== undefined) {
      const myData = {
        transaction_id: goodUtxo.txHash,
        output_index: BigInt(goodUtxo.outputIndex)
      }
      nftRedeemer = Data.to(myData, OutputReference);
      console.log("redeemer: ", nftRedeemer);
      d = toHex(sha256(fromHex(nftRedeemer)));
      console.log("d: ", d);
      encodedUtxo = Data.to(d);
      console.log("encodedutxo:", encodedUtxo);

    } else {
      console.log("not good utxo found");
      res.status(401).json({ error: "Couldn't find utxo" });
      return;
    }
    const enc = d.slice(0, 32);
    console.log("Enc: ", enc);
    const tokenRedeemer = Data.to(new Constr(0, [[]]));


    // *****************************************************************/
    //*********  constructing transaction ******************************/
    // redeem rewards
    //**************************************************************** */
    const tx = await lucid
      .newTx()
      .collectFrom([goodUtxo])    
      .attach.SpendingValidator(rewardsValidator)     
      .addSigner(address)
      .complete({ localUPLCEval: false })


    res.status(200).json({ tx: tx.toCBOR() });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

