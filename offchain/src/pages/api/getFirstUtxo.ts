import { Address, Data, LucidEvolution, UTxO, Validator, validatorToAddress } from "@lucid-evolution/lucid";
import { fromAddress, SimpleSaleDatum } from "./schemas";
import { findIfPolicyIdMatches, parseAssetId } from "./apitypes";


// get all utxos
// filter right datum
// return [reaable_utxos]  return not cbor but price of asset and seller address 

//how does the buy know what the seller address is in this???

export const getFirstUxtoWithAda = async (lucid: LucidEvolution, addr: Address): Promise<UTxO | undefined> => {

  const allContractUtxos = await lucid.utxosAt(addr);
  const allUserContractUtxos = allContractUtxos.find((value) => {
    try {

      for (const [assetId, quantity] of Object.entries(value.assets)) {
        const { policyId, tokenName } = parseAssetId(assetId);
        console.log("policy id: ", policyId, " token name: ", tokenName, " qty: ", quantity);
        if (quantity > 3_000_000n) {
          console.log("returned true: ", tokenName, " qty: ", quantity);
          return true;
        }
      }
    }
    catch (_) {
      console.log("catch hit on query");
      return false;
    }

  });

  return allUserContractUtxos; 

}