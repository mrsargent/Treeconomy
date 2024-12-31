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
import { ADA_POLICY_ID, NFT_MINT_POLICY, REWARDS_VALIDATOR, SAPLING_NFT_POLICY_ID, SEED_NFT_POLICY_ID, TOKEN_MINT_POLICY, TREE_NFT_POLICY_ID, TREE_TOKEN_POLICY_ID } from "@/Utils/constants";
import ErrorAlert from "./alerts/ErrorAlert";
import SuccessAlert, { SuccessAlertProps } from "./alerts/SuccessAlert";
import MintSeedModal from "./modals/MintSeedModal";


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

  const handleAPI = async (param: TransactionType, species?: string, coordinates?: string) => {
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
          const signedTx = await lucid.fromTx(tx).assemble([aiSigned,userSign]).complete();
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
        await handleAPI(param, species, coordinates);
      } else {
        await handleAPI(param);
      }
    } else {
      console.log(`${param} failed!`);
      setAlertMessage(`Image did not pass verification. ${param} operation failed`);
      setErrorAlertVisible(true);
    }
  };

  const handleMintSeed = (species: string, coordinates: string) => {
    // Here you would handle the minting with the selected species and coordinates
    console.log('Minting Seed NFT with:', { species, coordinates });
    randomActionFunction("Mint", species, coordinates);
    setIsMintModalOpen(false);
  };


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
              onClick={() => randomActionFunction("BurnMintSapling")}
              disabled={selectedAssetClass?.policyId !== SEED_NFT_POLICY_ID}
            >
              Seed - Sapling
            </button>
            <button
              className={`btn ${selectedAssetClass?.policyId !== SAPLING_NFT_POLICY_ID ? 'btn-disabled' : 'btn-primary'}`}
              onClick={() => randomActionFunction("BurnMintTree")}
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

          {/* Tokens section */}
          <div className="w-full">
            <h2 className="text-xl font-semibold mb-4 text-center">Tokens</h2>
            <div className="flex flex-col items-start">
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
                    <span>{token.tokenName}</span>
                    <span>{"...."}</span>
                    <span>{token.quantity.toString()}</span>
                  </h1>
                </div>
              ))}
            </div>
          </div>

          {/* Token Details Panel */}
          <div className="w-full sm:w-1/3 p-4 border-l border-gray-300">
            <h2 className="text-lg font-semibold mb-4 text-center">Token Details</h2>
            {selectedTokenMetadata && selectedAssetClass ? (
              <div>
                <p><strong>Policy ID:</strong> {selectedAssetClass.policyId}</p>
                <p><strong>Token Name:</strong> {selectedAssetClass.tokenName}</p>
                <p><strong>Name:</strong> {selectedTokenMetadata.name}</p>
                <p><strong>Number:</strong> {selectedTokenMetadata.number}</p>
                <p><strong>Species:</strong> {selectedTokenMetadata.species}</p>
                <p><strong>Coordinates:</strong> {selectedTokenMetadata.coordinates}</p>
              </div>
            ) : (
              <p className="text-center">No Treeconomy NFT selected</p>
            )}
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
    </>
  );
};

export default Delegate;
