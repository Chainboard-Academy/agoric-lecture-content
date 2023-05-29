# Lecture Eight - Agoric pre-built contracts & Price Authority

## Table of Content

- Pre-built contracts
    - Funded Call Spread
    - Simple Exchange
- Price Authority
    - Price Quote
    - Price Quote Notifier
    - Instant Price Quotes
        - quoteGiven
        - quoteWanted
    - Promise Price Quote
        - quoteWhen
        - mutableQuoteWhen
    - Manual Price Authority

## Agoric pre-built contracts
 
Agoric has a list list of available [Agoric pre-built contracts](https://github.com/Agoric/documentation/blob/24b31f8e49cc67d05e229992103bbecc0b2e5ead/main/guides/zoe/contracts/README.md), created to help developers building their applications. These contracts should be instantiated through a host contract, by taking advantage of Agoric `high-order` features.
We advise you to review [Lecture four](...) for more detail on high-order contracts.

We have selected two contracts from two different packages to demonstrate their utility and how to interact with them.

## Funded Call Spread

The `fundedCallSpread` contract, from the `DeFi package`, implements a fully collateralized call spread.
In a `call spread`, an investor buys one `call option` (referred to as the "long call") with a `lower strike price` and sells another call option (referred to as the "short call") with a `higher strike price`. The difference in the strike prices creates a `spread`, and the goal of the strategy is to profit from the difference between the two strikes. The long call provides limited upside potential, while the short call generates income and helps to offset the cost of the long call. The two options sold and bought in a call spread must have the same `expiration date`.

A `call option` is a financial contract that gives the holder the right, but *not* the obligation, to buy an underlying asset (such as a stock, commodity, or currency) at a specified price (strike price) within a specified time period. Call options are used as a form of investment and speculation, as well as for hedging purposes. If the price of the underlying asset rises above the strike price, the holder of the call option may choose to exercise the option and buy the asset at the lower strike price, resulting in a profit. If the price does not rise above the strike price, the option will expire worthless and the holder will lose the premium paid for the option. 

For more detail, we advise reading the:

- [Documentation](https://github.com/Agoric/documentation/blob/24b31f8e49cc67d05e229992103bbecc0b2e5ead/main/guides/zoe/contracts/fundedCallSpread.md)
- [Contract code](https://github.com/Agoric/agoric-sdk/blob/4e0aece631d8310c7ab8ef3f46fad8981f64d208/packages/zoe/src/contracts/callSpread/fundedCallSpread.js)
- [Contract test](https://github.com/Agoric/agoric-sdk/blob/4e0aece631d8310c7ab8ef3f46fad8981f64d208/packages/zoe/test/unitTests/contracts/test-callSpread.js)
- [Call Spread video](https://www.youtube.com/watch?v=m5Pf2d1tHCs&t=3989s)

Let's use the test below, [fundedCallSpread below Strike1](https://github.com/Agoric/agoric-sdk/blob/4e0aece631d8310c7ab8ef3f46fad8981f64d208/packages/zoe/test/unitTests/contracts/test-callSpread.js#L37), to exemplify how to interact with the fundedCallSpread contract.
Assuming that you have access to the fundedCallSpread contract `installation` in your host contract, the arguments required to call the `startInstance` function are the `issuerKeywordRecord` and `terms`.

```js
const { creatorInvitation } = await E(zoe).startInstance(
  installation,
  issuerKeywordRecord,
  terms
);
```

The issuerKeywordRecord will specify the `Issuer` of the `Underlying, Collateral and Strike assets`.
The Underlying and Collateral can have the same Issuer and the Strike a different one, or you can have three different Issuers, depending on the context of your application.
The Issuer of the `priceAuthority` of the underlying/strike pair is also included in the issuerKeywordRecord.

```js
const issuerKeywordRecord = harden({
  Underlying: simoleanIssuer,
  Collateral: bucksIssuer,
  Strike: moolaIssuer,
  Quote: await E(priceAuthority).getQuoteIssuer(
    brands.get("simoleans"),
    brands.get("moola")
  ),
});
```

As for the `terms`, they include the:

- `expiration`: time which defines when the call option can be exercised.
- `priceAuthority`: which will issue a PriceQuote, after the deadline, giving the value of the underlying asset in the strike currency.
- `underlyingAmount`: asset which price is being tracked.
- `strikePrice1` and `strikePrice2`: values defined as short and long, respectively.
- `settlementAmount`: the collateral amount deposited by the funder and split between the holders of the options.
- `timer`: recognized by the `priceAuthority`.

```js
const terms = harden({
  expiration: 2n,
  underlyingAmount: simoleans(2n),
  priceAuthority,
  strikePrice1: moola(60n),
  strikePrice2: moola(100n),
  settlementAmount: bucks(300n),
  timer: manualTimer,
});
```

The host contract, will then make an `offer` to the fundedCallSpread to get in return the two options, `LongOption` and `ShortOption`.
To build the offer, along with the `creatorInvitation`, returned when we called the startInstance(), we also required the `Proposal` and `Payment`.

```js
const aliceSeat = await E(zoe).offer(
  creatorInvitation,
  aliceProposal,
  alicePayments
);
```

The creatorInvitation returns, along with the invitation for `makeFundedPairInvitation` function, a `custom object`, that can get accessed with the method `getInvitationDetails`, which is the defined options longAmount and shortAmount. 
These values will be used in the offer proposal as the `want` property. Regarding the `give` property, it consists of the value defined as `settlementAmount` in the contract terms.

```js
const invitationDetail = await E(zoe).getInvitationDetails(creatorInvitation);
const longOptionAmount = invitationDetail.longAmount;
const shortOptionAmount = invitationDetail.shortAmount;

const aliceProposal = harden({
  want: { LongOption: longOptionAmount, ShortOption: shortOptionAmount },
  give: { Collateral: bucks(300n) },
});
```

The offer `payment`, as usual, is a minted payment of the amount defined in the `give` property of the offer proposal. In this case, the call spread `collateral`.

```js
const aliceBucksPayment = bucksMint.mintPayment(bucks(300n));
const alicePayments = { Collateral: aliceBucksPayment };
```

When the offer is made, a payout is returned containing the two option positions.
The positions are invitations that can be exercised for free, and provide the option payouts under the keyword Collateral.

```js
const { LongOption, ShortOption } = await aliceSeat.getPayouts();
```

These two invitations can be managed by your host contract, allowing you to build many different financial instruments, depending on the context of your application.

## Simple Exchange

The `simpleExchange` contract, from the `Generic Sales/Trading Contracts package`, is a basic exchange for trading one asset using a second asset as its price. 
The `order book` are two simple lists that the contract searches through for matching `selling` with `buying` orders when a new one is made. Anyone can create or fill orders, and there is a notification system to see the current list of orders.

For more detail, we advise reading the:

- [documentation](https://github.com/Agoric/documentation/blob/24b31f8e49cc67d05e229992103bbecc0b2e5ead/main/guides/zoe/contracts/simple-exchange.md)
- [Contract code](https://github.com/Agoric/agoric-sdk/blob/f29591519809dbadf19db0a26f38704d87429b89/packages/zoe/src/contracts/simpleExchange.js)
- [Contract test](https://github.com/Agoric/agoric-sdk/blob/4e0aece631d8310c7ab8ef3f46fad8981f64d208/packages/zoe/test/unitTests/contracts/test-simpleExchange.js)

Let's use the test below, [simpleExchange with valid offers](https://github.com/Agoric/agoric-sdk/blob/4e0aece631d8310c7ab8ef3f46fad8981f64d208/packages/zoe/test/unitTests/contracts/test-simpleExchange.js#L20), to exemplify how to interact with the simpleExchange contract.
Unlike the fundedCallSpread contract, the simpleExchange requires no terms as an argument for the `startIntance` function, regarding the `issuerKeyword`, they are `Asset` and `Price`.

```js
const { publicFacet, instance } = await E(zoe).startInstance(installation, {
  Asset: moolaIssuer,
  Price: simoleanIssuer,
});
```

When called the starInstance, it will return the SimpleExchange contract `publicFacet` and `instance`.
The publicFacet exposes two functions:
- makeInvitation: makeExchangeInvitation,
- getNotifier: () => notifier

By calling the `makeInvitation()`, the host contract can access the `aliceInvitation`, required to build the offer.

```js
const aliceSeat = await E(zoe).offer(
  aliceInvitation,
  aliceSellOrderProposal,
  alicePayments
);
```

If we want to build a `sell offer`, the give property will specify the `Asset` we are willing to sell and the want property will have the `Price` we want in return.
The `payment` will be the respective amount of the Asset described in the proposal.

```js
const aliceSellOrderProposal = harden({
  give: { Asset: moola(3n) },
  want: { Price: simoleans(4n) },
  exit: { onDemand: null },
});
const alicePayments = { Asset: aliceMoolaPayment };
```

If you wish to make a `buy offer`, the structure of the proposal will be the `opposite` of the above, meaning that the give and want would have the Price and Asset respectably.

```js
const bobBuyOrderProposal = harden({
  give: { Price: simoleans(7n) },
  want: { Asset: moola(3n) },
  exit: { onDemand: null },
});
const bobPayments = { Price: bobSimoleanPayment };
```

The `getNotifier` method of the publicFacet returns a notifier with two attributes, a `value` and a `updateCount`.
The value has two arrays, a list of buy offers and a list of sell offers.
It is updated every time a new offer is made or two offers match.

```js
  const part1 = E(aliceNotifier)
    .getUpdateSince()
    .then(({ value: afterAliceOrders, updateCount: afterAliceCount }) => {
      t.deepEqual(
        afterAliceOrders,
        {
          buys: [],
          sells: [
            {
              want: aliceSellOrderProposal.want,
              give: aliceSellOrderProposal.give,
            },
          ],
        },
        `order notifier is updated with Alice's sell order`,
      );
```

This contract can be useful if you wish to implement a simple logic for allowing the contract users to trade assets, although it is important to remember that there are more optimized ways to do it, like an [auction](https://github.com/Agoric/documentation/blob/24b31f8e49cc67d05e229992103bbecc0b2e5ead/main/guides/zoe/contracts/second-price-auction.md) for example.


## Price Authority

A `PriceAuthority` is an object that mints `PriceQuotes` and handles triggers and notifiers for changes in the price.

## Price Quote

A price quote is the price of one asset in comparison with another asset. These quotes always involve asset pairs because you are buying one by selling another. For example, the price of 1 Euro may cost 1.2 Dollar when viewing the EUR/USD currency pair.

A [PriceQuote](https://github.com/Agoric/agoric-sdk/blob/b36fcb2d832ec154019cb6ae0a5dda17f94207eb/packages/zoe/src/contractSupport/priceQuote.js) in Agoric context is an object with two properties:

- `quoteAmount`: An `Amount` whose value is a `PriceQuoteValue`.
- `quotePayment`: The `quoteAmount` wrapped as a `Payment`. It is either an `ERef<Payment>` or `null`.

The `quoteAmount` describes a price available at a particular time. So that price can be shared by recipients with others, its associated `quotePayment` is the same value wrapped as a payment from the `QuoteIssuer`.

A `PriceQuoteValue` is the `Value` part of a `quoteAmount`. Its properties are:

- `amountIn` `{ Amount }`: The amount supplied to a trade
- `amountOut` `{ Amount }`: The quoted result of trading `amountIn`
- `timer` `{ TimerService }`: The service that gave the `timestamp`
- `timestamp` `{ Timestamp }`: A timestamp according to `timer` for the quote
- `conditions` `{ any= }`: Additional conditions for the quote

For more detail, see:

- [PriceAuthority Zoe documentation](https://github.com/Agoric/documentation/blob/main/main/guides/zoe/price-authority.md)
- [PriceAuthority REPL documentation](https://github.com/Agoric/documentation/blob/main/main/guides/zoe/price-authority.md)
- [PriceAuthority Methods](https://github.com/Agoric/documentation/blob/main/main/reference/zoe-api/contract-support/price-authority.md)

## Price Quote Notifier

The [makeQuoteNotifier](https://github.com/Agoric/agoric-sdk/blob/b36fcb2d832ec154019cb6ae0a5dda17f94207eb/packages/zoe/src/contractSupport/priceAuthority.js#L244) function creates a `quote notifier` which wraps an underlying notifier. The purpose of the quote notifier is to provide a stream of price quotes, of the ratio between two assets, that are updated over time.

The makeQuoteNotifier() takes two parameters: `amountIn` and `brandOut`. The amountIn brand and brandOut are checked to ensure that the pair is supported by using the assertBrands function.

The `getUpdateSince` method of the underlying notifier is then overridden to generate a new "quote" each time the method is called. The quote is created using the `createQuote` function and passed to the quote constant. The method returns a new record containing the value of the quote and the updated count.

Finally, a new notifier object is created and returned, with methods and properties of `specificBaseNotifier`.

```js
makeQuoteNotifier(amountIn, brandOut) {
      AmountMath.coerce(actualBrandIn, amountIn);
      assertBrands(amountIn.brand, brandOut);

      // Wrap our underlying notifier with specific quotes.
      const specificBaseNotifier = harden({
        async getUpdateSince(updateCount = undefined) {
          // We use the same updateCount as our underlying notifier.
          const record = await E(notifier).getUpdateSince(updateCount);

          // We create a quote inline.
          const quote = createQuote(calcAmountOut => ({
            amountIn,
            amountOut: calcAmountOut(amountIn),
          }));
          assert(quote);

          const value = await quote;
          return harden({
            value,
            updateCount: record.updateCount,
          });
        },
      });

      /** @type {Notifier<PriceQuote>} */
      const specificNotifier = Far('QuoteNotifier', {
        ...makeNotifier(specificBaseNotifier),
        // TODO stop exposing baseNotifier methods directly.
        ...specificBaseNotifier,
      });
      return specificNotifier;
    }
```

The test below, [scaled price authority](https://github.com/Agoric/agoric-sdk/blob/b36fcb2d832ec154019cb6ae0a5dda17f94207eb/packages/zoe/test/unitTests/contracts/test-scaledPriceAuthority.js#L44), demonstrate how to use the makeQuoteNotifier method.
By calling the method getUpdateSince of the notifier object, returned by the makeQuoteNotifier, it will return a promise with the updated quote record and the updated count.

```js
test('scaled price authority', /** @param {ExecutionContext} t */ async t => {

    ...
  const pa = await E(scaledPrice.publicFacet).getPriceAuthority();

  const notifier = E(pa).makeQuoteNotifier(
    AmountMath.make(t.context.ibcAtom.brand, 10n ** 6n),
    t.context.run.brand,
  );

  const {
    value: { quoteAmount: qa1 },
    updateCount: uc1,
  } = await E(notifier).getUpdateSince();
  t.deepEqual(qa1.value, [
    {
      amountIn: { brand: t.context.ibcAtom.brand, value: 10n ** 6n },
      amountOut: { brand: t.context.run.brand, value: 35_610_000n },
      timer,
      timestamp: 0n,
    },
  ]);

  ...

});
```

## Instant Price Quotes

There are two methods to get an instant quote from the priceAuthority, being them the `quoteGiven` and `quoteWanted`.

### quoteGiven

The [quoteGiven](https://github.com/Agoric/agoric-sdk/blob/b36fcb2d832ec154019cb6ae0a5dda17f94207eb/packages/zoe/src/contractSupport/priceAuthority.js#L277) is an asynchronous function that takes two arguments, `amountIn` and `brandOut`.
This method waits for an update from the notifier and then creates a price quote by calling createQuote with a callback function. The callback takes a `calcAmountOut` function as an argument and returns an object that includes amountIn and amountOut, which is calculated by calling calcAmountOut with amountIn as its argument.
Finally, the function asserts that the quote exists and returns it.

```js
    async quoteGiven(amountIn, brandOut) {
      AmountMath.coerce(actualBrandIn, amountIn);
      assertBrands(amountIn.brand, brandOut);

      await E(notifier).getUpdateSince();
      const quote = createQuote(calcAmountOut => ({
        amountIn,
        amountOut: calcAmountOut(amountIn),
      }));
      assert(quote);
      return quote;
    },
```

The test below, [priceAuthority quoteGiven](https://github.com/Agoric/agoric-sdk/blob/b36fcb2d832ec154019cb6ae0a5dda17f94207eb/packages/zoe/test/unitTests/test-fakePriceAuthority.js#L54), demonstrate how to use the quoteGiven method.
The `priceAuthority` is created using the [makeTestPriceAuthority](https://github.com/Agoric/agoric-sdk/blob/b36fcb2d832ec154019cb6ae0a5dda17f94207eb/packages/zoe/test/unitTests/test-fakePriceAuthority.js#L20) function, that will invoke the `makeFakePriceAuthority` with the arguments passed to makeTestPriceAuthority.
By providing the amountIn, _moola(37n)_, and the brandOut ,_bucksBrand_, the quoteGiven method will return a quote.
The quote amount can be accessed using the `getPriceDescription`function.

```js
test("priceAuthority quoteGiven", async (t) => {
  const { moola, brands, bucks } = setup();
  const bucksBrand = brands.get("bucks");
  assert(bucksBrand);
  const manualTimer = buildManualTimer(t.log, 0n, { eventLoopIteration });
  const priceAuthority = await makeTestPriceAuthority(
    brands,
    [20, 55],
    manualTimer
  );

  await E(manualTimer).tick();
  const quote = await E(priceAuthority).quoteGiven(moola(37n), bucksBrand);
  const quoteAmount = getPriceDescription(quote);
  t.is(1n, TimeMath.absValue(quoteAmount.timestamp));
  t.deepEqual(bucks(37n * 20n), quoteAmount.amountOut);
});
```

### quoteWanted

The [quoteWanted](https://github.com/Agoric/agoric-sdk/blob/b36fcb2d832ec154019cb6ae0a5dda17f94207eb/packages/zoe/src/contractSupport/priceAuthority.js#L289)function calculates a price quote for a given `brandIn` and `amountOut`.
This function is similar with the function above, except that function createQuote takes two parameters `calcAmountOut` and `calcAmountIn`. The callback function uses calcAmountIn to determine an amountIn value that guarantees a minimum amountOut, and then uses calcAmountOut to calculate the actual amountOut for the given amountIn.
The function returns the price quote with both amountIn and amountOut.

```js
    async quoteWanted(brandIn, amountOut) {
      AmountMath.coerce(actualBrandOut, amountOut);
      assertBrands(brandIn, amountOut.brand);

      await E(notifier).getUpdateSince();
      const quote = createQuote((calcAmountOut, calcAmountIn) => {
        // We need to determine an amountIn that guarantees at least the amountOut.
        const amountIn = calcAmountIn(amountOut);
        const actualAmountOut = calcAmountOut(amountIn);
        AmountMath.isGTE(actualAmountOut, amountOut) ||
          assert.fail(
            X`Calculation of ${actualAmountOut} didn't cover expected ${amountOut}`,
          );
        return { amountIn, amountOut };
      });
      assert(quote);
      return quote;
    },
```

The test below, [priceAuthority quoteWanted](https://github.com/Agoric/agoric-sdk/blob/b36fcb2d832ec154019cb6ae0a5dda17f94207eb/packages/zoe/test/unitTests/test-fakePriceAuthority.js#L72), demonstrate how to use the quoteWanted method.
By providing the brandIn, _moolaBrand_, and the amountOut, _bucks(400n)_, it will return the expected quote.
In this example, the quote amount is accessed by using its attribute `quote.quoteAmount.value[0]`.

```js
test("priceAuthority quoteWanted", async (t) => {
  const { moola, bucks, brands } = setup();
  const moolaBrand = brands.get("moola");
  assert(moolaBrand);
  const manualTimer = buildManualTimer(t.log, 0n, { eventLoopIteration });
  const priceAuthority = await makeTestPriceAuthority(
    brands,
    [20, 55],
    manualTimer
  );

  await E(manualTimer).tick();
  const quote = await E(priceAuthority).quoteWanted(moolaBrand, bucks(400n));
  const quoteAmount = quote.quoteAmount.value[0];
  t.is(1n, quoteAmount.timestamp);
  assertAmountsEqual(t, bucks(400n), quoteAmount.amountOut);
  assertAmountsEqual(t, moola(20n), quoteAmount.amountIn);
});
```

## Promise Price Quote

There are a few [methods](https://github.com/Agoric/agoric-sdk/blob/b36fcb2d832ec154019cb6ae0a5dda17f94207eb/packages/zoe/src/contractSupport/priceAuthority.js#L339) of `priceAuthority` that returns a `promise` that will be resolved when certain conditions, specified by the developer, are achieved.
Those methods are:

```js
    quoteWhenLT: makeQuoteWhenOut(isLT),
    quoteWhenLTE: makeQuoteWhenOut(isLTE),
    quoteWhenGTE: makeQuoteWhenOut(isGTE),
    quoteWhenGT: makeQuoteWhenOut(isGT),
    mutableQuoteWhenLT: makeMutableQuote(isLT),
    mutableQuoteWhenLTE: makeMutableQuote(isLTE),
    mutableQuoteWhenGT: makeMutableQuote(isGT),
    mutableQuoteWhenGTE: makeMutableQuote(isGTE),
```

The parameters expected by the methods above, called `compareAmountsFn`, are created using the AmounthMath library. It is this parameter that will define the condition for the respective promise.

```js
/**
 * @callback CompareAmount
 * @param {Amount} amount
 * @param {Amount} amountLimit
 * @returns {boolean}
 */

/** @type {CompareAmount} */
const isLT = (amount, amountLimit) => !AmountMath.isGTE(amount, amountLimit);

/** @type {CompareAmount} */
const isLTE = (amount, amountLimit) => AmountMath.isGTE(amountLimit, amount);

/** @type {CompareAmount} */
const isGTE = (amount, amountLimit) => AmountMath.isGTE(amount, amountLimit);

/** @type {CompareAmount} */
const isGT = (amount, amountLimit) => !AmountMath.isGTE(amountLimit, amount);
```

### quoteWhen

The [makeQuoteWhenOut](https://github.com/Agoric/agoric-sdk/blob/b36fcb2d832ec154019cb6ae0a5dda17f94207eb/packages/zoe/src/contractSupport/priceAuthority.js#L85) function takes in a `compareAmountsFn` and returns an inner function `quoteWhenOutTrigger`. The inner function is an asynchronous function that takes in two arguments, `amountIn` and `amountOutLimit`.

The function creates a Promise object `triggerPK` using `makePromiseKit`. It then creates an asynchronous function `trigger` that takes in `createInstantQuote`. This function tries to generate a quote based on createInstantQuote and calcAmountOut:

- If the triggers set does not contain the trigger, it immediately returns undefined because the trigger has already been fired.
- If compareAmountsFn returns false when passed calcAmountOut(amountIn) and amountOutLimit, it returns undefined because the trigger should not fire yet.
- If compareAmountsFn returns true, the function generates a quote by returning an object with properties amountIn and amountOut.
- If the returned value of createInstantQuote is null, it returns undefined.
- If an exception is thrown in the try block, the trigger promise is rejected, and the trigger is deleted from the triggers set.

Finally, the trigger is added to the triggers set, and the trigger function is executed immediately with createQuote as its argument. The function will then return the Promise object triggerPK.

The test below, [priceAuthority quoteWhenLT](https://github.com/Agoric/agoric-sdk/blob/b36fcb2d832ec154019cb6ae0a5dda17f94207eb/packages/zoe/test/unitTests/test-fakePriceAuthority.js#L146), demonstrate how to use the `quoteWhenLT` method.
By providing the amountIn (moola(1n)) and the amountOutLimit (bucks(30n)) it will return promise of a PriceQuote.
The time will than be moved forward (await E(manualTimer).tick()) until the condition triggers.

```js
test("priceAuthority quoteWhenLT", async (t) => {
  const { moola, bucks, brands } = setup();
  const manualTimer = buildManualTimer(t.log, 0n, { eventLoopIteration });
  const priceAuthority = await makeTestPriceAuthority(
    brands,
    [40, 30, 29],
    manualTimer
  );

  E(priceAuthority)
    .quoteWhenLT(moola(1n), bucks(30n))
    .then((quote) => {
      const quoteInAmount = quote.quoteAmount.value[0];
      // @ts-expect-error could be TimestampRecord
      t.is(3n, manualTimer.getCurrentTimestamp());
      t.is(3n, quoteInAmount.timestamp);
      assertAmountsEqual(t, bucks(29n), quoteInAmount.amountOut);
      assertAmountsEqual(t, moola(1n), quoteInAmount.amountIn);
    });

  await E(manualTimer).tick();
  await E(manualTimer).tick();
  await E(manualTimer).tick();
  await E(manualTimer).tick();
});
```

### mutableQuoteWhen

The [makeMutableQuote](https://github.com/Agoric/agoric-sdk/blob/b36fcb2d832ec154019cb6ae0a5dda17f94207eb/packages/zoe/src/contractSupport/priceAuthority.js#L146) function is very similar with the function above, except that when called, it returns a new function `mutableQuoteWhenOutTrigger` which will return an object, `mutableQuote`.

The mutableQuote object is created with three methods: `cancel`, `updateLevel`, and `getPromise`:

- The cancel method is used to reject the promise associated with mutableQuote.
- The updateLevel method is used to change the amountIn and amountOutLimit values and re-fire the trigger.
- The getPromise method returns the promise associated with mutableQuote.

The test below, [temutableQuoteWhenLT: brands in/out matchst](https://github.com/Agoric/agoric-sdk/blob/b36fcb2d832ec154019cb6ae0a5dda17f94207eb/packages/zoe/test/unitTests/contracts/test-scaledPriceAuthority.js#L178), demonstrate how to use the `mutableQuoteWhenLT` method.
By providing the amountIn, _AmountMath.make(t.context.ibcAtom.brand, 10n \*\* 6n)_, and the amountOutLimit, _AmountMath.make(t.context.ibcAtom.brand, 10n \*\* 6n)_, it will return promise of a MutableQuote.
The time will than be moved forward, _await E(timer).tick()_, allowing the condition to trigger.

```js
test("mutableQuoteWhenLT: brands in/out match", /** @param {ExecutionContext} t */ async (t) => {
  const timer = buildManualTimer(t.log);
  const makeSourcePrice = (valueIn, valueOut) =>
    makeRatio(valueOut, t.context.usdBrand, valueIn, t.context.atomBrand);
  const sourcePriceAuthority = makeManualPriceAuthority({
    actualBrandIn: t.context.atomBrand,
    actualBrandOut: t.context.usdBrand,
    initialPrice: makeSourcePrice(10n ** 5n, 35_6100n),
    timer,
  });

  const scaledPrice = await E(t.context.zoe).startInstance(
    t.context.scaledPriceInstallation,
    undefined,
    {
      sourcePriceAuthority,
      scaleIn: makeRatio(
        10n ** 5n,
        t.context.atomBrand,
        10n ** 6n,
        t.context.ibcAtom.brand
      ),
      scaleOut: makeRatio(
        10n ** 4n,
        t.context.usdBrand,
        10n ** 6n,
        t.context.run.brand
      ),
    }
  );

  const pa = await E(scaledPrice.publicFacet).getPriceAuthority();

  const mutableQuote = E(pa).mutableQuoteWhenLT(
    AmountMath.make(t.context.ibcAtom.brand, 10n ** 6n),
    AmountMath.make(t.context.run.brand, 32_430_100n)
  );
  const sourceNotifier = E(sourcePriceAuthority).makeQuoteNotifier(
    AmountMath.make(t.context.atomBrand, 10n ** 5n),
    t.context.usdBrand
  );

  const {
    value: { quoteAmount: sqa1 },
    updateCount: suc1,
  } = await E(sourceNotifier).getUpdateSince();
  t.deepEqual(sqa1.value, [
    {
      amountIn: { brand: t.context.atomBrand, value: 10n ** 5n },
      amountOut: { brand: t.context.usdBrand, value: 35_6100n },
      timer,
      timestamp: 0n,
    },
  ]);

  await E(timer).tick();
  sourcePriceAuthority.setPrice(makeSourcePrice(10n ** 5n, 30_4301n));
  const { quoteAmount: qa2 } = await E(mutableQuote).getPromise();
  t.deepEqual(qa2.value, [
    {
      amountIn: { brand: t.context.ibcAtom.brand, value: 1_000_000n },
      amountOut: { brand: t.context.run.brand, value: 30_430_100n },
      timer,
      timestamp: 1n,
    },
  ]);

  // check source quote
  const {
    value: { quoteAmount: sqa2 },
  } = await E(sourceNotifier).getUpdateSince(suc1);
  t.deepEqual(sqa2.value, [
    {
      amountIn: { brand: t.context.atomBrand, value: 1_00000n },
      amountOut: { brand: t.context.usdBrand, value: 30_4301n },
      timer,
      timestamp: 1n,
    },
  ]);
});
```

For other examples we recommend seeing the following tests:

- [mutableQuoteWhen with update](https://github.com/Agoric/agoric-sdk/blob/b36fcb2d832ec154019cb6ae0a5dda17f94207eb/packages/zoe/test/unitTests/contracts/test-priceAggregator.js#L946)
- [cancel mutableQuoteWhen](https://github.com/Agoric/agoric-sdk/blob/b36fcb2d832ec154019cb6ae0a5dda17f94207eb/packages/zoe/test/unitTests/contracts/test-priceAggregator.js#L1020)

The main difference between the two functions `makeQuoteWhenOut` and `makeMutableQuote` is that makeQuoteWhenOut creates a function quoteWhenOutTrigger that returns a promise that is resolved with a quote when a certain condition is met, whereas makeMutableQuote creates a function mutableQuoteWhenOutTrigger that returns a mutable quote, which can be updated and canceled.

## Manual Price Authority

The [makeManualPriceAuthority](https://github.com/Agoric/agoric-sdk/blob/b36fcb2d832ec154019cb6ae0a5dda17f94207eb/packages/zoe/tools/manualPriceAuthority.js) function returns an object that represents a manual price authority, which creates and returns an object that implements the `PriceAuthority` interface, with the following additional method:

- setPrice: a function that allows changing the current price of the asset ratio requested.

The `createQuote` function creates a price quote for the current price. The quote is authenticated using the `authenticateQuote` function which takes a quote as an argument, converts it to a payment using the `quoteMint` and returns the `quote payment` and the `quote amount`. The `calcAmountOut` and `calcAmountIn` functions calculate the output and input amounts, respectively, based on the current price.

Finally, a priceAuthority object is created using the `makeOnewayPriceAuthorityKit` utility, which takes the `priceAuthorityOptions` object that contains the timer, the createQuote function, the input and output brands, the quote issuer, and the notifier.
The priceAuthority is returned, along with the setPrice method.

```js
/**
 *
 * @param {object} options
 * @param {Brand} options.actualBrandIn
 * @param {Brand} options.actualBrandOut
 * @param {Ratio} options.initialPrice
 * @param {TimerService} options.timer
 * @param {IssuerKit<'set'>} [options.quoteIssuerKit]
 * @returns {PriceAuthority & { setPrice: (Ratio) => void }}
 */
export function makeManualPriceAuthority(options) {

  const {
    actualBrandIn,
    actualBrandOut,
    initialPrice, // brandOut / brandIn
    timer,
    quoteIssuerKit = makeIssuerKit('quote', AssetKind.SET),
  } = options;

    ...

  function createQuote(priceQuery) {
    const quote = priceQuery(calcAmountOut, calcAmountIn);
    if (!quote) {
      return undefined;
    }

    const { amountIn, amountOut } = quote;
    return E(timer)
      .getCurrentTimestamp()
      .then(now =>
        authenticateQuote([{ amountIn, amountOut, timer, timestamp: now }]),
      );
  }

  /* --* @type {ERef<Notifier<Timestamp>>} */
  const priceAuthorityOptions = harden({
    timer,
    createQuote,
    actualBrandIn,
    actualBrandOut,
    quoteIssuer,
    notifier,
  });

  const {
    priceAuthority,
    adminFacet: { fireTriggers },
  } = makeOnewayPriceAuthorityKit(priceAuthorityOptions);

  return Far('ManualPriceAuthority', {
    setPrice: newPrice => {
      currentPrice = newPrice;
      updater.updateState(currentPrice);
      fireTriggers(createQuote);
    },
    ...priceAuthority,
  });
}
```

The test below, [scaled price authority](https://github.com/Agoric/agoric-sdk/blob/b36fcb2d832ec154019cb6ae0a5dda17f94207eb/packages/zoe/test/unitTests/contracts/test-scaledPriceAuthority.js#L83), demonstrate how to use the `makeManualPriceAuthority` function.
The makeManualPriceAuthority() will return a manualPriceAuthority, `sourcePriceAuthority`, that is used to retrieve the quoteNotifier using makeQuoteNotifier method, and update the price using setPrice method.

```js
test("scaled price authority", /** @param {ExecutionContext} t */ async (t) => {
  const timer = buildManualTimer(t.log);
  const makeSourcePrice = (valueIn, valueOut) =>
    makeRatio(valueOut, t.context.usdBrand, valueIn, t.context.atomBrand);
  const sourcePriceAuthority = makeManualPriceAuthority({
    actualBrandIn: t.context.atomBrand,
    actualBrandOut: t.context.usdBrand,
    initialPrice: makeSourcePrice(10n ** 5n, 35_6100n),
    timer,
  });

  const scaledPrice = await E(t.context.zoe).startInstance(
    t.context.scaledPriceInstallation,
    undefined,
    {
      sourcePriceAuthority,
      scaleIn: makeRatio(
        10n ** 5n,
        t.context.atomBrand,
        10n ** 6n,
        t.context.ibcAtom.brand
      ),
      scaleOut: makeRatio(
        10n ** 4n,
        t.context.usdBrand,
        10n ** 6n,
        t.context.run.brand
      ),
    }
  );

  const pa = await E(scaledPrice.publicFacet).getPriceAuthority();

  const notifier = E(pa).makeQuoteNotifier(
    AmountMath.make(t.context.ibcAtom.brand, 10n ** 6n),
    t.context.run.brand
  );
  const sourceNotifier = E(sourcePriceAuthority).makeQuoteNotifier(
    AmountMath.make(t.context.atomBrand, 10n ** 5n),
    t.context.usdBrand
  );

  const {
    value: { quoteAmount: qa1 },
    updateCount: uc1,
  } = await E(notifier).getUpdateSince();
  t.deepEqual(qa1.value, [
    {
      amountIn: { brand: t.context.ibcAtom.brand, value: 10n ** 6n },
      amountOut: { brand: t.context.run.brand, value: 35_610_000n },
      timer,
      timestamp: 0n,
    },
  ]);

  const {
    value: { quoteAmount: sqa1 },
    updateCount: suc1,
  } = await E(sourceNotifier).getUpdateSince();
  t.deepEqual(sqa1.value, [
    {
      amountIn: { brand: t.context.atomBrand, value: 10n ** 5n },
      amountOut: { brand: t.context.usdBrand, value: 35_6100n },
      timer,
      timestamp: 0n,
    },
  ]);

  await E(timer).tick();
  sourcePriceAuthority.setPrice(makeSourcePrice(10n ** 5n, 32_4301n));
  const {
    value: { quoteAmount: qa2 },
  } = await E(notifier).getUpdateSince(uc1);
  t.deepEqual(qa2.value, [
    {
      amountIn: { brand: t.context.ibcAtom.brand, value: 1_000_000n },
      amountOut: { brand: t.context.run.brand, value: 32_430_100n },
      timer,
      timestamp: 1n,
    },
  ]);

  const {
    value: { quoteAmount: sqa2 },
  } = await E(sourceNotifier).getUpdateSince(suc1);
  t.deepEqual(sqa2.value, [
    {
      amountIn: { brand: t.context.atomBrand, value: 1_00000n },
      amountOut: { brand: t.context.usdBrand, value: 32_4301n },
      timer,
      timestamp: 1n,
    },
  ]);
});
```
