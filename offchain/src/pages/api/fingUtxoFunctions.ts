import { Address, Data, fromText, LucidEvolution, UTxO } from "@lucid-evolution/lucid";
import { CIP68Datum, RewardsDatum } from "./schemas";
import { parseAssetId } from "./apitypes";


//find utxo where value of utxo is greater than 3ada
export const getFirstUxtoWithAda = async (lucid: LucidEvolution, addr: Address): Promise<UTxO | undefined> => {

  const allContractUtxos = await lucid.utxosAt(addr);
  const allUserContractUtxos = allContractUtxos.find((value) => {
    try {

      for (const [assetId, quantity] of Object.entries(value.assets)) {
        const { policyId, tokenName } = parseAssetId(assetId);
        console.log("policy id: ", policyId, " token name: ", tokenName, " qty: ", quantity);
        if (quantity > 5_000_000n) {
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


export const getReferenceNFTUtxo = async (lucid: LucidEvolution, userTokenAssetName: string, addr: Address, treeNumber: number): Promise<UTxO | undefined> => {
  const allContractUtxos = await lucid.utxosAt(addr);
  const allUserContractUtxos = allContractUtxos.find((value) => {
    try {
      if (value.datum){
        const datum = Data.from(value.datum!, CIP68Datum);       
        console.log("reference tokena name from datum: ", datum.metadata.get(fromText("name")));
        console.log("referene token name from input: ", userTokenAssetName);
        if (datum.metadata.get(fromText("name")) === userTokenAssetName ){
          console.log("reference token" + userTokenAssetName + " has been found!");
          return true;
        }
      } else {
        console.log("no reference token has been found!");
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

