"use client";
import { useCardano } from "@cardano-foundation/cardano-connect-with-wallet";
import { NetworkType } from "@cardano-foundation/cardano-connect-with-wallet-core";
import {
  Emulator,
  Lucid,
  UTxO
} from "@lucid-evolution/lucid";
import { aggregateTokens, BurnConfig, InitialMintConfig, MintBurnConfig, parseAssetId, Token, WithdrawConfig } from "../pages/api/apitypes";
import { useEffect, useState } from "react";
import TreeSpeciesSelector from "./TreeSpeciesSelector";



type TransactionType = "Mint" | "Withdraw" | "BurnMintSapling" | "Burn";
const NFT_MINT_POLICY = "initialmint.init_mint_nft.mint";
const TOKEN_MINT_POLICY = "initialmint.init_mint_token.mint";
const REWARDS_VALIDATOR = "rewards_validator.rewards_validator.spend";
const TREE_NUM = 55;
const TREE_SPECIES = "Oak";
const TREE_DESCRIPTION = "No: " + TREE_NUM + " Species: " + TREE_SPECIES;

const Delegate = async () => {

  const network =
    process.env.NODE_ENV === "development"
      ? NetworkType.TESTNET
      : NetworkType.MAINNET;
  const { isConnected, usedAddresses, enabledWallet } = useCardano({
    limitNetwork: network,
  });

  const [treeSpecies, setTreeSpecies] = useState('oak');


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
          const body: InitialMintConfig = {
            address: usedAddresses[0],
            nftMintPolicyName: NFT_MINT_POLICY,
            tokenMintPolicyName: TOKEN_MINT_POLICY,
            rewardsValidatorName: REWARDS_VALIDATOR,
            treeNumber: TREE_NUM,
            species: TREE_SPECIES
          };
          response = await fetch("/api/mintinitialseed", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify(body),
          });
        }
        if (param === "Withdraw") {
          console.log("Im in withdraw");
          const body: WithdrawConfig = {
            address: usedAddresses[0],
            rewardsValidatorName: REWARDS_VALIDATOR,
            treeNumber: TREE_NUM
          };
          response = await fetch("/api/redeemrewards", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify(body),
          });
        }
        if (param === "BurnMintSapling") {
          console.log("Im in BurnMintSapling");
          const body: MintBurnConfig = {
            address: usedAddresses[0],
            nftMintPolicyName: NFT_MINT_POLICY,
            burnAssetName: "c099c9e906d7f00ffcf9ec53ecac61c3"
          };
          response = await fetch("/api/mintburnnft", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify(body),
          });
        }
        if (param === "Burn") {
          const body: BurnConfig = {
            address: usedAddresses[0],
            nftMintPolicyName: NFT_MINT_POLICY
          };
          response = await fetch("/api/burnnft", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify(body),
          });
        }

        if (response) {
          console.log("finished with api");
          const { tx } = await response.json();

          const signedTx = await lucid.fromTx(tx).sign.withWallet().complete();
          const txh = await signedTx.submit();
          console.log(txh);
        }


      } catch (error) {
        console.log(error);
        console.error(JSON.stringify(error, null, 2));
      }
    }
  };



  return (
    <>
      {isConnected ? (
        <div className="flex flex-row items-start gap-3 sm:gap-6 lg:gap-8 w-full">

          <div className="flex flex-col items-center w-1/2">
            <h2 className="text-lg font-semibold mb-4">Functions</h2>
            <div className="flex items-center mb-4">
              <button className="btn btn-primary" onClick={() => handleAPI("Mint")}>
                Mint Seed NFT
              </button>
              <span className="ml-2">{TREE_NUM}</span>
              <TreeSpeciesSelector onSelect={setTreeSpecies} />
            </div>
            <button className="btn btn-primary mb-4" onClick={() => handleAPI("Withdraw")}>
              Collect Rewards
            </button>
            <button className="btn btn-primary mb-4" onClick={() => handleAPI("BurnMintSapling")}>
              Seed - Sapling
            </button>
            <button className="btn btn-primary mb-4" onClick={() => handleAPI("Burn")}>
              Burn Baby Burn
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
