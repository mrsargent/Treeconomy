import { POSIXTime } from "@/Utils/types";
import { Address, fromUnit, LucidEvolution, RewardAddress, UTxO } from "@lucid-evolution/lucid"



export type AssetClass = {
  policyId: string;
  tokenName: string;
}

export type LockTokensConfig = {
  beneficiary: Address;
  vestingAsset: AssetClass;
  totalVestingQty: number;
  vestingPeriodStart: POSIXTime;
  vestingPeriodEnd: POSIXTime;
  firstUnlockPossibleAfter: POSIXTime;
  totalInstallments: number;
  
};

export type InitialMintConfig = {   
  TokenName: string;
  address: string;
  compiledCodeNFT: string;
  compiledCodeToken: string;
};


export type NFTMinterConfig = {   
    TokenName: string;
    address: string;
  };

  export type LockNFTConfig = {
    priceOfAsset: string;
    policyID: string;
    TokenName: string;
    marketPlace: string;
    sellerAddr: string;
  };

  export type WithdrawNFTConfig = {
    marketplace: string; 
    sellerAddr: string;
    pid: string;
  };

  export type BuyNFTConfig = {
    marketplace: string;
    sellerAddr: string;
    pid:string;
  };
  
  export type Token = {
    policyId: string;
    tokenName: string;
    quantity: bigint;
  }

 
  export function parseAssetId(assetId: string) {
    const policyId = assetId.slice(0, 56);
    const tokenName = assetId.slice(56);
    return { policyId, tokenName };
  }


  export function hexToString(hex: string): string {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
  }

  export const aggregateTokens = (tokens: Token[]): Record<string, Token> => {
    return tokens.reduce((acc: Record<string, Token>, token) => {
      const tokenName = token.tokenName === "" ? "ADA" : hexToString(token.tokenName);
      const key = `${token.policyId}-${tokenName}`;
      if (!acc[key]) {
        acc[key] = { ...token, tokenName, quantity: BigInt(0) };
      }
      acc[key].quantity += token.quantity;
      return acc;
    }, {} as Record<string, Token>);
  };
  

  export function findIfPolicyIdMatches(value: UTxO, pid: string): boolean {          
    for (const [assetId, quantity] of Object.entries(value.assets)) {
      const { policyId, assetName } = fromUnit(assetId);          
      console.log(policyId, " --- ", pid); 
      if (policyId == pid){
        console.log("foudndPID has been triggered");
        return true;
      }
    }    
    return false;     
  }

  export const parse = (json: string) =>
    JSON.parse(json, (key, value) =>
      typeof value === "string" && /^\d+n$/.test(value)
        ? BigInt(value.slice(0, -1))
        : value
    );
  


  // export function serialzeAndHash(datum:any){
  //   const serializeData = JSON.stringify(datum);
  //   const encoder = new TextEncoder();
  //   const encArr = encoder.encode(serializeData);
  //   return hash_blake2b256(encArr);
  // }