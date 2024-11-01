use aiken/collection/dict
use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/assets.{PolicyId, tokens}
use cardano/transaction.{Input, OutputReference, Transaction}
//use cardano/transaction/value
use utils

validator init_mint_nft(owner: VerificationKeyHash, utxo_ref: OutputReference) {
  mint(_redeemer: Int, policy_id: PolicyId, self: Transaction) {
    let signed_by_program = utils.must_be_signed_by(self, owner)

    let Transaction { inputs, mint, .. } = self
    let is_output_consumed =
      list.any(inputs, fn(input) { input.output_reference == utxo_ref })

    expect [Pair(_, qty)] =
      mint
        |> tokens(policy_id)
        |> dict.to_pairs()
    let qty_correct = qty == 1

    signed_by_program && qty_correct && is_output_consumed
  }

  else(_) {
    fail
  }
}

validator init_mint_token(owner: VerificationKeyHash, asset_name: ByteArray) {
  mint(_redeemer: Data, policy_id: PolicyId, self: Transaction) {
    let signed_by_program = utils.must_be_signed_by(self, owner)

    expect [Pair(an, qty)] =
      self.mint
        |> tokens(policy_id)
        |> dict.to_pairs()

    let name_correct = asset_name == an
    let qty_correct = qty == 10000

    signed_by_program && name_correct && qty_correct
  }

  else(_) {
    fail
  }
}
// test initialmint_test() {
//   let out_ref: OutputReference =
//     OutputReference { transaction_id: #"0000", output_index: 0 }

//   let output =
//     Output {
//       address: from_script(""),
//       value: zero,
//       datum: NoDatum,
//       reference_script: None,
//     }
//   let test_input = Input { output_reference: out_ref, output }
//   let pid = #"0c3626175abe361b24728f3d80e2da26f21c0629cca89542c2935f37"

//   let mint_val: Value =
//     from_asset(policy_id: pid, asset_name: "TreeNFT", quantity: 1)

//   let signature: VerificationKeyHash = #"abcd"

//   //let test_mint = Mint { value: mint_val }
//   let test_trans: Transaction =
//     transaction.placeholder
//       |> fn(transaction) {
//           Transaction {
//             ..transaction,
//             inputs: [test_input],
//             mint: mint_val,
//             extra_signatories: [signature],
//           }
//         }

//   init_mint_nft.mint(signature, out_ref, 0, pid, test_trans)
// }
