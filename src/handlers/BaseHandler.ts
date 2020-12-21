import ILogger from "../generated/utils/ILogger";
import ISecretsMetadataStore from "../persistence/ISecretsMetadataStore";

/**
 * BaseHandler class should maintain a singleton to persistency layer, such as maintain a database connection pool.
 * So every inherited classes instances can reuse the persistency layer connection.
 *
 * @export
 * @class BaseHandler
 */
export default class BaseHandler {
  constructor(
    protected readonly metadataStore: ISecretsMetadataStore,
    protected readonly logger: ILogger
  ) {}
}