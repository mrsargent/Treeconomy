"use client";
import { useCardano } from "@cardano-foundation/cardano-connect-with-wallet";
import { NetworkType } from "@cardano-foundation/cardano-connect-with-wallet-core";
import {
  Assets,
  Emulator,
  fromUnit,
  Lucid,
  UTxO
} from "@lucid-evolution/lucid";
import { aggregateTokens, BuyNFTConfig, hexToString, InitialMintConfig, LockNFTConfig, NFTMinterConfig, parseAssetId, Token, WithdrawNFTConfig } from "../pages/api/apitypes";
import { useEffect, useState } from "react";
import axios from 'axios';



type TransactionType = "Delegate" | "Mint" | "Withdraw" | "Lock" | "Buy" | "Register" | "LockZero" | "BuyZero"

const Delegate = async () => {

  const network =
    process.env.NODE_ENV === "development"
      ? NetworkType.TESTNET
      : NetworkType.MAINNET;
  const { isConnected, usedAddresses, enabledWallet } = useCardano({
    limitNetwork: network,
  });


  const getWalletTokens = async (): Promise<Record<string, Token>> => {
    if (isConnected && enabledWallet) {
      try {
        const lucid = await Lucid(new Emulator([]), "Preprod");
        const api = await window.cardano[enabledWallet].enable();
        lucid.selectWallet.fromAPI(api);

        const utxos: UTxO[] = await lucid.wallet().getUtxos();
        const tokens: Token[] = [];

        for (const utxo of utxos) {
          const assets = utxo.assets;
          for (const [assetId, quantity] of Object.entries(assets)) {
            const { policyId, tokenName } = parseAssetId(assetId);
            tokens.push({
              policyId,
              tokenName,
              quantity: BigInt(quantity)
            });
          }
        }
        return aggregateTokens(tokens);
      } catch (error) {
        console.error("Failed to fetch wallet tokens:", error);
        return {};
      }
    }
    return {};
  };

  const [walletTokens, setWalletTokens] = useState<Record<string, Token>>({});

  useEffect(() => {
    if (isConnected) {
      getWalletTokens().then(aggregatedTokens => setWalletTokens(aggregatedTokens));
    }
  }, [isConnected]);



  const handleAPI = async (param: TransactionType) => {
    if (isConnected && enabledWallet) {
      try {
        const lucid = await Lucid(new Emulator([]), "Preprod");
        const api = await window.cardano[enabledWallet].enable();
        lucid.selectWallet.fromAPI(api);
        let response;

        if (param === "Mint") {
          console.log("Im in mint");
          const body: InitialMintConfig = { TokenName: "Seed_", address: usedAddresses[0], compiledCodeNFT: "", compiledCodeToken: "" };        
          response = await fetch("/api/mintinitialseed", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify(body),
          });
        }
        else {          
            const body: InitialMintConfig = { TokenName: "Seed_", address: usedAddresses[0], compiledCodeNFT: "", compiledCodeToken: "" };
            response = await fetch("/api/mintinitialseed", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
  
              body: JSON.stringify(body),
            });
                
        }
        const { tx } = await response.json();
       
        const signedTx = await lucid.fromTx(tx).sign.withWallet().complete();
        const txh = await signedTx.submit();
        console.log(txh);
      } catch (error) {
        console.log(error);
      }
    }
  };


 
  return (
    <>
      {isConnected ? (
        <div className="flex flex-row items-start gap-3 sm:gap-6 lg:gap-8 w-full">

          <div className="flex flex-col items-center w-1/2">
            <h2 className="text-lg font-semibold mb-4">Functions</h2>
            <button className="btn btn-primary mb-4" onClick={() => handleAPI("Mint")}>
              Mint Seed NFT
            </button>
          </div>


          <div className="w-1/2">
            <h2 className="text-lg font-semibold mb-4">Tokens</h2>
            {Object.entries(walletTokens).map(([key, token], index) => (
              <div key={index} className="mb-4">
                <h1 className="flex-grow">
                  <span>{token.tokenName}</span>
                  <span>{"...."}</span>
                  <span>{token.quantity.toString()}</span>
                </h1>
              </div>
            ))}
          </div>
        </div>
      ) : null}

    </>
  );

};

export default Delegate;
