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
    const prependIndex = concatBytes(indexByte, hexToBytes(utxo.txHash));

    if (prefix != null) {
        // concat the prefix
        const prependPrefix = concatBytes(hexToBytes(prefix), prependIndex);
        return bytesToHex(prependPrefix.slice(0, 32));
    } else {
        return bytesToHex(prependIndex.slice(0, 32));
    }
};

// export function canClaim(
//     startTime: bigint,
//     endTime: bigint,
//     numPayouts: bigint,
//     totalTokens: bigint,
//     remainingTokens: bigint,
//     currentTime: bigint
//   ): boolean {
//     if (currentTime > endTime){
//         return true;
//     }

//     // Calculate tokens per payout
//     const tokensPerPayout = totalTokens / numPayouts;
//     console.log("tokens per payout", tokensPerPayout);
//     // Ensure current time is within the contract's duration
//     if (currentTime < startTime || currentTime > endTime) {
//       return false;
//     }

//     // Calculate time interval between payouts
//     const interval = (endTime - startTime) / numPayouts;
//     const elapsedTime = currentTime - startTime;
//     console.log("interval: ",interval);
//     console.log("elapsedTime", elapsedTime);
//     // Ensure elapsed time is valid
//     if (elapsedTime < 0n) return false;

//     // Determine how many payouts should have been unlocked by now
//     const unlockedPayouts = elapsedTime / interval; // Integer division, truncated

//     console.log("unlocked payouts: ",unlockedPayouts);

//     // Calculate the number of already claimed payouts (rounding up)
//     const claimedPayouts = numPayouts - bigintCeil(remainingTokens, tokensPerPayout);
//     console.log("claimed payouts: ", claimedPayouts);
//     // User can claim if unlocked payouts > claimed payouts
//     if (claimedPayouts < 0){
//         return false;
//     }

//     return unlockedPayouts > claimedPayouts;
//   }

//   // Helper function to calculate the ceiling of remainingTokens / tokensPerPayout
//   function bigintCeil(numerator: bigint, denominator: bigint): bigint {
//     return (numerator + denominator - 1n) / denominator;
//   }


//   export function canClaim(
//     vestingPeriodStart: bigint,
//     vestingPeriodEnd: bigint,
//     totalInstallments: bigint,
//     totalVestingQty: bigint,
//     remainingTokens: bigint,
//     currentTime: bigint
// ): boolean {
//     // Check if we are within the vesting period
//     if (currentTime < vestingPeriodStart || currentTime >= vestingPeriodEnd) {
//         return false; // Outside of vesting period
//     }

//     // Calculate the time interval between installments
//     const interval = (vestingPeriodEnd - vestingPeriodStart) / totalInstallments;

//     // Determine how much time has elapsed since the vesting period started
//     const elapsedTime = currentTime - vestingPeriodStart;

//     // How many installments should be unlocked by now?
//     const unlockedInstallments = elapsedTime / interval; // This is floor division with bigint

//     // Tokens per installment
//     const tokensPerInstallment = totalVestingQty / totalInstallments;

//     // Calculate how many installments have been claimed already
//     const claimedInstallments = totalInstallments - divCeil(remainingTokens, tokensPerInstallment);

//     // Can claim if there are more unlocked installments than claimed
//     return unlockedInstallments > claimedInstallments;
// }
// export const canClaim = (
//     currentTime: bigint,
//     vestingPeriodStart: bigint,
//     vestingPeriodEnd: bigint,
//     totalInstallments: bigint,
//     totalVestingQty: bigint,
//     expectedRemainingQty: bigint
// ): boolean => {
//     // If before start time, cannot claim
//     if (currentTime < vestingPeriodStart) {
//         return false;
//     }

//     // If after end time and tokens remain, can claim
//     if (currentTime >= vestingPeriodEnd) {
//         return true;
//     }


//     // Calculate time elapsed since start
//     const timeElapsed = currentTime - vestingPeriodStart;

//     // Calculate total vesting period length
//     const vestingPeriodLength = vestingPeriodEnd - vestingPeriodStart;

//     // Calculate time per installment
//     const timePerInstallment = divCeil(vestingPeriodLength, totalInstallments);

//     if (timeElapsed < timePerInstallment){
//         return false;
//     }
//     // Calculate the current interval number (1-based)
//     const currentInterval = timeElapsed / timePerInstallment + 1n;

//     // Calculate tokens that should be remaining after the last completed interval
//     const shouldBeRemaining = divCeil(
//         (totalInstallments - (currentInterval - 1n)) * totalVestingQty,
//         totalInstallments
//     );

//     // Can only claim if we're at a new interval boundary AND there are more tokens than should be remaining
//     const isAtIntervalBoundary = timeElapsed % timePerInstallment === 0n;
//     return expectedRemainingQty > shouldBeRemaining && isAtIntervalBoundary;
// };

export const canClaim = (
    currentTime: bigint,
    vestingPeriodStart: bigint,
    vestingPeriodEnd: bigint,
    totalInstallments: bigint,
    totalVestingQty: bigint,
    expectedRemainingQty: bigint,
    toleranceTime: bigint
): boolean => {

    // If after or at the end time, full unlock is possible
    if (currentTime >= vestingPeriodEnd) {
        return true;
    }

    // Calculate time elapsed since start
    const timeElapsed = (currentTime - toleranceTime) - vestingPeriodStart;
    console.log("timeElapsed: ", timeElapsed);
    // Total vesting period length
    const vestingPeriodLength = vestingPeriodEnd - vestingPeriodStart;
    console.log("vestingPeriodLength: ", vestingPeriodLength);
    // Time per installment
    const timePerInstallment = divCeil(vestingPeriodLength, totalInstallments);
    console.log("timePerInstallment: ", timePerInstallment);
    // Determine which installment we are in (0-based index)
    const currentInstallment = timeElapsed / timePerInstallment;
    console.log("currentInstallment: ", currentInstallment);
    // Check if we've passed the time threshold for the current installment
    if (currentInstallment < 1n) {
        return false; // Can't claim if haven't passed the first installment yet
    }

    // Check if we've entered into a new installment time period
    if (timeElapsed >= timePerInstallment * currentInstallment) {
        const tokensPerInstallment = divCeil(totalVestingQty, totalInstallments)-1n;
        console.log("tokenPerInstallment: ", tokensPerInstallment);
        // Calculate expected tokens released up to this point
        const tokensReleased = tokensPerInstallment * currentInstallment;
        console.log("tokensReleased: ", tokensReleased);
        console.log("totalVestingQty: ", totalVestingQty);
        console.log("totalvestingqty - tokensrelease", totalVestingQty-tokensReleased);
        console.log("expectedremaiingQty: ", expectedRemainingQty);
        // We can claim if there are more tokens than expected to be released for the current interval
        return expectedRemainingQty   <= totalVestingQty - tokensReleased;
    }

    return false; // If we haven't entered a new installment period yet
};


export function canClaimTokens(
    currentTime: bigint,
    vestingPeriodStart: bigint,
    vestingPeriodEnd: bigint,
    totalInstallments: bigint,
    installmentsClaimed: bigint
  ): boolean {
    if (currentTime > vestingPeriodEnd){
        return true;
    }

    // Calculate the length of each installment period
    const vestingPeriodLengthTime = vestingPeriodEnd - vestingPeriodStart;
    const installmentPeriodTime = vestingPeriodLengthTime / totalInstallments;
  
  
    // Calculate which installment we're up to based on current time
    const elapsedTime = currentTime - vestingPeriodStart;
    const possibleInstallments = elapsedTime / installmentPeriodTime;
  
  // Since we're dealing with bigints, we need to handle the division result 
  // which might not be an integer. We'll compare with the next whole number
  // by adding 1 to installmentsClaimed to check if we've passed that point
  return possibleInstallments > installmentsClaimed;
  }
  


export function canClaimTokens2(
    currentTime: bigint,
    vestingPeriodStart: bigint,
    vestingPeriodEnd: bigint,
    totalInstallments: bigint,
    futureInstallments: bigint,
    timeBetweenTwoInstallments: bigint
  ): boolean {
    if (currentTime > vestingPeriodEnd){
        return true;
    }

   const claimAvail = totalInstallments - futureInstallments;
   console.log("claim available: ",claimAvail);
   if (claimAvail === 0n){
    return false;
   }
   
   const a = claimAvail * timeBetweenTwoInstallments;
   const elapsedTime = currentTime - vestingPeriodStart;
   console.log("a: ",a);
   console.log("elsapsed time: ",elapsedTime);



   if (elapsedTime > a ){
    return true;
   }
   return false;

  }
  