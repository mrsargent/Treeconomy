pvalidateVestingPartialUnlock = phoistAcyclic $ plam $ \datum ctx -> unTermCont $ do
  ctxF <- pletFieldsC @'["txInfo", "purpose"] ctx               --parsing out txinfo and purpose
  txInfoF <- pletFieldsC @'["outputs", "inputs", "signatories", "validRange"] ctxF.txInfo  -- parsing out txinfo
  PSpending ((pfield @"_0" #) -> ownRef) <- pmatchC ctxF.purpose  --making sure it is a spending contract

  PJust ownVestingInput <- pmatchC $ pfindOwnInput # txInfoF.inputs # ownRef  
  ownVestingInputF <- pletFieldsC @'["address", "value", "datum"] (pfield @"resolved" # ownVestingInput)  -- not sure what's goin on here I think it's an input but looks like an output
  PScriptCredential ((pfield @"_0" #) -> ownValHash) <- pmatchC (pfield @"credential" # ownVestingInputF.address)   -- ???I believe it is looking at ownInput? based on ownRef?

  ownVestingOutput <- pletC $ pheadSingleton #$ pfindOutputsToAddress # txInfoF.outputs # ownVestingInputF.address  
  ownVestingOutputF <- pletFieldsC @'["address", "value", "datum"] ownVestingOutput -- decontructing output 

  datumF <-
    pletFieldsC
      @'[ "beneficiary"
        , "vestingAsset"
        , "totalVestingQty"
        , "vestingPeriodStart"
        , "vestingPeriodEnd"
        , "firstUnlockPossibleAfter"
        , "totalInstallments"
        ]
      datum

  vestingAsset <- pletC $ ptoScottEncoding # datumF.vestingAsset  -- I guess parsing out the AssetClass?
  currentTimeApproximation <- pletC $ pfromData $ pto $ pgetLowerInclusiveTimeRange # txInfoF.validRange  -- get current time Validity range = Interval<Int>

  oldRemainingQty <- pletC $ passetClassValueOf # vestingAsset # ownVestingInputF.value  -- somehow getting the old remaining value from input
  newRemainingQty <- pletC $ passetClassValueOf # vestingAsset # ownVestingOutputF.value   -- somehow getting the new remaining value from output
  vestingPeriodLength <- pletC $ (pfromData datumF.vestingPeriodEnd) - (pfromData datumF.vestingPeriodStart) -- find how long each time vesting interval is 
  vestingTimeRemaining <- pletC $ (pfromData datumF.vestingPeriodEnd) - (currentTimeApproximation)  -- find how much time is remaing
  timeBetweenTwoInstallments <- pletC $ pdivCeil # vestingPeriodLength # datumF.totalInstallments
  futureInstallments <- pletC $ pdivCeil # (vestingTimeRemaining) # (timeBetweenTwoInstallments)

  let expectedRemainingQty = pdivCeil # (futureInstallments * datumF.totalVestingQty) #$ datumF.totalInstallments

  PPubKeyCredential ((pfield @"_0" #) -> beneficiaryHash) <- pmatchC (pfield @"credential" # datumF.beneficiary)

  pguardC "Missing beneficiary signature" (ptxSignedBy # txInfoF.signatories # beneficiaryHash)
  pguardC "Unlock not permitted until firstUnlockPossibleAfter time" (datumF.firstUnlockPossibleAfter #< currentTimeApproximation)
  pguardC "Zero remaining assets not allowed" (0 #< newRemainingQty)
  pguardC "Remaining asset exceed old asset" (newRemainingQty #< oldRemainingQty)
  pguardC "Mismatched remaining asset" (expectedRemainingQty #== newRemainingQty)
  pguardC "Datum Modification Prohibited" (ownVestingInputF.datum #== ownVestingOutputF.datum)
  pguardC "Double satisfaction" (pcountInputsAtScript # ownValHash # txInfoF.inputs #== 1)
  pure $ pconstant ()



pvalidateVestingFullUnlock :: Term s (PVestingDatum :--> PScriptContext :--> PUnit)
pvalidateVestingFullUnlock = phoistAcyclic $ plam $ \datum context -> unTermCont $ do
  datumF <- tcont $ pletFields @'["beneficiary", "vestingPeriodEnd"] datum
  txInfoF <- tcont $ pletFields @'["signatories", "validRange"] $ pfield @"txInfo" # context
  currentTimeApproximation <- pletC $ pfromData $ pto $ pgetLowerInclusiveTimeRange # txInfoF.validRange
  PPubKeyCredential ((pfield @"_0" #) -> beneficiaryHash) <- pmatchC (pfield @"credential" # datumF.beneficiary)

  pguardC "Missing beneficiary signature" (ptxSignedBy # txInfoF.signatories # beneficiaryHash)
  pguardC "Unlock not permitted until vestingPeriodEnd time" (datumF.vestingPeriodEnd #< currentTimeApproximation)
  pure $ pconstant ()