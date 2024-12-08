use aiken/builtin
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

    when action is {
      Mint -> {
        //find if input out_ref matches the out_ref provided by the redeemer
        expect Some(_input) =
          list.find(inputs, fn(input) { input.output_reference == out_ref })
        //serialize out_ref and take the first 32 chars to compare with name of 
        //provided token
        let serialized_redeemer =
          out_ref
            |> builtin.serialise_data
            |> builtin.sha2_256
            |> bytearray.take(16)
        let qty_asset_name_correct =
          prove_exact_nft(mint, policy_id, serialized_redeemer)
        and {
          signed_by_program?,
          qty_asset_name_correct?,
        }
      }
      Burn -> {
        //make sure that there is only 1 nft with the policy_id that is getting burned
        let qty_correct = utils.find_burn_nft(mint, policy_id)
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
