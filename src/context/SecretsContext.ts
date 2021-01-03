import Context from "../generated/Context";

export default class SecretsContext extends Context {
  public get xMsRequestID(): string | undefined {
    return this.contextId;
  }

  public set xMsRequestID(xMsRequestID: string | undefined) {
    this.contextId = xMsRequestID;
  }

  public get apiVersion(): string | undefined {
    return this.context.apiVersion;
  }

  public set apiVersion(apiVersion: string | undefined) {
    this.context.apiVersion = apiVersion;
  }

  public get nextMarker(): string | undefined {
    return this.context.nextMarker;
  }

  public set nextMarker(nextMarker: string | undefined) {
    this.context.nextMarker = nextMarker;
  }
}
