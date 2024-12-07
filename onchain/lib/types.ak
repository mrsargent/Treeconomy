use cardano/address.{Address}
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
  beneficiary: Address,
  vestingAsset: AssetClass,
  totalVestingQty: Int,
  vestingPeriodStart: Int,
  vestingPeriodEnd: Int,
  firstUnlockPossibleAfter: Int,
  totalInstallments: Int,
}

pub type Rewards_Redeemer {
  PartialUnlock
  FullUnlock
}

pub type Action {
  Mint
  Burn
}

pub type MintRedeemer {
  out_ref: OutputReference,
  action: Action,
}
