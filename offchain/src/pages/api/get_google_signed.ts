import { Blockfrost, Lucid, Kupmios, UTxO } from "@lucid-evolution/lucid";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../prisma/client";


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
    }
    const { email, tx } = req.body;

    try {
      const existingUser = await prisma.googleUser.findUnique({
        where: {
          email: email
        }
      });

      const lucid = await initLucid()
      lucid.selectWallet.fromPrivateKey(existingUser?.privateKey!);
      const googleSign = await lucid.fromTx(tx).partialSign.withPrivateKey(existingUser?.privateKey!);


      res.status(200).json({googleSign});

    } catch (error) {
      res.status(400).json({ error: "Method not allowed" });
    }





  }
  else {
    res.status(405).json({ error: "Method not allowed" });
  }
}