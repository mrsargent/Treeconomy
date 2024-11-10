use aiken/collection/list
use aiken/math/rational.{ceil, from_int}
use cardano/address.{VerificationKey}
use cardano/assets.{quantity_of}
use cardano/transaction.{Output, OutputReference, Transaction}
use types.{FullUnlock, PartialUnlock, Rewards_Datum, Rewards_Redeemer}
use utils.{find_own_input, must_be_signed_by, time_remaining_before_dealine}

validator rewards_validator {
  spend(
    datum: Option<Rewards_Datum>,
    redeemer: Rewards_Redeemer,
    own_ref: OutputReference,
    self: Transaction,
  ) {
    when redeemer is {
      PartialUnlock -> validate_partial_unlock(datum, own_ref, self)
      FullUnlock -> validate_full_unlock(datum, own_ref, self)
    }
  }

  else(_) {
    fail
  }
}

fn validate_partial_unlock(
  datum: Option<Rewards_Datum>,
  own_ref: OutputReference,
  self: Transaction,
) -> Bool {
  let Transaction { inputs, outputs, validity_range, .. } = self
  expect Some(Rewards_Datum {
    beneficiary,
    vestingAsset,
    totalVestingQty,
    vestingPeriodStart,
    vestingPeriodEnd,
    firstUnlockPossibleAfter,
    totalInstallments,
  }) = datum

  //asert there is a vkh and the signature of the transaction and the beneficiary match
  expect VerificationKey(vkh) = beneficiary.payment_credential
  let correct_signature = must_be_signed_by(self, vkh)

  //find input based on the outref and deconstruct
  let own_vesting_input = find_own_input(own_ref, self)

  //assert there is only 1 output that matches the input address  
  expect [own_vesting_output] =
    list.filter(
      outputs,
      fn(output) { output.address == own_vesting_input.output.address },
    )

  let old_remain_qty =
    quantity_of(
      own_vesting_input.output.value,
      vestingAsset.policyid,
      vestingAsset.tokenName,
    )
  let old_remain_qty =
    quantity_of(
      own_vesting_output.value,
      vestingAsset.policyid,
      vestingAsset.tokenName,
    )

  let vesting_period_length = vestingPeriodEnd - vestingPeriodStart
  let vesting_time_remaining =
    time_remaining_before_dealine(validity_range, vestingPeriodEnd)

  let time_between_installments = vesting_period_length / totalInstallments

  expect Some(temp_div) =
    rational.div(
      from_int(vesting_time_remaining),
      from_int(time_between_installments),
    )
  let future_installments = ceil(temp_div)

  True
}

fn validate_full_unlock(
  _datum: Option<Rewards_Datum>,
  _own_ref: OutputReference,
  _self: Transaction,
) -> Bool {
  False
}
