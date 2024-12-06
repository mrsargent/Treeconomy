use aiken/builtin
use aiken/cbor
use aiken/collection/dict
use aiken/collection/list
use aiken/crypto.{Blake2b_224, Hash, VerificationKey}
use aiken/primitive/bytearray
use cardano/assets.{PolicyId, tokens}
use cardano/transaction.{Input, OutputReference, Transaction}

validator mint_burn_nft(
  owner: Hash<Blake2b_224, VerificationKey>,
  burn_policy: PolicyId,
) {
  mint(redeemer: OutputReference, policy_id: PolicyId, self: Transaction) {
    let signed_by_program = list.has(self.extra_signatories, owner)
    let Transaction { inputs, mint, .. } = self

    expect Some(_input) =
      list.find(inputs, fn(input) { input.output_reference == redeemer })
    expect [Pair(an, qty_m)] =
      mint
        |> tokens(policy_id)
        |> dict.to_pairs()
    let qty_correct_m = qty_m == 1

    let serialized_redeemer =
      redeemer
        |> builtin.serialise_data
        |> builtin.sha2_256
        |> bytearray.take(16)

    let correct_asset_name = an == serialized_redeemer

    expect [Pair(_, qty_b)] =
      mint
        |> tokens(burn_policy)
        |> dict.to_pairs()
    let qty_correct_b = qty_b == -1

    and {
      signed_by_program?,
      qty_correct_b?,
      qty_correct_m?,
      correct_asset_name?,
    }
  }

  else(_) {
    fail
  }
}
