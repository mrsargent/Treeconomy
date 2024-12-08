use aiken/fuzz.{and_then, map}
use aiken/interval.{Finite, Interval, IntervalBound, PositiveInfinity}
use cardano/address.{Address}
use cardano/addresses
use cardano/assets.{AssetName, PolicyId, Value, from_asset}
use cardano/transaction.{InlineDatum, Input, NoDatum, Output, OutputReference}
use types.{AssetClass, POSIXtime, VestingDatum}

//********************************************************************************
//******************** helper functions property test *********************
//********************************************************************************

pub fn generate_address() -> Fuzzer<Address> {
  let byte1 <- and_then(fuzz.bytearray_between(56, 56))
  let byte2 <- map(fuzz.bytearray_between(56, 56))
  let addr: Address = addresses.create_address(byte1, byte2)
  addr
}

pub fn generate_script_address() -> Fuzzer<Address> {
  let byte1 <- and_then(fuzz.bytearray_between(56, 56))
  let byte2 <- map(fuzz.bytearray_between(56, 56))
  let addr: Address = addresses.create_script_address(byte1, byte2)
  addr
}

pub fn generate_outref() -> Fuzzer<OutputReference> {
  let index <- and_then(fuzz.int_between(1, 5))
  let hash <- map(fuzz.bytearray_between(64, 64))
  let out: OutputReference =
    OutputReference { transaction_id: hash, output_index: index }

  out
}

pub fn generate_token_value() -> Fuzzer<Value> {
  fuzz.map3(
    fuzz.bytearray_between(56, 56),
    fuzz.bytearray_between(1, 32),
    fuzz.int_between(10, 100),
    fn(pid, tn, qty) { from_asset(pid, tn, qty) },
  )
}

pub fn generate_token_name() -> Fuzzer<AssetName> {
  let tn <- map(fuzz.bytearray_between(1, 32))
  tn
}

pub fn generate_policy_id() -> Fuzzer<PolicyId> {
  let pid <- map(fuzz.bytearray_between(56, 56))
  pid
}

pub fn generate_interval_int() -> Fuzzer<Int> {
  let i <- map(fuzz.int_between(5, 200))
  i
}

//********************************************************************************
//******************** helper functions unit test *********************
//********************************************************************************

pub fn rewards_datum1() -> VestingDatum {
  let datum: VestingDatum =
    VestingDatum {
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

pub fn rewards_datum2() -> VestingDatum {
  let datum: VestingDatum =
    VestingDatum {
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

pub fn create_address1() -> Address {
  addresses.create_address(#"abcd", #"")
}

pub fn create_bad_address1() -> Address {
  addresses.create_address(#"", #"")
}

pub fn create_interval_lowerbound(num: Int) -> Interval<POSIXtime> {
  Interval {
    lower_bound: IntervalBound { bound_type: Finite(num), is_inclusive: False },
    upper_bound: IntervalBound {
      bound_type: PositiveInfinity,
      is_inclusive: False,
    },
  }
}

pub fn create_interval_range(lower: Int, upper: Int) -> Interval<POSIXtime> {
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

pub const test_datum: ByteArray = #"acabbeeffacecafe"

pub fn test_bad_inputs1() -> List<Input> {
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

pub fn test_bad_inputs2() -> List<Input> {
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

pub fn test_bad_outputs1() -> List<Output> {
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

pub fn test_bad_outputs2() -> List<Output> {
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

pub fn test_bad_outputs3() -> List<Output> {
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

pub fn test_bad_outputs4() -> List<Output> {
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
