import { stat } from "fs";
import Loki from "lokijs";

import { rimrafAsync } from "../utils/utils";
import * as Models from "../generated/artifacts/models";
import Context from "../generated/Context";
import ISecretsMetadataStore, { DeletedSecretModel, DeleteSecretProperties, SecretModel } from "./ISecretsMetadataStore";
import KeyVaultErrorFactory from "../errors/KeyVaultErrorFactory";
import { PaginationMarker } from "../utils/pagination";

/**
 * This is a metadata source implementation for secrets based on loki DB.
 *
 * Loki DB includes following collections and documents:
 *
 * -- SECRETS_COLLECTION                  // Collection contains all secrets
 *                                        // Default collection name is $SECRETS_COLLECTION$
 *                                        // Each document maps to a secret
 *                                        // Unique document properties: name
 * 
 * -- SECRET_VERSIONS_COLLECTION          // Collection contains all secret versions
 *                                        // Default collection name is $SECRET_VERSIONS_COLLECTION$
 *                                        // Each document maps to a secret version
 *                                        // Unique document properties: version
 * 
 * -- DELETEDSECRETS_COLLECTION           // Collection contains all deleted secrets
 *                                        // Default collection name is $DELETEDSECRETS_COLLECTION$
 *                                        // Each document maps to a deleted secret
 *                                        // Unique document properties: name
 * 
 * -- DELETEDSECRET_VERSIONS_COLLECTION   // Collection contains all deleted secret versions
 *                                        // Default collection name is $DELETEDSECRET_VERSIONS_COLLECTION$
 *                                        // Each document maps to a deleted secret version
 *                                        // Unique document properties: version
 *
 * @export
 * @class LokiSecretsMetadataStore
 */
export default class LokiSecretsMetadataStore
  implements ISecretsMetadataStore {
  private readonly db: Loki;

  private initialized: boolean = false;
  private closed: boolean = true;
  private clearEnabled: boolean = false;
  

  private readonly SECRETS_COLLECTION = "$SECRETS_COLLECTION$";
  private readonly SECRET_VERSIONS_COLLECTION = "$SECRET_VERSIONS_COLLECTION$";
  private readonly DELETEDSECRETS_COLLECTION = "$DELETEDSECRETS_COLLECTION$";
  private readonly DELETEDSECRET_VERSIONS_COLLECTION = "$DELETEDSECRET_VERSIONS_COLLECTION$";

  public constructor(public readonly lokiDBPath: string, private readonly runningTests: boolean = false) {
    this.db = new Loki(lokiDBPath, {
      autosave: true,
      autosaveInterval: 5000
    });
    this.clearEnabled = runningTests;
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
        unique: ["name"],
        // Optimization for indexing and searching
        indices: ["name", "version"]
      });
    }

    // Create secret versions collection if not exists
    let secretVersionsColl = this.db.getCollection(this.SECRET_VERSIONS_COLLECTION);
    if (secretVersionsColl === null) {
      secretsColl = this.db.addCollection(this.SECRET_VERSIONS_COLLECTION, {
        unique: ["version"],
        // Optimization for indexing and searching
        indices: ["secretId", "version"]
      });
    }

    // Create deletedsecrets collection if not exists
    let deletedSecretsColl = this.db.getCollection(this.DELETEDSECRETS_COLLECTION);
    if (deletedSecretsColl === null) {
      deletedSecretsColl = this.db.addCollection(this.DELETEDSECRETS_COLLECTION, {
        unique: ["name"],
        // Optimization for indexing and searching
        indices: ["name"]
      });
    }

    // Create deletedsecret versions collection if not exists
    let deletedSecretVersionsColl = this.db.getCollection(this.DELETEDSECRET_VERSIONS_COLLECTION);
    if (deletedSecretVersionsColl === null) {
      deletedSecretVersionsColl = this.db.addCollection(this.DELETEDSECRET_VERSIONS_COLLECTION, {
        unique: ["version"],
        // Optimization for indexing and searching
        indices: ["deletedSecretId", "version"]
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
  }

  /**
   * Clear all collections in LokiSecretsMetadataStore.
   *
   * @returns {Promise<void>}
   * @memberof LokiSecretsMetadataStore
   */
  public async clear(): Promise<void> {
    if (this.clearEnabled === false) {
      throw new Error(`Cannot clear LokiSecretsMetadataStore, the option is not enabled.`);
    }

    for (const collection of [
      this.SECRETS_COLLECTION,
      this.SECRET_VERSIONS_COLLECTION,
      this.DELETEDSECRETS_COLLECTION,
      this.DELETEDSECRET_VERSIONS_COLLECTION
    ]) {
      this.db.getCollection(collection).clear();
    }
  }

  private compareStringsIgnoreCase(a: string, b: string) {
    return a.localeCompare(b, undefined, { sensitivity: 'accent' });
  }

  private sortByDate(a: any, b: any) {
    return new Date(b.attributes.created).getTime() - new Date(a.attributes.created).getTime();
  }

  private stripLokiMeta(doc: any): any {
    delete doc.$loki;
    delete doc.meta;
    return doc;
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
    const versionsColl = this.db.getCollection(this.SECRET_VERSIONS_COLLECTION);
      
    let secretDoc = coll.findOne({
      'name': { '$regex': [`^${secret.name}$`, 'i'] } // case-insensitive search
    })

    if (!secretDoc) {
      secretDoc = coll.insert({ name: secret.name });
    }

    const secretId = secretDoc.$loki;
    const name = secretDoc.name; // Always use original name

    return versionsColl.insertOne({
      ...secret,
      name,
      secretId
    });
  }

  public async deleteSecret(context: Context, secretName: string, properties: DeleteSecretProperties, disableSoftDelete: boolean): Promise<DeletedSecretModel> {
    const coll = this.db.getCollection(this.SECRETS_COLLECTION);
    const versionsColl = this.db.getCollection(this.SECRET_VERSIONS_COLLECTION);

    const doc = coll.findOne({
      'name': { '$regex': [`^${secretName}$`, 'i'] } // case-insensitive search
    });

    if (!doc) {
      throw KeyVaultErrorFactory.getSecretNotFound(context.contextId, secretName);
    }

    let deletedDoc = { ...doc, ...properties };

    const versions = versionsColl
      .chain()
      .find({
        'secretId': { '$eq': doc.$loki }
      })
      .sort(this.sortByDate)
      .data();

    // Add to deletedsecrets as long as soft-delete is enabled
    if (disableSoftDelete === false) {
      const deletedColl = this.db.getCollection(this.DELETEDSECRETS_COLLECTION);
      const deletedVersionsColl = this.db.getCollection(this.DELETEDSECRET_VERSIONS_COLLECTION);

      deletedDoc = this.stripLokiMeta(deletedDoc);
      deletedDoc = deletedColl.insertOne(deletedDoc);

      let deletedVersions = versions.map(v => {
        v = this.stripLokiMeta(v);
        v.deletedSecretId = deletedDoc.$loki;
        delete v.secretId;
        return v;
      });

      deletedVersionsColl.insert(deletedVersions);
    }

    // remove secret and versions
    coll.remove(doc);
    for (let version of versions) {
      versionsColl.remove(version);
    }

    return { ...versions[0], ...deletedDoc };
  }

  public async updateSecret(context: Context, secret: SecretModel): Promise<SecretModel> {
    const coll = this.db.getCollection(this.SECRETS_COLLECTION);
    const versionsColl = this.db.getCollection(this.SECRET_VERSIONS_COLLECTION);

    const doc = coll.findOne({
      'name': { '$regex': [`^${secret.name}$`, 'i'] }, // case-insensitive search
    });

    if (!doc) {
      throw KeyVaultErrorFactory.getSecretNotFound(context.contextId, secret.name);
    }

    let result;

    if (secret.version !== "") {
      result = versionsColl.findOne({
        'version': { '$regex': [`^${secret.version}$`, 'i'] }, // case-insensitive search
        'secretId': { '$eq': doc.$loki }
      });

      if (!result) {
        throw KeyVaultErrorFactory.getSecretNotFound(context.contextId, secret.name, secret.version);
      }
    } else {
      // Otherwise sort by created date and limit by enabled
      const latest = versionsColl
        .chain()
        .find({
          'secretId': { '$eq': doc.$loki }
        })
        .sort(this.sortByDate)
        .limit(1)
        .data();

      if (latest.length === 0) {
        throw KeyVaultErrorFactory.getDisabledSecret(context.contextId);
      }

      result = latest[0];
    }

    const updatedDoc = {
      secretId: result.secretId,
      name: doc.name,
      version: result.version,
      contentType: secret.contentType !== undefined ? secret.contentType : result.contentType,
      tags: secret.tags || result.tags,
      attributes: {
        created: result.attributes.created,
        updated: secret.attributes?.updated,
        enabled: secret.attributes?.enabled !== undefined ? secret.attributes?.enabled : result.attributes.enabled,
        expires: secret.attributes?.expires !== undefined ? secret.attributes?.expires : result.attributes.expires,
        notBefore: secret.attributes?.notBefore !== undefined ? secret.attributes?.notBefore : result.attributes.notBefore,
      },
      $loki: result.$loki,
      meta: result.meta
    };

    return versionsColl.update(updatedDoc);
  }

  public async getSecret(context: Context, secretName: string, secretVersion?: string): Promise<SecretModel> {
    const coll = this.db.getCollection(this.SECRETS_COLLECTION);
    const versionsColl = this.db.getCollection(this.SECRET_VERSIONS_COLLECTION);

    const secretDoc = coll.findOne({
      'name': { '$regex': [`^${secretName}$`, 'i'] } // case-insensitive search
    });
    

    if (!secretDoc) {
      throw KeyVaultErrorFactory.getSecretNotFound(context.contextId, secretName);
    }

    const secretId = secretDoc.$loki;

    let result;

    if (secretVersion) {
      result = versionsColl.findOne({
        'version': { '$regex': [`^${secretVersion}$`, 'i'] }, // case-insensitive search
        'secretId': { '$eq': secretId }
      });

      if (!result) {
        throw KeyVaultErrorFactory.getSecretNotFound(context.contextId, secretName, secretVersion);
      }
      else if (result.attributes.enabled === false) {
        throw KeyVaultErrorFactory.getDisabledSecret(context.contextId);
      }

      return result as SecretModel;
    }

    // Get latest version 
    result = versionsColl
      .chain()
      .find({
        'secretId': { '$eq': secretId }
      })
      .sort(this.sortByDate)
      .limit(1)
      .data();

    // If latest version is disabled, then throw disabled error
    if (result.length === 0 || result[0].attributes.enabled === false) {
      throw KeyVaultErrorFactory.getDisabledSecret(context.contextId);
    }

    return result[0] as SecretModel;
  }

  public async getSecrets(context: Context, maxResults: number, marker?: PaginationMarker): Promise<[SecretModel[], PaginationMarker?]> {
    const coll = this.db.getCollection(this.SECRETS_COLLECTION);
    const versionsColl = this.db.getCollection(this.SECRET_VERSIONS_COLLECTION);

    const nextItem = marker !== undefined ? marker.itemIdentifier.name : "";

    const docs = coll
      .chain()
      .where(obj => this.compareStringsIgnoreCase(obj.name, nextItem) >= 0)
      .simplesort("name")
      .limit(maxResults + 1)
      .data();

    let results = docs.map(doc => {
      const result = versionsColl
        .chain()
        .find({
          'secretId': { '$eq': doc.$loki }
        })
        .sort(this.sortByDate)
        .limit(1)
        .data();

      return result[0] || null;
    });

    let nextPaginationMarker: PaginationMarker | undefined;

    if (docs.length > maxResults) {
      const nextItem = results.pop();

      nextPaginationMarker = {
        index: nextItem.$loki,
        itemIdentifier: {
          collection: "secret",
          name: nextItem.name
        }
      };
    }

    return [
      results,
      nextPaginationMarker
    ];
  }

  public async getSecretVersions(context: Context, secretName: string, maxResults: number, marker?: PaginationMarker): Promise<[SecretModel[], PaginationMarker?]> {
    const coll = this.db.getCollection(this.SECRETS_COLLECTION);
    const versionsColl = this.db.getCollection(this.SECRET_VERSIONS_COLLECTION);

    const secretDoc = coll.findOne({
      'name': { '$regex': [`^${secretName}$`, 'i'] } // case-insensitive search
    });

    if (!secretDoc) {
      throw KeyVaultErrorFactory.getSecretNotFound(context.contextId, secretName);
    }

    const nextItem = marker ? marker.itemIdentifier.version! : "";

    let results = versionsColl
      .chain()
      .find({
        'secretId': { '$eq': secretDoc.$loki }
      })
      .where(obj => this.compareStringsIgnoreCase(obj.version, nextItem) >= 0)
      .simplesort('version')
      .limit(maxResults + 1)
      .data();

    let nextPaginationMarker: PaginationMarker | undefined;

    if (results.length > maxResults) {
      const nextItem = results.pop();

      nextPaginationMarker = {
        index: nextItem.$loki,
        itemIdentifier: {
          collection: "secret",
          name: secretDoc.name,
          version: nextItem.version,
        }
      };
    }

    return [
      results,
      nextPaginationMarker
    ];
  }

  public async getDeletedSecret(context: Context, secretName: string): Promise<DeletedSecretModel> {
    const coll = this.db.getCollection(this.DELETEDSECRETS_COLLECTION);
    const versionsColl = this.db.getCollection(this.DELETEDSECRET_VERSIONS_COLLECTION);

    const deletedSecretDoc = coll.findOne({
      'name': { '$regex': [`^${secretName}$`, 'i'] } // case-insensitive search
    });

    if (!deletedSecretDoc) {
      throw KeyVaultErrorFactory.getDeletedSecretNotFound(context.contextId, secretName);
    }

    const result = versionsColl
      .chain()
      .find({
        'secretId': { '$eq': deletedSecretDoc.$loki }
      })
      .sort(this.sortByDate)
      .limit(1)
      .data();

    if (result.length === 0 || result[0].attributes.enabled === false) {
      throw KeyVaultErrorFactory.getDisabledSecret(context.contextId);
    }

    return result[0];
  }

  public async deletedSecretExists(context: Context, secretName: string): Promise<boolean> {
    const coll = this.db.getCollection(this.DELETEDSECRETS_COLLECTION);

    const deletedSecretDoc = coll.findOne({
      'name': { '$regex': [`^${secretName}$`, 'i'] } // case-insensitive search
    });

    if (deletedSecretDoc) {
      return true;
    }

    return false;
  }

  public async secretExists(context: Context, secretName: string): Promise<boolean> {
    const coll = this.db.getCollection(this.SECRETS_COLLECTION);

    const secretDoc = coll.findOne({
      'name': { '$regex': [`^${secretName}$`, 'i'] } // case-insensitive search
    });

    if (secretDoc) {
      return true;
    }

    return false;
  }
}
