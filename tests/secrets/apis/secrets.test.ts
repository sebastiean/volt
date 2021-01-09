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
    await secretClient.beginDeleteSecret(secretName);
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

  it("updateSecret disable @loki", async () => {
    await secretClient.setSecret(secretName, "new version");

    const result = await secretClient.getSecret(secretName);

    expect(result.name).to.equal(secretName);
    expect(result.value).to.equal("new version");
    expect(result.properties.version).to.not.equal(secretVersion);
  });
});