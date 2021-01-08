import { stat } from "fs";
import Loki from "lokijs";

import { rimrafAsync } from "../utils/utils";
import * as Models from "../generated/artifacts/models";
import Context from "../generated/Context";
import ISecretsMetadataStore, { DeletedSecretModel, SecretModel } from "./ISecretsMetadataStore";
import KeyVaultErrorFactory from "../errors/KeyVaultErrorFactory";
import { PaginationMarker } from "../utils/pagination";

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
  private readonly DELETEDSECRETS_COLLECTION = "$DELETEDSECRETS_COLLECTION$";

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

    // Create deletedsecrets collection if not exists
    let deletedSecretsColl = this.db.getCollection(this.DELETEDSECRETS_COLLECTION);
    if (deletedSecretsColl === null) {
      deletedSecretsColl = this.db.addCollection(this.DELETEDSECRETS_COLLECTION, {
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

  private sortVersionsByDate(versions: any[]): any[] {
    return versions.slice().sort((a: any, b: any) => {
      return new Date(b.attributes.created).getTime() - new Date(a.attributes.created).getTime();
    });
  }

  private sortVersionsByVersion(versions: any[]): any[] {
    return versions.slice().sort((a: any, b: any) => {
      return a.secretVersion > b.secretVersion ? 1 : -1;
    });
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

  public async deleteSecret(context: Context, secret: DeletedSecretModel, disableSoftDelete: boolean): Promise<DeletedSecretModel> {
    const secretsColl = this.db.getCollection(this.SECRETS_COLLECTION);
    const secretDoc = secretsColl.findOne({
      secretName: secret.secretName
    });

    if (!secretDoc) {
      throw KeyVaultErrorFactory.getSecretNotFound(context.contextId, secret.secretName);
    }

    // Add to deletedsecrets as long as soft-delete is enabled
    if (disableSoftDelete === false) {
      const deletedColl = this.db.getCollection(this.DELETEDSECRETS_COLLECTION);
      deletedColl.insert({
        ...secret,
        versions: secretDoc.versions
      });
    }

    secretsColl.remove(secretDoc);

    return secret;
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

    // If we don't have a version, update the latest version
    if (secret.secretVersion === "") {
      const sortedVersions = this.sortVersionsByDate(secretDoc.versions);
      secret.secretVersion = sortedVersions[0].secretVersion;
    }

    for (let i = 0; i < secretDoc.versions.length; i++) {
      if (secretDoc.versions[i].secretVersion === secret.secretVersion) {
        found = i;
        break;
      }
    }

    if (found === undefined) {
      throw KeyVaultErrorFactory.getSecretNotFound(context.contextId, secret.secretName, secret.secretVersion);
    }

    secretDoc.versions[found] = { ...secretDoc.versions[found], ...secret };
    coll.update(secretDoc);

    return secretDoc.versions[found];
  }

  public async getSecret(context: Context, secretName: string, secretVersion?: string): Promise<SecretModel> {
    const coll = this.db.getCollection(this.SECRETS_COLLECTION);
    const secretDoc = coll.findOne({
      secretName
    });

    if (!secretDoc) {
      throw KeyVaultErrorFactory.getSecretNotFound(context.contextId, secretName);
    }

    // If we have been provided a version, search for it.
    if (secretVersion && secretVersion !== "") {
      for (let i = 0; i < secretDoc.versions.length; i++) {
        if (secretDoc.versions[i].secretVersion = secretVersion) {
          if (secretDoc.versions[i].attributes.enabled === false) {
            throw KeyVaultErrorFactory.getDisabledSecret(context.contextId);
          }

          return secretDoc.versions[i] as SecretModel;
        }
      }

      throw KeyVaultErrorFactory.getSecretNotFound(context.contextId, secretName, secretVersion);
    }

    // Otherwise, get the latest by creation date
    const sortedVersions = this.sortVersionsByDate(secretDoc.versions);

    for (const sorted of sortedVersions) {
      if (sorted.attributes.enabled === true) {
        return sorted as SecretModel;
      }
    }

    throw KeyVaultErrorFactory.getDisabledSecret(context.contextId);
  }

  public async getSecrets(context: Context, maxResults: number, marker?: PaginationMarker): Promise<[SecretModel[], PaginationMarker?]> {
    const coll = this.db.getCollection(this.SECRETS_COLLECTION);
    const nextItem = marker!.itemIdentifier.name || "";

    const docs = await coll
      .chain()
      .where(obj => {
        return obj.secretName >= nextItem
      })
      .simplesort("secretName")
      .limit(maxResults + 1)
      .data();

    if (docs.length <= maxResults) {
      return [
        docs.map(doc => {
          const sortedVersions = this.sortVersionsByDate(doc.versions);
          for (const sorted of sortedVersions) {
            if (sorted.attributes.enabled === true) {
              return sorted as SecretModel;
            }
          }
          return sortedVersions[0];
        }),
        undefined
      ];
    } else {
      const nextIndex = docs.length - 1;
      const nextPaginationMarker: PaginationMarker = {
        index: nextIndex,
        itemIdentifier: {
          collection: "secret",
          name: docs[nextIndex].secretName
        }
      };

      docs.pop();

      return [
        docs.map(doc => {
          const sortedVersions = this.sortVersionsByDate(doc.versions);
          for (const sorted of sortedVersions) {
            if (sorted.attributes.enabled === true) {
              return sorted as SecretModel;
            }
          }
          return sortedVersions[0];
        }),
        nextPaginationMarker
      ];
    }
  }

  public async getSecretVersions(context: Context, secretName: string, maxResults: number, marker?: PaginationMarker): Promise<[SecretModel[], PaginationMarker?]> {
    const coll = this.db.getCollection(this.SECRETS_COLLECTION);
    const secretDoc = coll.findOne({
      secretName
    });

    if (!secretDoc) {
      throw KeyVaultErrorFactory.getSecretNotFound(context.contextId, secretName);
    }

    const version = marker ? marker.itemIdentifier.version! : "";

    const sortedVersions = this.sortVersionsByVersion(secretDoc.versions);

    let index = sortedVersions.findIndex(obj => obj.secretVersion >= version);

    if (index === -1) {
      index = 0;
    }

    let nextIndex = index + maxResults;

    const slicedVersions = sortedVersions.slice(index, nextIndex);

    if (sortedVersions.length < nextIndex) {
      return [sortedVersions, undefined];
    } else {
      const nextPaginationMarker: PaginationMarker = {
        index: nextIndex,
        itemIdentifier: {
          collection: "secret",
          name: secretDoc.secretName,
          version: sortedVersions[nextIndex].secretVersion
        }
      };

      return [slicedVersions, nextPaginationMarker];
    }
  }

  public async getDeletedSecret(context: Context, secretName: string): Promise<DeletedSecretModel> {
    const coll = this.db.getCollection(this.DELETEDSECRETS_COLLECTION);
    const deletedSecretDoc = coll.findOne({
      secretName
    });

    if (!deletedSecretDoc) {
      throw KeyVaultErrorFactory.getSecretNotFound(context.contextId, secretName);
    }

    return deletedSecretDoc;
  }
}