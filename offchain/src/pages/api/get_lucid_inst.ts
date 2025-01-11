import { Blockfrost, Lucid, Kupmios, UTxO } from "@lucid-evolution/lucid";
import { NextApiRequest, NextApiResponse } from "next";
import { aggregateTokens, parseAssetId, Token } from "./apitypes";


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

    const { address } = req.body;
    const lucid = await initLucid();

    try {
      console.log("address: ", address);
      const utxos: UTxO[] = await lucid.utxosAt(address!);      
      const tokens: Token[] = [];

      for (const utxo of utxos) {
        const assets = utxo.assets;
        for (const [assetId, quantity] of Object.entries(assets)) {
          const { policyId, tokenName } = parseAssetId(assetId);
          tokens.push({ policyId, tokenName, quantity: BigInt(quantity) });
        }
      }


      const aggregatedTokens: Record<string, Token> = aggregateTokens(tokens);

      // Convert `bigint` to `string` for response serialization
      const responseTokens = Object.fromEntries(
        Object.entries(aggregatedTokens).map(([key, token]) => [
          key,
          { ...token, quantity: token.quantity.toString() },
        ])
      );

      res.status(200).json({ aggregatedTokens: responseTokens });

    } catch (error) {
      res.status(400).json({ error: "Method not allowed" });
    }





  }
  else {
    res.status(405).json({ error: "Method not allowed" });
  }
}