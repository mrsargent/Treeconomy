import { Blockfrost, Lucid, Kupmios } from "@lucid-evolution/lucid";
import { NextApiRequest, NextApiResponse } from "next";
import { GetTokenDataConfig } from "./apitypes";
import { TreeData } from "@/Utils/types";


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
    const { unit }: GetTokenDataConfig = req.body;

    const metadata = await lucid.metadataOf<TreeData>(unit);
    console.log("metadata: ", metadata);

    const formattedMetadata: TreeData = {
      coordinates: metadata.coordinates.slice(1),
      name: metadata.name.slice(1),
      number: metadata.number.slice(1),
      species: metadata.species.slice(1),
      image: metadata.image.slice(1)
    };

    res.status(200).json({
      TreeData: formattedMetadata
    });
  }
  else {
    res.status(405).json({ error: "Method not allowed" });
  }
}





