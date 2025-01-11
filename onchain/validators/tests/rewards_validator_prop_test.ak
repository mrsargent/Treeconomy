use aiken/crypto.{VerificationKeyHash}
use aiken/fuzz
use aiken/interval.{Interval}
use cardano/addresses
use cardano/assets.{AssetName, PolicyId}
use cardano/transaction.{
  InlineDatum, Input, NoDatum, Output, OutputReference, Transaction,
}
use rewards_validator
use tests/utils_test
use types.{
  AssetClass, FullUnlock, POSIXtime, PartialUnlock, Rewards_Datum,
  VestingRedeemer,
}

//********************************************************************************
//******************** rewards validator full unlock *********************
//********************************************************************************

test rewards_validator_fullunlock_proptest(
  param via generate_full_unlock_test(),
) {
  let FullUnlockTest { out_ref, pid, tn, time_interval } = param

  let datum: Rewards_Datum =
    Rewards_Datum {
      vestingAsset: AssetClass { policyid: pid, tokenName: tn },
      totalVestingQty: 100,
      vestingPeriodStart: time_interval - 40,
      vestingPeriodEnd: time_interval - 1,
      firstUnlockPossibleAfter: time_interval - 40,
      totalInstallments: 10,
      treeNumber: 10,
    }

  let redeemer: VestingRedeemer = FullUnlock
  let out_ref: OutputReference = out_ref
  let signature: VerificationKeyHash = #"abcd"
  let i: Interval<POSIXtime> =
    utils_test.create_interval_lowerbound(time_interval)
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
//******************** rewards validator partial unlock *********************
//********************************************************************************

test rewards_validator_partialunlock_proptest(
  param via generate_partial_unlock_test(),
) {
  let PartialUnlockTest { out_ref, inputs, outputs, pid, tn, .. } = param

  let datum: Rewards_Datum =
    Rewards_Datum {
      vestingAsset: AssetClass { policyid: pid, tokenName: tn },
      totalVestingQty: 100,
      vestingPeriodStart: 10,
      vestingPeriodEnd: 100,
      firstUnlockPossibleAfter: 15,
      totalInstallments: 10,
      treeNumber: 10,
    }

  let redeemer: VestingRedeemer = PartialUnlock
  let out_ref: OutputReference = out_ref
  let signature: VerificationKeyHash = #"abcd"
  let i: Interval<POSIXtime> = utils_test.create_interval_range(20, 30)
  let test_trans: Transaction =
    transaction.placeholder
      |> fn(transaction) {
          Transaction {
            ..transaction,
            inputs: inputs,
            outputs: outputs,
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

type FullUnlockTest {
  out_ref: OutputReference,
  pid: PolicyId,
  tn: AssetName,
  time_interval: Int,
}

fn generate_full_unlock_test() -> Fuzzer<FullUnlockTest> {
  fuzz.map4(
    utils_test.generate_outref(),
    utils_test.generate_policy_id(),
    utils_test.generate_token_name(),
    fuzz.int_between(50, 200),
    fn(out_ref, pid, tn, time_interval) {
      FullUnlockTest(out_ref, pid, tn, time_interval)
    },
  )
}

type PartialUnlockTest {
  out_ref: OutputReference,
  inputs: List<Input>,
  outputs: List<Output>,
  pid: PolicyId,
  tn: AssetName,
  time_interval: Int,
}

fn generate_partial_unlock_test() -> Fuzzer<PartialUnlockTest> {
  fuzz.map7(
    utils_test.generate_script_address(),
    utils_test.generate_outref(),
    utils_test.generate_outref(),
    utils_test.generate_outref(),
    utils_test.generate_policy_id(),
    utils_test.generate_token_name(),
    fuzz.int_between(50, 200),
    fn(script_addr, out_ref1, out_ref2, out_ref3, pid, tn, time_interval) {
      let inputs: List<Input> =
        [
          Input {
            output_reference: out_ref1,
            output: Output {
              address: addresses.create_address(#"abcd", #""),
              value: assets.from_asset(pid, tn, 90),
              datum: InlineDatum(utils_test.test_datum),
              reference_script: None,
            },
          },
          Input {
            output_reference: out_ref2,
            output: Output {
              address: addresses.create_address(#"face", #""),
              value: assets.from_lovelace(5),
              datum: NoDatum,
              reference_script: None,
            },
          },
          Input {
            output_reference: out_ref3,
            output: Output {
              address: script_addr,
              value: assets.from_lovelace(100),
              datum: InlineDatum(utils_test.test_datum),
              reference_script: None,
            },
          },
        ]

      let outputs: List<Output> =
        [
          Output {
            address: addresses.create_address(#"abcd", #""),
            value: assets.from_asset(pid, tn, 80),
            datum: InlineDatum(utils_test.test_datum),
            reference_script: None,
          },
          Output {
            address: addresses.create_address(#"face", #""),
            value: assets.from_lovelace(40),
            datum: NoDatum,
            reference_script: None,
          },
        ]
      PartialUnlockTest(out_ref1, inputs, outputs, pid, tn, time_interval)
    },
  )
}
