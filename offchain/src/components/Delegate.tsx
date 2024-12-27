"use client";
import { useCardano } from "@cardano-foundation/cardano-connect-with-wallet";
import { NetworkType } from "@cardano-foundation/cardano-connect-with-wallet-core";
import {
  Emulator,
  Lucid,
  toUnit,
  UTxO
} from "@lucid-evolution/lucid";
import { aggregateTokens, BurnConfig, GetTokenDataConfig, InitialMintConfig, MintBurnConfig, parseAssetId, Token, WithdrawConfig } from "../pages/api/apitypes";
import { useEffect, useState } from "react";
import TreeSpeciesSelector from "./TreeSpeciesSelector";
import Image from "next/image";
import { AssetClass, TransactionType, TreeData } from "@/Utils/types";
import { NFT_MINT_POLICY, REWARDS_VALIDATOR, TOKEN_MINT_POLICY } from "@/Utils/constants";


const Delegate = async () => {

  const network =
    process.env.NODE_ENV === "development"
      ? NetworkType.TESTNET
      : NetworkType.MAINNET;
  const { isConnected, usedAddresses, enabledWallet } = useCardano({
    limitNetwork: network,
  });

  //useState hooks 
  const [selectedTokenMetadata, setSelectedTokenMetadata] = useState<TreeData | null>(null);
  const [treeSpecies, setTreeSpecies] = useState('oak');
  const [selectedAssetClass, setSelectedAssetClass] = useState<AssetClass | undefined>();
  const [walletTokens, setWalletTokens] = useState<Record<string, Token>>({});

  useEffect(() => {
    if (isConnected) {
      getWalletTokens().then(aggregatedTokens => setWalletTokens(aggregatedTokens));
    }
  }, [isConnected]);

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
            species: treeSpecies
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
            treeNumber: selectedTokenMetadata?.number!,
            assetClass: selectedAssetClass!
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
            refLockPolicy: REWARDS_VALIDATOR,
            nftMintPolicyName: NFT_MINT_POLICY,         
            treeData: selectedTokenMetadata!
          };
          response = await fetch("/api/mintburnnft_sapling", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify(body),
          });
        }
        if (param === "BurnMintTree") {
          console.log("Im in BurnMintTree");
          const body: MintBurnConfig = {
            address: usedAddresses[0],
            refLockPolicy: REWARDS_VALIDATOR,
            nftMintPolicyName: NFT_MINT_POLICY,           
            treeData: selectedTokenMetadata!
          };
          response = await fetch("/api/mintburnnft_tree", {
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
        if (param === "Test") {
          const body: BurnConfig = {
            address: usedAddresses[0],
            nftMintPolicyName: NFT_MINT_POLICY
          };
          response = await fetch("/api/test", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify(body),
          });
        }
        if (response) {
          console.log("finished with api");
          const { tx, newTree } = await response.json();
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

  // Define a function or object to map policy IDs to image paths
  const policyToImage: { [key: string]: string } = {
    "eedb2226bed60e11609a6f69f0529116e2d1c810618bd1b1b208c7a7": "/img/seed.jpg",
    "d304bacde35fa582ce8381ecd0f5ba57f7dca519bf00f56cd792866d": "/img/sapling.jpg",
    "1a57bc95171e9a2d9062d778e7b51547bdb15d375ab6f9da66cf442e": "/img/tree.jpg",
    "": "/img/ada.jpg",
    "default": "/img/treeconomy.jpg" // Fallback image
  };

  const getImageForPolicyId = (policyId: string) => {
    return policyToImage[policyId] || policyToImage['default'];
  };


  const handleTokenClick = async (tokenName: string, policyid: string) => {
    const assetClass: AssetClass = { policyId: policyid, tokenName: tokenName}
    setSelectedAssetClass(assetClass);
    console.log("policy id: ", assetClass.policyId);
    console.log("token name: ", assetClass.tokenName);

    const unit = toUnit(policyid, tokenName);

    const body: GetTokenDataConfig = { unit: unit };

    const response = await fetch("/api/getmetadata", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response) {
      console.log("got metadata");
      const { TreeData } = await response.json();
      setSelectedTokenMetadata(TreeData);
      console.log("Metadata number: ", TreeData.number);
    }
  };

  const randomActionFunction = async (param: TransactionType) => {
    // Generate a random number between 0 and 1
    const shouldProceed = Math.random() < 0.5;

    if (shouldProceed) {
      console.log(`Attempting to ${param}...`);
      await handleAPI(param);
    } else {
      console.log(`${param} failed!`);     
      alert(`${param} operation failed. Try again!`);
    }
  };

  return (
    <>
      {isConnected ? (
        <div className="flex flex-row items-start gap-3 sm:gap-6 lg:gap-8 w-full">

          <div className="flex flex-col items-center w-1/2">
            <h2 className="text-lg font-semibold mb-4">Functions</h2>
            <div className="flex items-center mb-4">
              <button className="btn btn-primary" onClick={() => randomActionFunction("Mint")}>
                Mint Seed NFT
              </button>              
              <TreeSpeciesSelector onSelect={setTreeSpecies} />
            </div>
            <div className="flex items-center mb-4">            
              <button className="btn btn-primary" onClick={() => handleAPI("Withdraw")}>
                Collect Rewards
              </button>
            </div>
            <button className="btn btn-primary mb-4" onClick={() => randomActionFunction("BurnMintSapling")}>
              Seed - Sapling
            </button>
            <button className="btn btn-primary mb-4" onClick={() => randomActionFunction("BurnMintTree")}>
              Sapling - Tree
            </button>
            <button className="btn btn-primary mb-4" onClick={() => handleAPI("Burn")}>
              Burn Baby Burn
            </button>
            <button className="btn btn-primary mb-4" onClick={() => handleAPI("Test")}>
              Test
            </button>
          </div>


          <div className="w-fit">
            <h2 className="text-lg font-semibold mb-4">Tokens</h2>
            {Object.entries(walletTokens).map(([key, token], index) => (
              <div
                key={index}
                className={`mb-4 flex items-center cursor-pointer ${selectedAssetClass?.tokenName === token.tokenName ? 'bg-blue-200' : ''}`}
                onClick={() => handleTokenClick(token.tokenName, token.policyId)}
              >
                <Image
                  src={getImageForPolicyId(token.policyId)}
                  alt={token.tokenName}
                  width={50}
                  height={50}
                  className="mr-2"
                />                
                <h1 className="flex-grow">
                  {/* <span>{token.tokenName}</span> */}
                  <span>
                  {selectedAssetClass?.tokenName === token.tokenName && selectedTokenMetadata ? 
                    selectedTokenMetadata.name : 
                    token.tokenName}
                   
                </span>
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
