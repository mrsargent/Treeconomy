use aiken/crypto.{VerificationKeyHash}
use cardano/addresses
use cardano/assets.{ada_asset_name, ada_policy_id, from_asset}
use cardano/transaction.{
  InlineDatum, Input, Output, OutputReference, Transaction,
}
use cardano/value
use initialmint
use types.{Burn, Mint, MintRedeemer}
use types/cip68

//********************************************************************************
//******************** initial mint NFT minting policy unit tests ****************
//********************************************************************************

test initialmint_nft_mint_test() {
  let out_ref: OutputReference =
    OutputReference {
      transaction_id: #"a22f96558a34449692beffa2b74eeb93b2ce1f1d65bd878501d6c8ea3e428506",
      output_index: 0,
    }
  let test_input: Input =
    Input {
      output_reference: OutputReference {
        transaction_id: #"a22f96558a34449692beffa2b74eeb93b2ce1f1d65bd878501d6c8ea3e428506",
        output_index: 0,
      },
      output: Output {
        address: addresses.create_address(#"acab", #""),
        value: assets.from_asset(#"acab", #"beef", 100),
        datum: InlineDatum(#""),
        reference_script: None,
      },
    }
  let pid = #"a46d84ed60f637be2434536515a48a77ce83b6dc9c29c7a37788a93a"

  let hashed_asset_name =
    value.unique_token_name(
      #"a22f96558a34449692beffa2b74eeb93b2ce1f1d65bd878501d6c8ea3e428506",
      0,
      cip68.prefix_222,
      #"1234",
    )

  // out_ref
  //   |> builtin.serialise_data
  //   |> builtin.sha2_256
  //   |> bytearray.take(16)
  let mint_val =
    from_asset(ada_policy_id, ada_asset_name, 100000)
      |> assets.add(pid, hashed_asset_name, 1)
      |> assets.add(#"beef", "SaplingNFT", -1)

  let signature: VerificationKeyHash =
    #"1b28519b5d79cb0c83a53bcc532177afc0500ebd68f6250be797128a"

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
  let redeemer: MintRedeemer =
    MintRedeemer {
      out_ref,
      action: Mint,
      prefix: cip68.prefix_222,
      treeNumber: #"1234",
    }

  initialmint.init_mint_nft.mint(signature, redeemer, pid, test_trans)
}

test initialmint_nft_burn_test() {
  let out_ref: OutputReference =
    OutputReference {
      transaction_id: #"a22f96558a34449692beffa2b74eeb93b2ce1f1d65bd878501d6c8ea3e428506",
      output_index: 0,
    }
  let test_input: Input =
    Input {
      output_reference: OutputReference {
        transaction_id: #"a22f96558a34449692beffa2b74eeb93b2ce1f1d65bd878501d6c8ea3e428506",
        output_index: 0,
      },
      output: Output {
        address: addresses.create_address(#"acab", #""),
        value: assets.from_asset(#"acab", #"beef", 100),
        datum: InlineDatum(#""),
        reference_script: None,
      },
    }
  let pid = #"a46d84ed60f637be2434536515a48a77ce83b6dc9c29c7a37788a93a"

  let hashed_asset_name =
    value.unique_token_name(
      #"a22f96558a34449692beffa2b74eeb93b2ce1f1d65bd878501d6c8ea3e428506",
      0,
      cip68.prefix_222,
      #"1234",
    )

  // out_ref
  //   |> builtin.serialise_data
  //   |> builtin.sha2_256
  //   |> bytearray.take(16)
  let mint_val =
    from_asset(ada_policy_id, ada_asset_name, 100000)
      |> assets.add(pid, hashed_asset_name, 1)
      |> assets.add(pid, "SaplingNFT", -1)

  let signature: VerificationKeyHash =
    #"1b28519b5d79cb0c83a53bcc532177afc0500ebd68f6250be797128a"

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
  let redeemer: MintRedeemer =
    MintRedeemer {
      out_ref,
      action: Burn,
      prefix: cip68.prefix_222,
      treeNumber: #"1234",
    }

  initialmint.init_mint_nft.mint(signature, redeemer, pid, test_trans)
}
// // //wrong signature for the transaction
// test initialmint_nft_test_wrong_sig() fail {
//   let out_ref: OutputReference = fake_tx.test_out_ref()
//   let test_input: Input = fake_tx.test_input()
//   let pid = #"0c3626175abe361b24728f3d80e2da26f21c0629cca89542c2935f37"

//   let hashed_asset_name =
//     out_ref
//       |> builtin.serialise_data
//       |> builtin.sha2_256

//   let mint_val: Value =
//     from_asset(
//       policy_id: pid,
//       asset_name: bytearray.take(hashed_asset_name, 16),
//       quantity: 1,
//     )

//   let signature: VerificationKeyHash = #"abcd"

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

//   initialmint.init_mint_nft.mint(#"aaaa", out_ref, pid, test_trans)
// }

// // //bad number of tokens
// test initialmint_nft_test_wrong_qty() fail {
//   let out_ref: OutputReference = fake_tx.test_out_ref()
//   let test_input: Input = fake_tx.test_input()
//   let pid = #"0c3626175abe361b24728f3d80e2da26f21c0629cca89542c2935f37"

//   let hashed_asset_name =
//     out_ref
//       |> builtin.serialise_data
//       |> builtin.sha2_256

//   let mint_val: Value =
//     from_asset(
//       policy_id: pid,
//       asset_name: bytearray.take(hashed_asset_name, 16),
//       quantity: 10,
//     )

//   let signature: VerificationKeyHash = #"abcd"

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

//   initialmint.init_mint_nft.mint(signature, out_ref, pid, test_trans)
// }

// // incorrect asset name - not serializing 
// test initialmint_nft_test_wrong_an() fail {
//   let out_ref: OutputReference = fake_tx.test_out_ref()
//   let out_ref_bad: OutputReference = fake_tx.test_bad_out_ref()
//   let test_input: Input = fake_tx.test_input()
//   let pid = #"0c3626175abe361b24728f3d80e2da26f21c0629cca89542c2935f37"

//   let hashed_asset_name =
//     out_ref
//       |> builtin.serialise_data
//       |> builtin.sha2_256

//   let mint_val: Value =
//     from_asset(
//       policy_id: pid,
//       asset_name: bytearray.take(hashed_asset_name, 16),
//       quantity: 1,
//     )

//   let signature: VerificationKeyHash = #"abcd"

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

//   initialmint.init_mint_nft.mint(signature, out_ref_bad, pid, test_trans)
// }

// //********************************************************************************
// //******************** initial mint token minting polciy unit tests **************
// //********************************************************************************

// test initialmint_token_test() {
//   let test_input: Input = fake_tx.test_input()
//   let pid = #"0c3626175abe361b24728f3d80e2da26f21c0629cca89542c2935f37"

//   let mint_val: Value =
//     from_asset(policy_id: pid, asset_name: "TreeNFT", quantity: 10000)

//   let signature: VerificationKeyHash = #"abcd"

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

//   initialmint.init_mint_token.mint(signature, "TreeNFT", 0, pid, test_trans)
// }

// //wrong signature for the transaction
// test initialmint_token_test_badsigner() fail {
//   let test_input: Input = fake_tx.test_input()
//   let pid = #"0c3626175abe361b24728f3d80e2da26f21c0629cca89542c2935f37"

//   let mint_val: Value =
//     from_asset(policy_id: pid, asset_name: "TreeNFT", quantity: 1)

//   let signature: VerificationKeyHash = #"abcd"

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

//   initialmint.init_mint_token.mint(#"aaaa", "TreeNFT", 0, pid, test_trans)
// }

// //bad number of tokens
// test initialmint_token_test_badtokenqty() fail {
//   let test_input: Input = fake_tx.test_input()
//   let pid = #"0c3626175abe361b24728f3d80e2da26f21c0629cca89542c2935f37"

//   let mint_val: Value =
//     from_asset(policy_id: pid, asset_name: "TreeNFT", quantity: 10)

//   let signature: VerificationKeyHash = #"abcd"
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

//   initialmint.init_mint_token.mint(signature, "TreeNFT", 0, pid, test_trans)
// }

// //wrong asset name
// test initialmint_token_test_badassetname() fail {
//   let test_input: Input = fake_tx.test_input()
//   let pid = #"0c3626175abe361b24728f3d80e2da26f21c0629cca89542c2935f37"

//   let mint_val: Value =
//     from_asset(policy_id: pid, asset_name: "TreeNFT", quantity: 10)

//   let signature: VerificationKeyHash = #"abcd"
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

//   initialmint.init_mint_token.mint(signature, "Butt coin", 0, pid, test_trans)
// }
