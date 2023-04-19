import { test } from '../prepare-test-env-ava.js';
import path from 'path';
import { E } from '@endo/eventual-send';
import bundleSource from '@endo/bundle-source';
import { makeFakeVatAdmin } from '@agoric/zoe/tools/fakeVatAdmin.js';
import { makeZoeKit } from '@agoric/zoe';
import { makeIssuerKit } from '@agoric/ertp/src/issuerKit.js';
import { AmountMath } from '@agoric/ertp/src/amountMath.js';
import { ZCF_MINT_SAMPLE_OPERATIONS } from '../../constants.js';

const filename = new URL(import.meta.url).pathname;
const dirname = path.dirname(filename);

const contractPath = `${dirname}/../../src/zoeSamples.js`;

test.beforeEach('Before', async (t) => {
  const { zoeService } = makeZoeKit(makeFakeVatAdmin().admin);
  const feePurse = E(zoeService).makeFeePurse();
  /** @type ZoeService */
  const zoe = E(zoeService).bindDefaultFeePurse(feePurse);

  // pack the contract
  const bundle = await bundleSource(contractPath);

  // install the contract
  const installation = await E(zoe).install(bundle);

  const quatloosIssuerKit = makeIssuerKit('Queatloos');
  const moolaIssuerKit = makeIssuerKit('Moola');

  const {
    publicFacet,
    creatorFacet,
    instance
  } = await E(zoe).startInstance(
    installation,
    harden({ Asset: quatloosIssuerKit.issuer, Price: moolaIssuerKit.issuer }), // issuerKeywordRecord
    harden({ creatorName: 'Chainboard Academy' }), // terms
    harden({ stopAcceptingOffers: false }), // privateArgs
    );

  t.context = harden({
    zoe,
    quatloosIssuerKit,
    moolaIssuerKit,
    installation,
    publicFacet,
    creatorFacet,
    instance
  });
});

test('initial', async t => {
  t.log(t.context);
  t.truthy(t.context);
});

test('check-zcf-holds-correct-data', async t => {
  const {
    quatloosIssuerKit,
    moolaIssuerKit,
    publicFacet,
    instance,
    zoe,
  } = t.context;

  // Build Expected Terms
  const expectedTerms = harden({
    brands: {
      Asset: quatloosIssuerKit.brand,
      Price: moolaIssuerKit.brand,
    },
    creatorName: 'Chainboard Academy',
    issuers: {
      Asset: quatloosIssuerKit.issuer,
      Price: moolaIssuerKit.issuer,
    }
  });

  const contractInstance = await E(publicFacet).getContractInstance();
  // const contractTerms = await E(publicFacet).getContractTerms();

  const contractTerms = await E(zoe).getTerms(instance);

  t.deepEqual(instance, contractInstance);
  t.deepEqual(expectedTerms, contractTerms);
});

test('no-offer-args', async t => {
  const {
    zoe,
    publicFacet,
  } = t.context;

  // Build offer
  const invitationP = E(publicFacet).makeZCFMintSampleInvitation();

  const userSeat = await E(zoe).offer(
    invitationP,
  );

  await t.throwsAsync(() => E(userSeat).getOfferResult(), { message: 'offerArgs must be defined.' });
});

test('bad-offer-args-no-operation', async t => {
  const {
    zoe,
    publicFacet,
  } = t.context;

  // Build offer
  const invitationP = E(publicFacet).makeZCFMintSampleInvitation();

  const userSeat = await E(zoe).offer(
    invitationP,
    undefined,
    undefined,
    harden({})
  );

  await t.throwsAsync(() => E(userSeat).getOfferResult(), { message: 'offerArgs must have a "operation" property, found: {}' });
});


test('bad-offer-args-operation-number', async t => {
  const {
    zoe,
    publicFacet,
  } = t.context;

  // Build offer
  const invitationP = E(publicFacet).makeZCFMintSampleInvitation();

  const userSeat = await E(zoe).offer(
    invitationP,
    undefined,
    undefined,
    harden({ operation: 3 })
  );

  await t.throwsAsync(() => E(userSeat).getOfferResult(), { message: 'The property "operation" must be of type "string", found: "number"' });
});

test('seat-exit-before-reallocate', async t => {
  const {
    zoe,
    moolaIssuerKit,
    publicFacet,
  } = t.context;

  const priceAmount = AmountMath.make(moolaIssuerKit.brand, 1000n);

  // Build offer
  const invitationP = E(publicFacet).makeZCFMintSampleInvitation();

  const proposal = harden({
    give: { Price: priceAmount },
  });

  const paymemt = harden({
    Price: moolaIssuerKit.mint.mintPayment(priceAmount),
  });

  const offerArgs = harden({
    operation: ZCF_MINT_SAMPLE_OPERATIONS.EXIT_BEFORE_REALLOCATE,
    tokenKeyword: 'Sample',
    valueToMint: 10_000n,
  })

  const userSeat = await E(zoe).offer(
    invitationP,
    proposal,
    paymemt,
    offerArgs,
  );

  await t.throwsAsync(() => E(userSeat).getOfferResult(), { message: 'seat has been exited' });
});

test('reallocate-without-staging', async t => {
  const {
    zoe,
    moolaIssuerKit,
    publicFacet,
  } = t.context;

  const priceAmount = AmountMath.make(moolaIssuerKit.brand, 1000n);

  // Build offer
  const invitationP = E(publicFacet).makeZCFMintSampleInvitation();

  const proposal = harden({
    give: { Price: priceAmount },
  });

  const paymemt = harden({
    Price: moolaIssuerKit.mint.mintPayment(priceAmount),
  });

  const offerArgs = harden({
    operation: ZCF_MINT_SAMPLE_OPERATIONS.REALLOCATE_WITHOUT_STAGING,
    tokenKeyword: 'Sample',
    valueToMint: 10_000n,
  })

  const userSeat = await E(zoe).offer(
    invitationP,
    proposal,
    paymemt,
    offerArgs,
  );

  await t.throwsAsync(() => E(userSeat).getOfferResult(),
    { message: 'Reallocate failed because a seat had no staged allocation. Please add or subtract from the seat and then reallocate.' });
});

test('not-offerSafe', async t => {
  const {
    zoe,
    quatloosIssuerKit,
    moolaIssuerKit,
    publicFacet,
  } = t.context;

  const priceAmount = AmountMath.make(moolaIssuerKit.brand, 1000n);

  // Build offer
  const invitationP = E(publicFacet).makeZCFMintSampleInvitation();

  const proposal = harden({
    give: { Price: priceAmount },
    want: { Asset: AmountMath.make(quatloosIssuerKit.brand, 200n) }
  });

  const paymemt = harden({
    Price: moolaIssuerKit.mint.mintPayment(priceAmount),
  });

  const offerArgs = harden({
    operation: ZCF_MINT_SAMPLE_OPERATIONS.REALLOCATE_NORMALLY,
    tokenKeyword: 'Sample',
    valueToMint: 10_000n,
  })

  const userSeat = await E(zoe).offer(
    invitationP,
    proposal,
    paymemt,
    offerArgs,
  );

  await t.throwsAsync(() => E(userSeat).getOfferResult(),
    { message: 'Offer safety was violated by the proposed allocation: {"Asset":{"brand":"[Alleged: Queatloos brand]","value":"[0n]"},"Price":{"brand":"[Alleged: Moola brand]","value":"[0n]"},"Sample":{"brand":"[Alleged: Sample brand]","value":"[1000n]"}}. Proposal was {"exit":{"onDemand":null},"give":{"Price":{"brand":"[Alleged: Moola brand]","value":"[1000n]"}},"want":{"Asset":{"brand":"[Alleged: Queatloos brand]","value":"[200n]"}}}' });
});

test('no-exit-no-payout', async t => {
  const {
    zoe,
    moolaIssuerKit,
    publicFacet,
  } = t.context;

  const priceAmount = AmountMath.make(moolaIssuerKit.brand, 1000n);

  // Build offer
  const invitationP = E(publicFacet).makeZCFMintSampleInvitation();

  const proposal = harden({
    give: { Price: priceAmount },
  });

  const paymemt = harden({
    Price: moolaIssuerKit.mint.mintPayment(priceAmount),
  });

  const offerArgs = harden({
    operation: ZCF_MINT_SAMPLE_OPERATIONS.REALLOCATE_NO_EXIT,
    tokenKeyword: 'Sample',
    valueToMint: 10_000n,
  })

  const userSeat = await E(zoe).offer(
    invitationP,
    proposal,
    paymemt,
    offerArgs,
  );

  const offerResult = await E(userSeat).getOfferResult();
  t.deepEqual(offerResult.message, 'Success');

  await t.throwsAsync(() => E(userSeat).getPayout('Sample'))
});

test('exit-get-payout', async t => {
  // Check Balances
  const {
    zoe,
    quatloosIssuerKit,
    moolaIssuerKit,
    publicFacet,
  } = t.context;

  const priceAmount = AmountMath.make(moolaIssuerKit.brand, 1000n);

  // Build offer
  const invitationP = E(publicFacet).makeZCFMintSampleInvitation();

  const proposal = harden({
    give: { Price: priceAmount },
  });

  const paymemt = harden({
    Price: moolaIssuerKit.mint.mintPayment(priceAmount),
  });

  const offerArgs = harden({
    operation: ZCF_MINT_SAMPLE_OPERATIONS.REALLOCATE_NORMALLY,
    tokenKeyword: 'Sample',
    valueToMint: 10_000n,
  })

  const userSeat = await E(zoe).offer(
    invitationP,
    proposal,
    paymemt,
    offerArgs,
  );

  const offerResult = await E(userSeat).getOfferResult();
  const payout = await E(userSeat).getPayout('Sample'); // zoeSeat.js line 34

  t.deepEqual(offerResult.message, 'Success');
  t.log(payout);

  const [totalBalance, quatloosBalance, moolaBalance] = await Promise.all([
    E(publicFacet).getTotalBalance(),
    E(publicFacet).getQuatloosBalance(),
    E(publicFacet).getMoolaBalance(),
  ]);

  t.log(totalBalance);
  t.log(quatloosBalance);
  t.log(moolaBalance);

  t.deepEqual(totalBalance.Sample, AmountMath.make(offerResult.brand, 9_000n)); // offerArgs.valueToMint - 1k
  t.deepEqual(quatloosBalance, AmountMath.makeEmpty(quatloosIssuerKit.brand));
  t.deepEqual(moolaBalance, priceAmount);

  const payoutAmount = await E(offerResult.issuer).getAmountOf(payout);
  t.deepEqual(AmountMath.make(offerResult.brand, 1000n), payoutAmount);
});

test('invitation-compare-details', async t => {
  const {
    zoe,
    publicFacet,
    instance,
    installation,
  } = t.context;

  const invitationP = E(publicFacet).makeZCFMintSampleInvitation();
  const {
    description: invitationDescription,
    installation: invitationInstallation,
    instance: invitationInstance,
  } = await E(zoe).getInvitationDetails(invitationP);

  t.log({ invitationDescription, invitationInstallation, invitationInstance });

  t.deepEqual(invitationDescription, 'Test Sample Invitation');
  t.deepEqual(invitationInstallation, installation);
  t.deepEqual(invitationInstance, instance);
});

test('stop-accepting-offers', async t => {
  const {
    zoe,
    quatloosIssuerKit,
    moolaIssuerKit,
    installation,
  } = t.context;

  // Start the contract with 'stopAcceptingOffers' set to true
  const {
    publicFacet,
  } = await E(zoe).startInstance(
    installation,
    harden({ Asset: quatloosIssuerKit.issuer, Price: moolaIssuerKit.issuer }), // issuerKeywordRecord
    harden({ creatorName: 'Chainboard Academy' }), // terms
    harden({ stopAcceptingOffers: true }), // privateArgs
  );

  // Try to make an offer, should throw
  const invitationP = E(publicFacet).makeZCFMintSampleInvitation();
  await t.throwsAsync(() => E(zoe).offer(invitationP), { message: 'No further offers are accepted' });
});

test('shutdown-contract', async t => {
  const {
    zoe,
    creatorFacet,
    publicFacet
  } = t.context;

  // Only creator can invoke shutdown
  await E(creatorFacet).shutdown();

  // Try to make an offer, should throw
  const invitationP = E(publicFacet).makeZCFMintSampleInvitation();
  await t.throwsAsync(() => E(zoe).offer(invitationP), { message: 'No further offers are accepted' });
});
