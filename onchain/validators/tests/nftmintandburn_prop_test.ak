// use aiken/builtin
// use aiken/crypto.{VerificationKeyHash}
// use aiken/fuzz
// use aiken/primitive/bytearray
// use cardano/address.{Address, VerificationKey}
// use cardano/addresses
// use cardano/assets.{
//   AssetName, PolicyId, Value, ada_asset_name, ada_policy_id, from_asset,
// }
// use cardano/transaction.{
//   InlineDatum, Input, NoDatum, Output, OutputReference, Transaction,
// }
// use nftmintandburn
// use tests/fake_tx
// use tests/utils_test

// //********************************************************************************
// //******************** initial mint NFT minting policy unit tests ****************
// //********************************************************************************

// test nftmintandburn_test(param via generate_mintburn_nft()) {
//   let NftMintBurnTest { addr, out_ref, inputs, pid1, pid2 } = param

//   let hashed_asset_name =
//     out_ref
//       |> builtin.serialise_data
//       |> builtin.sha2_256
//       |> bytearray.take(16)

//   let mint_val =
//     from_asset(ada_policy_id, ada_asset_name, 100000)
//       |> assets.add(pid1, hashed_asset_name, 1)
//       |> assets.add(pid2, "SaplingNFT", -1)

//   expect VerificationKey(vkh) = addr.payment_credential
//   let signature: VerificationKeyHash = vkh

//   let test_trans: Transaction =
//     transaction.placeholder
//       |> fn(transaction) {
//           Transaction {
//             ..transaction,
//             inputs: inputs,
//             mint: mint_val,
//             extra_signatories: [signature],
//           }
//         }

//   nftmintandburn.mint_burn_nft.mint(signature, pid2, out_ref, pid1, test_trans)
// }

// //********************************************************************************
// //******************** helper functions *********************
// //********************************************************************************

// type NftMintBurnTest {
//   addr: Address,
//   out_ref: OutputReference,
//   inputs: List<Input>,
//   pid1: PolicyId,
//   pid2: PolicyId,
// }

// fn generate_mintburn_nft() -> Fuzzer<NftMintBurnTest> {
//   fuzz.map4(
//     utils_test.generate_address(),
//     utils_test.generate_outref(),
//     utils_test.generate_policy_id(),
//     utils_test.generate_policy_id(),
//     fn(addr, out_ref, pid1, pid2) {
//       let inputs: List<Input> =
//         [
//           Input {
//             output_reference: out_ref,
//             output: Output {
//               address: addr,
//               value: assets.from_lovelace(5),
//               datum: InlineDatum(utils_test.test_datum),
//               reference_script: None,
//             },
//           },
//           Input {
//             output_reference: fake_tx.test_out_ref(),
//             output: Output {
//               address: addresses.create_address(#"face", #""),
//               value: assets.from_lovelace(5),
//               datum: NoDatum,
//               reference_script: None,
//             },
//           },
//           Input {
//             output_reference: fake_tx.test_bad_out_ref(),
//             output: Output {
//               address: addresses.create_address(#"face", #""),
//               value: assets.from_lovelace(100),
//               datum: InlineDatum(utils_test.test_datum),
//               reference_script: None,
//             },
//           },
//         ]
//       NftMintBurnTest(addr, out_ref, inputs, pid1, pid2)
//     },
//   )
// }
