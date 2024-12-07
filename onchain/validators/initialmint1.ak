use aiken/builtin
use aiken/cbor
use aiken/collection/dict
use aiken/collection/list
use aiken/crypto.{Blake2b_224, Hash, VerificationKey, VerificationKeyHash}
use aiken/primitive/bytearray
use cardano/assets.{PolicyId, tokens}
use cardano/transaction.{Input, Transaction}
use cardano/value.{prove_exact_nft}
use types.{Burn, Mint, MintRedeemer}
use utils

validator init_mint_nft(owner: Hash<Blake2b_224, VerificationKey>) {
  mint(redeemer: MintRedeemer, policy_id: PolicyId, self: Transaction) {
    let MintRedeemer { out_ref, action } = redeemer
    let signed_by_program = list.has(self.extra_signatories, owner)

    let Transaction { inputs, mint, .. } = self

    // expect [Pair(an, qty)] =
    //   mint
    //     |> tokens(policy_id)
    //     |> dict.to_pairs()
    when action is {
      Mint -> {
        expect Some(_input) =
          list.find(inputs, fn(input) { input.output_reference == out_ref })

        //let qty_correct = qty == 1
        let serialized_redeemer =
          redeemer.out_ref
            |> builtin.serialise_data
            |> builtin.sha2_256
            |> bytearray.take(16)

        //let correct_asset_name = an == serialized_redeemer
        let qty_correct = prove_exact_nft(mint, policy_id, serialized_redeemer)
        and {
          signed_by_program?,
          qty_correct?,
        }
      }
      // correct_asset_name?,
      Burn -> {
        let qty_correct = utils.find_burn_nft(mint, policy_id)
        //let qty_correct = qty == -1
        and {
          signed_by_program?,
          qty_correct?,
        }
      }
    }
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
