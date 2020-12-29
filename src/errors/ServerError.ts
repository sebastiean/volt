import MiddlewareError from "../generated/errors/MiddlewareError";
import KeyVaultError from "./KeyVaultError";

/**
 * Represents an Azure Key Vault Server Error.
 *
 * @export
 * @class ServerError
 * @extends {MiddlewareError}
 */
export default class ServerError extends MiddlewareError {
  public readonly statusCode: number;
  public readonly requestID: string;
  public readonly error: KeyVaultError;
  public readonly statusMessage?: string;

  /**
   * Creates an instance of KeyVaultError.
   *
   * @param {number} statusCode HTTP response status code
   * @param {string} requestID Azure Key Vault server request ID
   * @param {KeyVaultError} error The Key Vault error exception.
   * @param {string} [statusMessage] Azure Key Vault HTTP status message
   * @memberof KeyVaultError
   */
  constructor(
    statusCode: number,
    requestID: string,
    error: KeyVaultError,
    statusMessage?: string,
  ) {

    const body: any = {
      error: error.getBody()
    };

    const jsonBody = JSON.stringify(body);

    super(
      statusCode,
      error.keyVaultErrorMessage || "",
      statusMessage,
      {
        "x-ms-request-id": requestID
      },
      jsonBody,
      "application/json"
    );

    this.name = "KeyVaultError";
    this.statusCode = statusCode;
    this.requestID = requestID;
    this.error = error;
    this.statusMessage = statusMessage;
  }
}
