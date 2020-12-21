import MiddlewareError from "../generated/errors/MiddlewareError";

/**
 * Represents an Azure Key Vault Server Error.
 *
 * @export
 * @class KeyVaultError
 * @extends {MiddlewareError}
 */
export default class KeyVaultError extends MiddlewareError {
  public readonly keyVaultErrorCode: string;
  public readonly keyVaultErrorMessage: string;
  public readonly keyVaultRequestID: string;
  public readonly keyVaultStatusMessage?: string;

  /**
   * Creates an instance of KeyVaultError.
   *
   * @param {number} statusCode HTTP response status code
   * @param {string} keyVaultErrorCode Azure Key Vault error code, will be in response body
   * @param {string} keyVaultErrorMessage Azure Key Vault error message
   * @param {string} keyVaultRequestID Azure Key Vault server request ID
   * @param {string} [keyVaultStatusMessage] Azure Key Vault HTTP status message
   * @memberof KeyVaultError
   */
  constructor(
    statusCode: number,
    keyVaultErrorCode: string,
    keyVaultErrorMessage: string,
    keyVaultRequestID: string,
    keyVaultStatusMessage?: string,
  ) {
    const body: any = {
      code: keyVaultErrorCode,
      message: keyVaultErrorMessage
    };

    const jsonBody = JSON.stringify({ error: body });

    super(
      statusCode,
      keyVaultErrorMessage,
      keyVaultStatusMessage,
      {
        "x-ms-request-id": keyVaultRequestID
      },
      jsonBody,
      "application/json"
    );

    this.name = "KeyVaultError";
    this.keyVaultErrorCode = keyVaultErrorCode;
    this.keyVaultErrorMessage = keyVaultErrorMessage;
    this.keyVaultRequestID = keyVaultRequestID;
    this.keyVaultStatusMessage = keyVaultStatusMessage;
  }
}
