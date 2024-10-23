"use client";
import { useCardano } from "@cardano-foundation/cardano-connect-with-wallet";
import { NetworkType } from "@cardano-foundation/cardano-connect-with-wallet-core";
import { Button, Text } from "@radix-ui/themes";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";


declare global {
  interface Window {
    my_modal: any;
  }
}

const WalletModal = () => {
  const network =
    process.env.NODE_ENV === "development"
      ? NetworkType.TESTNET
      : NetworkType.MAINNET;
  const { isConnected, connect, installedExtensions } = useCardano({
    limitNetwork: network,
  });

  const [open, setOpen] = useState(false);

  const handleProvider = (p: string) => {
    connect(p);
    setOpen(false);
  };


  return (
    <>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <Button className="btn btn-primary" onClick={() => setOpen(true)}>
            {isConnected ? 'CONNECTED' : 'CONNECT'}
          </Button>
        </Dialog.Trigger>

        <Dialog.Content className="modal-box">
          <Dialog.Title>Select a Wallet</Dialog.Title>
          <Dialog.Description></Dialog.Description>
          <div className="flex flex-col gap-3 sm:gap-6 lg:gap-8">
            {installedExtensions.map((provider: string) => (
              <div key={provider} className="flex justify-around">
                <Button
                  className="btn btn-primary"
                  onClick={() => handleProvider(provider)}
                >
                  {provider.toUpperCase()}
                </Button>
                <span className="h-auto w-20">
                  <Image
                    src={window.cardano[provider].icon}
                    alt={provider}
                    width={36}
                    height={10}
                  />
                </span>
              </div>
            ))}
          </div>
          <Dialog.Close asChild>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
};

export default WalletModal;

{/* <Dialog.Root open={open} onOpenChange={setOpen}>
<Dialog.Trigger asChild>
  <Button className="btn btn-primary" onClick={() => setOpen(true)}>
    {isConnected ? 'CONNECTED' : 'CONNECT'}
  </Button>
</Dialog.Trigger>
<Dialog.Portal>


<Dialog.Content className="modal-box w-full max-w-lg">
  <Dialog.Title>
    <Text>Select a Wallet</Text>
  </Dialog.Title>
  <Dialog.Description></Dialog.Description>

  <div className="flex flex-col gap-3 sm:gap-6 lg:gap-8">
    {installedExtensions.map((provider: string) => (
      <div key={provider} className="flex justify-around">
        <Button
          className="btn btn-primary"
          onClick={() => handleProvider(provider)}
        >
          {provider.toUpperCase()}
        </Button>
        <span className="h-auto w-20">
          <Image
            src={window.cardano[provider].icon}
            alt={provider}
            width={36}
            height={10}
          />
        </span>
      </div>
    ))}
  </div>
  <Dialog.Close asChild>
    <Button className="btn" onClick={() => setOpen(false)}>Close</Button>
  </Dialog.Close>
</Dialog.Content>
</Dialog.Portal>
</Dialog.Root> */}