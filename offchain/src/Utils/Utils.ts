import {
    Address,
    applyDoubleCborEncoding,
    Assets,
    Constr,
    credentialToAddress,
    Data,
    Emulator,
    generateSeedPhrase,
    getAddressDetails,
    keyHashToCredential,
    Lucid,
    LucidEvolution,
    Network,
    scriptHashToCredential,
    SpendingValidator,
    UTxO,
    validatorToAddress,
} from "@lucid-evolution/lucid";

import { Either, ReadableUTxO, Result } from "./types.js";
import { AddressObject } from "@/pages/api/schemas.js";
import { bytesToHex, concatBytes, hexToBytes } from "@noble/hashes/utils";


export const utxosAtScript = async (
    lucid: LucidEvolution,
    script: string,
    stakeCredentialHash?: string
): Promise<UTxO[]> => {
    const network = lucid.config().network;

    const scriptValidator: SpendingValidator = {
        type: "PlutusV2",
        script: script,
    };

    const scriptValidatorAddr = stakeCredentialHash
        ? validatorToAddress(
            network,
            scriptValidator,
            keyHashToCredential(stakeCredentialHash)
        )
        : validatorToAddress(network, scriptValidator);

    return lucid.utxosAt(scriptValidatorAddr);
};

export const parseSafeDatum = <T>(
    datum: string | null | undefined,
    datumType: T
): Either<string, T> => {
    if (datum) {
        try {
            const parsedDatum = Data.from(datum, datumType);
            return {
                type: "right",
                value: parsedDatum,
            };
        } catch (error) {
            return { type: "left", value: `invalid datum : ${error}` };
        }
    } else {
        return { type: "left", value: "missing datum" };
    }
};

export const parseUTxOsAtScript = async <T>(
    lucid: LucidEvolution,
    script: string,
    datumType: T,
    stakeCredentialHash?: string
): Promise<ReadableUTxO<T>[]> => {
    try {
        const utxos = await utxosAtScript(
            lucid,
            script,
            stakeCredentialHash
        );
        return utxos.flatMap((utxo) => {
            const result = parseSafeDatum<T>(utxo.datum, datumType);
            if (result.type == "right") {
                return {
                    outRef: {
                        txHash: utxo.txHash,
                        outputIndex: utxo.outputIndex,
                    },
                    datum: result.value,
                    assets: utxo.assets,
                };
            } else {
                return [];
            }
        });
    } catch (e) {
        return [];
    }
};

export const toCBORHex = (rawHex: string) => {
    return applyDoubleCborEncoding(rawHex);
};

export const generateAccountSeedPhrase = async (assets: Assets) => {
    const seedPhrase = generateSeedPhrase();
    const lucid = await Lucid(new Emulator([]), "Custom");
    lucid.selectWallet.fromSeed(seedPhrase);
    const address = lucid.wallet().address;
    return {
        seedPhrase,
        address,
        assets,
    };
};

export function fromAddress(address: Address): AddressObject {
    // We do not support pointer addresses!

    const { paymentCredential, stakeCredential } = getAddressDetails(address);

    if (!paymentCredential) throw new Error("Not a valid payment address.");

    return {
        paymentCredential:
            paymentCredential?.type === "Key"
                ? {
                    PublicKeyCredential: [paymentCredential.hash],
                }
                : { ScriptCredential: [paymentCredential.hash] },
        stakeCredential: stakeCredential
            ? {
                Inline: [
                    stakeCredential.type === "Key"
                        ? {
                            PublicKeyCredential: [stakeCredential.hash],
                        }
                        : { ScriptCredential: [stakeCredential.hash] },
                ],
            }
            : null,
    };
}

export function toAddress(address: AddressObject, network: Network): Address {
    const paymentCredential = (() => {
        if ("PublicKeyCredential" in address.paymentCredential) {
            return keyHashToCredential(
                address.paymentCredential.PublicKeyCredential[0]
            );
        } else {
            return scriptHashToCredential(
                address.paymentCredential.ScriptCredential[0]
            );
        }
    })();
    const stakeCredential = (() => {
        if (!address.stakeCredential) return undefined;
        if ("Inline" in address.stakeCredential) {
            if ("PublicKeyCredential" in address.stakeCredential.Inline[0]) {
                return keyHashToCredential(
                    address.stakeCredential.Inline[0].PublicKeyCredential[0]
                );
            } else {
                return scriptHashToCredential(
                    address.stakeCredential.Inline[0].ScriptCredential[0]
                );
            }
        } else {
            return undefined;
        }
    })();
    return credentialToAddress(network, paymentCredential, stakeCredential);
}

export const fromAddressToData = (address: Address): Result<Data> => {
    const addrDetails = getAddressDetails(address);

    if (!addrDetails.paymentCredential)
        return { type: "error", error: new Error("undefined paymentCredential") };

    const paymentCred =
        addrDetails.paymentCredential.type == "Key"
            ? new Constr(0, [addrDetails.paymentCredential.hash])
            : new Constr(1, [addrDetails.paymentCredential.hash]);

    if (!addrDetails.stakeCredential)
        return {
            type: "ok",
            data: new Constr(0, [paymentCred, new Constr(1, [])]),
        };

    const stakingCred = new Constr(0, [
        new Constr(0, [new Constr(0, [addrDetails.stakeCredential.hash])]),
    ]);

    return { type: "ok", data: new Constr(0, [paymentCred, stakingCred]) };
};

export const chunkArray = <T>(array: T[], chunkSize: number) => {
    const numberOfChunks = Math.ceil(array.length / chunkSize);

    return [...Array(numberOfChunks)].map((_value, index) => {
        return array.slice(index * chunkSize, (index + 1) * chunkSize);
    });
};

export const replacer = (_key: unknown, value: unknown) =>
    typeof value === "bigint" ? value.toString() : value;

export const divCeil = (a: bigint, b: bigint) => {
    return 1n + (a - 1n) / b;
};

export function uniqueTokenName(
    txid: Uint8Array, 
    idx: number, 
    prefix: Uint8Array, 
    personal: Uint8Array
  ): Uint8Array {
    // Prefix the txid with the index
    let prependIndex = new Uint8Array(txid.length + 1);
    prependIndex.set([idx], 0); // Assuming idx is a single byte for simplicity
    prependIndex.set(txid, 1);
  
    // Trim personal to max length of 15 bytes
    let trimmedPersonal = personal.slice(0, Math.min(personal.length, 15));
  
    // Concatenate the name
    let result = new Uint8Array(prefix.length + trimmedPersonal.length + prependIndex.length);
    result.set(prefix, 0);
    result.set(trimmedPersonal, prefix.length);
    result.set(prependIndex, prefix.length + trimmedPersonal.length);
    
    
    // Slice off to 32 bytes, returning only the first 31 bytes
    return result.slice(0, 31);
  }

  export const generateUniqueAssetName = (utxo: UTxO, prefix: string): string => {
    // sha3_256 hash of the tx id
    //const txIdHash = sha3_256(hexToBytes(utxo.txHash));

    // prefix the txid hash with the index
    const indexByte = new Uint8Array([utxo.outputIndex]);
    const prependIndex = concatBytes(indexByte,hexToBytes(utxo.txHash));

    if (prefix != null) {
        // concat the prefix
        const prependPrefix = concatBytes(hexToBytes(prefix), prependIndex);
        return bytesToHex(prependPrefix.slice(0, 32));
    } else {
        return bytesToHex(prependIndex.slice(0, 32));
    }
};


