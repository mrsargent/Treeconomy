use aiken/crypto.{VerificationKeyHash}
use aiken/interval.{Finite, Interval, IntervalBound, PositiveInfinity}
use cardano/address.{Address}
use cardano/addresses
use cardano/assets
use cardano/transaction.{
  InlineDatum, Input, NoDatum, Output, OutputReference, Transaction,
}
use rewards_validator
use tests/fake_tx
use types.{
  AssetClass, FullUnlock, POSIXtime, PartialUnlock, Rewards_Datum,
  Rewards_Redeemer,
}

//********************************************************************************
//******************* rewards validator fullunlock unit tests *********************
//********************************************************************************

test rewards_validator_fullunlock_test() {
  let datum: Rewards_Datum = rewards_datum1()
  let redeemer: Rewards_Redeemer = FullUnlock
  let out_ref: OutputReference = fake_tx.test_out_ref()
  let signature: VerificationKeyHash = #"abcd"
  let i: Interval<POSIXtime> = create_interval_lowerbound(101)
  let test_trans: Transaction =
    transaction.placeholder
      |> fn(transaction) {
          Transaction {
            ..transaction,
            validity_range: i,
            extra_signatories: [signature],
          }
        }

  rewards_validator.rewards_validator.spend(
    Some(datum),
    redeemer,
    out_ref,
    test_trans,
  )
}

test rewards_validator_fullunlock_test_not_past_deadline() fail {
  let datum: Rewards_Datum = rewards_datum1()
  let redeemer: Rewards_Redeemer = FullUnlock
  let out_ref: OutputReference = fake_tx.test_out_ref()
  let signature: VerificationKeyHash = #"abcd"
  let i: Interval<POSIXtime> = create_interval_lowerbound(99)
  let test_trans: Transaction =
    transaction.placeholder
      |> fn(transaction) {
          Transaction {
            ..transaction,
            validity_range: i,
            extra_signatories: [signature],
          }
        }

  rewards_validator.rewards_validator.spend(
    Some(datum),
    redeemer,
    out_ref,
    test_trans,
  )
}

test rewards_validator_fullunlock_test_bad_address() fail {
  let datum: Rewards_Datum = rewards_datum2()
  let redeemer: Rewards_Redeemer = FullUnlock
  let out_ref: OutputReference = fake_tx.test_out_ref()
  let signature: VerificationKeyHash = #"abcd"
  let i: Interval<POSIXtime> = create_interval_lowerbound(99)
  let test_trans: Transaction =
    transaction.placeholder
      |> fn(transaction) {
          Transaction {
            ..transaction,
            validity_range: i,
            extra_signatories: [signature],
          }
        }

  rewards_validator.rewards_validator.spend(
    Some(datum),
    redeemer,
    out_ref,
    test_trans,
  )
}

//********************************************************************************
//******************* rewards validator partialunlock unit tests *****************
//********************************************************************************

test rewards_validator_partialunlock_test() {
  let datum: Rewards_Datum = rewards_datum1()
  let redeemer: Rewards_Redeemer = PartialUnlock
  let out_ref: OutputReference = fake_tx.test_out_ref()
  let test_inputs: List<Input> = test_bad_inputs1()
  let test_outputs: List<Output> = test_bad_outputs1()
  let signature: VerificationKeyHash = #"abcd"
  let i: Interval<POSIXtime> = create_interval_range(20, 30)
  let test_trans: Transaction =
    transaction.placeholder
      |> fn(transaction) {
          Transaction {
            ..transaction,
            inputs: test_inputs,
            outputs: test_outputs,
            validity_range: i,
            extra_signatories: [signature],
          }
        }

  rewards_validator.rewards_validator.spend(
    Some(datum),
    redeemer,
    out_ref,
    test_trans,
  )
}

test rewards_validator_partialunlock_test_bad_signature() fail {
  let datum: Rewards_Datum = rewards_datum2()
  let redeemer: Rewards_Redeemer = PartialUnlock
  let out_ref: OutputReference = fake_tx.test_out_ref()
  let test_inputs: List<Input> = test_bad_inputs1()
  let test_outputs: List<Output> = test_bad_outputs1()
  let signature: VerificationKeyHash = #"abcd"
  let i: Interval<POSIXtime> = create_interval_range(20, 30)
  let test_trans: Transaction =
    transaction.placeholder
      |> fn(transaction) {
          Transaction {
            ..transaction,
            inputs: test_inputs,
            outputs: test_outputs,
            validity_range: i,
            extra_signatories: [signature],
          }
        }

  rewards_validator.rewards_validator.spend(
    Some(datum),
    redeemer,
    out_ref,
    test_trans,
  )
}

test rewards_validator_partialunlock_test_before_first_unlock() fail {
  let datum: Rewards_Datum = rewards_datum1()
  let redeemer: Rewards_Redeemer = PartialUnlock
  let out_ref: OutputReference = fake_tx.test_out_ref()
  let test_inputs: List<Input> = test_bad_inputs1()
  let test_outputs: List<Output> = test_bad_outputs1()
  let signature: VerificationKeyHash = #"abcd"
  let i: Interval<POSIXtime> = create_interval_range(1, 30)
  let test_trans: Transaction =
    transaction.placeholder
      |> fn(transaction) {
          Transaction {
            ..transaction,
            inputs: test_inputs,
            outputs: test_outputs,
            validity_range: i,
            extra_signatories: [signature],
          }
        }

  rewards_validator.rewards_validator.spend(
    Some(datum),
    redeemer,
    out_ref,
    test_trans,
  )
}

test rewards_validator_partialunlock_test_zero_asset_remain() fail {
  let datum: Rewards_Datum = rewards_datum1()
  let redeemer: Rewards_Redeemer = PartialUnlock
  let out_ref: OutputReference = fake_tx.test_out_ref()
  let test_inputs: List<Input> = test_bad_inputs1()
  let test_outputs: List<Output> = test_bad_outputs2()
  let signature: VerificationKeyHash = #"abcd"
  let i: Interval<POSIXtime> = create_interval_range(20, 30)
  let test_trans: Transaction =
    transaction.placeholder
      |> fn(transaction) {
          Transaction {
            ..transaction,
            inputs: test_inputs,
            outputs: test_outputs,
            validity_range: i,
            extra_signatories: [signature],
          }
        }

  rewards_validator.rewards_validator.spend(
    Some(datum),
    redeemer,
    out_ref,
    test_trans,
  )
}

test rewards_validator_partialunlock_test_remaining_assets_less() fail {
  let datum: Rewards_Datum = rewards_datum1()
  let redeemer: Rewards_Redeemer = PartialUnlock
  let out_ref: OutputReference = fake_tx.test_out_ref()
  let test_inputs: List<Input> = test_bad_inputs1()
  let test_outputs: List<Output> = test_bad_outputs3()
  let signature: VerificationKeyHash = #"abcd"
  let i: Interval<POSIXtime> = create_interval_range(20, 30)
  let test_trans: Transaction =
    transaction.placeholder
      |> fn(transaction) {
          Transaction {
            ..transaction,
            inputs: test_inputs,
            outputs: test_outputs,
            validity_range: i,
            extra_signatories: [signature],
          }
        }

  rewards_validator.rewards_validator.spend(
    Some(datum),
    redeemer,
    out_ref,
    test_trans,
  )
}

test rewards_validator_partialunlock_test_bad_expected_qty() fail {
  let datum: Rewards_Datum = rewards_datum1()
  let redeemer: Rewards_Redeemer = PartialUnlock
  let out_ref: OutputReference = fake_tx.test_out_ref()
  let test_inputs: List<Input> = test_bad_inputs1()
  let test_outputs: List<Output> = test_bad_outputs1()
  let signature: VerificationKeyHash = #"abcd"
  let i: Interval<POSIXtime> = create_interval_range(20, 100)
  let test_trans: Transaction =
    transaction.placeholder
      |> fn(transaction) {
          Transaction {
            ..transaction,
            inputs: test_inputs,
            outputs: test_outputs,
            validity_range: i,
            extra_signatories: [signature],
          }
        }

  rewards_validator.rewards_validator.spend(
    Some(datum),
    redeemer,
    out_ref,
    test_trans,
  )
}

test rewards_validator_partialunlock_test_bad_datum_equivalent() fail {
  let datum: Rewards_Datum = rewards_datum1()
  let redeemer: Rewards_Redeemer = PartialUnlock
  let out_ref: OutputReference = fake_tx.test_out_ref()
  let test_inputs: List<Input> = test_bad_inputs1()
  let test_outputs: List<Output> = test_bad_outputs4()
  let signature: VerificationKeyHash = #"abcd"
  let i: Interval<POSIXtime> = create_interval_range(20, 30)
  let test_trans: Transaction =
    transaction.placeholder
      |> fn(transaction) {
          Transaction {
            ..transaction,
            inputs: test_inputs,
            outputs: test_outputs,
            validity_range: i,
            extra_signatories: [signature],
          }
        }

  rewards_validator.rewards_validator.spend(
    Some(datum),
    redeemer,
    out_ref,
    test_trans,
  )
}

test rewards_validator_partialunlock_test_too_many_script_inputs() fail {
  let datum: Rewards_Datum = rewards_datum1()
  let redeemer: Rewards_Redeemer = PartialUnlock
  let out_ref: OutputReference = fake_tx.test_out_ref()
  let test_inputs: List<Input> = test_bad_inputs2()
  let test_outputs: List<Output> = test_bad_outputs1()
  let signature: VerificationKeyHash = #"abcd"
  let i: Interval<POSIXtime> = create_interval_range(20, 30)
  let test_trans: Transaction =
    transaction.placeholder
      |> fn(transaction) {
          Transaction {
            ..transaction,
            inputs: test_inputs,
            outputs: test_outputs,
            validity_range: i,
            extra_signatories: [signature],
          }
        }

  rewards_validator.rewards_validator.spend(
    Some(datum),
    redeemer,
    out_ref,
    test_trans,
  )
}

//********************************************************************************
//******************** helper functions *********************
//********************************************************************************

fn rewards_datum1() -> Rewards_Datum {
  let datum: Rewards_Datum =
    Rewards_Datum {
      beneficiary: create_address1(),
      vestingAsset: AssetClass { policyid: #"acab", tokenName: #"beef" },
      totalVestingQty: 100,
      vestingPeriodStart: 10,
      vestingPeriodEnd: 100,
      firstUnlockPossibleAfter: 15,
      totalInstallments: 10,
    }
  datum
}

fn rewards_datum2() -> Rewards_Datum {
  let datum: Rewards_Datum =
    Rewards_Datum {
      beneficiary: create_bad_address1(),
      vestingAsset: AssetClass { policyid: #"acab", tokenName: #"beef" },
      totalVestingQty: 100,
      vestingPeriodStart: 10,
      vestingPeriodEnd: 100,
      firstUnlockPossibleAfter: 15,
      totalInstallments: 10,
    }
  datum
}

fn create_address1() -> Address {
  addresses.create_address(#"abcd", #"")
}

fn create_bad_address1() -> Address {
  addresses.create_address(#"", #"")
}

fn create_interval_lowerbound(num: Int) -> Interval<POSIXtime> {
  Interval {
    lower_bound: IntervalBound { bound_type: Finite(num), is_inclusive: False },
    upper_bound: IntervalBound {
      bound_type: PositiveInfinity,
      is_inclusive: False,
    },
  }
}

fn create_interval_range(lower: Int, upper: Int) -> Interval<POSIXtime> {
  Interval {
    lower_bound: IntervalBound {
      bound_type: Finite(lower),
      is_inclusive: False,
    },
    upper_bound: IntervalBound {
      bound_type: Finite(upper),
      is_inclusive: False,
    },
  }
}

const test_datum: ByteArray = #"acabbeeffacecafe"

fn test_bad_inputs1() -> List<Input> {
  [
    Input {
      output_reference: OutputReference {
        transaction_id: #"acab",
        output_index: 0,
      },
      output: Output {
        address: addresses.create_address(#"acab", #""),
        value: assets.from_asset(#"acab", #"beef", 90),
        datum: InlineDatum(test_datum),
        reference_script: None,
      },
    },
    Input {
      output_reference: OutputReference { transaction_id: #"", output_index: 1 },
      output: Output {
        address: addresses.create_address(#"face", #""),
        value: assets.from_lovelace(5),
        datum: NoDatum,
        reference_script: None,
      },
    },
    Input {
      output_reference: OutputReference {
        transaction_id: #"aaaa",
        output_index: 0,
      },
      output: Output {
        address: addresses.create_script_address(#"aaaa", #""),
        value: assets.from_lovelace(100),
        datum: InlineDatum(test_datum),
        reference_script: None,
      },
    },
  ]
}

fn test_bad_inputs2() -> List<Input> {
  [
    Input {
      output_reference: OutputReference {
        transaction_id: #"acab",
        output_index: 0,
      },
      output: Output {
        address: addresses.create_address(#"acab", #""),
        value: assets.from_asset(#"acab", #"beef", 90),
        datum: InlineDatum(test_datum),
        reference_script: None,
      },
    },
    Input {
      output_reference: OutputReference { transaction_id: #"", output_index: 1 },
      output: Output {
        address: addresses.create_script_address(#"face", #""),
        value: assets.from_lovelace(5),
        datum: NoDatum,
        reference_script: None,
      },
    },
    Input {
      output_reference: OutputReference {
        transaction_id: #"aaaa",
        output_index: 0,
      },
      output: Output {
        address: addresses.create_script_address(#"aaaa", #""),
        value: assets.from_lovelace(100),
        datum: InlineDatum(test_datum),
        reference_script: None,
      },
    },
  ]
}

fn test_bad_outputs1() -> List<Output> {
  [
    Output {
      address: addresses.create_address(#"acab", #""),
      value: assets.from_asset(#"acab", #"beef", 80),
      datum: InlineDatum(test_datum),
      reference_script: None,
    },
    Output {
      address: addresses.create_address(#"face", #""),
      value: assets.from_lovelace(40),
      datum: NoDatum,
      reference_script: None,
    },
  ]
}

fn test_bad_outputs2() -> List<Output> {
  [
    Output {
      address: addresses.create_address(#"acab", #""),
      value: assets.from_asset(#"acab", #"beef", 0),
      datum: InlineDatum(test_datum),
      reference_script: None,
    },
    Output {
      address: addresses.create_address(#"face", #""),
      value: assets.from_lovelace(40),
      datum: NoDatum,
      reference_script: None,
    },
  ]
}

fn test_bad_outputs3() -> List<Output> {
  [
    Output {
      address: addresses.create_address(#"acab", #""),
      value: assets.from_asset(#"acab", #"beef", 120),
      datum: InlineDatum(test_datum),
      reference_script: None,
    },
    Output {
      address: addresses.create_address(#"face", #""),
      value: assets.from_lovelace(40),
      datum: NoDatum,
      reference_script: None,
    },
  ]
}

fn test_bad_outputs4() -> List<Output> {
  [
    Output {
      address: addresses.create_address(#"acab", #""),
      value: assets.from_asset(#"acab", #"beef", 80),
      datum: NoDatum,
      reference_script: None,
    },
    Output {
      address: addresses.create_address(#"face", #""),
      value: assets.from_lovelace(40),
      datum: NoDatum,
      reference_script: None,
    },
  ]
}
