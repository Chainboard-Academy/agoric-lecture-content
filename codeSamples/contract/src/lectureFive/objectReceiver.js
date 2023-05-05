import { Far } from '@endo/marshal';

const start = () => {
  const importantObjects = [];

  const creatorFacet = Far('Important Object Receiver', {
    receiveNew: newImportantObject => {
      importantObjects.push(newImportantObject);
    },
    readImportantObjects: () => {
      return [...importantObjects];
    }
  });

  return { creatorFacet };
};

harden(start);
export { start };