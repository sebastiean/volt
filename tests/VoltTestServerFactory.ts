import SecretsConfiguration from "../src/SecretsConfiguration";
import VoltServer from "../src/VoltServer";

export default class VoltTestServerFactory {
  public createServer(
    loose: boolean = false,
    skipApiVersionCheck: boolean = false,
    https: boolean = false,
    oauth?: string,
    recoverableDays: number = 90,
    disableSoftDelete: boolean = false,
    purgeProtection: boolean = false,
    protectedSubscription: boolean = false
  ): VoltServer {
    const port = 13300;
    const host = "127.0.0.1";
    const cert = https ? "tests/server.pem" : undefined;
    const key = https ? "tests/server-key.pem" : undefined;

    const lokiMetadataDBPath = "__test_db_secrets__.json";

    const config = new SecretsConfiguration(
      host,
      port,
      lokiMetadataDBPath,
      false,
      undefined,
      false,
      undefined,
      loose,
      skipApiVersionCheck,
      cert,
      key,
      undefined,
      oauth,
      recoverableDays,
      disableSoftDelete,
      purgeProtection,
      protectedSubscription
    );

    return new VoltServer(config);
  }
}
