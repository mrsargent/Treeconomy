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
import { User } from "@prisma/client";
import Image from "next/image";
import { TreeData } from "@/Utils/types";



type TransactionType = "Mint" | "Withdraw" | "BurnMintSapling" | "Burn" | "Test" | "BurnMintTree";
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

  const [treeDetails, setTreeDetails] = useState<User>();

  const [withdrawNumber, setWithdrawNumber] = useState<number | undefined>();


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
            //  treeNumber: treeDetails!.treeNumber,
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
            treeNumber: withdrawNumber!
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
         //   burnAssetName: treeDetails!.seedNftName,
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
         //   burnAssetName: treeDetails!.seedNftName,
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

          //set new details of Tree that was just created
          setTreeDetails(newTree);
        }


      } catch (error) {
        console.log(error);
        console.error(JSON.stringify(error, null, 2));
      }
    }
  };

  // Define a function or object to map policy IDs to image paths
  const policyToImage: { [key: string]: string } = {
    "952ce598b0990a7c77c3fb129359b87d24b1b6505665b600079ee9cd": "/img/seed.jpg",
    "5fe331b2a31789888e76bffdcb2777a6e3743189069c4c3a98656806": "/img/sapling.jpg",
    "e53c06707464ebdcfd954b4ee85281bd574b38044f1db4d03f991483": "/img/tree.jpg",
    "" : "/img/ada.jpg",
    "default": "/img/seed.jpg" // Fallback image
  };

  const getImageForPolicyId = (policyId: string) => {
    return policyToImage[policyId] || policyToImage['default'];
  };


  const handleTokenClick = async (tokenName: string, policyid: string) => {
    setSelectedToken(tokenName);
    console.log("policy id: ", policyid);
    console.log("token name: ", tokenName);
    const unit = toUnit(policyid,tokenName); 
    
    const body: GetTokenDataConfig = { unit: unit};

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
      console.log("Metadata number: ",TreeData.number);     
    }   
  };

   // New state to keep track of the selected token
   const [selectedToken, setSelectedToken] = useState<string | null>(null);

   const [selectedTokenMetadata, setSelectedTokenMetadata] = useState<TreeData | null>(null);

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
              <span className="ml-2">{treeDetails?.treeNumber || "No Tree"}</span>
              <TreeSpeciesSelector onSelect={setTreeSpecies} />
            </div>
            <div className="flex items-center mb-4">
              <input
                type="number"
                value={withdrawNumber || ''}
                onChange={(e) => setWithdrawNumber(e.target.value ? parseInt(e.target.value) : undefined)}
                className="input input-bordered w-20 mr-2"
                placeholder="Tree #"
              />
              <button className="btn btn-primary" onClick={() => handleAPI("Withdraw")}>
                Collect Rewards
              </button>
            </div>
            <button className="btn btn-primary mb-4" onClick={() => handleAPI("BurnMintSapling")}>
              Seed - Sapling
            </button>
            <button className="btn btn-primary mb-4" onClick={() => handleAPI("BurnMintTree")}>
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
               className={`mb-4 flex items-center cursor-pointer ${selectedToken === token.tokenName ? 'bg-blue-200' : ''}`} 
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
