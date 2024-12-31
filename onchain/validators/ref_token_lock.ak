use cardano/transaction.{OutputReference, Transaction}

//this validator is to so I can lock the CIP68 ref token for my NFTs
// in  a contract that they can never be unlocked. 

validator ref_token_lock_validator {
  spend(
    _datum: Option<Data>,
    _redeemer: Data,
    _own_ref: OutputReference,
    _self: Transaction,
  ) {
    False
  }

  else(_) {
    fail
  }
}
