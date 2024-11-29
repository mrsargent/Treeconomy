import { Blockfrost, fromHex, fromText, Lucid, mintingPolicyToId, paymentCredentialOf, scriptFromNative, UTxO, Validator, Data, applyParamsToScript, applyDoubleCborEncoding, getAddressDetails, MintingPolicy, toHex } from "@lucid-evolution/lucid";
import { NextApiRequest, NextApiResponse } from "next";
import { InitialMintConfig } from "./apitypes";
import { getFirstUxtoWithAda } from "./getFirstUtxo";
import { sha256 } from '@noble/hashes/sha2';
import scripts from '../../../../onchain/plutus.json';
import { OutputReference } from "./schemas";
import { blake2b } from '@noble/hashes/blake2b';


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // *****************************************************************/
    //*********  establish network and wallet connection ***************/
    //**************************************************************** */
    const initLucid = async () => {
      if (process.env.NODE_ENV === "development") {
        const b = new Blockfrost(
          process.env.API_URL_PREPROD as string,
          process.env.BLOCKFROST_KEY_PREPROD as string
        );
        return Lucid(b, "Preprod");
      } else {
        const b = new Blockfrost(
          process.env.API_URL_MAINNET!,
          process.env.BLOCKFROST_KEY_MAINNET!
        );
        return Lucid(b, "Mainnet");
      }

    };
    const lucid = await initLucid();
    const { TokenName, address, compiledCodeNFT, compiledCodeToken }: InitialMintConfig = req.body;
    console.log(address);
    lucid.selectWallet.fromAddress(address, [])

    // *****************************************************************/
    //*********  constructing minting policy with params ***************/
    //**************************************************************** */
    const pkh = getAddressDetails(address).paymentCredential?.hash;
    //const pkh = paymentCredentialOf(address).hash;

   console.log("pkh: ",pkh);
    const compiledNft = scripts.validators.find(
      (v) => v.title === "initialmint.init_mint_nft.mint",
    )?.compiledCode;


    const mintingpolicy: MintingPolicy = {
      type: "PlutusV3",
      script: applyParamsToScript(applyDoubleCborEncoding(compiledNft!), [pkh!]),
    };

    const nativePolicyId = mintingPolicyToId(mintingpolicy);
    console.log("policy id: ",nativePolicyId);
    // *****************************************************************/
    //*********  find utxo and construct redeemer ***************/
    //**************************************************************** */

    const goodUtxo: UTxO | undefined = await getFirstUxtoWithAda(lucid, address);

    console.log("Tx hash: ", goodUtxo?.txHash, "Index: ", goodUtxo?.outputIndex);

    let encodedUtxo, redeemer, d


    if (goodUtxo !== undefined) {
      const myData = {
        transaction_id: goodUtxo.txHash,
        output_index: BigInt(goodUtxo.outputIndex)
      }
      redeemer = Data.to(myData, OutputReference);
      console.log("redeemer: ", redeemer);
      d = toHex(sha256(fromHex(redeemer)));
      console.log("d: ",d);
      encodedUtxo = Data.to(d); 
      console.log("encodedutxo:", encodedUtxo);
      
    } else {
      console.log("not good utxo found");
      res.status(401).json({ error: "Couldn't find utxo" });
      return;
    }
    const enc = d.slice(0,32);
    console.log("Enc: ",enc);
    // const encodedUtxoString = Buffer.from(d).toString('hex').slice(0, 32);
    // console.log("Encoded UTxO as string:", encodedUtxoString);

    // *****************************************************************/
    //*********  constructing transaction ******************************/
    //** Note: Asset name is the serialized out_ref.  This will always
    //* give the NFT a unique encoded name (i.e.  policyid + token name)*/
    //**************************************************************** */
    const tx = await lucid
      .newTx()
      .collectFrom([goodUtxo])
      .pay.ToAddress(address, {
        [nativePolicyId + enc]: 1n,
      })
      .mintAssets({
        [nativePolicyId + enc]: 1n,
      }, redeemer)
      .attach.MintingPolicy(mintingpolicy)
      .attachMetadata(721, {
        [nativePolicyId]: {
          [enc]: {
            name: "Seed NFT 1",
            image: "https://capacitree.com/wp-content/uploads/2024/09/seed_nft.jpg",
            description: "No: 1 Tree species: oak"
          }
        }
      })
      .complete({ localUPLCEval: false })
    

    res.status(200).json({ tx: tx.toCBOR() });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

