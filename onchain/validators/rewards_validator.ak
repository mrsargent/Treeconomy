// use aiken/collection/list
// use cardano/transaction.{Output, OutputReference, Transaction}
// use types.{FullUnlock, PartialUnlock, Rewards_Datum, Rewards_Redeemer}
// use utils.{find_own_input, find_own_outputs}

// validator rewards_validator {
//   spend(
//     datum: Option<Rewards_Datum>,
//     redeemer: Rewards_Redeemer,
//     own_ref: OutputReference,
//     self: Transaction,
//   ) {
//     when redeemer is {
//       PartialUnlock -> validate_partial_unlock(datum, own_ref, self)
//       FullUnlock -> validate_full_unlock(datum, own_ref, self)
//     }
//   }

//   else(_) {
//     fail
//   }
// }

// fn validate_partial_unlock(
//   datum: Option<Rewards_Datum>,
//   own_ref: OutputReference,
//   self: Transaction,
// ) -> Bool {
//   let own_vesting_input = find_own_input(own_ref, self)
//   let own_vesting_outputs = find_own_outputs(own_ref, self)

//   //expect [own_output] = list.head(own_vesting_outputs)
//   //let Output { address, value, datum, .. } = own_output
//   True
// }

// fn validate_full_unlock(
//   _datum: Option<Rewards_Datum>,
//   _own_ref: OutputReference,
//   _self: Transaction,
// ) -> Bool {
//   False
// }
