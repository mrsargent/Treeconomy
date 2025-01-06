import { Blockfrost, Lucid, Kupmios, generateSeedPhrase, generatePrivateKey } from "@lucid-evolution/lucid";
import { NextApiRequest, NextApiResponse } from "next";


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
        const b = new Kupmios(
          process.env.KUPO_ENDPOINT_PREPROD!,
          process.env.OGMIOS_ENDPOINT_PREPROD!
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
    console.log("seed phrase: ", process.env.SEED_PHRASE!)
    lucid.selectWallet.fromSeed(process.env.SEED_PHRASE!);
    const userAddr = await lucid.wallet().address();
    console.log("AI Address", userAddr);
   
    console.log("private key: ",generatePrivateKey());
    

    res.status(200).json({ });
  }
  else {
    res.status(405).json({ error: "Method not allowed" });
  }
}