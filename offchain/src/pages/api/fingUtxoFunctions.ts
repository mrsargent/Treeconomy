import { Address, Data, LucidEvolution, UTxO } from "@lucid-evolution/lucid";
import { RewardsDatum } from "./schemas";
import { parseAssetId } from "./apitypes";


//find utxo where value of utxo is greater than 3ada
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



//find a utxo based on tree number found in RewardsDatum
export const getUtxoByTreeNo = async (lucid: LucidEvolution, addr: Address, treeNumber: number): Promise<UTxO | undefined> => {

  const allContractUtxos = await lucid.utxosAt(addr);
  const allUserContractUtxos = allContractUtxos.find((value) => {
    try {
      if (value.datum){
        const datum = Data.from(value.datum!, RewardsDatum);
        if (datum.treeNumer === BigInt(treeNumber)){
          console.log("Tree number: " + datum.treeNumer + " has been found!");
          return true;
        }
      } else {
        console.log("No utxo with Tree number: " + treeNumber + " found");
        return false;
      }
     
    }
    catch (_) {
      console.log("catch hit on query");
      return false;
    }

  });

  return allUserContractUtxos; 

}