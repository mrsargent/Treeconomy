import { AssetClass, POSIXTime, Token, TreeData } from "@/Utils/types";
import { Address, fromUnit, LucidEvolution, RewardAddress, UTxO } from "@lucid-evolution/lucid"





export type InitialMintConfig = {
  address: string;
  nftMintPolicyName: string;
  tokenMintPolicyName: string;
  rewardsValidatorName: string;
  lockingValidatorName: string;
  species: string;
  coordinates: string;
  isSignedIn: boolean;
};

export type GetTokenDataConfig = {
  unit: string;
}

export type WithdrawConfig = {
  address: string;
  rewardsValidatorName: string;
  treeNumber: string;
  assetClass: AssetClass;
  isSignedIn: boolean;
};

export type MintBurnConfig = {
  address: string;
  refLockPolicy: string;
  nftMintPolicyName: string;
  treeData: TreeData;
  burnAssetName: string;
  isSignedIn: boolean;
}

export type BurnConfig = {
  address: string;
  nftMintPolicyName: string;
  burnAssetName: string;
}

export type GoogleConfig = {
  email: string;
}


// export type Token = {
//   policyId: string;
//   tokenName: string;
//   quantity: bigint;
// }

