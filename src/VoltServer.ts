import * as http from "http";
import * as https from "https";

import ServerBase, { ServerStatus } from "./ServerBase";
import ICleaner from "./ICleaner";
import { CertOptions } from "./ConfigurationBase";
import IRequestListenerFactory from "./IRequestListenerFactory";
import ISecretsMetadataStore from "./persistence/ISecretsMetadataStore";
import LokiSecretsMetadataStore from "./persistence/LokiSecretsMetadataStore";
import SecretsConfiguration from "./SecretsConfiguration";
import SecretsRequestListenerFactory from "./SecretsRequestListenerFactory";
import logger from "./Logger";

const BEFORE_CLOSE_MESSAGE = `Volt Secrets service is closing...`;
const AFTER_CLOSE_MESSAGE = `Volt Secrets service successfully closed`;

/**
 * Default implementation of Volt Secrets HTTP server.
 * This implementation provides a HTTP service based on express framework and LokiJS in memory database.
 *
 * We can create other secrets servers by extending abstract ServerBase class and initialize different httpServer,
 * metadataStore or requestListenerFactory fields.
 *
 * For example, creating a HTTPS server to accept HTTPS requests, or using other
 * Node.js HTTP frameworks like Koa, or just using another SQL database.
 *
 * @export
 * @class VoltServer
 */
export default class VoltServer extends ServerBase implements ICleaner {
  private readonly metadataStore: ISecretsMetadataStore;
  /**
     * Creates an instance of Server.
     *
     * @param {SecretsConfiguration} configuration
     * @memberof Server
     */
  constructor(configuration?: SecretsConfiguration) {
    if (configuration === undefined) {
      configuration = new SecretsConfiguration();
    }

    const host = configuration.host;
    const port = configuration.port;

    // We can create a HTTP server or a HTTPS server here
    let httpServer;
    const certOption = configuration.hasCert();
    switch (certOption) {
      case CertOptions.PEM:
      case CertOptions.PFX:
        httpServer = https.createServer(configuration.getCert(certOption)!);
        break;
      default:
        httpServer = http.createServer();
    }

    // We can change the persistency layer implementation by
    // creating a new XXXDataStore class implementing ISecretsMetadataStore interface
    // and replace the default LokiSecretsMetadataStore
    const metadataStore: ISecretsMetadataStore = new LokiSecretsMetadataStore(
      configuration.metadataDBPath
      // logger
    );

    // We can also change the HTTP framework here by
    // creating a new XXXListenerFactory implementing IRequestListenerFactory interface
    // and replace the default Express based request listener
    const requestListenerFactory: IRequestListenerFactory = new SecretsRequestListenerFactory(
      metadataStore,
      configuration.enableAccessLog, // Access log includes every handled HTTP request
      configuration.accessLogWriteStream,
      configuration.loose,
      configuration.skipApiVersionCheck,
      configuration.getOAuthLevel(),
      configuration.getHttpServerAddress(),
      configuration.getRecoveryLevel(),
      configuration.recoverableDays,
      configuration.disableSoftDelete
    );

    super(host, port, httpServer, requestListenerFactory, configuration);

    this.metadataStore = metadataStore;
  }

  /**
   * Clean up server persisted data, including Loki metadata database file,
   * Loki extent database file and extent data.
   *
   * @returns {Promise<void>}
   * @memberof VoltServer
   */
  public async clean(): Promise<void> {
    if (this.getStatus() === ServerStatus.Closed) {
      if (this.metadataStore !== undefined) {
        await this.metadataStore.clean();
      }

      return;
    }
    throw Error(`Cannot clean up secrets server in status ${this.getStatus()}.`);
  }

  protected async beforeStart(): Promise<void> {
    const msg = `Volt Secrets service is starting on ${this.host}:${this.port}`;
    logger.info(msg);

    if (this.metadataStore !== undefined) {
      await this.metadataStore.init();
    }
  }

  protected async afterStart(): Promise<void> {
    const msg = `Volt Secrets service successfully listens on ${this.getHttpServerAddress()}`;
    logger.info(msg);
  }

  protected async beforeClose(): Promise<void> {
    logger.info(BEFORE_CLOSE_MESSAGE);
  }

  protected async afterClose(): Promise<void> {
    if (this.metadataStore !== undefined) {
      await this.metadataStore.close();
    }

    logger.info(AFTER_CLOSE_MESSAGE);
  }
}
