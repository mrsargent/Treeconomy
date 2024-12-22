use aiken/builtin
use aiken/crypto.{VerificationKeyHash}
use aiken/fuzz
use aiken/primitive/bytearray
use cardano/address.{Address, VerificationKey}
use cardano/addresses
use cardano/assets.{
  AssetName, PolicyId, Value, ada_asset_name, ada_policy_id, from_asset,
}
use cardano/transaction.{
  InlineDatum, Input, NoDatum, Output, OutputReference, Transaction,
}
use cardano/value
use initialmint
use tests/fake_tx
use tests/utils_test
use types.{Burn, Mint, MintRedeemer}
use types/cip68

//********************************************************************************
//******************** initial mint NFT minting polciy prop tests ****************
//********************************************************************************

test initialmint_nft_test(param via generate_initial_mint_nft()) {
  let InitialNFTMintTest { addr, out_ref, inputs, pid } = param

  let hashed_asset_name =
    value.unique_token_name(
      out_ref.transaction_id,
      out_ref.output_index,
      cip68.prefix_222,
      #"1234",
    )

  // let hashed_asset_name =
  //   out_ref
  //     |> builtin.serialise_data
  //     |> builtin.sha2_256
  //     |> bytearray.take(16)
  let mint_val =
    from_asset(ada_policy_id, ada_asset_name, 100000)
      |> assets.add(pid, hashed_asset_name, 1)
      |> assets.add(pid, "SaplingNFT", -1)

  expect VerificationKey(vkh) = addr.payment_credential
  let signature: VerificationKeyHash = vkh

  let test_trans: Transaction =
    transaction.placeholder
      |> fn(transaction) {
          Transaction {
            ..transaction,
            inputs: inputs,
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

  initialmint.init_mint_nft.mint(signature, 0, redeemer, pid, test_trans)
}

//********************************************************************************
//******************** initial burn NFT minting polciy prop tests ****************
//********************************************************************************

test initialburn_nft_test(param via generate_initial_mint_nft()) {
  let InitialNFTMintTest { addr, out_ref, inputs, pid } = param
  let hashed_asset_name =
    out_ref
      |> builtin.serialise_data
      |> builtin.sha2_256
      |> bytearray.take(16)

  let mint_val =
    from_asset(ada_policy_id, ada_asset_name, 100000)
      |> assets.add(pid, hashed_asset_name, 1)
      |> assets.add(pid, "SaplingNFT", -1)

  expect VerificationKey(vkh) = addr.payment_credential
  let signature: VerificationKeyHash = vkh

  let test_trans: Transaction =
    transaction.placeholder
      |> fn(transaction) {
          Transaction {
            ..transaction,
            inputs: inputs,
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

  initialmint.init_mint_nft.mint(signature, 0, redeemer, pid, test_trans)
}

//********************************************************************************
//******************** initial mint token minting polcy prop tests *********************
//********************************************************************************

test initialmint_token_test(param via generate_initial_mint_token()) {
  let InitialTokenMintTest { addr, tn, pid } = param

  let mint_val: Value =
    from_asset(policy_id: pid, asset_name: tn, quantity: 10000)

  expect VerificationKey(vkh) = addr.payment_credential
  let signature: VerificationKeyHash = vkh

  let test_trans: Transaction =
    transaction.placeholder
      |> fn(transaction) {
          Transaction {
            ..transaction,
            mint: mint_val,
            extra_signatories: [signature],
          }
        }

  initialmint.init_mint_token.mint(signature, tn, 0, pid, test_trans)
}

//********************************************************************************
//******************** helper functions *********************
//********************************************************************************

type InitialNFTMintTest {
  addr: Address,
  out_ref: OutputReference,
  inputs: List<Input>,
  pid: PolicyId,
}

fn generate_initial_mint_nft() -> Fuzzer<InitialNFTMintTest> {
  fuzz.map3(
    utils_test.generate_address(),
    utils_test.generate_outref(),
    utils_test.generate_policy_id(),
    fn(addr, out_ref, pid) {
      let inputs: List<Input> =
        [
          Input {
            output_reference: out_ref,
            output: Output {
              address: addr,
              value: assets.from_lovelace(5),
              datum: InlineDatum(utils_test.test_datum),
              reference_script: None,
            },
          },
          Input {
            output_reference: fake_tx.test_out_ref(),
            output: Output {
              address: addresses.create_address(#"face", #""),
              value: assets.from_lovelace(5),
              datum: NoDatum,
              reference_script: None,
            },
          },
          Input {
            output_reference: fake_tx.test_bad_out_ref(),
            output: Output {
              address: addresses.create_address(#"face", #""),
              value: assets.from_lovelace(100),
              datum: InlineDatum(utils_test.test_datum),
              reference_script: None,
            },
          },
        ]
      InitialNFTMintTest(addr, out_ref, inputs, pid)
    },
  )
}

type InitialTokenMintTest {
  addr: Address,
  tn: AssetName,
  pid: PolicyId,
}

fn generate_initial_mint_token() -> Fuzzer<InitialTokenMintTest> {
  fuzz.map3(
    utils_test.generate_address(),
    utils_test.generate_token_name(),
    utils_test.generate_policy_id(),
    fn(addr, tn, pid) { InitialTokenMintTest(addr, tn, pid) },
  )
}
