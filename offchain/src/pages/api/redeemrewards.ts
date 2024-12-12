import { Lucid, UTxO, Validator, Data, validatorToAddress, toUnit, Kupmios } from "@lucid-evolution/lucid";
import { NextApiRequest, NextApiResponse } from "next";
import { WithdrawConfig } from "./apitypes";
import scripts from '../../../../onchain/plutus.json';
import { RewardsDatum, VestingRedeemer } from "./schemas";
import { divCeil, parseSafeDatum, toAddress } from "@/Utils/Utils";
import { TIME_TOLERANCE_MS } from "@/Utils/constants";
import { POSIXTime } from "@/Utils/types";
import { getUtxoByTreeNo } from "./fingUtxoFunctions";



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
    const { address, rewardsValidatorName, treeNumber }: WithdrawConfig = req.body;
    console.log(address);
    lucid.selectWallet.fromAddress(address, [])

    console.log("Tree number: ", treeNumber);

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

    const currentTime: POSIXTime = Date.now();
    console.log("current time: ",currentTime);
    
    
    // *****************************************************************/
    //*********  construct stuff ***************/
    //**************************************************************** */

    //****** test out ref for first test to make sure things work */
    // const out_ref: OutRef = {
    //   txHash: "4054cabbd2604c32e2eb64b67ecbf9ed89d3bd55c8465da5b42c1db28f253ad7",
    //   outputIndex: 1
    // };

    //*********************** */
    //const vestingUTXO: UTxO = (await lucid.utxosByOutRef([out_ref]))[0];
    const vestingUTXO: UTxO | undefined = await getUtxoByTreeNo(lucid,contractAddr,treeNumber);

    console.log("Tree utxo hash: ", vestingUTXO?.txHash, " index: ",vestingUTXO?.outputIndex);

    if (!vestingUTXO){
      console.log("no utxo in script");
      return { type: "error", error: new Error("No Utxo in Script") };
    }
     

    if (!vestingUTXO.datum){
      console.log("missing datum");
      return { type: "error", error: new Error("Missing Datum") };
    }
      

    const datum = parseSafeDatum(vestingUTXO.datum, RewardsDatum);
    if (datum.type == "left")
      return { type: "error", error: new Error(datum.value) };


    console.log("vesting period end: ", datum.value.vestingPeriodEnd);
    const vestingPeriodLength =
      datum.value.vestingPeriodEnd - datum.value.vestingPeriodStart;

    const vestingTimeRemaining =
      datum.value.vestingPeriodEnd - BigInt(currentTime);
    console.log("vestingTimeRemaining", vestingTimeRemaining);

    const timeBetweenTwoInstallments = divCeil(
      BigInt(vestingPeriodLength),
      datum.value.totalInstallments
    );
    console.log("timeBetweenTwoInstallments", timeBetweenTwoInstallments);

    const futureInstallments = divCeil(
      vestingTimeRemaining,
      timeBetweenTwoInstallments
    );
    console.log("futureInstallments", futureInstallments);

    const expectedRemainingQty = divCeil(
      futureInstallments * datum.value.totalVestingQty,
      datum.value.totalInstallments
    );
    console.log("expectedRemainingQty", expectedRemainingQty);

    const vestingTokenUnit = datum.value.vestingAsset.policyId
      ? toUnit(datum.value.vestingAsset.policyId, datum.value.vestingAsset.tokenName)
      : "lovelace";
    console.log("vestingTokenUnit", vestingTokenUnit)

    const vestingTokenAmount =
      vestingTimeRemaining < 0n
        ? vestingUTXO.assets[vestingTokenUnit]
        : vestingUTXO.assets[vestingTokenUnit] - expectedRemainingQty;
    console.log("vestingTokenAmount", vestingTokenAmount);
    console.log("vestingUTXO.assets[vestingTokenUnit]: ",vestingUTXO.assets[vestingTokenUnit]);

    const beneficiaryAddress = toAddress(datum.value.beneficiary, "Preprod");
    console.log("Beneficiary Address: ", beneficiaryAddress);
    const rewardsRedeemer =
      vestingTimeRemaining < 0n
        ? Data.to("FullUnlock", VestingRedeemer)
        : Data.to("PartialUnlock", VestingRedeemer);

    const upperBound = Number(currentTime + TIME_TOLERANCE_MS);
    const lowerBound = Number(currentTime - TIME_TOLERANCE_MS);

    // *****************************************************************/
    //*********  constructing transaction ******************************/
    // redeem rewards
    //**************************************************************** */
    try {
      let tx;
      console.log("unlocking");
      if (vestingTimeRemaining < 0n) {
        console.log("Doing full unlock");
        tx = await lucid
          .newTx()
          .collectFrom([vestingUTXO], rewardsRedeemer)
          .attach.SpendingValidator(rewardsValidator)
          .pay.ToAddress(beneficiaryAddress,
            
            {
              [vestingTokenUnit]: vestingTokenAmount,
            })
          .validFrom(lowerBound)
          .validTo(upperBound)
          .addSigner(beneficiaryAddress)
          .complete({ localUPLCEval: false });

        res.status(200).json({ tx: tx.toCBOR() });
      } else {
        console.log("Doing partial unlock unlock");
        tx = await lucid
          .newTx()
          .collectFrom([vestingUTXO], rewardsRedeemer)
          .attach.SpendingValidator(rewardsValidator)
          .pay.ToAddress(beneficiaryAddress, {
            [vestingTokenUnit]: vestingTokenAmount,
          })
          .pay.ToContract(
            contractAddr,
            { kind: "inline", value: Data.to(datum.value, RewardsDatum) },
            { [vestingTokenUnit]: expectedRemainingQty }
          )          
          .validFrom(lowerBound)
          .validTo(upperBound)
          .addSigner(beneficiaryAddress)
          .complete({ localUPLCEval: false });
        res.status(200).json({ tx: tx.toCBOR() });
      }
    } catch (error) {
      console.log("transaction error: ", error);
      res.status(400).json({ error: "Transaction Error" });
    }

  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

