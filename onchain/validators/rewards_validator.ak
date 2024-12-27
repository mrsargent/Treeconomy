use aiken/collection/list
use cardano/assets.{quantity_of}
use cardano/transaction.{Output, OutputReference, Transaction}
use types.{FullUnlock, PartialUnlock, Rewards_Datum, VestingRedeemer}
use utils.{
  divide_ceil_int, find_own_input, must_start_after,
  time_remaining_before_dealine,
}
use validation/count.{inputs_by_vkh}

validator rewards_validator {
  spend(
    datum: Option<Rewards_Datum>,
    redeemer: VestingRedeemer,
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
    vestingAsset,
    totalVestingQty,
    vestingPeriodStart,
    vestingPeriodEnd,
    firstUnlockPossibleAfter,
    totalInstallments,
    ..
  }) = datum

  //find input based on the outref and deconstruct
  let own_vesting_input = find_own_input(own_ref, self)

  //assert there is only 1 output that matches the input address  
  expect [own_vesting_output] =
    list.filter(
      outputs,
      fn(output) { output.address == own_vesting_input.output.address },
    )

  //find qty of token in input (before)
  let old_remain_qty =
    quantity_of(
      own_vesting_input.output.value,
      vestingAsset.policyid,
      vestingAsset.tokenName,
    )

  //find qty of token in output (after)
  let new_remain_qty =
    quantity_of(
      own_vesting_output.value,
      vestingAsset.policyid,
      vestingAsset.tokenName,
    )

  let vesting_period_length = vestingPeriodEnd - vestingPeriodStart

  let vesting_time_remaining =
    time_remaining_before_dealine(validity_range, vestingPeriodEnd)

  let time_between_installments = vesting_period_length / totalInstallments
  let future_installments =
    divide_ceil_int(vesting_time_remaining, time_between_installments)

  let expcted_qty_remaining =
    divide_ceil_int(future_installments * totalVestingQty, totalInstallments)

  //unlock not permitted until firstUnlockPossible 
  let first_unlock_possible =
    must_start_after(validity_range, firstUnlockPossibleAfter)

  //zero remaining assets not allowed
  let assets_remain = new_remain_qty > 0

  //new assets less the old
  let remaining_assets_less = new_remain_qty < old_remain_qty

  //expected assets the same as expected
  let expected_asset_check = expcted_qty_remaining == new_remain_qty

  //datum is equivalent
  let datum_equivalent =
    own_vesting_input.output.datum == own_vesting_output.datum

  //double satisfaction check that there is only 1 script input
  let only_one_script_input = inputs_by_vkh(inputs, 1)

  and {
    first_unlock_possible?,
    assets_remain?,
    remaining_assets_less?,
    expected_asset_check?,
    datum_equivalent?,
    only_one_script_input?,
  }
}

fn validate_full_unlock(
  datum: Option<Rewards_Datum>,
  _own_ref: OutputReference,
  self: Transaction,
) -> Bool {
  expect Some(Rewards_Datum { vestingPeriodEnd, .. }) = datum

  //full unlock not permitted until vesting period end time 
  let full_unlock_possible =
    must_start_after(self.validity_range, vestingPeriodEnd)

  full_unlock_possible?
}
