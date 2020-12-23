import { stat } from "fs";
import Loki from "lokijs";

import { rimrafAsync } from "../utils/utils";
import * as Models from "../generated/artifacts/models";
import Context from "../generated/Context";
import ISecretsMetadataStore, { SecretModel } from "./ISecretsMetadataStore";
import KeyVaultErrorFactory from '../errors/KeyVaultErrorFactory';

/**
 * This is a metadata source implementation for secrets based on loki DB.
 *
 * Loki DB includes following collections and documents:
 *
 * -- SECRETS_COLLECTION     // Collection contains all secrets
 *                           // Default collection name is $SECRETS_COLLECTION$
 *                           // Each document maps to a secret
 *                           // Unique document properties: secretName
 *
 * @export
 * @class LokiSecretsMetadataStore
 */
export default class LokiSecretsMetadataStore
  implements ISecretsMetadataStore {
  private readonly db: Loki;

  private initialized: boolean = false;
  private closed: boolean = true;

  private readonly SECRETS_COLLECTION = "$SECRETS_COLLECTION$";

  public constructor(public readonly lokiDBPath: string) {
    this.db = new Loki(lokiDBPath, {
      autosave: true,
      autosaveInterval: 5000
    });
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public isClosed(): boolean {
    return this.closed;
  }

  public async init(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      stat(this.lokiDBPath, (statError, stats) => {
        if (!statError) {
          this.db.loadDatabase({}, dbError => {
            if (dbError) {
              reject(dbError);
            } else {
              resolve();
            }
          });
        } else {
          // when DB file doesn't exist, ignore the error because following will re-create the file
          resolve();
        }
      });
    });

    // In loki DB implementation, these operations are all sync. Doesn't need an async lock

    // Create secrets collection if not exists
    let secretsColl = this.db.getCollection(this.SECRETS_COLLECTION);
    if (secretsColl === null) {
      secretsColl = this.db.addCollection(this.SECRETS_COLLECTION, {
        unique: ["secretName"],
        // Optimization for indexing and searching
        // https://rawgit.com/techfort/LokiJS/master/jsdoc/tutorial-Indexing%20and%20Query%20performance.html
        indices: ["secretName"]
      });
    }

    await new Promise<void>((resolve, reject) => {
      this.db.saveDatabase(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    this.initialized = true;
    this.closed = false;
  }

  /**
   * Close loki DB.
   *
   * @returns {Promise<void>}
   * @memberof LokiSecretsMetadataStore
   */
  public async close(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.db.close(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    this.closed = true;
  }

  /**
   * Clean LokiSecretsMetadataStore.
   *
   * @returns {Promise<void>}
   * @memberof LokiSecretsMetadataStore
   */
  public async clean(): Promise<void> {
    if (this.isClosed()) {
      await rimrafAsync(this.lokiDBPath);

      return;
    }
    throw new Error(`Cannot clean LokiSecretsMetadataStore, it's not closed.`);
  }

  /**
   * Set secret item in persistency layer. Will create new version if secret exists.
   *
   * @param {Context} context
   * @param {SecretModel} secret
   * @returns {Promise<SecretModel>}
   * @memberof LokiSecretsMetadataStore
   */
  public async setSecret(context: Context, secret: SecretModel): Promise<SecretModel> {
    const coll = this.db.getCollection(this.SECRETS_COLLECTION);
    const secretDoc = coll.findOne({
      secretName: secret.secretName
    });

    // validateParameters(context, parameters, secretDoc);

    if (secretDoc) {
      secretDoc.versions.push(secret);
      return coll.update(secretDoc);
    }

    return coll.insert({
      secretName: secret.secretName,
      versions: [secret]
    });
  }

  public async deleteSecret(context: Context, secretName: string): Promise<Models.DeleteSecretResponse> {
    throw new Error("Method not implemented.");
  }

  public async updateSecret(context: Context, secret: SecretModel): Promise<SecretModel> {
    const coll = this.db.getCollection(this.SECRETS_COLLECTION);
    const secretDoc = coll.findOne({
      secretName: secret.secretName
    });

    if (!secretDoc) {
      throw KeyVaultErrorFactory.getSecretNotFound(context.contextId, secret.secretName);
    }

    let found = undefined;

    for (let i = 0; i < secretDoc.versions.length; i++) {
      if (secretDoc.versions[i].secretVersion = secret.secretVersion) {
        found = i;
      }
    }

    if (!found) {
      throw KeyVaultErrorFactory.getSecretNotFound(context.contextId, secret.secretName, secret.secretVersion);
    }

    secretDoc.versions[found] = { ...secretDoc.versions[found], ...secret };
    coll.update(secretDoc);

    return secretDoc.versions[found];
  }

  public async getSecret(context: Context, secretName: string, secretVersion: string): Promise<SecretModel> {
    const coll = this.db.getCollection(this.SECRETS_COLLECTION);

    const secretDoc = coll.findOne({
      secretName
    });

    if (!secretDoc) {
      throw KeyVaultErrorFactory.getSecretNotFound(context.contextId, secretName);
    }



    return {} as SecretModel;
  }

  public async getSecrets(context: Context, parameters: Models.VoltServerSecretsGetSecretsOptionalParams): Promise<Models.GetSecretsResponse> {
    throw new Error("Method not implemented.");
  }

  public async getSecretVersions(context: Context, secretName: string, parameters: Models.VoltServerSecretsGetSecretVersionsOptionalParams): Promise<Models.GetSecretVersionsResponse> {
    throw new Error("Method not implemented.");
  }
}