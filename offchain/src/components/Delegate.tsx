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
import Image from "next/image";
import { AssetClass, TransactionType, TreeData } from "@/Utils/types";
import { ADA_POLICY_ID, LOCKING_CONTRACT, NFT_MINT_POLICY, REWARDS_VALIDATOR, SAPLING_NFT_POLICY_ID, SEED_NFT_POLICY_ID, TOKEN_MINT_POLICY, TREE_NFT_POLICY_ID, TREE_TOKEN_POLICY_ID } from "@/Utils/constants";
import ErrorAlert from "./alerts/ErrorAlert";
import SuccessAlert, { SuccessAlertProps } from "./alerts/SuccessAlert";
import MintSeedModal from "./modals/MintSeedModal";
import MintSaplingTreeModal from "./modals/MintSaplingTreeModal";


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
  const [selectedAssetClass, setSelectedAssetClass] = useState<AssetClass | undefined>();
  const [walletTokens, setWalletTokens] = useState<Record<string, Token>>({});
  const [errorAlertVisible, setErrorAlertVisible] = useState(false);
  const [successAlertVisible, setSuccessAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState<SuccessAlertProps>();
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [isSaplingModalOpen, setIsSaplingModalOpen] = useState(false);
  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, TreeData>>({});

  useEffect(() => {
    if (isConnected) {
      getWalletTokens();
    }
  }, [isConnected]);

 
  const getWalletTokens = async () => {
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
            tokens.push({ policyId, tokenName, quantity: BigInt(quantity) });
          }
        }
        const aggregatedTokens = aggregateTokens(tokens);
        setWalletTokens(aggregatedTokens);
        await fetchMetadataForTokens(Object.values(aggregatedTokens));
      } catch (error) {
        console.error("Failed to fetch wallet tokens:", error);
        setErrorAlertVisible(true);
        setAlertMessage("Failed to fetch wallet tokens");
      }
    }
  };

  const fetchMetadataForTokens = async (tokens: Token[]) => {
    const metadata: { [key: string]: TreeData } = {};
    for (const token of tokens) {
      // Skip ADA (lovelace)
      if (token.policyId === "lovelace" || token.policyId === TREE_TOKEN_POLICY_ID) continue;
      const unit = toUnit(token.policyId, token.tokenName);
      const response = await fetch("/api/getmetadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unit }),
      });
      if (response) {
        const { TreeData } = await response.json();
        metadata[unit] = TreeData;
      }
    }
    setTokenMetadata(metadata);
  };


  const handleAPI_AI = async (param: TransactionType, species?: string, coordinates?: string) => {
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
            lockingValidatorName: LOCKING_CONTRACT,
            species: species!,
            coordinates: coordinates!
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
            refLockPolicy: LOCKING_CONTRACT,
            nftMintPolicyName: NFT_MINT_POLICY,
            treeData: selectedTokenMetadata!,
            burnAssetName: selectedAssetClass?.tokenName!
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
            refLockPolicy: LOCKING_CONTRACT,
            nftMintPolicyName: NFT_MINT_POLICY,
            treeData: selectedTokenMetadata!,
            burnAssetName: selectedAssetClass?.tokenName!
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
            nftMintPolicyName: NFT_MINT_POLICY,
            burnAssetName: selectedAssetClass?.tokenName!
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
            nftMintPolicyName: NFT_MINT_POLICY,
            burnAssetName: selectedAssetClass?.tokenName!
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
          const { tx, aiSigned } = await response.json();
          const userSign = await lucid.fromTx(tx).partialSign.withWallet();
          const signedTx = await lucid.fromTx(tx).assemble([aiSigned, userSign]).complete();
          const txh = await signedTx.submit();
          console.log(txh);
          if (txh !== "") {
            const sp: SuccessAlertProps = {
              message: "Transaction was a success",
              onClose: () => false,
              link: {
                href: txh,
                text: "Transaction ID"
              }
            }
            setSuccessMessage(sp);
            setSuccessAlertVisible(true);
          }
        }


      } catch (error) {
        console.log(error);
        console.error(JSON.stringify(error, null, 2));
        setAlertMessage(`Error in transaction: ${error}`);
        setErrorAlertVisible(true);
      }
    }
  };

  const handleAPI = async (param: TransactionType, species?: string, coordinates?: string) => {
    if (isConnected && enabledWallet) {
      try {
        const lucid = await Lucid(new Emulator([]), "Preprod");
        const api = await window.cardano[enabledWallet].enable();
        lucid.selectWallet.fromAPI(api);
        let response;

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
        if (param === "Burn") {
          const body: BurnConfig = {
            address: usedAddresses[0],
            nftMintPolicyName: NFT_MINT_POLICY,
            burnAssetName: selectedAssetClass?.tokenName!
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
            nftMintPolicyName: NFT_MINT_POLICY,
            burnAssetName: selectedAssetClass?.tokenName!
          };
          response = await fetch("/api/test", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify(body),
          });
        }
        if (!response?.ok) {
          const errorData = await response?.json();
          throw new Error(errorData.error || 'Failed to process request');
        }

        if (response) {
          const { tx } = await response.json();
          const signedTx = await lucid.fromTx(tx).sign.withWallet().complete();
          const txh = await signedTx.submit();
          console.log(txh);
          if (txh !== "") {
            const sp: SuccessAlertProps = {
              message: "Transaction was a success",
              onClose: () => false,
              link: {
                href: txh,
                text: "Transaction ID"
              }
            }
            setSuccessMessage(sp);
            setSuccessAlertVisible(true);
          }
        }



      } catch (error) {
        console.log(error);
        console.error(JSON.stringify(error, null, 2));
        setAlertMessage(`Error in transaction: ${error}`);
        setErrorAlertVisible(true);
      }
    }
  };

  // Define a function or object to map policy IDs to image paths
  const policyToImage: { [key: string]: string } = {
    [SEED_NFT_POLICY_ID]: "/img/seed.jpg",
    [SAPLING_NFT_POLICY_ID]: "/img/sapling.jpg",
    [TREE_NFT_POLICY_ID]: "/img/tree.jpg",
    [ADA_POLICY_ID]: "/img/ada.jpg",
    [TREE_TOKEN_POLICY_ID]: "/img/treeconomy.jpg",
    "default": "/img/question.jpg"
  };

  const getImageForPolicyId = (policyId: string) => {
    return policyToImage[policyId === "lovelace" ? ADA_POLICY_ID : policyId] || policyToImage['default'];
  };


  const handleTokenClick = async (tokenName: string, policyid: string) => {
    const assetClass: AssetClass = { policyId: policyid, tokenName: tokenName }
    setSelectedAssetClass(assetClass);
    console.log("policy id: ", assetClass.policyId);
    console.log("token name: ", assetClass.tokenName);

    try {
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
      } else {
        console.log("didn't get metadata");
        setSelectedTokenMetadata(null);
      }
    }
    catch (error) {
      console.log("didn't get metadata");
      setSelectedTokenMetadata(null);
    }


  };

  const randomActionFunction = async (param: TransactionType, species?: string, coordinates?: string) => {
    // Generate a random number between 0 and 1
    const shouldProceed = Math.random() < 0.5;

    if (shouldProceed) {
      console.log(`Attempting to ${param}...`);
      if (param === "Mint") {
        await handleAPI_AI(param, species, coordinates);
      } else {
        await handleAPI_AI(param);
      }
    } else {
      console.log(`${param} failed!`);
      setAlertMessage(`Image did not pass verification. ${param} operation failed`);
      setErrorAlertVisible(true);
    }
  };

  const handleMintSeed = (species: string, coordinates: string, image: File | null) => {
    console.log('Minting Seed NFT with:', { species, coordinates });
    randomActionFunction("Mint", species, coordinates);
    setIsMintModalOpen(false);
  };

  const handleMintSapling = (treeType: string, image: File | null) => {
    console.log('Minting Sapling NFT');
    randomActionFunction("BurnMintSapling");
    setIsSaplingModalOpen(false);
  }

  const handleMintTree = (treeType: string, image: File | null) => {
    console.log('Minting Tree NFT');
    randomActionFunction("BurnMintTree");
    setIsTreeModalOpen(false);
  }


  return (
    <>
      {isConnected ? (
        <div className="w-full">
          {/* Buttons section */}
          <div className="flex flex-row items-center justify-center gap-4 mb-8 flex-wrap">
            <h2 className="text-lg font-semibold mb-4 w-full text-center"></h2>
            <button
              className="btn btn-primary"
              onClick={() => setIsMintModalOpen(true)}
            >
              Mint Seed NFT
            </button>
            <button
              className={`btn ${selectedAssetClass?.policyId !== SEED_NFT_POLICY_ID ? 'btn-disabled' : 'btn-primary'}`}
              onClick={() => setIsSaplingModalOpen(true)}
              disabled={selectedAssetClass?.policyId !== SEED_NFT_POLICY_ID}
            >
              Seed - Sapling
            </button>
            <button
              className={`btn ${selectedAssetClass?.policyId !== SAPLING_NFT_POLICY_ID ? 'btn-disabled' : 'btn-primary'}`}
              onClick={() => setIsTreeModalOpen(true)}
              disabled={selectedAssetClass?.policyId !== SAPLING_NFT_POLICY_ID}
            >
              Sapling - Tree
            </button>
            <button
              className={`btn ${selectedAssetClass?.policyId !== TREE_NFT_POLICY_ID ? 'btn-disabled' : 'btn-primary'}`}
              onClick={() => handleAPI("Withdraw")}
              disabled={selectedAssetClass?.policyId !== TREE_NFT_POLICY_ID}
            >
              Collect Rewards
            </button>
            <button className="btn btn-primary" onClick={() => handleAPI("Burn")}>
              Burn Baby Burn
            </button>
            <button className="btn btn-primary" onClick={() => handleAPI("Test")}>
              Test
            </button>
          </div>
{/* 
          <div className="w-full sm:w-1/2 p-4 border-l border-gray-300">
            <h2 className="text-lg font-semibold mb-4 text-center">My Tokens</h2>
            <div className="max-h-[120vh] overflow-y-auto"> 
              {Object.entries(walletTokens).map(([key, token]) => {
                let unit;
                if (token.policyId === "lovelace") {
                  unit = "lovelace";
                } else {
                  unit = toUnit(token.policyId, token.tokenName);
                }

                return (
                  <div
                    key={key}
                    className={`mb-4 flex items-start cursor-pointer ${selectedAssetClass?.tokenName === token.tokenName ? 'bg-blue-200' : ''}`}
                    onClick={() => handleTokenClick(token.tokenName, token.policyId)}
                  >
                    <Image
                      src={getImageForPolicyId(token.policyId)}
                      alt={token.policyId === "lovelace" ? "ADA" : (token.policyId === "02ef810a03b1b5c0cfd1b81401bdddd954374284d190563e51add648" ? "Tree Token" : token.tokenName)}
                      width={100}
                      height={100}
                      className="mr-2"
                    />
                    <div>
                      {token.policyId === "lovelace" ? (
                        <p><strong>ADA:</strong>
                          {((Number(token.quantity) / 1000000).toFixed(6))} 
                        </p>
                      ) : token.policyId === TREE_TOKEN_POLICY_ID ? (
                        <p><strong>Tree Token:</strong> {token.quantity.toString()}</p>
                      ) : (
                        <>
                        
                          {tokenMetadata[unit] && (
                            <>
                              <p><strong>Name:</strong> {tokenMetadata[unit].name}</p>
                              <p><strong>Number:</strong> {tokenMetadata[unit].number}</p>
                              <p><strong>Species:</strong> {tokenMetadata[unit].species}</p>
                              <p><strong>Coordinates:</strong> {tokenMetadata[unit].coordinates}</p>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div> */}
          {/* Token sections */}
        <div className="flex flex-wrap">
          {/* Left Column: My Trees */}
          <div className="w-full sm:w-1/2 p-4 border-r border-gray-300">
            <h2 className="text-lg font-semibold mb-4 text-center">My Trees</h2>
            <div className="max-h-[120vh] overflow-y-auto">
              {Object.entries(walletTokens).map(([key, token]) => {
                if ([TREE_NFT_POLICY_ID, SAPLING_NFT_POLICY_ID, SEED_NFT_POLICY_ID].includes(token.policyId)) {
                  let unit;
                  if (token.policyId === "lovelace") {
                    unit = "lovelace";
                  } else {
                    unit = toUnit(token.policyId, token.tokenName);
                  }

                  return (
                    <div
                      key={key}
                      className={`mb-4 flex items-start cursor-pointer ${selectedAssetClass?.tokenName === token.tokenName ? 'bg-blue-200' : ''}`}
                      onClick={() => handleTokenClick(token.tokenName, token.policyId)}
                    >
                      <Image
                        src={getImageForPolicyId(token.policyId)}
                        alt={token.policyId === "lovelace" ? "ADA" : token.tokenName}
                        width={100}
                        height={100}
                        className="mr-2"
                      />
                      <div>
                        {tokenMetadata[unit] && (
                          <>
                            <p><strong>Name:</strong> {tokenMetadata[unit].name}</p>
                            <p><strong>Number:</strong> {tokenMetadata[unit].number}</p>
                            <p><strong>Species:</strong> {tokenMetadata[unit].species}</p>
                            <p><strong>Coordinates:</strong> {tokenMetadata[unit].coordinates}</p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                }
                return null; // Skip rendering if not a tree token
              })}
            </div>
          </div>

          {/* Right Column: My Tokens */}
          <div className="w-full sm:w-1/2 p-4">
            <h2 className="text-lg font-semibold mb-4 text-center">My Tokens</h2>
            <div className="max-h-[120vh] overflow-y-auto">
              {Object.entries(walletTokens).map(([key, token]) => {
                if (![TREE_NFT_POLICY_ID, SAPLING_NFT_POLICY_ID, SEED_NFT_POLICY_ID].includes(token.policyId)) {
                  let unit;
                  if (token.policyId === "lovelace") {
                    unit = "lovelace";
                  } else {
                    unit = toUnit(token.policyId, token.tokenName);
                  }

                  return (
                    <div
                      key={key}
                      className={`mb-4 flex items-start cursor-pointer ${selectedAssetClass?.tokenName === token.tokenName ? 'bg-blue-200' : ''}`}
                      onClick={() => handleTokenClick(token.tokenName, token.policyId)}
                    >
                      <Image
                        src={getImageForPolicyId(token.policyId)}
                        alt={token.policyId === "lovelace" ? "ADA" : (token.policyId === TREE_TOKEN_POLICY_ID ? "Tree Token" : token.tokenName)}
                        width={100}
                        height={100}
                        className="mr-2"
                      />
                      <div>
                        {token.policyId === "lovelace" ? (
                          <p><strong>ADA:</strong> {((Number(token.quantity) / 1000000).toFixed(6))}</p>
                        ) : token.policyId === TREE_TOKEN_POLICY_ID ? (
                          <p><strong>Tree Token:</strong> {token.quantity.toString()}</p>
                        ) : (
                          <>
                            {tokenMetadata[unit] && (
                              <>
                                <p><strong>Name:</strong> {tokenMetadata[unit].name}</p>
                                <p><strong>Number:</strong> {tokenMetadata[unit].number}</p>
                                <p><strong>Species:</strong> {tokenMetadata[unit].species}</p>
                                <p><strong>Coordinates:</strong> {tokenMetadata[unit].coordinates}</p>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                }
                return null; // Skip rendering if it's a tree token
              })}
            </div>
          </div>
        </div>
        </div>
      ) : null}
      {errorAlertVisible &&
        <ErrorAlert
          message={alertMessage}
          onClose={() => setErrorAlertVisible(false)}
        />}
      {successAlertVisible &&
        <SuccessAlert
          message={successMessage?.message!}
          onClose={() => setSuccessAlertVisible(false)}
          link={successMessage?.link}
        />}
      <MintSeedModal
        isOpen={isMintModalOpen}
        onClose={() => setIsMintModalOpen(false)}
        onConfirm={handleMintSeed}
      />
      <MintSaplingTreeModal
        treeType="Sapling"
        isOpen={isSaplingModalOpen}
        onClose={() => setIsSaplingModalOpen(false)}
        onConfirm={handleMintSapling}
      />
      <MintSaplingTreeModal
        treeType="Tree"
        isOpen={isTreeModalOpen}
        onClose={() => setIsTreeModalOpen(false)}
        onConfirm={handleMintTree}
      />
    </>
  );
};

export default Delegate;
