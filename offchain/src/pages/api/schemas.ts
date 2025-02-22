import { Address, Data, getAddressDetails } from "@lucid-evolution/lucid";

const Blake2b_224Schema = Data.Bytes({ minLength: 28, maxLength: 28 });

export const CredentialSchema = Data.Enum([
  Data.Object({
    PublicKeyCredential: Data.Tuple([Blake2b_224Schema]),
  }),
  Data.Object({
    ScriptCredential: Data.Tuple([
      Data.Bytes({ minLength: 28, maxLength: 28 }),
    ]),
  }),
]);
export type Credential = Data.Static<typeof CredentialSchema>;
export const Credential = CredentialSchema as unknown as Credential;

const PointerSchema = Data.Object({
  Pointer: Data.Tuple([
    Data.Object({
      slotNumber: Data.Integer(),
      transactionIndex: Data.Integer(),
      certificateIndex: Data.Integer(),
    }),
  ]),
});
const InlineSchema = Data.Object({ Inline: Data.Tuple([CredentialSchema]) });

const AddressSchema = Data.Object({
  paymentCredential: CredentialSchema,
  stakeCredential: Data.Nullable(Data.Enum([InlineSchema, PointerSchema])),
});

export type AddressObject = Data.Static<typeof AddressSchema>;
export const AddressObject = AddressSchema as unknown as AddressObject;

const MarketRedeemerEnumSchema = Data.Enum([
  Data.Literal("Buy"),
  Data.Literal("Withdraw"),
]);

type MarketRedeemerEnum = Data.Static<typeof MarketRedeemerEnumSchema>;
export const MarketRedeemerEnum =
  MarketRedeemerEnumSchema as unknown as MarketRedeemerEnum;

//-- Datum schema
const SimpleSaleSchema = Data.Object({
  sellerAddress: AddressSchema,
  priceOfAsset: Data.Integer(),
});

export type SimpleSaleDatum = Data.Static<typeof SimpleSaleSchema>;
export const SimpleSaleDatum = SimpleSaleSchema as unknown as SimpleSaleDatum;

export function fromAddress(address: Address): AddressObject {
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







//-- Datum schema
const SimpleSaleSchemaZero = Data.Object({
  owner: AddressSchema,
  sellerAddress: AddressSchema,
  priceOfAsset: Data.Integer(),
});

export type SimpleSaleDatumZero = Data.Static<typeof SimpleSaleSchemaZero>;
export const SimpleSaleDatumZero = SimpleSaleSchemaZero as unknown as SimpleSaleDatumZero;


const AssetClassSchema = Data.Object({
  policyId: Data.Bytes(),
  tokenName: Data.Bytes()
});

const RewardsSchema = Data.Object({ 
  vestingAsset: AssetClassSchema,
  totalVestingQty: Data.Integer(),
  vestingPeriodStart: Data.Integer(),
  vestingPeriodEnd: Data.Integer(),
  firstUnlockPossibleAfter: Data.Integer(),
  totalInstallments: Data.Integer(),
  treeNumer: Data.Integer()
});

export type RewardsDatum = Data.Static<typeof RewardsSchema>;
export const RewardsDatum = RewardsSchema as unknown as RewardsDatum;


export const VestingRedeemerSchema = Data.Enum([
  Data.Literal("PartialUnlock"),
  Data.Literal("FullUnlock"),
]);
export type VestingRedeemer = Data.Static<typeof VestingRedeemerSchema>;
export const VestingRedeemer =
  VestingRedeemerSchema as unknown as VestingRedeemer;

const OutputReferenceSchema = Data.Object({
  transaction_id: Data.Bytes(),
  output_index: Data.Integer()
});

const MintActionSchema = Data.Enum([
  Data.Literal("Mint"),
  Data.Literal("Burn")
]);

export const MintRedeemerSchema = Data.Object({
  out_ref: OutputReferenceSchema,
  action: MintActionSchema,
  prefix: Data.Bytes(),
  treeNumber: Data.Bytes()
});

export type MintRedeemer = Data.Static<typeof MintRedeemerSchema>;
export const MintRedeemer = MintRedeemerSchema as unknown as MintRedeemer;

export type OutputReference = Data.Static<typeof OutputReferenceSchema>;
export const OutputReference = OutputReferenceSchema as unknown as OutputReference;


const CIP68DatumSchema = Data.Object({
  metadata: Data.Map(Data.Any(), Data.Any()),
  version: Data.Integer(),
});
export type CIP68DatumSchemaType = Data.Static<typeof CIP68DatumSchema>;
export const CIP68Datum = CIP68DatumSchema as unknown as CIP68DatumSchemaType;