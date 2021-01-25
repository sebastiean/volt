import {
  SecretClient
} from "@azure/keyvault-secrets";

import { configLogger } from "../../src/Logger";
import VoltTestServerFactory from "../VoltTestServerFactory";
import { SimpleTokenCredential } from "../SimpleTokenCredential";

import {
  getUniqueName,
  generateJWTToken
} from "../testutils";

import { v4 as uuid } from "uuid";

import { expect } from 'chai';

// Set true to enable debug log
configLogger(false);

describe("Secrets OAuth Basic", () => {
  const factory = new VoltTestServerFactory();
  let server = factory.createServer(false, false, true, "basic");
  const baseURL = `https://${server.config.host}:${server.config.port}`;

  before(async () => {
    await server.start();
  });

  after(async () => {
    await server.close();
    await server.clean();
  });

  afterEach(async () => {
    await server.clear();
  });

  it(`Should work with set secret @loki`, async () => {
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

    const secretName: string = getUniqueName("1-secret-");
    const secretValue: string = getUniqueName("1-value-");

    await secretClient.setSecret(secretName, secretValue);
  });

  it(`Should not work with invalid JWT token @loki`, async () => {
    const secretClient = new SecretClient(
      baseURL,
      new SimpleTokenCredential("invalid token"),
      {
        retryOptions: { maxRetries: 1 },
        // Make sure socket is closed once the operation is done.
        keepAliveOptions: { enable: false }
      }
    );

    const secretName: string = getUniqueName("1-secret-");
    const secretValue: string = getUniqueName("1-value-");

    try {
      await secretClient.setSecret(secretName, secretValue);
    } catch (err) {
      expect(err.message).to.include("Unable to parse JWT token");
      return;
    }
    expect.fail();
  });

  it(`Should work with valid audiences @loki`, async () => {
    const audiences = [
      "https://vault.azure.net",
      "https://vault.azure.net/"
    ];

    for (const audience of audiences) {
      const token = generateJWTToken(
        new Date("2019/01/01"),
        new Date("2019/01/01"),
        new Date("2100/01/01"),
        "https://sts.windows-ppe.net/ab1f708d-50f6-404c-a006-d71b2ac7a606/",
        audience,
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

      const secretName: string = getUniqueName("1-secret-");
      const secretValue: string = getUniqueName("1-value-");

      await secretClient.setSecret(secretName, secretValue);
    }
  });

  it(`Should not work with invalid audiences @loki`, async () => {
    const token = generateJWTToken(
      new Date("2019/01/01"),
      new Date("2019/01/01"),
      new Date("2100/01/01"),
      "https://sts.windows-ppe.net/ab1f708d-50f6-404c-a006-d71b2ac7a606/",
      "https://invalidaudience.azure.net",
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

    const secretName: string = getUniqueName("1-secret-");
    const secretValue: string = getUniqueName("1-value-");

    try {
      await secretClient.setSecret(secretName, secretValue);
    } catch (err) {
      expect(err.message).to.include("Error validating token: IDX10501");
      return;
    }
    expect.fail();
  });

  it(`Should work with valid issuers @loki`, async () => {
    const issuerPrefixes = [
      "https://sts.windows.net/",
      "https://sts.microsoftonline.de/",
      "https://sts.chinacloudapi.cn/",
      "https://sts.windows-ppe.net"
    ];

    for (const issuerPrefix of issuerPrefixes) {
      const token = generateJWTToken(
        new Date("2019/01/01"),
        new Date("2019/01/01"),
        new Date("2100/01/01"),
        `${issuerPrefix}/ab1f708d-50f6-404c-a006-d71b2ac7a606/`,
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

      const secretName: string = getUniqueName("1-secret-");
      const secretValue: string = getUniqueName("1-value-");

      await secretClient.setSecret(secretName, secretValue);
    }
  });

  it(`Should not work with invalid issuers @loki`, async () => {
    const token = generateJWTToken(
      new Date("2019/01/01"),
      new Date("2019/01/01"),
      new Date("2100/01/01"),
      "https://invalidissuer/ab1f708d-50f6-404c-a006-d71b2ac7a606/",
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

    const secretName: string = getUniqueName("1-secret-");
    const secretValue: string = getUniqueName("1-value-");

    try {
      await secretClient.setSecret(secretName, secretValue);
    } catch (err) {
      expect(err.message).to.include("Error validating token: IDX10501");
      return;
    }
    expect.fail();
  });

  it(`Should not work with invalid nbf @loki`, async () => {
    const token = generateJWTToken(
      new Date("2119/01/01"),
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

    const secretName: string = getUniqueName("1-secret-");
    const secretValue: string = getUniqueName("1-value-");

    try {
      await secretClient.setSecret(secretName, secretValue);
    } catch (err) {
      expect(err.message).to.include("Error validating token: IDX10501");
      return;
    }
    expect.fail();
  });

  it(`Should not work with invalid exp @loki`, async () => {
    const token = generateJWTToken(
      new Date("2119/01/01"),
      new Date("2019/01/01"),
      new Date("2019/01/01"),
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

    const secretName: string = getUniqueName("1-secret-");
    const secretValue: string = getUniqueName("1-value-");

    try {
      await secretClient.setSecret(secretName, secretValue);
    } catch (err) {
      expect(err.message).to.include("Error validating token: IDX10501");
      return;
    }
    expect.fail();
  });

  it(`Should not work with HTTP @loki`, async () => {
    await server.close();
    await server.clean();

    server = factory.createServer(false, false, false, "basic");
    await server.start();

    const httpBaseURL = `http://${server.config.host}:${server.config.port}`;

    const token = generateJWTToken(
      new Date("2019/01/01"),
      new Date("2019/01/01"),
      new Date("2100/01/01"),
      "https://sts.windows-ppe.net/ab1f708d-50f6-404c-a006-d71b2ac7a606/",
      "https://vault.azure.net",
      uuid()
    );

    const secretClient = new SecretClient(
      httpBaseURL,
      new SimpleTokenCredential(token),
      {
        retryOptions: { maxRetries: 1 },
        // Make sure socket is closed once the operation is done.
        keepAliveOptions: { enable: false }
      }
    );

    const secretName: string = getUniqueName("1-secret-");
    const secretValue: string = getUniqueName("1-value-");

    try {
      await secretClient.setSecret(secretName, secretValue);
    } catch (err) {
      expect(err.message).to.include("The resource address for authorization must use the 'https' protocol");
      return;
    }
    expect.fail();
  });
});
