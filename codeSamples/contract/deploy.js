// @ts-check

import * as fs from 'fs/promises';
import '@agoric/zoe/exported.js';
import { makeHelpers } from '@agoric/deploy-script-support';

// This script takes our contract code, installs it on Zoe, and makes
// the installation publicly available. Our backend API script will
// use this installation in a later step.

/**
 * @template T
 * @typedef {import('@endo/eventual-send').ERef<T>} ERef
 */

/**
 * @typedef {object} DeployPowers The special powers that agoric deploy gives us
 * @property {(path: string) => string} pathResolve
 * @property {(bundle: unknown) => any} publishBundle
 * @typedef {object} Board
 * @property {(id: string) => unknown} getValue
 * @property {(value: unknown) => string} getId
 * @property {(value: unknown) => boolean} has
 * @property {() => [string]} ids
 */

/**
 * @param {Promise<{zoe: ERef<ZoeService>, board: ERef<Board>, agoricNames:
 * object, wallet: ERef<object>, faucet: ERef<object>}>} homePromise
 * @param {DeployPowers} endowments
 */
const deployContract = async (homePromise, endowments) => {
  // Your off-chain machine (what we call an ag-solo) starts off with
  // a number of references, some of which are shared objects on chain, and
  // some of which are objects that only exist on your machine.

  const { pathResolve } = endowments;

  const { install } = await makeHelpers(homePromise, endowments);

  const CONTRACT_NAME = 'fungibleFaucet';
  const { id: INSTALLATION_BOARD_ID } = await install(
    './src/contract.js',
    CONTRACT_NAME,
  );

  // Save the constants somewhere where the UI and api can find it.
  const dappConstants = {
    CONTRACT_NAME,
    INSTALLATION_BOARD_ID,
  };
  const defaultsFolder = pathResolve(`../ui/public/conf`);
  const defaultsFile = pathResolve(
    `../ui/public/conf/installationConstants.js`,
  );
  console.log('writing', defaultsFile);
  const defaultsContents = `\
// GENERATED FROM ${pathResolve('./deploy.js')}
export default ${JSON.stringify(dappConstants, undefined, 2)};
`;
  await fs.mkdir(defaultsFolder, { recursive: true });
  await fs.writeFile(defaultsFile, defaultsContents);
};

export default deployContract;
