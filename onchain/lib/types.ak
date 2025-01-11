use cardano/assets.{AssetName, PolicyId}
use cardano/transaction.{OutputReference}

//******************************************
//********* standard util types ************
//******************************************
pub type POSIXtime =
  Int

pub type AssetClass {
  policyid: PolicyId,
  tokenName: AssetName,
}

//******************************************
//********* rewards validator types ********
//******************************************
pub type Rewards_Datum {
  vestingAsset: AssetClass,
  totalVestingQty: Int,
  vestingPeriodStart: Int,
  vestingPeriodEnd: Int,
  firstUnlockPossibleAfter: Int,
  totalInstallments: Int,
  treeNumber: Int,
}

pub type VestingRedeemer {
  PartialUnlock
  FullUnlock
}

//******************************************
//********* minting policy types ********
//******************************************

pub type Action {
  Mint
  Burn
}

pub type MintRedeemer {
  out_ref: OutputReference,
  action: Action,
  prefix: ByteArray,
  treeNumber: ByteArray,
}
