import { Far } from '@endo/marshal';
import { AmountMath } from '@agoric/ertp/src/amountMath.js';
import { ZCF_MINT_SAMPLE_OPERATIONS } from '../constants.js';

const { details: X } = assert;

/**
 *
 * @param {ZCF} zcf
 * @param {Object} privateArgs
 * @return {Promise<void>}
 */
const start = async (zcf, privateArgs) => {
  const {
    brands: {
      Price: moolaBrand,
      Asset: quatloosBrand,
    }
  } = zcf.getTerms();

  const { stopAcceptingOffers } = privateArgs;
  if ( stopAcceptingOffers === true ) await zcf.stopAcceptingOffers();

  const { zcfSeat: zoeSamplesSeat } = zcf.makeEmptySeatKit();

  const makeZCFMintSampleInvitation = () => {

    const assertZcfMintSampleOfferArgs = offerArgs => {
      assert(offerArgs, X`offerArgs must be defined.`);
      assert(offerArgs.hasOwnProperty('operation'),
        X`offerArgs must have a "operation" property, found: ${offerArgs}`);
      assert(typeof offerArgs.operation === 'string',
        X`The property "operation" must be of type "string", found: ${typeof offerArgs.operation}`);
      assert(offerArgs.hasOwnProperty('tokenKeyword'),
        X`offerArgs must have a 'tokenKeyword' property, found: ${offerArgs}`);
      assert(offerArgs.hasOwnProperty('valueToMint'),
        X`offerArgs must have a 'valueToMint' property, found: ${offerArgs}`);
      assert(typeof offerArgs.valueToMint === 'bigint',
        X`The property 'valueToMint' must be of type 'bigint', found: ${typeof offerArgs.valueToMint}`);
    };

    /**
     * @type OfferHandler
     */
    const zcfMintSampleOfferHandler = async (testerSeat, offerArgs) => {
      assertZcfMintSampleOfferArgs(offerArgs);
      const {
        operation,
        tokenKeyword,
        valueToMint,
      } = offerArgs;

      const sampleMint = await zcf.makeZCFMint(tokenKeyword);
      const { issuer: sampleIssuer, brand: sampleBrand } = sampleMint.getIssuerRecord();
      console.log('Successfully Created', harden({ sampleIssuer, sampleBrand }));

      sampleMint.mintGains({ [tokenKeyword]: AmountMath.make(sampleBrand, valueToMint) }, zoeSamplesSeat);

      switch (operation) {
        case ZCF_MINT_SAMPLE_OPERATIONS.EXIT_BEFORE_REALLOCATE:
          tryToReallocateAfterExit(testerSeat);
          break;
        case ZCF_MINT_SAMPLE_OPERATIONS.REALLOCATE_WITHOUT_STAGING:
          tryToReallocateWithoutStaging(testerSeat);
          break;
        case ZCF_MINT_SAMPLE_OPERATIONS.REALLOCATE_NORMALLY:
          reallocateNormally(testerSeat, tokenKeyword, sampleBrand);
          break;
        case ZCF_MINT_SAMPLE_OPERATIONS.REALLOCATE_NO_EXIT:
          reallocateNoExit(testerSeat, tokenKeyword, sampleBrand);
          break;
      }

      // This is the offerResult
      return harden({ message: 'Success', brand: sampleBrand, issuer: sampleIssuer });
    };

    return zcf.makeInvitation(zcfMintSampleOfferHandler, 'Test Sample Invitation');
  };

  const tryToReallocateAfterExit = (testerSeat) => {
    // Exit the tester seat before reallocation
    testerSeat.exit();

    // Try to reallocate, should throw
    zcf.reallocate(testerSeat, zoeSamplesSeat);
  };

  const tryToReallocateWithoutStaging = (testerSeat) => {
    // Try to reallocate, should throw
    zcf.reallocate(testerSeat, zoeSamplesSeat);
  };

  const reallocateNormally = (testerSeat, tokenKeyword, sampleBrand) => {
    const {
      give: priceAmountKeywordRecord, // { Price: {brand: moolaBrand, value: 1000n} }
    } = testerSeat.getProposal();
    // Stage Allocations First
    zoeSamplesSeat.incrementBy(
      testerSeat.decrementBy(priceAmountKeywordRecord)
    );

    testerSeat.incrementBy(
      zoeSamplesSeat.decrementBy(harden({ [tokenKeyword]: AmountMath.make(sampleBrand, 1000n) }))
    );

    // Reallocate
    zcf.reallocate(testerSeat, zoeSamplesSeat);

    // Exit the tester seat
    testerSeat.exit();
  };

  const reallocateNoExit = (testerSeat, tokenKeyword, sampleBrand) => {
    const {
      give: priceAmountKeywordRecord,
    } = testerSeat.getProposal();
    // Stage Allocations First
    zoeSamplesSeat.incrementBy(
      testerSeat.decrementBy(priceAmountKeywordRecord)
    );

    testerSeat.incrementBy(
      zoeSamplesSeat.decrementBy(harden({ [tokenKeyword]: AmountMath.make(sampleBrand, 1000n) }))
    );

    // Reallocate
    zcf.reallocate(testerSeat, zoeSamplesSeat);
  };

  const publicFacet = Far('Sample Public Facet', {
    makeZCFMintSampleInvitation,
    getContractInstance: () => zcf.getInstance(),
    getContractTerms: () => zcf.getTerms(),
    getTotalBalance: () => zoeSamplesSeat.getCurrentAllocation(),
    getQuatloosBalance: () => zoeSamplesSeat.getAmountAllocated('Asset', quatloosBrand),
    getMoolaBalance: () => zoeSamplesSeat.getAmountAllocated('Price', moolaBrand),
  });

  const creatorFacet = Far('Sample Creator Facet', {
    helloWorld: () => 'Hello World From Creator Facet',
    shutdown: () => zcf.shutdown(),
  })

  return { publicFacet, creatorFacet };
};

harden(start);
export { start }