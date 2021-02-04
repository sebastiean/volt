import {
  SecretClient
} from "@azure/keyvault-secrets";

import { configLogger } from "../../../src/Logger";
import VoltTestServerFactory from "../../VoltTestServerFactory";
import { SimpleTokenCredential } from "../../SimpleTokenCredential";

import {
  getUniqueName,
  generateJWTToken,
  MD5_REGEX
} from "../../testutils";

import { v4 as uuid } from "uuid";

import { expect } from 'chai';
import md5 from "md5";

// Set true to enable debug log
configLogger(false);

describe("Secrets API", () => {
  const factory = new VoltTestServerFactory();
  let server = factory.createServer(false, false, true, "basic");
  const baseURL = `https://${server.config.host}:${server.config.port}`;

  const token = generateJWTToken(
    new Date("2019/01/01"),
    new Date("2019/01/01"),
    new Date("2100/01/01"),
    "https://sts.windows-ppe.net/ab1f708d-50f6-404c-a006-d71b2ac7a606/",
    "https://vault.azure.net",
    uuid()
  );

  const secretClient = new SecretClient(
    baseURL,
    new SimpleTokenCredential(token),
    {
      retryOptions: { maxRetries: 1 },
      // Make sure socket is closed once the operation is done.
      keepAliveOptions: { enable: false }
    }
  );

  let secretName: string = getUniqueName("secret");
  let secretVersion: string = "";
  const secretValue: string = "value";

  before(async () => {
    await server.start();
  });

  after(async () => {
    await server.close();
    await server.clean();
  });

  beforeEach(async () => {
    secretName = getUniqueName("secret");
    const result = await secretClient.setSecret(secretName, secretValue);
    secretVersion = result.properties.version!;
  });

  afterEach(async () => {
    await server.clear();
  });

  it("getSecret latest version @loki", async () => {
    const result = await secretClient.getSecret(secretName);

    expect(result.name).to.equal(secretName);
    expect(result.value).to.equal(secretValue);
    expect(result.properties.enabled).to.equal(true);
    expect(result.properties.vaultUrl).to.equal(baseURL);
    expect(result.properties.id).to.be.a('string').and.satisfy((id: string) => id.startsWith(`${baseURL}/secrets/${secretName}/`));
    expect(result.properties.version).to.be.a('string').and.match(MD5_REGEX);
    expect(result.properties.version).to.equal(secretVersion);
  });

  it("getSecret specific version @loki", async () => {
    const result = await secretClient.getSecret(secretName, { version: secretVersion });

    expect(result.name).to.equal(secretName);
    expect(result.value).to.equal(secretValue);
    expect(result.properties.enabled).to.equal(true);
    expect(result.properties.vaultUrl).to.equal(baseURL);
    expect(result.properties.id).to.be.a('string').and.satisfy((id: string) => id.startsWith(`${baseURL}/secrets/${secretName}/`));
    expect(result.properties.version).to.be.a('string').and.match(MD5_REGEX);
    expect(result.properties.version).to.equal(secretVersion);
  });

  it("setSecret new version then getSecret should be latest version @loki", async () => {
    await secretClient.setSecret(secretName, "new version");

    const result = await secretClient.getSecret(secretName);

    expect(result.name).to.equal(secretName);
    expect(result.value).to.equal("new version");
    expect(result.properties.version).to.not.equal(secretVersion);
  });

  it("getSecret does not exist @loki", async () => {
    try {
      await secretClient.getSecret("doesnotexist");
    } catch (err) {
      expect(err.statusCode).to.equal(404);
      expect(err.message).to.include("A secret with (name/id) doesnotexist was not found in this key vault.");
      return;
    }
    expect.fail();
  });

  it("getSecret version does not exist @loki", async () => {
    const version = md5(uuid());

    try {
      await secretClient.getSecret(secretName, { version });
    } catch (err) {
      expect(err.statusCode).to.equal(404);
      expect(err.message).to.include(`A secret with (name/id) ${secretName}/${version} was not found in this key vault.`);
      return;
    }
    expect.fail();
  });

  it("updateSecret set content-type @loki", async () => {
    await secretClient.updateSecretProperties(secretName, secretVersion, {
      contentType: "application/test"
    });

    const result = await secretClient.getSecret(secretName, { version: secretVersion });

    expect(result.name).to.equal(secretName);
    expect(result.properties.version).to.equal(secretVersion);
    expect(result.properties.contentType).to.equal("application/test");
  });

  it("updateSecret set tags @loki", async () => {
    await secretClient.updateSecretProperties(secretName, secretVersion, {
      tags: {
        "test1": "value1",
        "test2": "value2"
      }
    });

    const result = await secretClient.getSecret(secretName, { version: secretVersion });

    expect(result.name).to.equal(secretName);
    expect(result.properties.version).to.equal(secretVersion);
    expect(result.properties.tags).to.have.property("test1", "value1");
    expect(result.properties.tags).to.have.property("test2", "value2");
  });

  it("updateSecret set expires @loki", async () => {
    let expires = new Date();
    expires.setDate(expires.getDate() + 7);

    await secretClient.updateSecretProperties(secretName, secretVersion, {
      expiresOn: expires
    });

    // Key Vault uses epoch with seconds precision
    const expectedExpires = new Date(expires.getTime());
    expectedExpires.setMilliseconds(0);

    const result = await secretClient.getSecret(secretName, { version: secretVersion });

    expect(result.name).to.equal(secretName);
    expect(result.properties.version).to.equal(secretVersion);
    expect(result.properties.expiresOn).to.deep.equal(expectedExpires);
  });

  it("updateSecret set notBefore @loki", async () => {
    let notBefore = new Date();
    notBefore.setDate(notBefore.getDate() + 7);

    await secretClient.updateSecretProperties(secretName, secretVersion, {
      notBefore
    });

    // Key Vault uses epoch with seconds precision
    const expectedNotBefore = new Date(notBefore.getTime());
    expectedNotBefore.setMilliseconds(0);

    const result = await secretClient.getSecret(secretName, { version: secretVersion });

    expect(result.name).to.equal(secretName);
    expect(result.properties.version).to.equal(secretVersion);
    expect(result.properties.notBefore).to.deep.equal(expectedNotBefore);
  });

  it("updateSecret disable secret should throw error on getSecret @loki", async () => {
    await secretClient.updateSecretProperties(secretName, secretVersion, {
      enabled: false
    });

    try {
      await secretClient.getSecret(secretName);
    } catch (err) {
      expect(err.statusCode).to.equal(403);
      expect(err.message).to.include("Operation get is not allowed on a disabled secret.");
      return;
    }
    expect.fail();
  });

  it("updateSecret disable latest version should throw error on getSecret @loki", async () => {
    const latest = await secretClient.setSecret(secretName, "latest version");

    // disable latest version
    await secretClient.updateSecretProperties(secretName, latest.properties.version!, {
      enabled: false
    });

    try {
      await secretClient.getSecret(secretName);
    } catch (err) {
      expect(err.statusCode).to.equal(403);
      expect(err.message).to.include("Operation get is not allowed on a disabled secret.");
      return;
    }
    expect.fail();
  });

  it("updateSecret disable old version should return latest on getSecret @loki", async () => {
    const latest = await secretClient.setSecret(secretName, "latest version");

    // disable latest version
    await secretClient.updateSecretProperties(secretName, secretVersion, {
      enabled: false
    });

    const result = await secretClient.getSecret(secretName);

    expect(result.name).to.equal(secretName);
    expect(result.value).to.equal("latest version");
    expect(result.properties.version).to.equal(latest.properties.version!);
  });

  it("deleteSecret should delete secret with correct response @loki", async () => {
    const now = new Date();

    const poller = await secretClient.beginDeleteSecret(secretName);
    const result = await poller.pollUntilDone();

    const recoverableDays = result.properties.recoverableDays!;

    const expectedPurgeDate = new Date();
    expectedPurgeDate.setDate(now.getDate() + recoverableDays);
    expectedPurgeDate.setMilliseconds(0);

    expect(result.name).to.equal(secretName);
    expect(result.properties.version).to.equal(secretVersion);
    expect(result.properties.recoveryId).to.be.a('string').and.to.equal(`${baseURL}/deletedsecrets/${secretName}`);
    expect(recoverableDays).to.be.a('number');
    expect(recoverableDays).to.be.gte(7).and.lte(90);
    // Expect scheduled purge date to be within 1 seconds, allowing for request latency
    expect(result.properties.scheduledPurgeDate).to.be.closeToTime(expectedPurgeDate, 1);
    expect(result.properties.deletedOn).to.equalDate(now);
  });

  it("deleteSecret error should be thrown when getSecret is called on deleted secret @loki", async () => {
    const poller = await secretClient.beginDeleteSecret(secretName);
    await poller.pollUntilDone();

    try {
      await secretClient.getSecret(secretName);
    } catch (err) {
      expect(err.statusCode).to.equal(404);
      expect(err.message).to.include(`A secret with (name/id) ${secretName} was not found in this key vault.`);
      return;
    }
    expect.fail();
  });

  it("deleteSecret error should be thrown when setSecret is called on deleted secret @loki", async () => {
    const poller = await secretClient.beginDeleteSecret(secretName);
    await poller.pollUntilDone();

    try {
      await secretClient.setSecret(secretName, "new value");
    } catch (err) {
      expect(err.statusCode).to.equal(409);
      expect(err.code).to.equal("Conflict")
      expect(err.message).to.include(`Secret ${secretName} is currently in a deleted but recoverable state, and its name cannot be reused; in this state, the secret can only be recovered or purged.`);
      return;
    }
    expect.fail();
  });

  it("deleteSecret error should be thrown when updateSecret is called on deleted secret @loki", async () => {
    const poller = await secretClient.beginDeleteSecret(secretName);
    await poller.pollUntilDone();

    try {
      await secretClient.updateSecretProperties(secretName, secretVersion, {
        tags: { "test1": "value1" }
      });
    } catch (err) {
      expect(err.statusCode).to.equal(409);
      expect(err.code).to.equal("Conflict")
      expect(err.message).to.include(`Secret ${secretName} is currently in a deleted but recoverable state, and its name cannot be reused; in this state, the secret can only be recovered or purged.`);
      return;
    }
    expect.fail();
  });

  it("deleteSecret error should be thrown when secret does not exist @loki", async () => {
    try {
      await secretClient.beginDeleteSecret("nonexistant");
    } catch (err) {
      expect(err.statusCode).to.equal(404);
      expect(err.message).to.include("A secret with (name/id) nonexistant was not found in this key vault.");
      return;
    }
    expect.fail();
  });

  it("getDeletedSecret error should be thrown when deletedsecret does not exist @loki", async () => {
    try {
      await secretClient.getDeletedSecret("nonexistant");
    } catch (err) {
      expect(err.statusCode).to.equal(404);
      expect(err.message).to.include("Deleted Secret not found: nonexistant");
      return;
    }
    expect.fail();
  });

  it("getDeletedSecret error should be thrown when latest version is disabled @loki", async () => {
    // disable secret
    await secretClient.updateSecretProperties(secretName, secretVersion, {
      enabled: false
    });

    const poller = await secretClient.beginDeleteSecret(secretName);
    await poller.pollUntilDone();

    try {
      await secretClient.getDeletedSecret(secretName);
    } catch (err) {
      expect(err.statusCode).to.equal(403);
      expect(err.code).to.equal("Forbidden");
      expect(err.message).to.equal("Operation get is not allowed on a disabled secret.");
      return;
    }
    expect.fail();
  });

  it("getSecrets correctly returns expected reponse @loki", async () => {
    // setup
    for (let i = 0; i < 9; i++) {
      await secretClient.setSecret(getUniqueName("secret"), getUniqueName("value"));
    }

    let result = [];

    for await (let secretProperties of secretClient.listPropertiesOfSecrets()) {
      result.push(secretProperties);
    }

    expect(result).to.have.length(10);
    expect(result[0].name).to.equal(secretName);
    expect(result[0].enabled).to.equal(true);
    expect(result[0].vaultUrl).to.equal(baseURL);
    expect(result[0].id).to.be.a('string').and.satisfy((id: string) => id.startsWith(`${baseURL}/secrets/${secretName}/`));
    expect(result[0].version).to.be.a('string').and.match(MD5_REGEX);
    expect(result[0].version).to.equal(secretVersion);
  });

  it("getSecretVersions correctly returns expected reponse @loki", async () => {
    // setup
    for (let i = 0; i < 9; i++) {
      await secretClient.setSecret(secretName, getUniqueName("value"));
    }

    let result = [];

    for await (let secretVersionProperties of secretClient.listPropertiesOfSecretVersions(secretName)) {
      result.push(secretVersionProperties);
    }

    expect(result).to.have.length(10);
    // @ts-ignore
    expect(result).to.be.ascendingBy("version")

    expect(result[0].name).to.equal(secretName);
    expect(result[0].enabled).to.equal(true);
    expect(result[0].vaultUrl).to.equal(baseURL);
    expect(result[0].id).to.be.a('string').and.satisfy((id: string) => id.startsWith(`${baseURL}/secrets/${secretName}/`));
    expect(result[0].version).to.be.a('string').and.match(MD5_REGEX);
  });
   it(`Should work using HTTPS endpoint @loki`, async () => {
    const token = generateJWTToken(
      new Date("2019/01/01"),
      new Date("2019/01/01"),
      new Date("2100/01/01"),
      "https://sts.windows-ppe.net/ab1f708d-50f6-404c-a006-d71b2ac7a606/",
      "https://vault.azure.net",
      uuid()
    );

    const secretClient = new SecretClient(
      baseURL,
      new SimpleTokenCredential(token),
      {
        retryOptions: { maxRetries: 1 },
        // Make sure socket is closed once the operation is done.
        keepAliveOptions: { enable: false },
      }
    );

    const secretName: string = getUniqueName("1-secret-");
    const secretValue: string = getUniqueName("1-value-");

    await secretClient.setSecret(secretName, secretValue);
    await secretClient.beginDeleteSecret(secretName);
  });

  it("getSecret returns corresponding secret @loki", async () => {
    // setup
    const secretName: string = "testname";
    const secretValue: string = "testvalue";

    await secretClient.setSecret(secretName, secretValue);
    await secretClient.setSecret("test", "value");

    const result = await secretClient.getSecret("test");

    expect(result.name).to.not.equal(secretName);
    expect(result.value).to.not.equal(secretValue);
  });
});
