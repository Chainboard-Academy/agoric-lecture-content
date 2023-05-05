import { E } from '@endo/far';
import { makeHelpers } from '@agoric/deploy-script-support';

const deployContract = async (homeP, endowments) => {
  const { board, scratch, zoe } = E.get(homeP);
  const { install } = await makeHelpers(homeP, endowments);

  console.log('Installting faucet contract...');
  const { installation } = await install(
    '../../contract/src/contract.js',
    'Faucet contract'
  );

  console.log('Starting objectReceiver contract...');
  const {
    creatorFacet: faucetCreatorFacet,
    instance,
  } = await E(zoe).startInstance(
    installation
  );

  const tokenIssuer = await E(faucetCreatorFacet).getTokenIssuer();

  const [
    faucetCreatorFacetId,
    instanceBoardId,
    tokenIssuerBoardId,
  ] = await Promise.all([
    E(scratch).set('faucet-creator-scratch-id', faucetCreatorFacet),
    E(board).getId(instance),
    E(board).getId(tokenIssuer),
  ]);

  console.log('Success', {
    faucetCreatorFacetId,
    instanceBoardId,
    tokenIssuerBoardId
  })
};

export default deployContract;