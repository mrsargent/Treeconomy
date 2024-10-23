"use client";
import { useCardano } from "@cardano-foundation/cardano-connect-with-wallet";
import { NetworkType } from "@cardano-foundation/cardano-connect-with-wallet-core";
import WalletModal from "./WalletModal";
import { Button } from "@radix-ui/themes";

const WalletConnect2 = () => {
  const network =
    process.env.NODE_ENV === "development"
      ? NetworkType.TESTNET
      : NetworkType.MAINNET;
  const { isConnected, enabledWallet, stakeAddress, usedAddresses, disconnect, accountBalance } = useCardano({
    limitNetwork: network,
  });  

  return (
    <div className="flex items-center gap-3 sm:gap-6 lg:gap-8">
      {isConnected ? (
        <div className="flex items-center gap-3 sm:gap-6 lg:gap-8">
          <h1>          
            {usedAddresses[0] === undefined ? " " : usedAddresses[0]!.slice(0, 10)}
            {"..."}
            {usedAddresses[0] === undefined ? " " : usedAddresses[0]!.slice(usedAddresses[0]!.length - 6)}
          </h1>        
          <h1>{accountBalance}</h1>
         
          <Button
            className="btn btn-square btn-outline"
            onClick={() => {
              disconnect();
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>
      ) : (
        <></>
      )}
      <WalletModal />
    </div>
  );
};

export default WalletConnect2;
