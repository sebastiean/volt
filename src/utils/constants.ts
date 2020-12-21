export const DEFAULT_SECRETS_SERVER_HOST_NAME = "127.0.0.1"; // Change to 0.0.0.0 when needs external access
export const DEFAULT_SECRETS_LISTENING_PORT = 13000;
export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const DEFAULT_SECRETS_LOKI_DB_PATH = "__volt_db_secrets__.json";
export const DEFAULT_DEBUG_LOG_PATH = "./debug.log";
export const DEFAULT_ENABLE_DEBUG_LOG = true;
export const DEFAULT_ACCESS_LOG_PATH = "./access.log";
export const DEFAULT_ENABLE_ACCESS_LOG = true;
export const DEFAULT_CONTEXT_PATH = "volt_secrets_context";
export const LOGGER_CONFIGS = {};