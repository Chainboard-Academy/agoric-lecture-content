# Lecture Four - Assignment

## Assignment Description:

1. Create a new contract;
2. Mint some NFTs;
3. Create a function that allows the user to sell some of the minted NFTs to through the zoe sellItems contract;
4. Create a new test file for the contract above;

## Sequence diagram

```mermaid
sequenceDiagram
    actor Alice
    participant Contract
    participant SellItems
    note over Alice,SellItems: Sell NFT
    Alice->>+Contract: sell( nftIDs, pricePerNFT, sellItemsInstalation)
    Contract->>+Contract: mint NFTs
    Contract->>+Contract: start SellItems instance
    Contract->>+SellItems: offer(invitation, proposal, ...)
    SellItems -->>Contract: sellItemsCreatorSeat
    Contract -->>Alice: creatorFacet, publicFacet, ...
    note over Alice,SellItems: Buy NFT
    Alice->>+SellItems: makeBuyerInvitation()
    SellItems -->>Alice: Invitation
    Alice->>+SellItems: offer(invitation, proposal, ...)
    SellItems -->>Alice: buyerSeat
```