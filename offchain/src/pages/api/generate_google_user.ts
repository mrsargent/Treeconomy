import { PrismaClient } from '@prisma/client';
import { credentialToAddress, generatePrivateKey, keyHashToCredential } from '@lucid-evolution/lucid';
import * as CML from '@anastasia-labs/cardano-multiplatform-lib-nodejs';
import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleConfig } from './apitypes';

const prisma = new PrismaClient();

interface ApiResponse {
  addr?: string;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } : GoogleConfig = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    let addr: string;
    
    const existingUser = await prisma.googleUser.findUnique({
      where: {
        email: email
      }
    });

    if (existingUser) {
      addr = existingUser.address; // Non-null assertion operator since we assume address exists if user exists
    } else {
      const privateKey = generatePrivateKey();
      const pkh = CML.PrivateKey.from_bech32(privateKey).to_public().hash().to_hex();
      const cred = keyHashToCredential(pkh);
      addr = credentialToAddress("Preprod", cred);
      
      // Save new user to database
      await prisma.googleUser.create({
        data: {
          email: email,
          privateKey: privateKey,
          address: addr,
          pkh: pkh 
        }
      });
    }

    // Send the address back to the client
    res.status(200).json({ addr });
  } catch (error) {
    console.error("Database operation failed:", error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  } finally {
    await prisma.$disconnect();
  }
}