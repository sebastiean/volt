import ConfigurationBase from "./ConfigurationBase";
import {
  DEFAULT_SECRETS_LISTENING_PORT,
  DEFAULT_SECRETS_LOKI_DB_PATH,
  DEFAULT_SECRETS_SERVER_HOST_NAME,
  DEFAULT_ENABLE_ACCESS_LOG,
  DEFAULT_ENABLE_DEBUG_LOG,
} from "./utils/constants";

/**
 * Default configurations for default implementation of SecretsServer.
 *
 * As default implementation of SecretsServer class leverages LokiJS DB.
 * This configuration class also maintains configuration settings for LokiJS DB.
 *
 * When creating other server implementations, should also create a NEW
 * corresponding configuration class by extending ConfigurationBase.
 *
 * @export
 * @class SecretsConfiguration
 */
export default class SecretsConfiguration extends ConfigurationBase {
  public constructor(
    host: string = DEFAULT_SECRETS_SERVER_HOST_NAME,
    port: number = DEFAULT_SECRETS_LISTENING_PORT,
    public readonly metadataDBPath: string = DEFAULT_SECRETS_LOKI_DB_PATH,
    enableAccessLog: boolean = DEFAULT_ENABLE_ACCESS_LOG,
    accessLogWriteStream?: NodeJS.WritableStream,
    enableDebugLog: boolean = DEFAULT_ENABLE_DEBUG_LOG,
    debugLogFilePath?: string,
    loose = false,
    skipApiVersionCheck = false,
    cert = "",
    key = "",
    pwd = "",
    oauth?: string,
    recoverableDays = 90,
    disableSoftDelete = false, // soft-delete enable by default https://docs.microsoft.com/en-us/azure/key-vault/general/soft-delete-change
    purgeProtection = false,
    protectedSubscription = false,
  ) {
    super(
      host,
      port,
      enableAccessLog,
      accessLogWriteStream,
      enableDebugLog,
      debugLogFilePath,
      loose,
      skipApiVersionCheck,
      cert,
      key,
      pwd,
      oauth,
      recoverableDays,
      disableSoftDelete,
      purgeProtection,
      protectedSubscription,
    );
  }
}
