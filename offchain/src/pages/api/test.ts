import { Blockfrost, Lucid, Kupmios, generateSeedPhrase, generatePrivateKey, getAddressDetails, credentialToAddress, keyHashToCredential, toPublicKey, toHex, makeWalletFromPrivateKey } from "@lucid-evolution/lucid";
import { NextApiRequest, NextApiResponse } from "next";
import * as CML from '@anastasia-labs/cardano-multiplatform-lib-nodejs';
//import { blake2b } from '@noble/hashes/blake2b';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // *****************************************************************/
    //*********  establish network and wallet connection ***************/
    //**************************************************************** */
    // const initLucid = async () => {
    //   if (process.env.NODE_ENV === "development") {
    //     const b = new Kupmios(
    //       process.env.KUPO_ENDPOINT_PREPROD!,
    //       process.env.OGMIOS_ENDPOINT_PREPROD!
    //     );
    //     return Lucid(b, "Preprod");
    //   } else {
    //     const b = new Blockfrost(
    //       process.env.API_URL_MAINNET!,
    //       process.env.BLOCKFROST_KEY_MAINNET!
    //     );
    //     return Lucid(b, "Mainnet");
    //   }

    // };
    // const lucid = await initLucid();
    // console.log("seed phrase: ", process.env.SEED_PHRASE!)
    // lucid.selectWallet.fromSeed(process.env.SEED_PHRASE!);
    // const userAddr = await lucid.wallet().address();
    // console.log("AI Address", userAddr);
   
    // console.log("private key: ",generatePrivateKey());
  
    const privateKey = generatePrivateKey();                        
    const publicKey = toPublicKey(privateKey);
    const pkh = CML.PrivateKey.from_bech32(privateKey).to_public().hash().to_hex();
    
    //attempt 1 
    //const pkh1 = toHex(blake2b(publicKey));
    //attempt 2 
    

    //const pkh2 = Ed25519KeyHash.from_bech32(publicKey).to_hex();
    console.log("priavet key: ", privateKey);
    console.log("public key: ",publicKey);
    console.log("pkh: ",pkh);
   
    const cred1 = keyHashToCredential(pkh);
    //const cred2 = keyHashToCredential(pkh2);
    // hashPublicKey
    
     const addr = credentialToAddress("Preprod",cred1); 
    console.log("Google address: ", addr);
    res.status(200).json({ });
  }
  else {
    res.status(405).json({ error: "Method not allowed" });
  }
}