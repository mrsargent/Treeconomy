'use client';
import dynamic from "next/dynamic";
import Image from "next/image";
import { Suspense, useState } from "react";
import Clerkcomp from "./Clerkcomp";
import { useCardano } from "@cardano-foundation/cardano-connect-with-wallet";
import { NetworkType } from "@cardano-foundation/cardano-connect-with-wallet-core";
//import WalletConnect from "./WalletConnect";
const WalletConnect = dynamic(() => import("./WalletConnect"), {
  ssr: false,
});

export default function NavBar() {
  const [isUserSignedIn, setIsUserSignedIn] = useState<boolean>(false);

  // const network =
  //   process.env.NODE_ENV === "development"
  //     ? NetworkType.TESTNET
  //     : NetworkType.MAINNET;
  // const { isConnected } = useCardano({
  //   limitNetwork: network,
  // });
  
  return (
    // <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
    <div className="flex flex-wrap w-full max-w-5xl items-center justify-between font-mono text-sm">
      {/* <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none"> */}
      <div className="flex items-center">

        <Image
          src="/img/icon.jpg"
          alt="Capacitree"
          width={60}
          height={24}
          priority
        />
        <p className="text-3xl ml-5">Tree-conomy</p>

      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '10px' }}>
          <Suspense fallback={<div>Loading ... </div>}>
            {!isUserSignedIn && <WalletConnect />}
          </Suspense>
        </span>
         {<Clerkcomp onSignInStatusChange={setIsUserSignedIn} />}
      </div>
    </div>
  );
}


