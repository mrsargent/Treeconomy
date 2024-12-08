use aiken/crypto.{VerificationKeyHash}
use aiken/interval.{Interval}
use cardano/transaction.{Input, Output, OutputReference, Transaction}
use linearvesting
use tests/fake_tx
use tests/utils_test.{
  create_interval_lowerbound, create_interval_range, rewards_datum1,
  rewards_datum2, test_bad_inputs1, test_bad_inputs2, test_bad_outputs1,
  test_bad_outputs2, test_bad_outputs3, test_bad_outputs4,
}
use types.{FullUnlock, POSIXtime, PartialUnlock, VestingDatum, VestingRedeemer}

//********************************************************************************
//******************* rewards validator fullunlock unit tests *********************
//********************************************************************************

test rewards_validator_fullunlock_test() {
  let datum: VestingDatum = rewards_datum1()
  let redeemer: VestingRedeemer = FullUnlock
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

  linearvesting.linearvesting_validator.spend(
    Some(datum),
    redeemer,
    out_ref,
    test_trans,
  )
}

test rewards_validator_fullunlock_test_not_past_deadline() fail {
  let datum: VestingDatum = rewards_datum1()
  let redeemer: VestingRedeemer = FullUnlock
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

  linearvesting.linearvesting_validator.spend(
    Some(datum),
    redeemer,
    out_ref,
    test_trans,
  )
}

test rewards_validator_fullunlock_test_bad_address() fail {
  let datum: VestingDatum = rewards_datum2()
  let redeemer: VestingRedeemer = FullUnlock
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

  linearvesting.linearvesting_validator.spend(
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
  let datum: VestingDatum = rewards_datum1()
  let redeemer: VestingRedeemer = PartialUnlock
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

  linearvesting.linearvesting_validator.spend(
    Some(datum),
    redeemer,
    out_ref,
    test_trans,
  )
}

test rewards_validator_partialunlock_test_bad_signature() fail {
  let datum: VestingDatum = rewards_datum2()
  let redeemer: VestingRedeemer = PartialUnlock
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

  linearvesting.linearvesting_validator.spend(
    Some(datum),
    redeemer,
    out_ref,
    test_trans,
  )
}

test rewards_validator_partialunlock_test_before_first_unlock() fail {
  let datum: VestingDatum = rewards_datum1()
  let redeemer: VestingRedeemer = PartialUnlock
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

  linearvesting.linearvesting_validator.spend(
    Some(datum),
    redeemer,
    out_ref,
    test_trans,
  )
}

test rewards_validator_partialunlock_test_zero_asset_remain() fail {
  let datum: VestingDatum = rewards_datum1()
  let redeemer: VestingRedeemer = PartialUnlock
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

  linearvesting.linearvesting_validator.spend(
    Some(datum),
    redeemer,
    out_ref,
    test_trans,
  )
}

test rewards_validator_partialunlock_test_remaining_assets_less() fail {
  let datum: VestingDatum = rewards_datum1()
  let redeemer: VestingRedeemer = PartialUnlock
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

  linearvesting.linearvesting_validator.spend(
    Some(datum),
    redeemer,
    out_ref,
    test_trans,
  )
}

test rewards_validator_partialunlock_test_bad_expected_qty() fail {
  let datum: VestingDatum = rewards_datum1()
  let redeemer: VestingRedeemer = PartialUnlock
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

  linearvesting.linearvesting_validator.spend(
    Some(datum),
    redeemer,
    out_ref,
    test_trans,
  )
}

test rewards_validator_partialunlock_test_bad_datum_equivalent() fail {
  let datum: VestingDatum = rewards_datum1()
  let redeemer: VestingRedeemer = PartialUnlock
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

  linearvesting.linearvesting_validator.spend(
    Some(datum),
    redeemer,
    out_ref,
    test_trans,
  )
}

test rewards_validator_partialunlock_test_too_many_script_inputs() fail {
  let datum: VestingDatum = rewards_datum1()
  let redeemer: VestingRedeemer = PartialUnlock
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

  linearvesting.linearvesting_validator.spend(
    Some(datum),
    redeemer,
    out_ref,
    test_trans,
  )
}
