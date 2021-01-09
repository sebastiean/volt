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

// Set true to enable debug log
configLogger(false);

describe("Secrets HTTPS (OAuth)", () => {
  const factory = new VoltTestServerFactory();
  const server = factory.createServer(false, false, true, "basic");
  const baseURL = `https://${server.config.host}:${server.config.port}`;

  before(async () => {
    await server.start();
  });

  after(async () => {
    await server.close();
    await server.clean();
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
        keepAliveOptions: { enable: false }
      }
    );

    const secretName: string = getUniqueName("1-secret-");
    const secretValue: string = getUniqueName("1-value-");

    await secretClient.setSecret(secretName, secretValue);
    await secretClient.beginDeleteSecret(secretName);
  });
});
