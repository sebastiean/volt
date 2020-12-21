import * as http from "http";
import * as https from "https";

import ServerBase from "./ServerBase";
import ICleaner from "./ICleaner";
import IRequestListenerFactory from "./IRequestListenerFactory";
import ISecretsMetadataStore from "./persistence/ISecretsMetadataStore";
import LokiSecretsMetadataStore from "./persistence/LokiSecretsMetadataStore";

/**
 * Default implementation of Azurite Blob HTTP server.
 * This implementation provides a HTTP service based on express framework and LokiJS in memory database.
 *
 * We can create other blob servers by extending abstract Server class and initialize different httpServer,
 * dataStore or requestListenerFactory fields.
 *
 * For example, creating a HTTPS server to accept HTTPS requests, or using other
 * Node.js HTTP frameworks like Koa, or just using another SQL database.
 *
 * @export
 * @class Server
 */
export default class VoltServer extends ServerBase implements ICleaner {
  private readonly secretsMetadataStore: ISecretsMetadataStore;
}
