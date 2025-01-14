"use strict";

import BaseProvider from "./base_provider";
import Utils from "./utils";

class FoxAleoProvider extends BaseProvider {
  constructor(config) {
    super(config);

    this.isFoxWallet = true;
    this.chain = "ALEO";
    this.callbacks = new Map();
    this.wrapResults = new Map();
    this.setConfig(config);
  }

  setAddress(address) {
    this.publicKey = address;
    this.ready = !!address;
    this.emitConnect(this.publicKey);
  }

  setConfig(config) {
    const aleoConfig = config[this.chain];
    this.setAddress(aleoConfig.address);
    this.isDebug = !!config.isDebug;
    this.config = aleoConfig;
  }

  emitConnect(address) {
    this.emit("connect", address);
  }

  async decrypt(ciphertext, tpk, programId, functionName, index) {
    return this.send("decrypt", {
      ciphertext,
      tpk,
      programId,
      functionName,
      index,
    });
  }

  async requestRecords(program, filter) {
    return this.send("requestRecords", { program, filter });
  }

  async requestTransaction(transaction) {
    return this.send("requestTransaction", { transaction });
  }

  async requestExecution(transaction) {
    return this.send("requestExecution", { transaction });
  }

  async requestBulkTransactions(transactions) {
    return this.send("requestBulkTransactions", { transactions });
  }

  async requestDeploy(deployment) {
    return this.send("requestDeploy", { deployment });
  }

  async transactionStatus(txId) {
    return this.send("transactionStatus", { transactionId: txId });
  }

  async getExecution(txId) {
    return this.send("getExecution", { transactionId: txId });
  }

  async requestRecordPlaintexts(program) {
    return this.send("requestRecordPlaintexts", { program });
  }

  async requestTransactionHistory(program, order) {
    return this.send("requestTransactionHistory", { program, order });
  }

  async connect(decryptPermission, network, programs) {
    const result = await this.send("connect", {
      decryptPermission,
      network,
      programs,
    });
    Utils.emitConnectEvent(this.chain, this.config, { address: result });
    return result;
  }

  async disconnect() {
    return this.send("disconnect");
  }

  async signMessage(message) {
    return this.send("signMessage", {
      message: Utils.uint8ArrayToHex(message),
    });
  }

  async requestViewKey() {
    return this.send("requestViewKey");
  }

  send(method, params) {
    // id: number;
    // name: string; // 方法名
    // object: any; // payload
    // chain: CoinType;
    const id = Utils.genId();
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
      this.postMessage(method, id, params);
    });
  }

  emit(event, ...args) {
    console.log(`=== emit event ${event} ${args}`);
    super.emit(event, ...args);
  }
}

module.exports = FoxAleoProvider;
