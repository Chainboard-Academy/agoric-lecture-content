import { E } from '@endo/far';

const claimMoney = async (homeP) => {
  const { wallet, board } = E.get(homeP);

  const instance = await E(board).getValue('board01759');
  const walletBridge = E(wallet).getBridge();

  const offerConfig = {
    id: `${Date.now()}`,
    invitationQuery: {
      description: 'mint a payment',
      instance,
    },
    proposalTemplate: {
      want: {
        Token: {
          pursePetname: 'Tokens',
          value: 1000n,
        },
      },
    },
  };

  await E(walletBridge).addOffer(offerConfig);
  console.log('Done, check your wallet UI.')

};

export default claimMoney;