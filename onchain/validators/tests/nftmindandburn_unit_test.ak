use aiken/builtin
use aiken/crypto.{VerificationKeyHash}
use aiken/primitive/bytearray
use cardano/addresses
use cardano/assets.{ada_asset_name, ada_policy_id, from_asset}
use cardano/transaction.{
  InlineDatum, Input, Output, OutputReference, Transaction,
}
use nftmintandburn

//********************************************************************************
//******************** initial mint NFT minting policy unit tests ****************
//********************************************************************************

test nftmintandburn_test() {
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
    out_ref
      |> builtin.serialise_data
      |> builtin.sha2_256
      |> bytearray.take(16)

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

  nftmintandburn.mint_burn_nft.mint(
    signature,
    #"beef",
    out_ref,
    pid,
    test_trans,
  )
}

test nftmintandburn_missingburning_test() fail {
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
    out_ref
      |> builtin.serialise_data
      |> builtin.sha2_256
      |> bytearray.take(16)

  let mint_val =
    from_asset(ada_policy_id, ada_asset_name, 100000)
      |> assets.add(pid, hashed_asset_name, 1)

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

  nftmintandburn.mint_burn_nft.mint(
    signature,
    #"beef",
    out_ref,
    pid,
    test_trans,
  )
}

test nftmintandburn_missingmint_test() fail {
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

  // let hashed_asset_name =
  //   out_ref
  //     |> builtin.serialise_data
  //     |> builtin.sha2_256
  //     |> bytearray.take(16)
  let mint_val =
    from_asset(ada_policy_id, ada_asset_name, 100000)
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

  nftmintandburn.mint_burn_nft.mint(
    signature,
    #"beef",
    out_ref,
    pid,
    test_trans,
  )
}

test nftmintandburn_badsig_test() fail {
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
    out_ref
      |> builtin.serialise_data
      |> builtin.sha2_256
      |> bytearray.take(16)

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

  nftmintandburn.mint_burn_nft.mint(#"aaaa", #"beef", out_ref, pid, test_trans)
}
