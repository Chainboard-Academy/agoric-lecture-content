/* eslint-disable import/order -- https://github.com/endojs/endo/issues/1235 */
import { test } from '../prepare-test-env-ava.js';

import { AmountMath, makeIssuerKit, AssetKind } from '@agoric/ertp';

test('ertp guide issuers and mints makeIssuerKit', async t => {
  // #region makeIssuerKit
  const {
    issuer: quatloosIssuer,
    mint: quatloosMint,
    brand: quatloosBrand,
  } = makeIssuerKit('quatloos');
  // This is merely an amount, describing assets.
  // It does not create new assets.
  const quatloos2 = AmountMath.make(quatloosBrand, 2n);
  // Non-fungible asset, which needs an AssetKind
  // of AssetKind.SET
  const { mint: titleMint, issuer: titleIssuer } = makeIssuerKit(
    'alamedaCountyPropertyTitle',
    AssetKind.SET,
  );
  // #endregion makeIssuerKit

  t.truthy(quatloosIssuer);
  t.truthy(quatloosMint);
  t.truthy(quatloosBrand);
  t.deepEqual(quatloos2, { brand: quatloosBrand, value: 2n }); // Amount data structure
  t.truthy(titleMint);
  t.truthy(titleIssuer);
});

test('ertp guide issuers and mints getBrand', async t => {
  // #region getBrand
  const { issuer: quatloosIssuer, brand: quatloosBrand } = makeIssuerKit(
    'quatloos',
  );
  // myQuatloosBrand === quatloosBrand
  const myQuatloosBrand = quatloosIssuer.getBrand(); // one-to-one relationship
  // #endregion getBrand

  t.is(quatloosBrand, myQuatloosBrand);
});

test('ertp guide issuers and mints getAllegedName', async t => {
  // #region getAllegedName
  const { issuer: quatloosIssuer } = makeIssuerKit('quatloos');
  const quatloosIssuerAllegedName = quatloosIssuer.getAllegedName();
  // quatloosIssuerAllegedName === 'quatloos'
  // #endregion getAllegedName
  t.is(quatloosIssuerAllegedName, 'quatloos');
});

test('ertp guide issuers and mints getAssetKind', async t => {
  // #region getAssetKind
  const { issuer: quatloosIssuer } = makeIssuerKit('quatloos', AssetKind.COPY_SET);
  const kind = quatloosIssuer.getAssetKind(); // 'nat', the default value for makeIssuerKit()
  // #endregion getAssetKind
  t.is(kind, 'copySet');
});

test('ertp guide issuers and mints makeEmptyPurse', async t => {
  // #region makeEmptyPurse
  const { issuer: quatloosIssuer } = makeIssuerKit('quatloos');
  // The new empty purse contains 0 Quatloos
  const quatloosPurse = quatloosIssuer.makeEmptyPurse();
  // #endregion makeEmptyPurse
  t.deepEqual(await quatloosPurse.getCurrentAmount(), {
    brand: quatloosIssuer.getBrand(),
    value: 0n,
  });
});

test('ertp guide issuers and mints mint.getIssuer', async t => {
  // #region mintGetIssuer
  const { issuer: quatloosIssuer, mint: quatloosMint } = makeIssuerKit(
    'quatloos',
  );
  const quatloosMintIssuer = quatloosMint.getIssuer();
  // returns true
  const sameIssuer = quatloosIssuer === quatloosMintIssuer;
  // #endregion mintGetIssuer
  t.truthy(sameIssuer);
});

test('ertp guide issuers and mints mint.mintPayment', async t => {
  // #region mintMintPayment
  const { mint: quatloosMint, brand: quatloosBrand } = makeIssuerKit(
    'quatloos',
  );
  const quatloos1000 = AmountMath.make(quatloosBrand, 1000n);
  const newPayment = quatloosMint.mintPayment(quatloos1000);
  // #endregion mintMintPayment

  const issuer = quatloosMint.getIssuer();
  t.truthy(issuer.isLive(newPayment));
});

test('ertp guide issuers and mints payment methods', async t => {
  const {
    issuer: quatloosIssuer,
    brand: quatloosBrand,
    mint: quatloosMint,
  } = makeIssuerKit('quatloos');

  // #region getAmountOf
  const quatloosPayment = quatloosMint.mintPayment(
    AmountMath.make(quatloosBrand, 100n),
  );
  // returns an amount with a value of 100 and the quatloos brand
  const quatloosAmountMinted = await quatloosIssuer.getAmountOf(quatloosPayment);
  t.deepEqual(
    AmountMath.make(quatloosBrand, 100n),
    quatloosAmountMinted);
  // #endregion getAmountOf

  // #region burn
  const amountToBurn = AmountMath.make(quatloosBrand, 10n);
  const paymentToBurn = quatloosMint.mintPayment(amountToBurn);
  // Try to burn wrong payment, should throw
  const burnWrongAmountP = quatloosIssuer.burn(paymentToBurn, AmountMath.make(quatloosBrand, 9n));
  await t.throwsAsync(() => burnWrongAmountP);
  t.truthy(await quatloosIssuer.isLive(paymentToBurn));
  // burntAmount is 10 quatloos
  const burntAmount = await quatloosIssuer.burn(paymentToBurn, amountToBurn);
  t.deepEqual(burntAmount, amountToBurn);
  t.falsy(await quatloosIssuer.isLive(paymentToBurn));
  // #endregion burn

  // #region claim
  const amountToTransfer = AmountMath.make(quatloosBrand, 2n);
  const originalPayment = quatloosMint.mintPayment(amountToTransfer);
  const newPayment = await quatloosIssuer.claim(
    originalPayment,
    amountToTransfer,
  );
  // #endregion claim
  t.deepEqual(await quatloosIssuer.getAmountOf(newPayment), amountToTransfer);
  t.not(originalPayment, newPayment);

  // #region combine
  // create an array of 100 payments of 1 unit each
  // payments = [payment1, payment2, ....., payment100]
  const payments = [];
  for (let i = 0; i < 100; i += 1) {
    payments.push(quatloosMint.mintPayment(AmountMath.make(quatloosBrand, 1n)));
  }
  // combinedPayment equals 100
  const combinedPayment = quatloosIssuer.combine(harden(payments));
  // #endregion combine

  t.deepEqual(await quatloosIssuer.getAmountOf(combinedPayment), {
    brand: quatloosBrand,
    value: 100n,
  });

  // #region split
  const oldPayment = quatloosMint.mintPayment(
    AmountMath.make(quatloosBrand, 30n),
  );
  const [paymentA, paymentB] = await quatloosIssuer.split(
    oldPayment,
    AmountMath.make(quatloosBrand, 10n),
  );
  // paymentA is 10 quatloos, payment B is 20 quatloos.
  // #endregion split
  const paymentAAmount = await quatloosIssuer.getAmountOf(paymentA);
  const paymentBAmount = await quatloosIssuer.getAmountOf(paymentB);
  t.deepEqual(paymentAAmount, AmountMath.make(quatloosBrand, 10n));
  t.deepEqual(paymentBAmount, AmountMath.make(quatloosBrand, 20n));

  // #region splitMany
  // #region splitManyConcise
  const oldQuatloosPayment = quatloosMint.mintPayment(
    AmountMath.make(quatloosBrand, 100n),
  );
  const goodQuatloosAmounts = Array(10).fill(
    AmountMath.make(quatloosBrand, 10n),
  );

  const arrayOfNewPayments = await quatloosIssuer.splitMany(
    oldQuatloosPayment,
    harden(goodQuatloosAmounts),
  );
  // #endregion splitManyConcise
  // Note that the total amount in the amountArray must equal the
  // amount in the original payment, in the above case, 100 Quatloos in each.

  const anotherQuatloosPayment = quatloosMint.mintPayment(
    AmountMath.make(quatloosBrand, 1000n),
  );
  // total amounts in badQuatloosAmounts equal 20, when it should equal 1000
  const badQuatloosAmounts = Array(2).fill(AmountMath.make(quatloosBrand, 10n));
  // throws error
  t.throwsAsync(
    () =>
      quatloosIssuer.splitMany(
        anotherQuatloosPayment,
        harden(badQuatloosAmounts),
      ),
    { message: /rights were not conserved/ },
  );
  // #endregion splitMany

  t.is(arrayOfNewPayments.length, 10);
  t.deepEqual(await quatloosIssuer.getAmountOf(arrayOfNewPayments[0]), {
    value: 10n,
    brand: quatloosBrand,
  });

  const payment = quatloosMint.mintPayment(
    AmountMath.make(quatloosBrand, 100n),
  );
  // #region isLive
  const isItLive = quatloosIssuer.isLive(payment);
  // #endregion isLive
  t.truthy(isItLive);

  // #region getIssuer
  const quatloosMintIssuer = quatloosMint.getIssuer();
  // returns true
  const sameIssuer = quatloosIssuer === quatloosMintIssuer;
  // #endregion

  t.truthy(sameIssuer);

  // #region isMyIssuer
  const isIssuer = quatloosBrand.isMyIssuer(quatloosIssuer);
  // #endregion isMyIssuer

  t.truthy(isIssuer);
});

test('ertp guide amountMath', async t => {
  const {
    brand: quatloosBrand,
  } = makeIssuerKit('quatloos');

  const {
    brand: moolaBrand,
  } = makeIssuerKit('moola');

  // REGION_COERCE
  const quatloosCoerceSampleAmount = AmountMath.make(quatloosBrand, 100n);
  t.deepEqual(quatloosCoerceSampleAmount, AmountMath.coerce(quatloosBrand, quatloosCoerceSampleAmount));
  t.throws(() => AmountMath.coerce(moolaBrand, quatloosCoerceSampleAmount));
  // END_REGION_COERCE

  // REGION_GET_VALUE
  const quatloosGetValSampleAmount = AmountMath.make(quatloosBrand, 200n);
  t.is(AmountMath.getValue(quatloosBrand, quatloosGetValSampleAmount), 200n);
  t.not(AmountMath.getValue(quatloosBrand, quatloosGetValSampleAmount), 100n);
  t.throws(() => AmountMath.getValue(moolaBrand, quatloosGetValSampleAmount));
  // END_REGION_GET_VALUE

  // REGION_MAKE_EMPTY
  const quatloosRefAmount = AmountMath.make(quatloosBrand, 500n);
  const quatloosEmpty = AmountMath.makeEmpty(quatloosBrand);
  const quatloosEmptyFrom = AmountMath.makeEmptyFromAmount(quatloosRefAmount);

  t.not(AmountMath.isEmpty(quatloosRefAmount));
  t.truthy(AmountMath.isEmpty(quatloosEmpty));
  t.truthy(AmountMath.isEmpty(quatloosEmptyFrom));

  t.is(AmountMath.getValue(quatloosBrand, quatloosEmptyFrom), 0n);
  // END_REGION_MAKE_EMPTY

  // REGION_IS_GTE
  const quatloosCompare100 = AmountMath.make(quatloosBrand, 100n);
  const quatloosCompare50 = AmountMath.make(quatloosBrand, 50n);

  t.truthy(AmountMath.isGTE(quatloosCompare100, quatloosCompare50));
  t.not(AmountMath.isGTE(quatloosCompare50, quatloosCompare100));
  t.throws(() => AmountMath.isGTE(quatloosCompare100, quatloosCompare50, moolaBrand));
  // END_REGION_IS_GTE

  // REGION_ADD_SUBSTRACT
  const quatloosAddSubstract213 = AmountMath.make(quatloosBrand, 213n);
  const quatloosAddSubstract7 = AmountMath.make(quatloosBrand, 7n);
  const moola18 = AmountMath.make(moolaBrand, 18n);

  const quatloosAddResult = AmountMath.add(quatloosAddSubstract213, quatloosAddSubstract7);
  const quatloosSubResult = AmountMath.subtract(quatloosAddSubstract213, quatloosAddSubstract7);

  t.deepEqual(quatloosAddResult, AmountMath.make(quatloosBrand, 220n));
  t.deepEqual(quatloosSubResult, AmountMath.make(quatloosBrand, 206n));
  t.throws(() => AmountMath.add(quatloosAddSubstract213, moola18));
  t.throws(() => AmountMath.subtract(quatloosAddSubstract213, moola18));
  // END_REGION_ADD_SUBSTRACT

  // REGION_MIN_MAX
  const quatloosMinMax200 = AmountMath.make(quatloosBrand, 200n);
  const quatloosMinMax150 = AmountMath.make(quatloosBrand, 150n);

  t.deepEqual(quatloosMinMax200, AmountMath.max(quatloosMinMax200, quatloosMinMax150));
  t.deepEqual(quatloosMinMax150, AmountMath.min(quatloosMinMax200, quatloosMinMax150));
  t.throws(() => AmountMath.max(quatloosMinMax200, quatloosMinMax150, moolaBrand));
  t.throws(() => AmountMath.min(quatloosMinMax200, quatloosMinMax150, moolaBrand));
  // END_REGION_MIN_MAX

});