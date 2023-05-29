# Lecture Eight - Assignment
## Assignment Description

1. Build a new Agoric project
2. Create a new contract that allows the user to sell a call option of a certain asset belonging to him;
3. Use the Agoric contract coveredCall to generate the call option; `*`
4. Create the following tests:
    - sell call option;
    - buy and exercise the call option before deadline;
    - buy and exercise the call option after deadline;

`* https://github.com/Agoric/agoric-sdk/blob/f29591519809dbadf19db0a26f38704d87429b89/packages/zoe/src/contracts/coveredCall.js`


## Sequence diagram

```mermaid
sequenceDiagram
    actor S as Seller
    participant C as Contract
    participant CC as Covered Call
    actor B as Buyer
    S ->> C: Get sell invitation
    C -->> S: sell Invitation
    S ->> C: Sell Offer
    C ->> CC: Escrow asset and define offer terms
    CC -->> C: Call Option
    B ->> C: Get buy invitation
    C -->> B: Buy Invitation
    B ->> C: Buy Offer
    C -->> B: Call Option
    alt exercise call option
    CC ->> S: Strike amount
    CC ->> B: Asset
    else don't exercise call option
    CC ->> S: Asset
    end
```
