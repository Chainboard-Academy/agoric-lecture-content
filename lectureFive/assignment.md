# Lecture Five - Assignment
## Assignment Description:

1. Import your project developed for assignment 4
2. build 3 deploy scripts:
    - deploy.js (deploy contract at local chain)
    - sell.js (sell nft)
    - buy.js (buy nft)

## Sequence diagram

```mermaid
sequenceDiagram
    participant Buy.sh
    participant Sell.sh
    participant Deploy.sh
    participant Contract
    participant SellItems
    note over Deploy.sh,Contract: Deploy contract
    Deploy.sh->>+Contract: start instance
    Contract-->>Deploy.sh: response
    Deploy.sh->>+Deploy.sh: save data on board
    note over Sell.sh,Contract: Sell NFTs
    Sell.sh->>+Sell.sh: get data on board
    Sell.sh->>+Contract: sell( nftIDs, pricePerNFT, sellItemsInstalation)
    Contract-->>Sell.sh: response
    Sell.sh->>+Sell.sh: create Purses
    Sell.sh->>+Sell.sh: save data on board
    note over Buy.sh,SellItems: Buy NFTs
    Buy.sh->>+Buy.sh: get data on board
    Buy.sh->>+SellItems: addOffer(harden(offerConfig))
```
