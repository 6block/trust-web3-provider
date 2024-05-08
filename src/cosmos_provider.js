"use strict";

import BaseProvider from "./base_provider";
import Utils from "./utils";
import ProviderRpcError from "./error";
import { Buffer } from "buffer";
import CosmJSOfflineSigner from "./cosmjs_adapter";

export class FoxWalletCosmosWeb3Provider extends BaseProvider {
  constructor(config) {
    super(config);

    this.chain = "COSMOS";
    this.callbacks = new Map();
    this.mode = "wallet-connect";
    this.isFoxWallet = true;
    this.version = "1.0.0";
  }

  enable(chainIds) {
    console.log(`==> enabled for ${chainIds}`);
  }

  experimentalSuggestChain(chainInfo) {
    console.log("==> experimentalSuggestChain isn't implemented");
  }

  getKey(chainId) {
    return this._request("requestAccounts", { chainId: chainId }).then(
      (response) => {
        return {
          algo: "secp256k1",
          address: response.address,
          bech32Address: response.address,
          pubKey: Buffer.from(response.pubKey, "hex"),
          username: response.name,
        };
      }
    );
  }

  getOfflineSigner(chainId) {
    return new CosmJSOfflineSigner(chainId, this);
  }

  getOfflineSignerOnlyAmino(chainId) {
    return new CosmJSOfflineSigner(chainId, this);
  }

  getOfflineSignerAuto(chainId) {
    return new CosmJSOfflineSigner(chainId, this);
  }

  signAmino(chainId, signerAddress, signDoc) {
    return this._request("signAmino", {
      chainId: chainId,
      signDoc: signDoc,
    }).then((signatures) => {
      return { signed: signDoc, signature: signatures[0] };
    });
  }

  signDirect(chainId, signerAddress, signDoc) {
    const object = {
      bodyBytes: Utils.bufferToHex(signDoc.bodyBytes),
      authInfoBytes: Utils.bufferToHex(signDoc.authInfoBytes),
    };
    return this._request("signDirect", {
      chainId: chainId,
      signDoc: object,
    }).then((signatures) => {
      return { signed: signDoc, signature: signatures[0] };
    });
  }

  signArbitrary(chainId, signerAddress, data) {
    const buffer = Buffer.from(data);
    const hex = Utils.bufferToHex(buffer);

    return this._request("signArbitrary", { chainId: chainId, data: hex }).then(
      (result) => {
        const signature = result[0].signature;
        const signDoc = {};
        return { signDoc, signature };
      }
    );
  }

  sendTx(chainId, tx, mode) {
    const tx_bytes = Buffer.from(tx).toString("base64");
    return this._request("sendTx", {
      chainId: chainId,
      raw: tx_bytes,
      mode: mode,
    }).then((tx_hash) => {
      return Buffer.from(tx_hash, "hex");
    });
  }

  /**
   * @private Internal rpc handler
   */
  _request(method, payload) {
    if (this.isDebug) {
      console.log(
        `==> _request method: ${method}, payload ${JSON.stringify(payload)}`
      );
    }
    return new Promise((resolve, reject) => {
      const id = Utils.genId();
      console.log(`==> setting id ${id}`);
      this.callbacks.set(id, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });

      switch (method) {
        case "requestAccounts":
          return this.postMessage("requestAccounts", id, payload);
        case "signAmino":
          return this.postMessage("signTransaction", id, payload);
        case "signDirect":
          return this.postMessage("signTransaction", id, payload);
        case "signArbitrary":
          return this.postMessage("signMessage", id, payload);
        case "sendTx":
          return this.postMessage("sendTransaction", id, payload);
        default:
          // throw errors for unsupported methods
          throw new ProviderRpcError(
            4200,
            `Trust does not support calling ${payload.method} yet.`
          );
      }
    });
  }
}

module.exports = FoxWalletCosmosWeb3Provider;
