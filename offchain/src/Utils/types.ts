import { Address, Assets, OutRef } from "@lucid-evolution/lucid";

export const TreeToken: string = "Treeconomy Token";
export const TIME_TOLERANCE_MS: POSIXTime = 100000;
export type CborHex = string;
export type RawHex = string;
export type POSIXTime = number;

export type Result<T> =
  | { type: "ok"; data: T }
  | { type: "error"; error: Error };

export type Either<L, R> =
  | { type: "left"; value: L }
  | { type: "right"; value: R };

export type AssetClass = {
  policyId: string;
  tokenName: string;
};

export type LockTokensConfig = {
  beneficiary: Address;
  vestingAsset: AssetClass;
  totalVestingQty: number;
  vestingPeriodStart: POSIXTime;
  vestingPeriodEnd: POSIXTime;
  firstUnlockPossibleAfter: POSIXTime;
  totalInstallments: number;
  scripts: {
    vesting: CborHex;
  };
};

export type CollectPartialConfig = {
  vestingOutRef: OutRef;
  scripts: {
    vesting: CborHex;
  };
  currentTime?: POSIXTime;
};

export type ReadableUTxO<T> = {
  outRef: OutRef;
  datum: T;
  assets: Assets;
};