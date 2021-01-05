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
export const DEFAULT_GET_SECRETS_MAX_RESULTS = 25; // Maximum number of results to return in a page.
export const DEFAULT_GET_SECRET_VERSIONS_MAX_RESULTS = 25; // Maximum number of results to return in a page.

export const HeaderConstants = {
  AUTHORIZATION: "authorization",
  AUTHORIZATION_SCHEME: "Bearer",
  CONTENT_ENCODING: "content-encoding",
  CONTENT_LANGUAGE: "content-language",
  CONTENT_LENGTH: "content-length",
  CONTENT_MD5: "content-md5",
  CONTENT_TYPE: "content-type",
  COOKIE: "Cookie",
  DATE: "date",
  IF_MATCH: "if-match",
  IF_MODIFIED_SINCE: "if-modified-since",
  IF_NONE_MATCH: "if-none-match",
  IF_UNMODIFIED_SINCE: "if-unmodified-since",
  SOURCE_IF_MATCH: "x-ms-source-if-match",
  SOURCE_IF_MODIFIED_SINCE: "x-ms-source-if-modified-since",
  SOURCE_IF_NONE_MATCH: "x-ms-source-if-none-match",
  SOURCE_IF_UNMODIFIED_SINCE: "x-ms-source-if-unmodified-since",
  RANGE: "Range",
  USER_AGENT: "User-Agent",
  X_MS_CLIENT_REQUEST_ID: "x-ms-client-request-id",
  X_MS_DATE: "x-ms-date",
  SERVER: "Server",
  X_MS_VERSION: "x-ms-version",
  X_MS_REQUEST_ID: "x-ms-request-id",
  X_MS_KEYVAULT_SERVICE_VERSION: "x-ms-keyvault-service-version",
  X_MS_KEYVAULT_REGION: "x-ms-keyvault-region",
  X_MS_KEYVAULT_NETWORK_INFO: "x-ms-keyvault-network-info",
  ORIGIN: "origin",
  VARY: "Vary",
  ACCESS_CONTROL_EXPOSE_HEADERS: "Access-Control-Expose-Headers",
  ACCESS_CONTROL_ALLOW_ORIGIN: "Access-Control-Allow-Origin",
  ACCESS_CONTROL_ALLOW_CREDENTIALS: "Access-Control-Allow-Credentials",
  ACCESS_CONTROL_ALLOW_METHODS: "Access-Control-Allow-Methods",
  ACCESS_CONTROL_ALLOW_HEADERS: "Access-Control-Allow-Headers",
  ACCESS_CONTROL_MAX_AGE: "Access-Control-Max-Age",
  ACCESS_CONTROL_REQUEST_METHOD: "access-control-request-method",
  ACCESS_CONTROL_REQUEST_HEADERS: "access-control-request-headers",
  WWW_AUTHENTICATE: "WWW-Authenticate",
};

export const HeaderValueConstants = {
  [HeaderConstants.WWW_AUTHENTICATE]: "Bearer authorization=\"https://login.windows.net/ab1f708d-50f6-404c-a006-d71b2ac7a606\", resource=\"https://vault.azure.net\"",
  [HeaderConstants.X_MS_KEYVAULT_SERVICE_VERSION]: "1.2.99.0",
  [HeaderConstants.X_MS_KEYVAULT_REGION]: "westeurope",
  [HeaderConstants.X_MS_KEYVAULT_NETWORK_INFO]: "conn_type=Ipv4;addr=127.0.0.1;act_addr_fam=InterNetwork;"
};

export const ParameterConstants = {
  API_VERSION: "api-version",
  SKIP_TOKEN: "$skiptoken"
};

export const LatestStableAPIVersion = "7.1";

export const ValidAPIVersions = [
  "7.3-preview",
  "7.2-preview",
  "7.2",
  "7.1",
  "7.0",
  "2016-10-01",
  "2015-06-01"
];

// Validate audience, accept following audience patterns
// https://vault.azure.net
// https://vault.azure.net/
export const VALID_KEY_VAULT_AUDIENCES = [
  /^https:\/\/vault\.azure\.net[\/]?$/,
];

export const BEARER_TOKEN_PREFIX = "Bearer";
export const HTTPS = "https";

// Validate issuer
// Only check prefix and bypass AAD tenant ID match
// BlackForest: https://sts.microsoftonline.de/
// Fairfax: https://sts.windows.net/
// Mooncake: https://sts.chinacloudapi.cn/
// Production: https://sts.windows.net/
// Test: https://sts.windows-ppe.net/
export const VALID_ISSUE_PREFIXES = [
  "https://sts.windows.net/",
  "https://sts.microsoftonline.de/",
  "https://sts.chinacloudapi.cn/",
  "https://sts.windows-ppe.net"
];