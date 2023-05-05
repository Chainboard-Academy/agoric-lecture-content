// @ts-check

import { Far, E } from '@endo/far';
import { makeHelpers } from '@agoric/deploy-script-support';

const shareImportantObject = async (homeP , endowments) => {
  const { myAddressNameAdmin, zoe } = E.get(homeP);
  const { install } = await makeHelpers(homeP, endowments);

  console.log('Installting objectReceiver contract...');
  const { installation } = await install(
    '../../contract/src/lectureFive/objectReceiver.js',
    'Object Receiver Contract'
  );

  console.log('Starting objectReceiver contract...');
  const {
    creatorFacet: objectReceiverCreatorFacet
  } = await E(zoe).startInstance(
    installation
  );

  console.log('Putting objectReceiverCreatorFacet to namesByAddress...');
  await E(myAddressNameAdmin).update('objectReceiver', objectReceiverCreatorFacet);

  console.log('Done.');
};

export default shareImportantObject;