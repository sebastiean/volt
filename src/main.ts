#!/usr/bin/env node
import { access } from "fs";
import { dirname, join } from "path";
import { promisify } from "util";

import VoltServer from "./VoltServer";
import SecretsConfiguration from "./SecretsConfiguration";
import IEnvironment from "./IEnvironment";
import Environment from "./Environment";
import { DEFAULT_SECRETS_LOKI_DB_PATH } from "./utils/constants";

const accessAsync = promisify(access);

function shutdown(
  secretsServer: VoltServer
) {
  const secretsBeforeCloseMessage = `Volt Secrets service is closing...`;
  const secretsAfterCloseMessage = `Volt Secrets service successfully closed`;

  console.log(secretsBeforeCloseMessage);
  secretsServer.close().then(() => {
    console.log(secretsAfterCloseMessage);
  });
}

/**
 * Entry for Volt services.
 */
async function main() {
  // Initialize and validate environment values from command line parameters
  const env = new Environment();

  const location = await env.location();
  await accessAsync(location);

  const debugFilePath = await env.debug();
  if (debugFilePath !== undefined) {
    await accessAsync(dirname(debugFilePath!));
  }

  const config = new SecretsConfiguration(
    env.secretsHost(),
    env.secretsPort(),
    join(location, DEFAULT_SECRETS_LOKI_DB_PATH),
    !env.silent(),
    undefined,
    debugFilePath !== undefined,
    debugFilePath,
    env.loose(),
    env.skipApiVersionCheck(),
    env.cert(),
    env.key(),
    env.pwd(),
    env.oauth()
  );

  // Create server instance
  const secretsServer = new VoltServer(config);

  // Start server
  console.log(
    `Volt Secrets service is starting at ${config.getHttpServerAddress()}`
  );
  await secretsServer.start();
  console.log(
    `Volt Secrets service is successfully listening at ${secretsServer.getHttpServerAddress()}`
  );

  // Handle close event

  process
    .once("message", (msg) => {
      if (msg === "shutdown") {
        shutdown(secretsServer);
      }
    })
    .once("SIGINT", () => shutdown(secretsServer))
    .once("SIGTERM", () => shutdown(secretsServer));
}

main().catch((err) => {
  console.error(`Exit due to unhandled error: ${err.message}`);
  process.exit(1);
});