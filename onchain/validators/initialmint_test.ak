use aiken/crypto.{VerificationKeyHash}
use cardano/address.{from_script}
use cardano/assets.{Value, from_asset, zero}
use cardano/transaction.{Input, NoDatum, Output, OutputReference, Transaction}
use initialmint

test initialmint_test() {
  let out_ref: OutputReference =
    OutputReference { transaction_id: #"0000", output_index: 0 }

  let output =
    Output {
      address: from_script(""),
      value: zero,
      datum: NoDatum,
      reference_script: None,
    }
  let test_input = Input { output_reference: out_ref, output }
  let pid = #"0c3626175abe361b24728f3d80e2da26f21c0629cca89542c2935f37"

  let mint_val: Value =
    from_asset(policy_id: pid, asset_name: "TreeNFT", quantity: 1)

  let signature: VerificationKeyHash = #"abcd"

  //let test_mint = Mint { value: mint_val }
  let test_trans: Transaction =
    transaction.placeholder
      |> fn(transaction) {
          Transaction {
            ..transaction,
            inputs: [test_input],
            mint: mint_val,
            extra_signatories: [signature],
          }
        }

  initialmint.init_mint_nft.mint(signature, out_ref, 0, pid, test_trans)
}
