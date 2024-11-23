import { Data, LucidEvolution, UTxO, Validator, validatorToAddress } from "@lucid-evolution/lucid";
import { fromAddress, SimpleSaleDatum } from "./schemas";
import { findIfPolicyIdMatches } from "./apitypes";


// get all utxos
// filter right datum
// return [reaable_utxos]  return not cbor but price of asset and seller address 

//how does the buy know what the seller address is in this???

export const queryNFT = async (lucid: LucidEvolution, contractCbor: string, purchasePrice: bigint, sellerAddr: string, pid: string): Promise<UTxO[]> => {

  const contract: Validator = {
    type: "PlutusV2",
    script: contractCbor,
  };
  const contractAddr = validatorToAddress("Preprod", contract);


  const allContractUtxos = await lucid.utxosAt(contractAddr);
  const allUserContractUtxos = allContractUtxos.find((value) => {    
    try{
      if (value.datum){
        const datum = Data.from(value.datum!, SimpleSaleDatum);
        const price_equal = datum.priceOfAsset === purchasePrice;        
        const foundPId = findIfPolicyIdMatches(value,pid);        
        const same_addr = JSON.stringify(datum.sellerAddress) === JSON.stringify(fromAddress(sellerAddr));
        console.log("price equal -- ", datum.priceOfAsset === purchasePrice);
        console.log("Address equivalent ",  JSON.stringify(datum.sellerAddress) === JSON.stringify(fromAddress(sellerAddr)));
        console.log("everyting true ", price_equal && same_addr && foundPId);
        console.log("found pid: ", foundPId);
        return price_equal && same_addr && foundPId;
      }
      else {
        return false;
      }
    }
    catch(_){
      console.log("catch hit on query");
      return false;   
    }
      
  });       
  
  return allUserContractUtxos ? [allUserContractUtxos] : [];

}