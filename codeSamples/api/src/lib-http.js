// This library file contains the interface to the http service.
// You don't need to edit it.
//
// This functionality will later be merged into the agoric-sdk.

// @ts-check
/* global harden */
import { E } from '@endo/eventual-send';
import { Far } from '@endo/marshal';

export const makeWebSocketHandler = (http, makeConnectionHandler) => {
  return Far('commandHandler', {
    // This creates the commandHandler for the http service to handle inbound
    // websocket requests.
    getCommandHandler() {
      const channelToConnHandler = new WeakMap();
      const handler = Far('handler', {
        // Executed upon an error in handling the websocket.
        onError(obj, { channelHandle }) {
          const connHandler = channelToConnHandler.get(channelHandle);
          console.error('Have error', obj);
          if (connHandler.onError) {
            connHandler.onError(obj);
          }
        },

        // These hooks are run when the websocket is opened or closed.
        onOpen(obj, meta) {
          const { channelHandle } = meta;
          const send = (objToSend) => E(http).send(objToSend, [channelHandle]);
          const connHandler = makeConnectionHandler(send, meta);
          channelToConnHandler.set(channelHandle, connHandler);
          if (connHandler.onOpen) {
            connHandler.onOpen(obj);
          }
        },
        onClose(obj, { channelHandle }) {
          const connHandler = channelToConnHandler.get(channelHandle);
          channelToConnHandler.delete(channelHandle);
          if (connHandler.onClose) {
            connHandler.onClose(obj);
          }
        },
        onMessage(obj, { channelHandle }) {
          const connHandler = channelToConnHandler.get(channelHandle);
          return connHandler.onMessage(obj);
        },
      });
      return harden(handler);
    },
  });
};
