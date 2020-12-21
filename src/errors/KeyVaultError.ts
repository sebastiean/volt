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

  /**
   * Creates an instance of KeyVaultError.
   *
   * @param {number} statusCode HTTP response status code
   * @param {string} keyVaultErrorCode Azure Key Vault error code, will be in response body
   * @param {string} keyVaultErrorMessage Azure Key Vault error message
   * @param {string} keyVaultRequestID Azure Key Vault server request ID
   * @memberof KeyVaultError
   */
  constructor(
    statusCode: number,
    keyVaultErrorCode: string,
    keyVaultErrorMessage: string,
    keyVaultRequestID: string
  ) {
    const body: any = {
      code: keyVaultErrorCode,
      message: keyVaultErrorMessage
    };

    super(
      statusCode,
      keyVaultErrorMessage,
      keyVaultErrorMessage,
      {
        "x-ms-request-id": keyVaultRequestID
      },
      body,
      "application/json"
    );

    this.name = "KeyVaultError";
    this.keyVaultErrorCode = keyVaultErrorCode;
    this.keyVaultErrorMessage = keyVaultErrorMessage;
    this.keyVaultRequestID = keyVaultRequestID;
  }
}
