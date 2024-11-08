use aiken/builtin
use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use aiken/interval.{Finite}
use aiken/primitive/bytearray
use cardano/address.{from_verification_key}
use cardano/assets.{
  AssetName, PolicyId, Value, flatten, lovelace_of, merge, quantity_of, zero,
}
use cardano/transaction.{
  InlineDatum, Input, Output, OutputReference, Transaction, ValidityRange,
  find_script_outputs,
}
use types.{POSIXtime}

pub fn datum_tagging_hash(output: Output, out_ref: OutputReference) -> Bool {
  let datum_tag =
    out_ref
      |> builtin.serialise_data
      |> builtin.blake2b_256
      |> InlineDatum

  output.datum == datum_tag
}

pub fn must_be_signed_by(
  transaction: Transaction,
  vk: VerificationKeyHash,
) -> Bool {
  list.has(transaction.extra_signatories, vk)
}

//get all the value of the inputs as an int 
pub fn inputs_int(inputs: List<Input>) -> Int {
  //v is the accumulator for the foldl function 
  let f =
    fn(i: Input, v: Int) -> Int { lovelace_of(i.output.value) + v }
  list.foldl(inputs, 0, f)
}

//take a list of inputs and return the value
//get all inputs value, identical to Plutus valueSpent function
pub fn inputs_value(inputs: List<Input>) -> Value {
  let inputs_ = list.map(inputs, fn(n) { n.output.value })
  list.foldr(inputs_, zero, fn(in1, in2) { merge(in1, in2) })
}

//filter inputs based on policy id and return the qty of tokens
pub fn inputs_value_filter(
  inputs: List<Input>,
  pid: PolicyId,
  an: AssetName,
) -> Int {
  //filter the inputs by policy id
  let filtered_inputs: List<Input> =
    list.filter(inputs, fn(input) { filter_policyid(input, pid) })
  let totaled_value = inputs_value(filtered_inputs)
  quantity_of(totaled_value, pid, an)
}

fn filter_policyid(input: Input, policyid: PolicyId) -> Bool {
  list.any(
    flatten(input.output.value),
    fn(asset) {
      let (p, _, _) = asset
      p == policyid
    },
  )
}

// Get value paid to a public key address by a pending transaction
pub fn value_paid_to(
  outputs: List<Output>,
  receiver: VerificationKeyHash,
) -> Value {
  let addr = from_verification_key(receiver)
  expect [match] = list.filter(outputs, fn(output) { output.address == addr })
  match.value
}

// // Get input from the script.
pub fn find_own_input(out_ref: OutputReference, self: Transaction) -> Input {
  let Transaction { inputs, .. } = self

  //expect and input from the out_ref.
  expect Some(input) =
    inputs
      |> transaction.find_input(out_ref)

  input
}

// // Get outputs to the script.
pub fn find_own_outputs(
  out_ref: OutputReference,
  self: Transaction,
) -> List<Output> {
  let Transaction { outputs, .. } = self

  //find the output based on the hash of the transaciton id hash
  let own_outputs = outputs |> find_script_outputs(out_ref.transaction_id)
  own_outputs
}

// Get all outputs value.
pub fn outputs_value(outputs: List<Output>) -> Value {
  let outputs_ = list.map(outputs, fn(o) { o.value })
  list.foldr(outputs_, zero, fn(in1, in2) { merge(in1, in2) })
}

// Compare the token name without the label. 
pub fn comparing(a: ByteArray, b: ByteArray) -> Bool {
  let sliced_a = bytearray.drop(a, n: 3)
  bytearray.compare(sliced_a, b) == Equal
}

pub fn must_start_after(
  range: ValidityRange,
  lock_expiration_time: POSIXtime,
) -> Bool {
  when range.lower_bound.bound_type is {
    Finite(tx_earliest_time) -> lock_expiration_time <= tx_earliest_time
    _ -> False
  }
}

pub fn must_complete_before(
  range: ValidityRange,
  lock_expiration_time: POSIXtime,
) -> Bool {
  when range.upper_bound.bound_type is {
    Finite(tx_latest_time) -> lock_expiration_time > tx_latest_time
    _ -> False
  }
}
